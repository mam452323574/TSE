export const SCAN_IMAGE_BUCKET = 'scan-images';

export const APP_SCAN_TYPES = ['health', 'body', 'nutrition', 'super'] as const;
export type AppScanType = (typeof APP_SCAN_TYPES)[number];

export const PROVIDER_SCAN_TYPE_BY_APP_SCAN_TYPE = {
  health: 'face',
  body: 'body',
  nutrition: 'nutrition',
  super: 'super_health_v2',
} as const;

export type ProviderScanType =
  (typeof PROVIDER_SCAN_TYPE_BY_APP_SCAN_TYPE)[AppScanType];

export const CHECK_AND_RECORD_SCAN_REQUEST_KEYS = [
  'scan_type',
  'check_only',
] as const;

export const LEGACY_CHECK_AND_RECORD_SCAN_REQUEST_KEYS = [
  'scanType',
  'checkOnly',
] as const;

export const ANALYZE_SCAN_REQUEST_KEYS = [
  'scan_id',
  'scan_type',
  'language',
] as const;

export function isAppScanType(value: unknown): value is AppScanType {
  return typeof value === 'string' && APP_SCAN_TYPES.includes(value as AppScanType);
}

export function getProviderScanType(scanType: AppScanType): ProviderScanType {
  return PROVIDER_SCAN_TYPE_BY_APP_SCAN_TYPE[scanType];
}

export function buildCanonicalScanImagePath(userId: string, scanId: string) {
  return `${userId}/scans/${scanId}.jpg`;
}

export function buildCheckAndRecordScanRequest(
  scanType: AppScanType,
  options: { checkOnly?: boolean } = {},
) {
  return {
    scan_type: scanType,
    ...(options.checkOnly ? { check_only: true } : {}),
  };
}

export function buildAnalyzeScanRequest(
  scanId: string,
  scanType: AppScanType,
  language?: string,
) {
  const normalizedLanguage =
    typeof language === 'string' && language.trim().length > 0
      ? language.trim()
      : undefined;

  return {
    scan_id: scanId,
    scan_type: scanType,
    ...(normalizedLanguage ? { language: normalizedLanguage } : {}),
  };
}
