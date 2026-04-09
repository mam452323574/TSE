import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';
import {
  createServiceRoleClient,
  requireAuthenticatedUser,
} from '../_shared/phase2Auth.ts';
import {
  Phase2HttpError,
  toPhase2ErrorPayload,
} from '../_shared/phase2Errors.ts';
import {
  createRequestId,
  logPhase2Error,
} from '../_shared/phase2Observability.ts';
import {
  assertNoUnknownKeys,
  readJsonBody,
} from '../_shared/phase2Utils.ts';
import {
  createScanReservationProfileSnapshot,
  normalizeScanUsage,
  normalizeWelcomeCredits,
  restoreScanReservationProfile,
} from '../_shared/scanReservations.ts';
import {
  CHECK_AND_RECORD_SCAN_REQUEST_KEYS,
  LEGACY_CHECK_AND_RECORD_SCAN_REQUEST_KEYS,
  isAppScanType,
} from '../../../shared/scanContract.ts';

interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
  super: ScanUsageRecord;
}

interface WelcomeCredits {
  health: number;
  body: number;
  nutrition: number;
}

type AccountTier = 'free' | 'premium' | 'admin';
type ScanType = 'body' | 'health' | 'nutrition' | 'super';

const SCAN_LIMITS: Record<
  AccountTier,
  Record<ScanType, { count: number; periodMs: number }>
> = {
  free: {
    health: { count: 1, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 1, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 1, periodMs: 24 * 60 * 60 * 1000 },
    super: { count: 0, periodMs: 24 * 60 * 60 * 1000 },
  },
  premium: {
    health: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    super: { count: 1, periodMs: 24 * 60 * 60 * 1000 },
  },
  admin: {
    health: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
    super: { count: 20, periodMs: 24 * 60 * 60 * 1000 },
  },
};

const LEGACY_SCAN_MESSAGES: Record<AccountTier, Record<ScanType, string>> = {
  free: {
    health: 'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans',
    body: 'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans',
    nutrition: 'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans',
    super: 'Le Super Scan est réservé aux membres Premium',
  },
  premium: {
    health:
      'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    body: 'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    nutrition:
      'Limite quotidienne atteinte (3 scans). Prochain scan disponible dans',
    super:
      'Limite quotidienne atteinte (1 scan). Prochain scan disponible dans',
  },
  admin: {
    health: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    body: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    nutrition:
      'Limite administrateur atteinte (20 scans). Prochain scan demain.',
    super: 'Limite administrateur atteinte (20 scans). Prochain scan demain.',
  },
};

const SCAN_MESSAGE_KEYS: Partial<
  Record<AccountTier, Partial<Record<ScanType, string>>>
> = {
  free: {
    health: 'scan_limits.msg_daily_reached_1_with_time',
    body: 'scan_limits.msg_daily_reached_1_with_time',
    nutrition: 'scan_limits.msg_daily_reached_1_with_time',
    super: 'scan_limits.msg_premium_only',
  },
  premium: {
    health: 'scan_limits.msg_daily_reached_3_with_time',
    body: 'scan_limits.msg_daily_reached_3_with_time',
    nutrition: 'scan_limits.msg_daily_reached_3_with_time',
    super: 'scan_limits.msg_daily_reached_1_with_time',
  },
};

function getScanLimitMessagePayload(accountTier: AccountTier, scanType: ScanType) {
  return {
    message:
      LEGACY_SCAN_MESSAGES[accountTier]?.[scanType] ??
      LEGACY_SCAN_MESSAGES.free[scanType],
    message_key:
      SCAN_MESSAGE_KEYS[accountTier]?.[scanType] ??
      undefined,
  };
}

function normalizeAccountTier(value: unknown): AccountTier {
  return value === 'premium' || value === 'admin' ? value : 'free';
}

function getRemaining(limit: number, currentCount: number) {
  return Math.max(0, limit - currentCount);
}

function readWelcomeCreditsForScanType(
  welcomeCredits: WelcomeCredits,
  scanType: ScanType,
) {
  return scanType === 'super' ? 0 : welcomeCredits[scanType];
}

