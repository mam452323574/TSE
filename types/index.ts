import type { LocaleCode } from '@/i18n/config';
import type {
  CoachPersonaDefinition,
  CoachPersonaKey,
} from '@/shared/coachPersonas';

export type { CoachPersonaDefinition, CoachPersonaKey } from '@/shared/coachPersonas';

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  benefits: string[];
  shopUrl: string;
}

export interface GamificationData {
  scanCount: number;
  mascotStage: number;
  mascotFilename: string;
  mascotImageUrl: string;
}

export interface DashboardData {
  healthScore: number;
  calories: {
    current: number;
    goal: number;
  };
  bodyfat: number;
  recommendedProducts: Product[];
  gamification: GamificationData;
}

export interface HealthScoreHistoryItem {
  date: string;
  value: number;
}

export interface CalorieHistoryItem {
  date: string;
  consumed: number;
  goal: number;
}

export interface BodyCompositionHistoryItem {
  date: string;
  bodyfat: number;
  muscle: number;
}

// Nouvelles interfaces pour les métriques étendues
export interface BodyScoreHistoryItem {
  date: string;
  bodyScore: number;
  bodyFatPercentage: number;
}

export interface FaceScoreHistoryItem {
  date: string;
  faceScore: number;
  skinQualityScore: number;
}

export interface NutritionHistoryItem {
  date: string;
  caloriesEstimate: number;
  proteinGrams: number;
  nutritionScore: number;
}

export interface SuperScanHistoryItem {
  date: string;
  globalRiskScore: number;
}

export type SupportedLocale = LocaleCode;

export type LocalizedTextMap = Partial<Record<SupportedLocale, string>>;

export interface LocalizedTextDescriptor {
  locale?: SupportedLocale | string;
  default?: string;
  text?: string;
  value?: string;
  translations?: LocalizedTextMap;
}

export type LocalizedTextValue = string | LocalizedTextMap | LocalizedTextDescriptor;

export type AnalyticsPeriod = '7days' | '30days' | '3months' | '1year';

export interface AnalyticsData {
  period: AnalyticsPeriod;
  healthScoreHistory: HealthScoreHistoryItem[];
  calorieHistory: CalorieHistoryItem[];
  bodyCompositionHistory: BodyCompositionHistoryItem[];
  // Nouvelles données
  bodyScoreHistory: BodyScoreHistoryItem[];
  faceScoreHistory: FaceScoreHistoryItem[];
  nutritionHistory: NutritionHistoryItem[];
  superScanHistory: SuperScanHistoryItem[];
}

export type ScanType = 'body' | 'health' | 'nutrition' | 'super';

export interface ScanResult {
  type: 'muscle' | 'fat';
  percentage: number;
  imageUrl: string;
}

export interface ScanLimitStatus {
  scanType: ScanType;
  currentCount: number;
  isLimitReached: boolean;
}

