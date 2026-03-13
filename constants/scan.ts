import { ScanType, ScanLimitConfig, AnalysisType } from '@/types';

export const MAX_SCANS_PER_TYPE = 3;
export const RATE_LIMIT_HOURS = 24;
export const STORAGE_BUCKET_NAME = 'scan-images';

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  body: 'scan_types.body',
  health: 'scan_types.health',
  nutrition: 'scan_types.nutrition',
  super: 'scan_types.super',
};

// Mapping entre le type de scan (application) et le type d'analyse (n8n)
export const SCAN_TYPE_TO_ANALYSIS_TYPE: Record<ScanType, AnalysisType> = {
  health: 'face',
  body: 'body',
  nutrition: 'nutrition',
  super: 'super_health_v2',
};

// Labels pour les types d'analyse retournés par n8n (USED INTERNALLY OR DISPLAYED? If displayed, use keys)
export const ANALYSIS_TYPE_LABELS: Record<AnalysisType, string> = {
  face: 'scan_types.health',
  body: 'scan_types.body',
  nutrition: 'scan_types.nutrition',
  super_health_v2: 'scan_types.super',
};

export const FREE_SCAN_LIMITS: Record<ScanType, ScanLimitConfig> = {
  health: {
    count: 1,
    periodMs: 7 * 24 * 60 * 60 * 1000,
    label: 'scan_limits.week_1',
  },
  body: {
    count: 1,
    periodMs: 30 * 24 * 60 * 60 * 1000,
    label: 'scan_limits.month_1',
  },
  nutrition: {
    count: 1,
    periodMs: 3 * 24 * 60 * 60 * 1000,
    label: 'scan_limits.days_3_1',
  },
  super: {
    count: 0,
    periodMs: 24 * 60 * 60 * 1000,
    label: 'scan_limits.premium_only',
  },
};

export const PREMIUM_SCAN_LIMITS: Record<ScanType, ScanLimitConfig> = {
  health: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: 'scan_limits.day_3',
  },
  body: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: 'scan_limits.day_3',
  },
  nutrition: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: 'scan_limits.day_3',
  },
  super: {
    count: 1,
    periodMs: 24 * 60 * 60 * 1000,
    label: 'scan_limits.day_1',
  },
};

export const SCAN_LIMIT_MESSAGES: Record<ScanType, { free: string; premium: string }> = {
  health: {
    free: 'scan_limits.msg_weekly_reached',
    premium: 'scan_limits.msg_daily_reached_3',
  },
  body: {
    free: 'scan_limits.msg_monthly_reached',
    premium: 'scan_limits.msg_daily_reached_3',
  },
  nutrition: {
    free: 'scan_limits.msg_days_3_reached',
    premium: 'scan_limits.msg_daily_reached_3',
  },
  super: {
    free: 'scan_limits.msg_premium_only',
    premium: 'scan_limits.msg_daily_reached_1',
  },
};

export const NOTIFICATION_MESSAGES: Record<ScanType, { title: string; body: string }> = {
  health: {
    title: 'notifications.scan_health_title',
    body: 'notifications.scan_health_body',
  },
  body: {
    title: 'notifications.scan_body_title',
    body: 'notifications.scan_body_body',
  },
  nutrition: {
    title: 'notifications.scan_nutrition_title',
    body: 'notifications.scan_nutrition_body',
  },
  super: {
    title: 'notifications.scan_super_title',
    body: 'notifications.scan_super_body',
  },
};
