import { readOptionalServerEnv, requireWebhookUrl } from './phase2Env.ts';
import { Phase2HttpError } from './phase2Errors.ts';
import { summarizeProviderPayload } from './phase2Observability.ts';
import { type Phase2WebhookResult, postWebhookJson } from './phase2Webhook.ts';

export const COACH_GENERATE_WEBHOOK_ENV_NAME =
  'N8N_COACH_GENERATE_WEBHOOK_URL';
export const COACH_GENERATE_FALLBACK_WEBHOOK_ENV_NAME =
  'N8N_COACH_GENERATE_FALLBACK_WEBHOOK_URL';
export const COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE =
  'coach_webhook_not_configured';
export const COACH_PROVIDER_NOT_CONFIGURED_MESSAGE =
  'Coach generation provider is not configured';

export interface CoachGenerateWebhookEndpoints {
  primaryUrl: string;
  fallbackUrl: string | null;
}

export type CoachWebhookFallbackReason =
  | 'network_error'
  | 'server_error'
  | 'invalid_json';

export interface CoachGenerateWebhookCallResult {
  webhookResult: Phase2WebhookResult;
  usedFallback: boolean;
  fallbackReason: CoachWebhookFallbackReason | null;
}

export async function markCoachProviderUnavailable(
  client: any,
  entryId: string,
) {
  await client
    .from('coach_entries')
    .update({
      status: 'error',
      error_code: COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE,
      response_payload_json: summarizeProviderPayload(null, {
        error_code: COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE,
        source: 'coach_generation',
      }),
    })
    .eq('id', entryId);
}

export async function requireCoachGenerateWebhookEndpoints(
  client: any,
  entryId: string,
): Promise<CoachGenerateWebhookEndpoints> {
  try {
    return {
      primaryUrl: requireWebhookUrl(COACH_GENERATE_WEBHOOK_ENV_NAME, {
        code: COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE,
        message: COACH_PROVIDER_NOT_CONFIGURED_MESSAGE,
      }),
      fallbackUrl: readOptionalServerEnv(
        COACH_GENERATE_FALLBACK_WEBHOOK_ENV_NAME,
      ),
    };
  } catch (error) {
    if (
      error instanceof Phase2HttpError &&
      error.code === COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE
    ) {
      await markCoachProviderUnavailable(client, entryId);
    }

    throw error;
  }
}

function resolveCoachWebhookFallbackReason(
  result: Phase2WebhookResult,
): CoachWebhookFallbackReason | null {
  if (result.status >= 500) {
    return 'server_error';
  }

  if (result.ok && result.payload === null) {
    return 'invalid_json';
  }

  return null;
}

export async function postCoachGenerateWebhook(options: {
  endpoints: CoachGenerateWebhookEndpoints;
  payload: Record<string, unknown>;
  timeoutMs?: number;
  onFallback?: (details: {
    reason: CoachWebhookFallbackReason;
    primaryStatus: number | null;
  }) => void | Promise<void>;
}): Promise<CoachGenerateWebhookCallResult> {
  const timeoutMs = options.timeoutMs ?? 10000;

  try {
    const primaryResult = await postWebhookJson(
      options.endpoints.primaryUrl,
      options.payload,
      timeoutMs,
    );
    const fallbackReason = options.endpoints.fallbackUrl
      ? resolveCoachWebhookFallbackReason(primaryResult)
      : null;

    if (!fallbackReason || !options.endpoints.fallbackUrl) {
      return {
        webhookResult: primaryResult,
        usedFallback: false,
        fallbackReason: null,
      };
    }

    await options.onFallback?.({
      reason: fallbackReason,
      primaryStatus: primaryResult.status,
    });

    return {
      webhookResult: await postWebhookJson(
        options.endpoints.fallbackUrl,
        options.payload,
        timeoutMs,
      ),
      usedFallback: true,
      fallbackReason,
    };
  } catch (error) {
    if (error instanceof Phase2HttpError) {
      throw error;
    }

    if (!options.endpoints.fallbackUrl) {
      throw error;
    }

    await options.onFallback?.({
      reason: 'network_error',
      primaryStatus: null,
    });

    return {
      webhookResult: await postWebhookJson(
        options.endpoints.fallbackUrl,
        options.payload,
        timeoutMs,
      ),
      usedFallback: true,
      fallbackReason: 'network_error',
    };
  }
}
