import { Phase2HttpError } from './phase2Errors.ts';
import { isRecord, readOptionalNumber, readOptionalString } from './phase2Utils.ts';

type SafeObservabilityValue = string | number | boolean | null | undefined;
type SafeObservabilityMetadata = Record<string, SafeObservabilityValue>;

const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|authorization|cookie|payload|details|webhook_text|response_text|raw_body|request_body|text|content_text|email)/i;

const PROVIDER_SUMMARY_KEYS = [
  'status',
  'source',
  'result',
  'workflow_status',
  'moderation_state',
  'moderation_reason',
  'moderation_provider',
  'reason_code',
  'error_code',
  'code',
  'auto_hidden',
  'cached',
  'fallback',
] as const;

export function createRequestId() {
  return crypto.randomUUID();
}

function sanitizeMetadata(metadata?: SafeObservabilityMetadata) {
  if (!metadata) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(metadata).flatMap(([key, value]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      return [];
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return [[key, value] as const];
    }

    return [];
  });

  return sanitizedEntries.length > 0
    ? Object.fromEntries(sanitizedEntries)
    : undefined;
}

export function summarizePhase2Error(error: unknown) {
  const errorRecord = isRecord(error) ? error : null;

  return sanitizeMetadata({
    error_name:
      error instanceof Error
        ? error.name
        : readOptionalString(errorRecord?.name) ?? undefined,
    code:
      error instanceof Phase2HttpError
        ? error.code
        : readOptionalString(errorRecord?.code) ?? undefined,
    status:
      error instanceof Phase2HttpError
        ? error.status
        : readOptionalNumber(errorRecord?.status) ?? undefined,
    request_id:
      readOptionalString(errorRecord?.request_id) ??
      readOptionalString(errorRecord?.requestId) ??
      undefined,
    event_id:
      readOptionalString(errorRecord?.event_id) ??
      readOptionalString(errorRecord?.eventId) ??
      undefined,
  });
}

export function logPhase2Error(
  scope: string,
  error: unknown,
  metadata?: SafeObservabilityMetadata,
) {
  console.error(scope, {
    ...sanitizeMetadata(metadata),
    ...summarizePhase2Error(error),
  });
}

export function summarizeProviderPayload(
  payload: Record<string, unknown> | null,
  metadata?: SafeObservabilityMetadata,
) {
  const providerSummary: SafeObservabilityMetadata = {
    ...metadata,
  };

  if (payload) {
    for (const key of PROVIDER_SUMMARY_KEYS) {
      const value = payload[key];
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        providerSummary[key] = value;
      }
    }
  }

  return sanitizeMetadata(providerSummary) ?? {};
}

export function summarizeWebhookResult(
  result: {
    status: number;
    payload: Record<string, unknown> | null;
    bodyPresent: boolean;
  },
  metadata?: SafeObservabilityMetadata,
) {
  return summarizeProviderPayload(result.payload, {
    ...metadata,
    webhook_status: result.status,
    response_body_present: result.bodyPresent,
  });
}
