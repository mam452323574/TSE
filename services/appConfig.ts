import { supabase } from './supabase';

import type { FeatureFlags } from '@/types';

export const APP_CONFIG_REMOTE_KEY = 'mobile';

export interface AppConfig extends FeatureFlags {
  entry_offer_offering_id: string | null;
  post_rate_limit_per_day: number | null;
  comment_rate_limit_per_hour: number | null;
  rollout_percentage: number | null;
  moderation_enabled: boolean;
}

interface AppConfigRow {
  value?: unknown;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  social_enabled: false,
  coach_enabled: false,
  entry_offer_enabled: false,
  social_comments_enabled: false,
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  ...DEFAULT_FEATURE_FLAGS,
  entry_offer_offering_id: null,
  post_rate_limit_per_day: null,
  comment_rate_limit_per_hour: null,
  rollout_percentage: null,
  moderation_enabled: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
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

function isMissingAppConfigError(error: unknown, sourceName: 'app_config' | 'app_feature_flags') {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  if (errorCode === '42P01' || errorCode === 'PGRST204' || errorCode === 'PGRST205') {
    return true;
  }

  const haystack = buildSupabaseErrorHaystack(error);

  return haystack.includes(sourceName) && (
    haystack.includes('not found') ||
    haystack.includes('does not exist') ||
    haystack.includes('schema cache')
  );
}

function isIncompatibleAppConfigError(
  error: unknown,
  sourceName: 'app_config' | 'app_feature_flags',
) {
  const supabaseError = toSupabaseErrorLike(error);
  const errorCode = supabaseError.code ?? '';

  if (errorCode === '42703' || errorCode === 'PGRST204') {
    return true;
  }

  const haystack = buildSupabaseErrorHaystack(error);
  return haystack.includes(sourceName) && haystack.includes('column') && haystack.includes('does not exist');
}

export function parseAppConfigValue(value: unknown): AppConfig {
  if (!isRecord(value)) {
    return DEFAULT_APP_CONFIG;
  }

  return {
    ...DEFAULT_APP_CONFIG,
    social_enabled: readBoolean(value.social_enabled),
    coach_enabled: readBoolean(value.coach_enabled),
    entry_offer_enabled: readBoolean(value.entry_offer_enabled),
    social_comments_enabled: readBoolean(value.social_comments_enabled),
    entry_offer_offering_id: readString(value.entry_offer_offering_id),
    post_rate_limit_per_day: readNumber(value.post_rate_limit_per_day),
    comment_rate_limit_per_hour: readNumber(value.comment_rate_limit_per_hour),
    rollout_percentage: readNumber(value.rollout_percentage),
    moderation_enabled: readBoolean(value.moderation_enabled),
  };
}

async function fetchCanonicalAppConfig() {
  try {
    const { data, error } = await supabase
      .from('app_feature_flags')
      .select(
        'social_enabled, coach_enabled, entry_offer_enabled, social_comments_enabled, entry_offer_offering_id, post_rate_limit_per_day, comment_rate_limit_per_hour, rollout_percentage, moderation_enabled',
      )
      .eq('scope', APP_CONFIG_REMOTE_KEY)
      .maybeSingle();

    if (error) {
      if (
        isMissingAppConfigError(error, 'app_feature_flags') ||
        isIncompatibleAppConfigError(error, 'app_feature_flags')
      ) {
        return null;
      }

      console.warn(
        '[AppConfig] Failed to fetch canonical app_feature_flags config, using defaults:',
        error,
      );
      return DEFAULT_APP_CONFIG;
    }

    if (!data) {
      return DEFAULT_APP_CONFIG;
    }

    return parseAppConfigValue(data);
  } catch (error) {
    console.warn(
      '[AppConfig] Unexpected app_feature_flags failure, using defaults:',
      error,
    );
    return DEFAULT_APP_CONFIG;
  }
}

async function fetchCompatibilityAppConfig() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', APP_CONFIG_REMOTE_KEY)
      .maybeSingle();

    if (error) {
      if (!isMissingAppConfigError(error, 'app_config')) {
        console.warn('[AppConfig] Failed to fetch app config, using defaults:', error);
      }
      return DEFAULT_APP_CONFIG;
    }

    return parseAppConfigValue((data as AppConfigRow | null)?.value);
  } catch (error) {
    console.warn('[AppConfig] Unexpected app config failure, using defaults:', error);
    return DEFAULT_APP_CONFIG;
  }
}

export async function fetchAppConfig(): Promise<AppConfig> {
  const canonicalConfig = await fetchCanonicalAppConfig();
  if (canonicalConfig !== null) {
    return canonicalConfig;
  }

  return fetchCompatibilityAppConfig();
}
