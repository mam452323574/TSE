import { Phase2HttpError } from './phase2Errors.ts';

const DEFAULT_REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com';

function readEnvValue(name: string) {
  const value = Deno.env.get(name);
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

export function readOptionalServerEnv(name: string) {
  return readEnvValue(name);
}

export function requireServerEnv(
  name: string,
  options: {
    status?: number;
    code?: string;
    message?: string;
  } = {},
) {
  const value = readEnvValue(name);
  if (value) {
    return value;
  }

  throw new Phase2HttpError(
    options.status ?? 500,
    options.code ?? 'missing_server_configuration',
    options.message ?? `${name} is not configured`,
  );
}

export function getSupabaseServerConfig() {
  return {
    supabaseUrl: requireServerEnv('SUPABASE_URL', {
      code: 'missing_supabase_url',
      message: 'SUPABASE_URL is not configured',
    }),
    serviceRoleKey: requireServerEnv('SUPABASE_SERVICE_ROLE_KEY', {
      code: 'missing_supabase_service_role_key',
      message: 'SUPABASE_SERVICE_ROLE_KEY is not configured',
    }),
  };
}

export function getRevenueCatServerConfig() {
  return {
    apiBaseUrl:
      readOptionalServerEnv('REVENUECAT_API_BASE_URL') ??
      DEFAULT_REVENUECAT_API_BASE_URL,
    apiKey: requireServerEnv('REVENUECAT_API_KEY', {
      code: 'missing_revenuecat_api_key',
      message: 'REVENUECAT_API_KEY is not configured',
    }),
    premiumEntitlementId:
      readOptionalServerEnv('REVENUECAT_PREMIUM_ENTITLEMENT_ID') ?? 'premium',
    webhookAuthorization:
      readOptionalServerEnv('REVENUECAT_WEBHOOK_AUTHORIZATION') ??
      readOptionalServerEnv('REVENUECAT_WEBHOOK_SECRET'),
  };
}

export function getOptionalWebhookUrl(envName: string) {
  return readOptionalServerEnv(envName) ?? '';
}

export function requireWebhookUrl(
  envName: string,
  options: {
    code?: string;
    message?: string;
  } = {},
) {
  return requireServerEnv(envName, {
    status: 503,
    code: options.code ?? 'missing_webhook_url',
    message: options.message ?? `${envName} is not configured`,
  });
}