export interface Recipe {
  id: number;
  name: string;
  imageUrl: string;
  preparationTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Exercise {
  id: number;
  name: string;
  imageUrl: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AccountTier = 'free' | 'premium' | 'admin';

export type OAuthProvider = 'google' | 'apple' | 'email';

export interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

export interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
  super?: ScanUsageRecord;
}

export interface WelcomeCredits {
  health: number;
  body: number;
  nutrition: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  scan_count: number;
  account_tier: AccountTier;
  coach_persona_key: CoachPersonaKey;
  bio: string | null;
  push_token: string | null;
  email_verified: boolean;
  has_seen_tutorial: boolean;
  notification_settings: {
    reminders: boolean;
    achievements: boolean;
    newContent: boolean;
  };
  subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due' | 'expired';
  subscription_expiry_date?: string | null;
  subscription_platform?: 'ios' | 'android' | 'stripe' | 'web' | null;
  scan_usage: ScanUsage;
  welcome_credits: WelcomeCredits;
  last_scan_date: string | null;
  account_created_at: string;
  created_at: string;
  updated_at: string;
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  provider_email: string | null;
  linked_at: string;
  metadata: Record<string, any>;
}

export interface PremiumFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  free_tier_description: string | null;
  premium_tier_description: string | null;
  requires_premium: boolean;
  category: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisposableEmailDomain {
  id: string;
  domain: string;
  added_at: string;
  added_by: string | null;
  active: boolean;
  notes: string | null;
}

export interface ScanEligibilityResponse {
  success: boolean;
  allowed: boolean;
  message: string;
  message_key?: string;
  code?: string;
  request_id?: string;
  remaining?: number;
  next_available_date?: number;
  current_count?: number;
  limit?: number;
  scan_id?: string;
  error?: string;
  used_welcome_credit?: boolean;
  remaining_welcome_credits?: number;
  welcome_credits?: number;
}

export interface ScanLimitConfig {
  count: number;
  periodMs: number;
  label: string;
}

export interface VerificationCode {
  id: string;
  user_id: string;
  email: string;
  code: string;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string;
  last_used_at: string;
  created_at: string;
}

export interface N8nNutritionData {
  productName: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionScore?: number;
  healthScore?: number;
  recommendations?: string[];
}

export interface Scan {
  id: string;
  user_id: string;
  scan_type: ScanType;
  image_url: string | null;
  image_path?: string | null;
  used_welcome_credit?: boolean;
  analysis_result?: N8nNutritionData | StoredAnalysisResult;
  analyzed_at?: string;
  created_at: string;
}

export interface PremiumPotentialHistoryPoint {
  date: string;
  score: number;
}

export interface PremiumPotentialInputs {
  scanType: ScanType;
  currentScan: Scan | null;
  historicalAverage30d: number | null;
  scanCountTotal: number;
  recentScoreHistory: PremiumPotentialHistoryPoint[];
}

// Types pour les résultats d'analyse ChatGPT (visage, corps, plat)
// Types pour les résultats d'analyse ChatGPT (visage, corps, plat)
export type NormalizedAnalysisSchemaVersion = 3;

export interface NormalizedAnalysisBase {
  schema_version: NormalizedAnalysisSchemaVersion;
}

export interface LegacyNormalizedAnalysisBase {
  schema_version: 2;
}

export type ScanCatalogKey = string;
export type ScanVitaminKey = string;
export type SuperScanCatalogKey = string;

export type ConditionSeverity = 'low' | 'moderate' | 'high' | 'unknown';
export type LegacyConditionSeverity = 'Faible' | 'Modérée' | 'Élevée' | string;

export type AnalysisType = 'face' | 'body' | 'nutrition' | 'super_health_v2';

export interface LegacyScanFaceResult {
  scan_type: 'face';
  analysis_locale?: SupportedLocale | string;
  face_score: number;
  perceived_age: number;
  skin_quality_score: number;
  symmetry_percentage: number;
  fatigue_level: number;
  glow_index?: number | null;
  energy_score?: number | null;
  face_shape?: LocalizedTextValue;
  face_shape_code?: string | null;
  face_shape_i18n?: unknown;
  collagen_level: number;
  hydration_level: number;
  photogenic_score: number;
}

export interface LegacyNormalizedScanFaceResult extends LegacyNormalizedAnalysisBase {
  scan_type: 'face';
  face_score: number;
  perceived_age: number;
  skin_quality_score: number;
  symmetry_percentage: number;
  fatigue_level: number;
  glow_index?: number | null;
  energy_score?: number | null;
  face_shape_key: ScanCatalogKey;
  face_shape_fallback_text?: string | null;
  collagen_level: number;
  hydration_level: number;
  photogenic_score: number;
}

export interface ScanFaceResult extends NormalizedAnalysisBase {
  scan_type: 'face';
  face_score: number;
  perceived_age: number;
  skin_quality_score: number;
  symmetry_percentage: number;
  fatigue_level: number;
  glow_index?: number | null;
  energy_score?: number | null;
  face_shape_key: ScanCatalogKey;
  collagen_level: number;
  hydration_level: number;
  photogenic_score: number;
}

export interface LegacyScanBodyResult {
  scan_type: 'body';
  analysis_locale?: SupportedLocale | string;
  body_score: number;
  body_fat_percentage: number;
  muscle_mass_label?: LocalizedTextValue;
  muscle_mass_code?: string | null;
  muscle_mass_label_i18n?: unknown;
  body_type?: LocalizedTextValue;
  body_type_code?: string | null;
  body_type_i18n?: unknown;
  posture_score: number;
  waist_estimation_cm: number;
  strength_index: number;
  body_symmetry: number;
  bmi_estimate: number;
  metabolic_age: number;
}

export interface LegacyNormalizedScanBodyResult extends LegacyNormalizedAnalysisBase {
  scan_type: 'body';
  body_score: number;
  body_fat_percentage: number;
  muscle_mass_key: ScanCatalogKey;
  muscle_mass_fallback_text?: string | null;
  body_type_key: ScanCatalogKey;
  body_type_fallback_text?: string | null;
  posture_score: number;
  waist_estimation_cm: number;
  strength_index: number;
  body_symmetry: number;
  bmi_estimate: number;
  metabolic_age: number;
}

export interface ScanBodyResult extends NormalizedAnalysisBase {
  scan_type: 'body';
  body_score: number;
  body_fat_percentage: number;
  muscle_mass_key: ScanCatalogKey;
  body_type_key: ScanCatalogKey;
  posture_score: number;
  waist_estimation_cm: number;
  strength_index: number;
  body_symmetry: number;
  bmi_estimate: number;
  metabolic_age: number;
}

export interface LegacyScanNutritionResult {
  scan_type: 'nutrition';
  analysis_locale?: SupportedLocale | string;
  plate_health_score: number;
  calories_estimate: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  glycemic_index_label?: LocalizedTextValue;
  glycemic_index_code?: string | null;
  glycemic_index_label_i18n?: unknown;
  satiety_index: number;
  ingredient_quality?: LocalizedTextValue;
  ingredient_quality_code?: string | null;
  ingredient_quality_i18n?: unknown;
  main_vitamins?: LocalizedTextValue;
  main_vitamins_i18n?: unknown;
  short_verdict?: LocalizedTextValue;
  short_verdict_i18n?: unknown;
}

export interface LegacyNormalizedScanNutritionResult extends LegacyNormalizedAnalysisBase {
  scan_type: 'nutrition';
  plate_health_score: number;
  calories_estimate: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  verdict_key: ScanCatalogKey;
  verdict_fallback_text?: string | null;
  glycemic_index_key: ScanCatalogKey;
  satiety_index: number;
  ingredient_quality_key: ScanCatalogKey;
  main_vitamin_keys: ScanVitaminKey[];
  main_vitamins_fallback_text?: string | null;
}

export interface ScanNutritionResult extends NormalizedAnalysisBase {
  scan_type: 'nutrition';
  plate_health_score: number;
  calories_estimate: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  verdict_key: ScanCatalogKey;
  glycemic_index_key: ScanCatalogKey;
  satiety_index: number;
  ingredient_quality_key: ScanCatalogKey;
  main_vitamin_keys: ScanVitaminKey[];
}

export type AnalysisResult = ScanFaceResult | ScanBodyResult | ScanNutritionResult;
export type LegacyNormalizedAnalysisResult =
  | LegacyNormalizedScanFaceResult
  | LegacyNormalizedScanBodyResult
  | LegacyNormalizedScanNutritionResult;
export type LegacyAnalysisResult =
  | LegacyScanFaceResult
  | LegacyScanBodyResult
  | LegacyScanNutritionResult;
export type ShareStoryVariant = 'face' | 'body' | 'nutrition' | 'super';
export type ShareableAnalysisResult = AnalysisResult | SuperScanResult;
export type ShareStoryMetricValueVariant = 'numeric' | 'fraction' | 'text';

export interface ShareStoryMetric {
  label: string;
  value: string;
  valueVariant: ShareStoryMetricValueVariant;
  labelMaxLines: number;
  valueMaxLines: number;
}

export interface ShareStoryPayload {
  variant: ShareStoryVariant;
  variantLabel: string;
  score: number;
  scoreLabel: string;
  heroImageUri?: string | null;
  metrics: ShareStoryMetric[];
  accentColor: string;
  accentColorSecondary?: string;
  headline?: string;
  footerBrand: string;
  footerCta: string;
  statusBadgeLabel?: string;
  statusTone?: 'neutral' | 'warning';
}

export type SocialComposerDraftAsset =
  | { kind: 'none' }
  | { kind: 'share_story'; payload: ShareStoryPayload }
  | { kind: 'local_image'; imageUri: string };

export interface SocialComposerDraft {
  version: 1;
  id: string;
  source: 'composer' | 'share_story';
  scanId: string | null;
  category: SocialCategory;
  caption: string;
  asset: SocialComposerDraftAsset;
  createdAt: string;
  updatedAt: string;
}

// === Super Scan Types ===

export interface LegacyDetectedCondition {
  condition_name?: string;
  condition_code?: string | null;
  condition_name_i18n?: unknown;
  category?: string;
  category_code?: string | null;
  category_i18n?: unknown;
  probability: number;
  severity: LegacyConditionSeverity;
  explanation?: string;
  explanation_i18n?: unknown;
  actionable_advice?: string;
  actionable_advice_i18n?: unknown;
}

export interface LegacyNormalizedDetectedCondition {
  condition_key: SuperScanCatalogKey;
  condition_fallback_text?: string | null;
  category_key: SuperScanCatalogKey;
  category_fallback_text?: string | null;
  probability: number;
  severity_key: ConditionSeverity;
  explanation_key: SuperScanCatalogKey;
  explanation_fallback_text?: string | null;
  advice_key: SuperScanCatalogKey;
  advice_fallback_text?: string | null;
}

export interface DetectedCondition {
  condition_key: SuperScanCatalogKey;
  category_key: SuperScanCatalogKey;
  probability: number;
  severity_key: ConditionSeverity;
  explanation_key: SuperScanCatalogKey;
  advice_key: SuperScanCatalogKey;
}

export interface LegacySuperScanResult {
  scan_type: 'super_health_v2';
  analysis_locale?: SupportedLocale | string;
  global_risk_score: number;
  urgency_flag: boolean;
  analysis_summary?: string;
  analysis_summary_i18n?: unknown;
  detected_conditions: LegacyDetectedCondition[];
  disclaimer_text?: string;
  disclaimer_text_i18n?: unknown;
}

export interface LegacyNormalizedSuperScanResult extends LegacyNormalizedAnalysisBase {
  scan_type: 'super_health_v2';
  global_risk_score: number;
  urgency_flag: boolean;
  summary_key: SuperScanCatalogKey;
  summary_fallback_text?: string | null;
  detected_conditions: LegacyNormalizedDetectedCondition[];
  disclaimer_key: SuperScanCatalogKey;
  disclaimer_fallback_text?: string | null;
}

export interface SuperScanResult extends NormalizedAnalysisBase {
  scan_type: 'super_health_v2';
  global_risk_score: number;
  urgency_flag: boolean;
  summary_key: SuperScanCatalogKey;
  detected_conditions: DetectedCondition[];
  disclaimer_key: SuperScanCatalogKey;
}

export type StoredAnalysisResult =
  | AnalysisResult
  | SuperScanResult
  | LegacyNormalizedAnalysisResult
  | LegacyNormalizedSuperScanResult
  | LegacyAnalysisResult
  | LegacySuperScanResult;

// === Phase 1 foundations ===

export interface FeatureFlags {
  social_enabled: boolean;
  coach_enabled: boolean;
  entry_offer_enabled: boolean;
  social_comments_enabled: boolean;
}

export type SocialCategory = 'before_after' | 'food' | 'physique';

export type SocialCategoryFilter = 'all' | SocialCategory;

export type ModerationState =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'hidden'
  | 'removed';

export type SocialModerationStatus = ModerationState;

export type SocialReportTargetType = 'post' | 'comment';

export type SocialReactionState = 'like' | 'dislike' | 'neutral';

export type SocialReportReasonCode =
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'graphic_gore'
  | 'spam_repeat'
  | 'self_harm'
  | 'illegal_activity'
  | 'misinformation'
  | 'other';

export type SocialModerationAction =
  | 'approve'
  | 'flag'
  | 'hide'
  | 'remove'
  | 'restore'
  | 'reject'
  | 'dismiss_reports';

export type SocialReportWorkflowStatus =
  | 'submitted'
  | 'reviewing'
  | 'resolved'
  | 'dismissed';

export type CoachEntryStatus = 'pending' | 'ready' | 'error';

export type CoachPromptType =
  | 'latest_scan'
  | 'weekly_plan'
  | 'nutrition_focus'
  | 'body_focus'
  | 'face_focus';

export type GrowthState =
  | 'baseline'
  | 'entry_offer_ready'
  | 'entry_offer_claimed'
  | 'entry_offer_dismissed'
  | 'coach_ready'
  | 'cooldown';

export interface CoachScanDigest {
  scan_id: string;
  scan_type: ScanType;
  captured_at: string;
  normalized_scan_type: 'face' | 'body' | 'nutrition' | 'super_health_v2';
  metrics: Record<string, unknown>;
}

export interface CoachGuidancePayload {
  prompt_type: CoachPromptType;
  generated_at: string;
  scan_count_7d: number;
  selected_scan: CoachScanDigest | null;
  recent_scans: CoachScanDigest[];
  by_type?: Partial<Record<ScanType, CoachScanDigest | null>>;
}

export interface SocialPost {
  id: string;
  author_id: string;
  author_username: string | null;
  author_avatar_url: string | null;
  category: SocialCategory;
  content_text: string;
  scan_id?: string | null;
  share_payload_snapshot?: ShareStoryPayload | null;
  asset_path?: string | null;
  asset_url?: string | null;
  image_url: string | null;
  created_at: string;
  like_count: number;
  dislike_count: number;
  impression_count: number;
  comment_count: number;
  viewer_reaction: SocialReactionState;
  viewer_has_liked: boolean;
  moderation_status: SocialModerationStatus;
  moderation_state?: ModerationState;
  moderation_reason?: string | null;
  moderation_provider?: string | null;
  rejection_count?: number;
  last_rejected_at?: string | null;
  deleted_at?: string | null;
}

export interface SocialComment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string | null;
  author_avatar_url: string | null;
  content_text: string;
  created_at: string;
  moderation_status: SocialModerationStatus;
  moderation_state?: ModerationState;
  moderation_reason?: string | null;
  moderation_provider?: string | null;
  rejection_count?: number;
  last_rejected_at?: string | null;
  deleted_at?: string | null;
}

