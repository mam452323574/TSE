import { Phase2HttpError } from './phase2Errors.ts';
import { isRecord } from './phase2Utils.ts';
import {
  getProviderScanType,
  type AppScanType,
  type ProviderScanType,
} from '../../../shared/scanContract.ts';

type SupportedScanType = AppScanType;

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function readBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null;
}

function readScanPayloadCandidate(payload: Record<string, unknown>) {
  if (isRecord(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.entry)) {
    return payload.entry;
  }

  return payload;
}

export function normalizeScanAnalysisLanguage(value: unknown) {
  const locale = readString(value)?.toLowerCase() ?? 'en';
  const [baseLocale] = locale.split(/[-_]/);
  return /^[a-z]{2}$/.test(baseLocale) ? baseLocale : 'en';
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

export function resolveNormalizedScanAnalysisPayload(
  payload: Record<string, unknown> | null,
  scanType: SupportedScanType,
) {
  if (!payload) {
    throw new Phase2HttpError(
      502,
      'invalid_analysis_response',
      'Scan analysis provider returned an empty payload',
    );
  }

  const success = readBoolean(payload.success);
  if (success === false) {
    throw new Phase2HttpError(
      502,
      'analysis_failed',
      readString(payload.error) ?? 'Scan analysis provider reported a failure',
    );
  }

  const candidate = readScanPayloadCandidate(payload);
  if (!isRecord(candidate)) {
    throw new Phase2HttpError(
      502,
      'invalid_analysis_response',
      'Scan analysis provider returned an invalid payload',
    );
  }

  const analysisType = readString(candidate.scan_type);
  if (!analysisType) {
    throw new Phase2HttpError(
      502,
      'invalid_analysis_response',
      'Scan analysis payload is missing scan_type',
    );
  }

  const expectedType = getProviderScanType(scanType);
  if (analysisType !== expectedType) {
    throw new Phase2HttpError(
      422,
      'analysis_type_mismatch',
      `Expected ${expectedType} analysis for ${scanType}, received ${analysisType}`,
      {
        expected_type: expectedType,
        actual_type: analysisType,
      },
    );
  }

  return {
    ...candidate,
    schema_version:
      typeof candidate.schema_version === 'number' &&
      (candidate.schema_version === 2 || candidate.schema_version === 3)
        ? candidate.schema_version
        : 3,
  };
}

export function isStoredScanAnalysisComplete(scanRow: {
  analysis_result?: unknown;
  analyzed_at?: string | null;
} | null | undefined) {
  return Boolean(scanRow?.analysis_result && scanRow?.analyzed_at);
}

export function isProviderScanType(
  value: unknown,
): value is ProviderScanType {
  return (
    typeof value === 'string' &&
    ['face', 'body', 'nutrition', 'super_health_v2'].includes(value)
  );
}
