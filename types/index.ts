export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  benefits: string[];
  shopUrl: string;
}

export interface DashboardData {
  healthScore: number;
  calories: {
    current: number;
    goal: number;
  };
  bodyfat: number;
  recommendedProducts: Product[];
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
  account_tier: AccountTier;
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
  image_url: string;
  analysis_result?: N8nNutritionData | AnalysisResult | SuperScanResult;
  analyzed_at?: string;
  created_at: string;
}

// Types pour les résultats d'analyse ChatGPT (visage, corps, plat)
// Types pour les résultats d'analyse ChatGPT (visage, corps, plat)
export type AnalysisType = 'face' | 'body' | 'nutrition' | 'super_health_v2';

export interface ScanFaceResult {
  scan_type: 'face';
  face_score: number;
  perceived_age: number;
  skin_quality_score: number;
  symmetry_percentage: number;
  fatigue_level: number;
  glow_index: number;
  face_shape: string;
  collagen_level: number;
  hydration_level: number;
  photogenic_score: number;
}

export interface ScanBodyResult {
  scan_type: 'body';
  body_score: number;
  body_fat_percentage: number;
  muscle_mass_label: string;
  body_type: string;
  posture_score: number;
  waist_estimation_cm: number;
  strength_index: number;
  body_symmetry: number;
  bmi_estimate: number;
  metabolic_age: number;
}

export interface ScanNutritionResult {
  scan_type: 'nutrition';
  plate_health_score: number;
  calories_estimate: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  glycemic_index_label: string;
  satiety_index: number;
  ingredient_quality: string;
  main_vitamins: string;
  short_verdict: string;
}

export type AnalysisResult = ScanFaceResult | ScanBodyResult | ScanNutritionResult;

// === Super Scan V2 Types ===

export type ConditionSeverity = 'Faible' | 'Modérée' | 'Élevée';

export interface DetectedCondition {
  condition_name: string;      // Ex: "Suspicion Carence Fer"
  category: string;            // Ex: "Carences"
  probability: number;         // 0-99
  severity: ConditionSeverity;
  explanation: string;         // Explication technique
  actionable_advice: string;   // Conseil pratique
}

export interface SuperScanResult {
  scan_type: 'super_health_v2';
  global_risk_score: number;   // 0-100
  urgency_flag: boolean;       // TRUE = Alerte critique
  analysis_summary: string;
  detected_conditions: DetectedCondition[]; // Peut être vide si RAS
  disclaimer_text: string;     // Texte légal obligatoire
}

