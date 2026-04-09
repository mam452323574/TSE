import { requireWebhookUrl } from './phase2Env.ts';
import { Phase2HttpError } from './phase2Errors.ts';
import { summarizeProviderPayload } from './phase2Observability.ts';

export const COACH_GENERATE_WEBHOOK_ENV_NAME =
  'N8N_COACH_GENERATE_WEBHOOK_URL';
export const COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE =
  'coach_webhook_not_configured';
export const COACH_PROVIDER_NOT_CONFIGURED_MESSAGE =
  'Coach generation provider is not configured';

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

export async function requireCoachGenerateWebhookUrl(
  client: any,
  entryId: string,
) {
  try {
    return requireWebhookUrl(COACH_GENERATE_WEBHOOK_ENV_NAME, {
      code: COACH_PROVIDER_NOT_CONFIGURED_ERROR_CODE,
      message: COACH_PROVIDER_NOT_CONFIGURED_MESSAGE,
    });
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