export interface SocialFeedPage {
  items: SocialPost[];
  next_cursor: string | null;
}

export interface CoachEntry {
  id: string;
  title: string;
  body: string;
  disclaimer: string;
  persona_key: CoachPersonaKey;
  cta_label: string | null;
  cta_route: string | null;
  created_at: string;
  source: string | null;
  user_id?: string;
  status?: CoachEntryStatus | null;
  error_code?: string | null;
  cache_key?: string | null;
  input_hash?: string | null;
  request_payload_json?: Record<string, unknown> | null;
  response_payload_json?: Record<string, unknown> | null;
  expires_at?: string | null;
  generated_at?: string | null;
}

export interface UserGrowthExperience {
  user_id: string;
  growth_state: GrowthState;
  entry_offer_eligible: boolean;
  entry_offer_shown_at: string | null;
  entry_offer_dismissed_at: string | null;
  entry_offer_claimed_at: string | null;
  entry_offer_offering_id: string | null;
  coach_seen_at: string | null;
  coach_cooldown_until: string | null;
  growth_state_updated_at: string;
  created_at?: string;
  updated_at: string;
}

export interface Phase2FeatureFlags extends FeatureFlags {
  scope: string;
  moderation_enabled: boolean;
  entry_offer_offering_id: string | null;
  rollout_percentage: number | null;
  post_rate_limit_per_day: number;
  comment_rate_limit_per_hour: number;
  report_rate_limit_per_day: number;
  repeated_rejection_threshold: number;
  rejected_content_cooldown_hours: number;
  coach_cache_ttl_minutes: number;
}