function readValidTimestamps(record: ScanUsageRecord | undefined, cutoffTime: number) {
  return (record?.scan_timestamps || []).filter(
    (timestamp: string) => new Date(timestamp).getTime() > cutoffTime,
  );
}

function parseScanCheckRequest(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Phase2HttpError(400, 'invalid_payload', 'Request body must be an object');
  }

  const requestBody = payload as Record<string, unknown>;
  assertNoUnknownKeys(
    requestBody,
    [
      ...CHECK_AND_RECORD_SCAN_REQUEST_KEYS,
      ...LEGACY_CHECK_AND_RECORD_SCAN_REQUEST_KEYS,
    ],
    'Scan reservation request',
  );

  const rawScanType = requestBody.scan_type ?? requestBody.scanType;
  if (!isAppScanType(rawScanType)) {
    throw new Phase2HttpError(400, 'invalid_scan_type', 'scan_type is invalid');
  }

  const rawCheckOnly = requestBody.check_only ?? requestBody.checkOnly;
  if (rawCheckOnly !== undefined && typeof rawCheckOnly !== 'boolean') {
    throw new Phase2HttpError(400, 'invalid_payload', 'check_only must be a boolean');
  }

  return {
    scanType: rawScanType,
    checkOnly: rawCheckOnly === true,
  };
}

