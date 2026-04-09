import { supabase } from './supabase';
import {
  getConfiguredSupabaseProjectLabel,
  invokeAuthedEdgeFunction,
} from './edgeFunctions';

import {
  DEFAULT_COACH_PERSONA_KEY,
  isCoachPersonaKey,
} from '@/shared/coachPersonas';
import { tryNormalizeAnalysisResult } from '@/utils/analysisNormalization';
import { logOperationalError } from '@/utils/observability';
import type {
  CoachEntry,
  CoachGenerateResponse,
  CoachGuidancePayload,
  CoachGuidanceResult,
  CoachPersonaKey,
  CoachPromptType,
  CoachScanDigest,
  ScanType,
} from '@/types';

const COACH_FUNCTION_NAME = 'coach-generate-response';
export const COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE =
  'coach_webhook_not_configured';
const DEFAULT_COACH_DISCLAIMER =
  'Wellness guidance only. This is not a diagnosis or medical advice.';
const RECENT_COACH_SCAN_LIMIT = 12;

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

interface CoachScanRow {
  id?: unknown;
  scan_type?: unknown;
  analysis_result?: unknown;
  analyzed_at?: unknown;
  created_at?: unknown;
}

interface CoachSourceScan {
  id: string;
  scan_type: ScanType;
  captured_at: string;
  digest: CoachScanDigest;
}

export class CoachServiceError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
  requestId?: string;
  functionName?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      details?: unknown;
      requestId?: string;
      functionName?: string;
    } = {},
  ) {
    super(message);
    this.name = 'CoachServiceError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
    this.functionName = options.functionName;
  }
}

export function isCoachProviderUnavailableError(error: unknown) {
  return (
    error instanceof CoachServiceError &&
    error.code === COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE
  );
}

export function isCoachProviderUnavailableEntry(
  entry: Pick<CoachEntry, 'error_code' | 'status'> | null | undefined,
) {
  return (
    entry?.status === 'error' &&
    entry.error_code === COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readCoachPersonaKey(value: unknown): CoachPersonaKey {
  return isCoachPersonaKey(value) ? value : DEFAULT_COACH_PERSONA_KEY;
}

function toSupabaseErrorLike(error: unknown): SupabaseErrorLike {
  if (!error || typeof error !== 'object') {
    return {};
  }

  return error as SupabaseErrorLike;
}

function buildSupabaseErrorHaystack(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);

  return [
    supabaseError.message,
    supabaseError.details,
    supabaseError.hint,
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
}

function isMissingCoachRelationError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  if (
    errorCode === '42P01' ||
    errorCode === 'PGRST205' ||
    errorCode === 'PGRST202'
  ) {
    return true;
  }

  const haystack = buildSupabaseErrorHaystack(error);

  return (
    (haystack.includes('coach_entries') ||
      haystack.includes('user_growth_experiences') ||
      haystack.includes('relation')) &&
    haystack.includes('does not exist')
  );
}

function isMissingScansRelationError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  if (
    errorCode === '42P01' ||
    errorCode === 'PGRST204' ||
    errorCode === 'PGRST205'
  ) {
    return true;
  }

  const haystack = buildSupabaseErrorHaystack(error);

  return haystack.includes('scans') && haystack.includes('does not exist');
}

function isMissingSupabaseColumnError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  return (
    errorCode === '42703' ||
    errorCode === 'PGRST204' ||
    (buildSupabaseErrorHaystack(error).includes('column') &&
      buildSupabaseErrorHaystack(error).includes('does not exist'))
  );
}

function isSupabasePolicyDeniedError(error: unknown) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';
  const haystack = buildSupabaseErrorHaystack(error);

  return (
    errorCode === '42501' ||
    haystack.includes('permission denied') ||
    haystack.includes('row-level security')
  );
}

function createCoachServiceError(
  message: string,
  options: {
    code?: string;
    status?: number;
    details?: unknown;
    requestId?: string;
    functionName?: string;
  } = {},
) {
  return new CoachServiceError(message, options);
}