export interface SocialCreatePostRequest {
  category: SocialCategory;
  content_text?: string;
  upload_id?: string;
  reserved_asset_path?: string;
  scan_id?: string;
  share_payload_snapshot?: ShareStoryPayload;
}

export interface Phase2RateLimitResult {
  allowed: boolean;
  limit_count: number;
  window_seconds: number;
  recent_count: number;
  retry_after_seconds: number;
}

export interface Phase2RejectionCooldownResult {
  active: boolean;
  cooldown_until: string | null;
  recent_rejection_count: number;
  rejection_threshold: number;
  cooldown_hours: number;
}

export interface SocialCreatePostResponse {
  success: true;
  post_id: string;
  moderation_state: ModerationState;
  published: boolean;
  asset_url: string | null;
  rate_limit: Phase2RateLimitResult;
  cooldown: Phase2RejectionCooldownResult;
}

export interface SocialCreateCommentRequest {
  post_id: string;
  content_text: string;
}

export interface SocialCreateCommentResponse {
  success: true;
  comment_id: string;
  post_id: string;
  moderation_state: ModerationState;
  published: boolean;
  rate_limit: Phase2RateLimitResult;
  cooldown: Phase2RejectionCooldownResult;
}

export interface SocialReportContentRequest {
  target_type: SocialReportTargetType;
  target_post_id?: string;
  target_comment_id?: string;
  reason_code: SocialReportReasonCode;
  details?: string;
}