async function createReservedScanRecord(
  client: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  scanType: ScanType,
  createdAt: string,
  usedWelcomeCredit: boolean,
) {
  const { data: scanRecord, error: scanError } = await client
    .from('scans')
    .insert({
      user_id: userId,
      scan_type: scanType,
      created_at: createdAt,
      used_welcome_credit: usedWelcomeCredit,
    })
    .select('id')
    .single();

  if (scanError || !scanRecord?.id) {
    throw new Phase2HttpError(
      500,
      'scan_reservation_failed',
      'Failed to create scan reservation',
    );
  }

  return scanRecord.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const requestId = createRequestId();

  try {
    if (req.method !== 'POST') {
      throw new Phase2HttpError(405, 'method_not_allowed', 'Method not allowed');
    }

    const client = createServiceRoleClient();
    const user = await requireAuthenticatedUser(client, req);
    const { scanType, checkOnly } = parseScanCheckRequest(
      await readJsonBody(req, { maxBytes: 4 * 1024 }),
    );

    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('account_tier, scan_usage, welcome_credits')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Phase2HttpError(
        500,
        'scan_profile_lookup_failed',
        'Failed to fetch user profile for scan reservation',
      );
    }

    const accountTier = normalizeAccountTier(profile.account_tier);
    const snapshot = createScanReservationProfileSnapshot(
      profile.scan_usage,
      profile.welcome_credits,
    );
    const scanUsage = normalizeScanUsage(snapshot.scanUsage) as ScanUsage;
    const welcomeCredits = normalizeWelcomeCredits(
      snapshot.welcomeCredits,
    ) as WelcomeCredits;

    const limit = SCAN_LIMITS[accountTier][scanType];
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const cutoffTime = now - limit.periodMs;
    const existingRecord = scanUsage[scanType];
    const validTimestamps = readValidTimestamps(existingRecord, cutoffTime);
    const welcomeCreditCount = readWelcomeCreditsForScanType(welcomeCredits, scanType);

    if (scanType === 'super' && accountTier === 'free') {
      const messagePayload = getScanLimitMessagePayload(accountTier, scanType);
      return jsonResponse(req, {
        success: true,
        allowed: false,
        ...messagePayload,
        current_count: 0,
        limit: 0,
        remaining: 0,
        welcome_credits: 0,
      });
    }

    if (scanType !== 'super' && welcomeCreditCount > 0) {
      if (checkOnly) {
        return jsonResponse(req, {
          success: true,
          allowed: true,
          message: 'Credit de bienvenue disponible',
          welcome_credits: welcomeCreditCount,
          current_count: validTimestamps.length,
          limit: limit.count,
          remaining: getRemaining(limit.count, validTimestamps.length),
        });
      }

      const updatedWelcomeCredits = {
        ...welcomeCredits,
        [scanType]: welcomeCreditCount - 1,
      };
      const nextTimestamps = [...validTimestamps, nowIso].slice(-limit.count);
      const updatedScanUsage = {
        ...scanUsage,
        [scanType]: {
          last_scan_date: nowIso,
          scan_timestamps: nextTimestamps,
        },
      };

      const { error: updateProfileError } = await client
        .from('user_profiles')
        .update({
          welcome_credits: updatedWelcomeCredits,
          scan_usage: updatedScanUsage,
        })
        .eq('id', user.id);

      if (updateProfileError) {
        throw new Phase2HttpError(
          500,
          'scan_profile_update_failed',
          'Failed to reserve scan allowance',
        );
      }

      try {
        const scanId = await createReservedScanRecord(
          client,
          user.id,
          scanType,
          nowIso,
          true,
        );

        return jsonResponse(req, {
          success: true,
          allowed: true,
          message: 'Scan autorise (credit de bienvenue utilise)',
          used_welcome_credit: true,
          remaining_welcome_credits: updatedWelcomeCredits[scanType],
          welcome_credits: updatedWelcomeCredits[scanType],
          current_count: nextTimestamps.length,
          limit: limit.count,
          remaining: getRemaining(limit.count, nextTimestamps.length),
          scan_id: scanId,
        });
      } catch (error) {
        await restoreScanReservationProfile(client, user.id, snapshot);
        throw error;
      }
    }

    if (validTimestamps.length >= limit.count) {
      const sortedTimestamps = [...validTimestamps].sort(
        (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(),
      );
      const oldestTimestamp = sortedTimestamps[0];
      const nextAvailableDate =
        new Date(oldestTimestamp).getTime() + limit.periodMs;
      const messagePayload = getScanLimitMessagePayload(accountTier, scanType);

      return jsonResponse(req, {
        success: true,
        allowed: false,
        ...messagePayload,
        next_available_date: nextAvailableDate,
        current_count: validTimestamps.length,
        limit: limit.count,
        remaining: 0,
        welcome_credits: welcomeCreditCount,
      });
    }

    if (checkOnly) {
      return jsonResponse(req, {
        success: true,
        allowed: true,
        message: 'Scan disponible',
        current_count: validTimestamps.length,
        limit: limit.count,
        remaining: getRemaining(limit.count, validTimestamps.length),
        welcome_credits: welcomeCreditCount,
      });
    }

    const nextTimestamps = [...validTimestamps, nowIso].slice(-limit.count);
    const updatedScanUsage = {
      ...scanUsage,
      [scanType]: {
        last_scan_date: nowIso,
        scan_timestamps: nextTimestamps,
      },
    };

    const { error: updateProfileError } = await client
      .from('user_profiles')
      .update({ scan_usage: updatedScanUsage })
      .eq('id', user.id);

    if (updateProfileError) {
      throw new Phase2HttpError(
        500,
        'scan_profile_update_failed',
        'Failed to reserve scan allowance',
      );
    }

    try {
      const scanId = await createReservedScanRecord(
        client,
        user.id,
        scanType,
        nowIso,
        false,
      );

      return jsonResponse(req, {
        success: true,
        allowed: true,
        message: 'Scan autorisé',
        current_count: nextTimestamps.length,
        limit: limit.count,
        remaining: getRemaining(limit.count, nextTimestamps.length),
        welcome_credits: welcomeCreditCount,
        used_welcome_credit: false,
        scan_id: scanId,
      });
    } catch (error) {
      await restoreScanReservationProfile(client, user.id, snapshot);
      throw error;
    }
  } catch (error) {
    if (error instanceof Phase2HttpError) {
      logPhase2Error('[check-and-record-scan] Request failed', error, {
        request_id: requestId,
      });
      return jsonResponse(
        req,
        toPhase2ErrorPayload(error, { requestId }),
        { status: error.status },
      );
    }

    logPhase2Error('[check-and-record-scan] Unexpected error', error, {
      request_id: requestId,
    });
    return jsonResponse(
      req,
      toPhase2ErrorPayload(error, { requestId }),
      { status: 500 },
    );
  }
});