function createCoachEntriesUnavailableError(error: unknown) {
  return createCoachServiceError(
    `Coach data table "coach_entries" is unavailable on Supabase project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'coach_entries_unavailable',
      status: 503,
      details: error,
    },
  );
}

function createCoachScansUnavailableError(error: unknown) {
  return createCoachServiceError(
    `Coach scan source table "scans" is unavailable on Supabase project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'coach_scans_unavailable',
      status: 503,
      details: error,
    },
  );
}

function createCoachEntriesSchemaMismatchError(error: unknown) {
  return createCoachServiceError(
    `Coach data on Supabase project "${getConfiguredSupabaseProjectLabel()}" is missing required columns for "coach_entries".`,
    {
      code: 'coach_entries_schema_mismatch',
      status: 503,
      details: error,
    },
  );
}

function createCoachScansSchemaMismatchError(error: unknown) {
  return createCoachServiceError(
    `Coach scan source data on Supabase project "${getConfiguredSupabaseProjectLabel()}" is missing required columns for "scans".`,
    {
      code: 'coach_scans_schema_mismatch',
      status: 503,
      details: error,
    },
  );
}

function createCoachEntriesPolicyDeniedError(error: unknown) {
  return createCoachServiceError(
    `Coach data access is denied by Supabase policies or grants for "coach_entries" on project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'coach_entries_policy_denied',
      status: 403,
      details: error,
    },
  );
}

function createCoachScansPolicyDeniedError(error: unknown) {
  return createCoachServiceError(
    `Coach scan source access is denied by Supabase policies or grants for "scans" on project "${getConfiguredSupabaseProjectLabel()}".`,
    {
      code: 'coach_scans_policy_denied',
      status: 403,
      details: error,
    },
  );
}

function createCoachReadError(
  fallbackMessage: string,
  fallbackCode: string,
  error: unknown,
) {
  const supabaseError = toSupabaseErrorLike(error);

  return createCoachServiceError(
    typeof supabaseError.message === 'string' && supabaseError.message.length > 0
      ? supabaseError.message
      : fallbackMessage,
    {
      code: supabaseError.code ?? fallbackCode,
      status: 500,
      details: error,
    },
  );
}

function createCoachEntriesReadError(error: unknown) {
  if (isMissingCoachRelationError(error)) {
    return createCoachEntriesUnavailableError(error);
  }

  if (isMissingSupabaseColumnError(error)) {
    return createCoachEntriesSchemaMismatchError(error);
  }

  if (isSupabasePolicyDeniedError(error)) {
    return createCoachEntriesPolicyDeniedError(error);
  }

  return createCoachReadError(
    'Failed to load coach entries.',
    'coach_entries_load_failed',
    error,
  );
}

function createCoachScansReadError(error: unknown) {
  if (isMissingScansRelationError(error)) {
    return createCoachScansUnavailableError(error);
  }

  if (isMissingSupabaseColumnError(error)) {
    return createCoachScansSchemaMismatchError(error);
  }

  if (isSupabasePolicyDeniedError(error)) {
    return createCoachScansPolicyDeniedError(error);
  }

  return createCoachReadError(
    'Failed to load recent coach scans.',
    'coach_scans_load_failed',
    error,
  );
}

async function invokeAuthedCoachFunction<TResponse>(
  functionName: string,
  payload: Record<string, unknown>,
) {
  return invokeAuthedEdgeFunction<TResponse, CoachServiceError>({
    scopeLabel: 'Coach',
    functionName,
    payload,
    createError: (message, options) =>
      createCoachServiceError(message, {
        code: options.code,
        status: options.status,
        details: options.details,
        requestId: options.requestId,
        functionName: options.functionName,
      }),
  });
}

function createCoachDigestMetrics(
  normalized: ReturnType<typeof tryNormalizeAnalysisResult>,
) {
  if (!normalized) {
    return {};
  }

  switch (normalized.scan_type) {
    case 'face':
      return {
        face_score: normalized.face_score,
        perceived_age: normalized.perceived_age,
        symmetry_percentage: normalized.symmetry_percentage,
        fatigue_level: normalized.fatigue_level,
        glow_index: normalized.glow_index,
        hydration_level: normalized.hydration_level,
      };
    case 'body':
      return {
        body_score: normalized.body_score,
        body_fat_percentage: normalized.body_fat_percentage,
        muscle_mass_key: normalized.muscle_mass_key,
        body_type_key: normalized.body_type_key,
        posture_score: normalized.posture_score,
        strength_index: normalized.strength_index,
      };
    case 'nutrition':
      return {
        plate_health_score: normalized.plate_health_score,
        calories_estimate: normalized.calories_estimate,
        protein_grams: normalized.protein_grams,
        carbs_grams: normalized.carbs_grams,
        fat_grams: normalized.fat_grams,
        verdict_key: normalized.verdict_key,
        glycemic_index_key: normalized.glycemic_index_key,
      };
    case 'super_health_v2':
      return {
        global_risk_score: normalized.global_risk_score,
        urgency_flag: normalized.urgency_flag,
        summary_key: normalized.summary_key,
        detected_conditions: normalized.detected_conditions
          .slice(0, 3)
          .map((condition) => ({
            condition_key: condition.condition_key,
            severity_key: condition.severity_key,
            probability: condition.probability,
          })),
      };
    default:
      return {};
  }
}

function parseCoachEntryRow(row: unknown): CoachEntry | null {
  if (!isRecord(row)) {
    return null;
  }

  const id = readRequiredString(row.id);
  const title = readRequiredString(row.title);
  const body = readRequiredString(row.body);
  const createdAt = readRequiredString(row.created_at);

  if (!id || !title || !body || !createdAt) {
    return null;
  }

  return {
    id,
    title,
    body,
    disclaimer:
      readOptionalString(row.disclaimer) ??
      DEFAULT_COACH_DISCLAIMER,
    persona_key: readCoachPersonaKey(row.persona_key),
    cta_label: readOptionalString(row.cta_label),
    cta_route: readOptionalString(row.cta_route),
    created_at: createdAt,
    source: readOptionalString(row.source),
    user_id: readOptionalString(row.user_id) ?? undefined,
    status:
      row.status === 'pending' || row.status === 'ready' || row.status === 'error'
        ? row.status
        : null,
    error_code: readOptionalString(row.error_code),
    cache_key: readOptionalString(row.cache_key),
    input_hash: readOptionalString(row.input_hash),
    request_payload_json: isRecord(row.request_payload_json)
      ? row.request_payload_json
      : null,
    response_payload_json: isRecord(row.response_payload_json)
      ? row.response_payload_json
      : null,
    expires_at: readOptionalString(row.expires_at),
    generated_at: readOptionalString(row.generated_at),
  };
}

function parseCoachGenerateResponse(payload: unknown): CoachGenerateResponse {
  if (!isRecord(payload) || payload.success !== true) {
    throw new CoachServiceError('Coach generation returned an invalid payload', {
      code: 'invalid_coach_response',
      status: 502,
      details: payload,
    });
  }

  const entryId = readRequiredString(payload.entry_id);
  if (!entryId) {
    throw new CoachServiceError('Coach response is missing entry_id', {
      code: 'invalid_coach_response',
      status: 502,
      details: payload,
    });
  }

  return {
    success: true,
    cached: payload.cached === true,
    entry_id: entryId,
    persona_key: readCoachPersonaKey(payload.persona_key),
    status:
      payload.status === 'pending' ||
      payload.status === 'ready' ||
      payload.status === 'error'
        ? payload.status
        : 'error',
    title: readOptionalString(payload.title),
    body: readOptionalString(payload.body),
    disclaimer:
      readOptionalString(payload.disclaimer) ??
      DEFAULT_COACH_DISCLAIMER,
    cta_label: readOptionalString(payload.cta_label),
    cta_route: readOptionalString(payload.cta_route),
    source: readOptionalString(payload.source),
    expires_at: readOptionalString(payload.expires_at),
    response_payload_json: isRecord(payload.response_payload_json)
      ? payload.response_payload_json
      : {},
  };
}

function parseCoachSourceScan(row: unknown): CoachSourceScan | null {
  const scanRow = row as CoachScanRow;
  const id = readRequiredString(scanRow.id);
  const scanType = scanRow.scan_type;
  const createdAt =
    readOptionalString(scanRow.analyzed_at) ??
    readOptionalString(scanRow.created_at);

  if (
    !id ||
    !createdAt ||
    (scanType !== 'health' &&
      scanType !== 'body' &&
      scanType !== 'nutrition' &&
      scanType !== 'super')
  ) {
    return null;
  }

  const normalized = tryNormalizeAnalysisResult(scanRow.analysis_result, {
    expectedScanType: scanType,
  });
  if (!normalized) {
    return null;
  }

  return {
    id,
    scan_type: scanType,
    captured_at: createdAt,
    digest: {
      scan_id: id,
      scan_type: scanType,
      captured_at: createdAt,
      normalized_scan_type: normalized.scan_type,
      metrics: createCoachDigestMetrics(normalized),
    },
  };
}

function findLatestScanByType(scans: CoachSourceScan[], scanType: ScanType) {
  return scans.find((scan) => scan.scan_type === scanType) ?? null;
}

function resolveSelectedScanForPrompt(
  promptType: CoachPromptType,
  scans: CoachSourceScan[],
) {
  switch (promptType) {
    case 'nutrition_focus':
      return findLatestScanByType(scans, 'nutrition') ?? scans[0] ?? null;
    case 'body_focus':
      return findLatestScanByType(scans, 'body') ?? scans[0] ?? null;
    case 'face_focus':
      return findLatestScanByType(scans, 'health') ?? scans[0] ?? null;
    case 'weekly_plan':
    case 'latest_scan':
    default:
      return scans[0] ?? null;
  }
}

function getScansWithinLastDays(scans: CoachSourceScan[], days: number) {
  const now = Date.now();
  const cutoffMs = now - days * 24 * 60 * 60 * 1000;

  return scans.filter((scan) => {
    const timestamp = Date.parse(scan.captured_at);
    return Number.isFinite(timestamp) && timestamp >= cutoffMs;
  });
}

export function buildCoachPayload(
  promptType: CoachPromptType,
  scans: CoachSourceScan[],
): CoachGuidancePayload {
  const selectedScan = resolveSelectedScanForPrompt(promptType, scans);
  const scansWithinWeek = getScansWithinLastDays(scans, 7);
  const recentScans =
    promptType === 'weekly_plan' ? scansWithinWeek : scans.slice(0, 5);
  const byType =
    promptType === 'weekly_plan'
      ? {
          health: findLatestScanByType(scans, 'health')?.digest ?? null,
          body: findLatestScanByType(scans, 'body')?.digest ?? null,
          nutrition: findLatestScanByType(scans, 'nutrition')?.digest ?? null,
          super: findLatestScanByType(scans, 'super')?.digest ?? null,
        }
      : undefined;

  return {
    prompt_type: promptType,
    generated_at: new Date().toISOString(),
    scan_count_7d: scansWithinWeek.length,
    selected_scan: selectedScan?.digest ?? null,
    recent_scans: recentScans.map((scan) => scan.digest),
    ...(byType ? { by_type: byType } : {}),
  };
}

function buildGuidanceResultFromEntry(
  entry: CoachEntry,
  payload: CoachGuidancePayload,
  fallback: boolean,
): CoachGuidanceResult {
  return {
    success: true,
    cached: true,
    entry_id: entry.id,
    persona_key: entry.persona_key,
    status: entry.status ?? 'ready',
    title: entry.title,
    body: entry.body,
    disclaimer: entry.disclaimer,
    cta_label: entry.cta_label,
    cta_route: entry.cta_route,
    source: entry.source,
    expires_at: entry.expires_at ?? null,
    response_payload_json: entry.response_payload_json ?? {},
    fallback,
    payload,
  };
}

function shouldFallbackToCachedCoachEntry(error: unknown) {
  if (!(error instanceof CoachServiceError)) {
    return true;
  }

  if (
    error.code === COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE ||
    error.code === 'invalid_coach_response' ||
    error.code === 'coach_entries_unavailable' ||
    error.code === 'coach_entries_schema_mismatch' ||
    error.code === 'coach_entries_policy_denied' ||
    error.code === 'coach_scans_unavailable' ||
    error.code === 'coach_scans_schema_mismatch' ||
    error.code === 'coach_scans_policy_denied'
  ) {
    return false;
  }

  return (error.status ?? 500) >= 500;
}

export async function fetchCoachEntries(limit = 10): Promise<CoachEntry[]> {
  try {
    const { data, error } = await supabase
      .from('coach_entries')
      .select('*')
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const coachError = createCoachEntriesReadError(error);

      logOperationalError('[Coach] Failed to fetch coach entries', coachError, {
        limit,
      });
      throw coachError;
    }

    return (Array.isArray(data) ? data : [])
      .map(parseCoachEntryRow)
      .filter((item): item is CoachEntry => item !== null);
  } catch (error) {
    if (error instanceof CoachServiceError) {
      throw error;
    }

    logOperationalError('[Coach] Unexpected coach entries failure', error, {
      limit,
    });
    throw createCoachReadError(
      'Failed to load coach entries.',
      'coach_entries_load_failed',
      error,
    );
  }
}

export async function fetchLatestReadyCoachEntry(personaKey: CoachPersonaKey) {
  try {
    const { data, error } = await supabase
      .from('coach_entries')
      .select('*')
      .eq('status', 'ready')
      .eq('persona_key', personaKey)
      .order('generated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      const coachError = createCoachEntriesReadError(error);
      logOperationalError('[Coach] Failed to fetch latest ready coach entry', coachError, {
        persona_key: personaKey,
      });
      throw coachError;
    }

    return parseCoachEntryRow(data);
  } catch (error) {
    if (error instanceof CoachServiceError) {
      throw error;
    }

    logOperationalError('[Coach] Unexpected latest ready entry failure', error, {
      persona_key: personaKey,
    });
    throw createCoachReadError(
      'Failed to load latest coach guidance.',
      'coach_latest_entry_load_failed',
      error,
    );
  }
}

export async function fetchRecentCoachScans(
  limit = RECENT_COACH_SCAN_LIMIT,
) {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('id, scan_type, analysis_result, analyzed_at, created_at')
      .order('analyzed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      const coachError = createCoachScansReadError(error);

      logOperationalError('[Coach] Failed to fetch recent scans', coachError, {
        limit,
      });
      throw coachError;
    }

    return (Array.isArray(data) ? data : [])
      .map(parseCoachSourceScan)
      .filter((item): item is CoachSourceScan => item !== null);
  } catch (error) {
    if (error instanceof CoachServiceError) {
      throw error;
    }

    logOperationalError('[Coach] Unexpected recent scans failure', error, {
      limit,
    });
    throw createCoachReadError(
      'Failed to load recent coach scans.',
      'coach_scans_load_failed',
      error,
    );
  }
}

export async function generateCoachGuidance(options: {
  promptType: CoachPromptType;
  personaKey: CoachPersonaKey;
  locale?: string;
  forceRefresh?: boolean;
}): Promise<CoachGuidanceResult> {
  const personaKey = readCoachPersonaKey(options.personaKey);
  let payload: CoachGuidancePayload | null = null;

  try {
    const scans = await fetchRecentCoachScans();
    const nextPayload = buildCoachPayload(options.promptType, scans);
    payload = nextPayload;

    const response = parseCoachGenerateResponse(
      await invokeAuthedCoachFunction<CoachGenerateResponse>(
        COACH_FUNCTION_NAME,
        {
          payload: nextPayload,
          persona_key: personaKey,
          ...(options.locale ? { locale: options.locale } : {}),
          ...(options.forceRefresh ? { force_refresh: true } : {}),
        },
      ),
    );

    return {
      ...response,
      fallback: false,
      payload: nextPayload,
    };
  } catch (error) {
    const resolvedPayload =
      payload ?? buildCoachPayload(options.promptType, []);
    if (!shouldFallbackToCachedCoachEntry(error)) {
      throw error;
    }

    const fallbackEntry = await fetchLatestReadyCoachEntry(personaKey);
    if (fallbackEntry) {
      return buildGuidanceResultFromEntry(fallbackEntry, resolvedPayload, true);
    }

    throw error;
  }
}
