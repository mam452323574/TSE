import { isConnectivityApiError } from '@/services/api';
import { AccountTier, ScanEligibilityResponse, ScanType } from '@/types';

export type ScanQuotaState =
  | { status: 'auth-unready' }
  | { status: 'loading' }
  | { status: 'query-error'; error: unknown }
  | { status: 'backend-unavailable'; error: unknown }
  | { status: 'missing-payload' }
  | { status: 'locked'; accountTier: AccountTier | null }
  | {
      status: 'available' | 'exhausted';
      accountTier: AccountTier | null;
      allowed: boolean;
      remaining: number;
      limit: number;
      nextAvailableDate?: number;
      welcomeCredits: number;
      eligibility: ScanEligibilityResponse;
    };

interface ResolveScanQuotaStateArgs {
  scanType: ScanType;
  accountTier?: AccountTier | null;
  eligibility?: ScanEligibilityResponse | null;
  error?: unknown | null;
  loading?: boolean;
  isAuthReady: boolean;
  canQuery: boolean;
}

function clampCount(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function getResolvedWelcomeCredits(
  eligibility: ScanEligibilityResponse,
): number {
  if (typeof eligibility.welcome_credits === 'number') {
    return clampCount(eligibility.welcome_credits);
  }

  return clampCount(eligibility.remaining_welcome_credits);
}

function getResolvedLimit(eligibility: ScanEligibilityResponse): number {
  const currentCount = clampCount(eligibility.current_count);
  const explicitLimit = clampCount(eligibility.limit);

  if (explicitLimit > 0) {
    return explicitLimit;
  }

  const remaining = clampCount(eligibility.remaining);

  return Math.max(currentCount + remaining, 0);
}

function getResolvedRemaining(
  eligibility: ScanEligibilityResponse,
  limit: number,
): number {
  if (typeof eligibility.remaining === 'number' && !Number.isNaN(eligibility.remaining)) {
    return Math.max(0, eligibility.remaining);
  }

  return Math.max(0, limit - clampCount(eligibility.current_count));
}

export function resolveScanQuotaState({
  scanType,
  accountTier = null,
  eligibility,
  error,
  loading = false,
  isAuthReady,
  canQuery,
}: ResolveScanQuotaStateArgs): ScanQuotaState {
  if (!isAuthReady || !canQuery) {
    return { status: 'auth-unready' };
  }

  if (loading) {
    return { status: 'loading' };
  }

  if (scanType === 'super' && accountTier === 'free') {
    return {
      status: 'locked',
      accountTier,
    };
  }

  if (error) {
    return isConnectivityApiError(error)
      ? { status: 'backend-unavailable', error }
      : { status: 'query-error', error };
  }

  if (!eligibility) {
    return { status: 'missing-payload' };
  }

  const limit = getResolvedLimit(eligibility);
  const remaining = getResolvedRemaining(eligibility, limit);
  const welcomeCredits = getResolvedWelcomeCredits(eligibility);

  return {
    status: eligibility.allowed ? 'available' : 'exhausted',
    accountTier,
    allowed: eligibility.allowed,
    remaining,
    limit,
    nextAvailableDate: eligibility.next_available_date,
    welcomeCredits,
    eligibility,
  };
}

export function hasScanQuotaPayload(
  state: ScanQuotaState,
): state is Extract<ScanQuotaState, { status: 'available' | 'exhausted' }> {
  return state.status === 'available' || state.status === 'exhausted';
}

export function getScanQuotaStatusLabelKey(state: ScanQuotaState) {
  switch (state.status) {
    case 'auth-unready':
      return 'scan_limit.auth_unready';
    case 'loading':
      return 'scan_limit.loading';
    case 'query-error':
      return 'scan_limit.query_error';
    case 'backend-unavailable':
      return 'scan_limit.backend_unavailable';
    case 'missing-payload':
      return 'scan_limit.missing_payload';
    case 'locked':
      return 'scan_limits.premium_only';
    case 'available':
    case 'exhausted':
    default:
      return null;
  }
}