export interface SocialReportContentResponse {
  success: true;
  report_id: string;
  workflow_status: SocialReportWorkflowStatus;
}

export interface SocialSetReactionRequest {
  post_id: string;
  reaction: SocialReactionState;
}

export interface SocialSetReactionResponse {
  success: true;
  post_id: string;
  viewer_reaction: SocialReactionState;
  like_count: number;
  dislike_count: number;
}

export interface SocialRecordImpressionsRequest {
  post_ids: string[];
  source?: 'feed' | 'detail' | 'comments';
}

export interface SocialRecordImpressionsResponse {
  success: true;
  recorded_count: number;
}

export interface SocialReserveUploadRequest {
  mime_type: string;
}

export interface SocialReserveUploadResponse {
  success: true;
  upload_id: string;
  asset_path: string;
  bucket: string;
  mime_type: string;
}

export interface CoachGenerateRequest {
  payload: CoachGuidancePayload;
  persona_key: CoachPersonaKey;
  locale?: string;
  force_refresh?: boolean;
}

export interface CoachGenerateResponse {
  success: true;
  cached: boolean;
  entry_id: string;
  persona_key: CoachPersonaKey;
  status: CoachEntryStatus;
  title: string | null;
  body: string | null;
  disclaimer: string;
  cta_label: string | null;
  cta_route: string | null;
  source: string | null;
  expires_at: string | null;
  response_payload_json: Record<string, unknown>;
}

export interface CoachGuidanceResult extends CoachGenerateResponse {
  fallback: boolean;
  payload: CoachGuidancePayload;
}
