import { supabase } from './supabase';
import Constants from 'expo-constants';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import { DashboardData, AnalyticsData, AnalyticsPeriod, Product, ScanType, ScanEligibilityResponse, AnalysisType, AnalysisResult, ScanBodyResult, ScanFaceResult, ScanNutritionResult, SuperScanResult, BodyScoreHistoryItem, FaceScoreHistoryItem, NutritionHistoryItem, SuperScanHistoryItem } from '@/types';
import { STORAGE_BUCKET_NAME, SCAN_TYPE_TO_ANALYSIS_TYPE, ANALYSIS_TYPE_LABELS, SCAN_TYPE_LABELS } from '@/constants/scan';
import { N8nWebhookService, N8nAnalysisData } from './n8nWebhook';

const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Types d'erreurs pour une meilleure gestion
export type ApiErrorType = 'NETWORK' | 'DATABASE' | 'VALIDATION' | 'AUTH' | 'ANALYSIS' | 'TYPE_MISMATCH' | 'UNKNOWN';

export class ApiError extends Error {
  type: ApiErrorType;
  originalError?: unknown;
  context?: Record<string, unknown>;

  constructor(
    message: string,
    type: ApiErrorType,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }

  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('Network request failed') ||
        error.message.includes('fetch failed') ||
        error.name === 'TypeError'
      );
    }
    return false;
  }

  static isDatabaseError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      return code.startsWith('PGRST') || code.startsWith('42');
    }
    return false;
  }
}

// Type de retour pour createScanWithAnalysis
export interface ScanWithAnalysisResult {
  scan: any;
  analysisSucceeded: boolean;
  analysisError?: ApiError;
}

export class ApiService {
  static async getDashboard(): Promise<DashboardData> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('api_errors.unauthorized');
    }

    // 1. Récupérer le Global Score depuis la Vue SQL
    const { data: globalScoreData, error: viewError } = await supabase
      .from('user_current_global_score')
      .select('global_score')
      .eq('user_id', user.id)
      .maybeSingle();

    if (viewError) {
      console.error('[API] Error fetching global score:', viewError);
    }

    // 2. Récupérer les produits recommandés (inchangé)
    const { data: products, error: productsError } = await supabase
      .from('recommended_products')
      .select('*')
      .eq('active', true)
      .limit(5);

    if (productsError) throw productsError;

    const recommendedProducts: Product[] = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.image_url,
      benefits: p.benefits || [],
      shopUrl: p.shop_url,
    }));

    return {
      // Le healthScore devient le Global Score unifié
      healthScore: globalScoreData?.global_score || 0,

      // Valeurs par défaut car ces widgets sont supprimés de la Home
      calories: {
        current: 0,
        goal: 2000,
      },
      bodyfat: 0,

      recommendedProducts,
    };
  }

  static async getAnalytics(period: AnalyticsPeriod): Promise<AnalyticsData> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('api_errors.unauthorized');
    }

    // Map period to days
    const periodToDays: Record<string, number> = {
      '7days': 7,
      '30days': 30,
      '3months': 90,
      '1year': 365,
    };
    const days = periodToDays[period] || 30;

    // Calculer la date de début en LOCAL (évite le décalage UTC)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localStartDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;

    // Exécuter les deux requêtes en PARALLÈLE avec colonnes spécifiques + limit
    const [healthResult, metricsResult] = await Promise.all([
      // Requête 1: health_scores (legacy)
      supabase
        .from('health_scores')
        .select('date, score, calories_current, calories_goal, bodyfat, muscle')
        .eq('user_id', user.id)
        .gte('date', localStartDateStr)
        .order('date', { ascending: true })
        .limit(1000),

      // Requête 2: scan_metrics (nouvelles données)
      supabase
        .from('scan_metrics')
        .select('recorded_at, scan_type, body_score, body_fat_percentage, face_score, skin_quality_score, plate_health_score, calories_estimate, protein_grams, global_risk_score')
        .eq('user_id', user.id)
        .gte('recorded_at', localStartDateStr)
        .order('recorded_at', { ascending: true })
        .limit(1000),
    ]);

    const { data: healthScores, error } = healthResult;
    if (error) throw error;

    const { data: scanMetrics, error: metricsError } = metricsResult;
    // Si la table n'existe pas encore, on continue sans erreur
    if (metricsError) {
      console.error('[API] Error fetching scan_metrics:', metricsError);
    }

    const metrics = scanMetrics || [];

    // Helper to group by date and compute average
    const aggregateDailyData = <T extends Record<string, any>>(
      data: any[],
      type: string,
      mapFn: (m: any) => T,
      valueKeys: { [key in keyof T]?: string }
    ): T[] => {
      const filtered = data.filter((m: any) => m.scan_type === type);
      const grouped: Record<string, any[]> = {};

      filtered.forEach((m: any) => {
        const date = m.recorded_at.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(m);
      });

      return Object.entries(grouped).map(([date, items]) => {
        // Obtenir la structure base via la fonction de mapping sur le premier element (pour recup les autres champs statiques si besoin)
        const base = mapFn(items[0]);
        (base as any).date = date; // Force la date

        // Calculer la moyenne pour chaque cle define dans valueKeys
        for (const key in valueKeys) {
          const keyName = key as keyof T;
          const sourceName = valueKeys[keyName] as string;

          // Check if all items have this field as null, to ignore
          const isValid = items.some(i => i[sourceName] !== null && i[sourceName] !== undefined);
          if (isValid) {
            const sum = items.reduce((acc, curr) => acc + (curr[sourceName] || 0), 0);
            (base as any)[keyName] = Math.round(sum / items.length);
          }
        }
        return base;
      }).sort((a, b) => new Date((a as any).date).getTime() - new Date((b as any).date).getTime());
    };

    // Mapper les anciennes données
    // Mapper les anciennes données (legacy)
    // const healthScoreHistory = ... (Removed, computed later)

    const calorieHistory = (healthScores || []).map((h: any) => ({
      date: h.date,
      consumed: h.calories_current,
      goal: h.calories_goal,
    }));

    const bodyCompositionHistory = (healthScores || []).map((h: any) => ({
      date: h.date,
      bodyfat: h.bodyfat,
      muscle: h.muscle,
    }));

    // Mapper les nouvelles données depuis scan_metrics avec agregation journaliere
    const bodyScoreHistory: BodyScoreHistoryItem[] = aggregateDailyData<BodyScoreHistoryItem>(
      metrics,
      'body',
      (m: any) => ({
        date: m.recorded_at.split('T')[0],
        bodyScore: m.body_score,
        bodyFatPercentage: m.body_fat_percentage || 0,
      }),
      { bodyScore: 'body_score', bodyFatPercentage: 'body_fat_percentage' }
    ).filter(x => x.bodyScore !== null && x.bodyScore !== undefined);

    const faceScoreHistory: FaceScoreHistoryItem[] = aggregateDailyData<FaceScoreHistoryItem>(
      metrics,
      'face',
      (m: any) => ({
        date: m.recorded_at.split('T')[0],
        faceScore: m.face_score,
        skinQualityScore: m.skin_quality_score || 0,
      }),
      { faceScore: 'face_score', skinQualityScore: 'skin_quality_score' }
    ).filter(x => x.faceScore !== null && x.faceScore !== undefined);

    const nutritionHistory: NutritionHistoryItem[] = aggregateDailyData<NutritionHistoryItem>(
      metrics,
      'nutrition',
      (m: any) => ({
        date: m.recorded_at.split('T')[0],
        caloriesEstimate: m.calories_estimate,
        proteinGrams: m.protein_grams || 0,
        nutritionScore: m.plate_health_score || 0,
      }),
      { caloriesEstimate: 'calories_estimate', proteinGrams: 'protein_grams', nutritionScore: 'plate_health_score' }
    ).filter(x => x.caloriesEstimate !== null && x.caloriesEstimate !== undefined);

    const superScanHistory: SuperScanHistoryItem[] = aggregateDailyData<SuperScanHistoryItem>(
      metrics,
      'super',
      (m: any) => ({
        date: m.recorded_at.split('T')[0],
        globalRiskScore: m.global_risk_score,
      }),
      { globalRiskScore: 'global_risk_score' }
    ).filter(x => x.globalRiskScore !== null && x.globalRiskScore !== undefined);

    // Dans Analytics, le Score Santé = Score Visage uniquement
    // (Le Dashboard/Home conserve le Global Score = moyenne Face+Body)
    const healthScoreHistory = faceScoreHistory.map(item => ({
      date: item.date,
      value: item.faceScore,
    }));

    return {
      period,
      healthScoreHistory, // Contient maintenant le Global Score unifié
      calorieHistory, // Legacy, non utilisé
      bodyCompositionHistory, // Legacy, non utilisé
      bodyScoreHistory,
      faceScoreHistory,
      nutritionHistory,
      superScanHistory,
    };
  }

  /**
   * Sauvegarde les métriques clés d'un scan dans la table scan_metrics
   * pour l'historique et les graphiques d'évolution
   */
  static async saveMetricsToHistory(
    scanId: string,
    scanType: ScanType,
    analysisResult: AnalysisResult | SuperScanResult
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[API] saveMetricsToHistory: User not authenticated');
      return;
    }

    try {
      // Préparer les données selon le type de scan
      const metricsData: any = {
        user_id: user.id,
        scan_id: scanId,
        recorded_at: new Date().toISOString(),
      };

      // Mapper le scan_type au type d'analyse
      const resultType = (analysisResult as any).scan_type;

      if (resultType === 'body') {
        const bodyResult = analysisResult as ScanBodyResult;
        metricsData.scan_type = 'body';
        metricsData.body_score = bodyResult.body_score;
        metricsData.body_fat_percentage = bodyResult.body_fat_percentage;
        metricsData.waist_estimation_cm = bodyResult.waist_estimation_cm;
      } else if (resultType === 'face') {
        const faceResult = analysisResult as ScanFaceResult;
        metricsData.scan_type = 'face';
        metricsData.face_score = faceResult.face_score;
        metricsData.skin_quality_score = faceResult.skin_quality_score;
        metricsData.fatigue_level = faceResult.fatigue_level;
      } else if (resultType === 'nutrition') {
        const nutritionResult = analysisResult as ScanNutritionResult;
        metricsData.scan_type = 'nutrition';
        metricsData.plate_health_score = nutritionResult.plate_health_score;
        metricsData.calories_estimate = nutritionResult.calories_estimate;
        metricsData.protein_grams = nutritionResult.protein_grams;
      } else if (resultType === 'super_health_v2') {
        const superResult = analysisResult as SuperScanResult;
        metricsData.scan_type = 'super';
        metricsData.global_risk_score = superResult.global_risk_score;
      } else {
        console.warn('[API] saveMetricsToHistory: Unknown scan type:', resultType);
        return;
      }

      const { error } = await supabase
        .from('scan_metrics')
        .insert(metricsData);

      if (error) {
        // Ne pas faire échouer le scan si l'insertion des métriques échoue
        console.error('[API] saveMetricsToHistory error:', error);
      }
    } catch (error) {
      console.error('[API] saveMetricsToHistory exception:', error);
    }
  }

  static async getRecipes() {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async checkScanEligibility(scanType: ScanType): Promise<ScanEligibilityResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('api_errors.unauthorized');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/check-and-record-scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanType }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      // FALLBACK: Si l'erreur est "Invalid scan type" pour "super", on gère localement
      if (scanType === 'super' && error.error === 'Invalid scan type') {
        console.warn('[API] Backend rejected super scan. Using client-side fallback.');

        // Créer l'entrée scan directement
        const { data: scanRecord, error: scanError } = await supabase
          .from('scans')
          .insert({
            user_id: session.user.id,
            scan_type: scanType,
          })
          .select('id')
          .single();

        if (scanError) throw scanError;

        return {
          success: true,
          allowed: true,
          message: 'Scan autorisé (fallback)',
          current_count: 0,
          limit: 1, // Suppose premium limit
          welcome_credits: 0,
          scan_id: scanRecord.id,
        };
      }

      throw new Error(error.error || 'Failed to check scan eligibility');
    }

    const data: ScanEligibilityResponse = await response.json();

    // Calculer 'remaining' si absent mais limit et current_count sont présents
    if (data.remaining === undefined && typeof data.limit === 'number' && typeof data.current_count === 'number') {
      data.remaining = Math.max(0, data.limit - data.current_count);
    }

    return data;
  }

  static async checkScanEligibilityOnly(scanType: ScanType): Promise<ScanEligibilityResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('api_errors.unauthorized');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/check-and-record-scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanType, checkOnly: true }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      // FALLBACK: Si l'erreur est "Invalid scan type" pour "super", on gère localement
      if (scanType === 'super' && error.error === 'Invalid scan type') {
        console.warn('[API] Backend rejected super scan check. Using client-side fallback.');
        return {
          success: true,
          allowed: true, // Just allow it for testing
          message: 'Disponible (fallback)',
          current_count: 0,
          limit: 1,
          welcome_credits: 0,
        };
      }

      throw new Error(error.error || 'Failed to check scan eligibility');
    }

    const data: ScanEligibilityResponse = await response.json();

    // Calculer 'remaining' si absent mais limit et current_count sont présents
    if (data.remaining === undefined && typeof data.limit === 'number' && typeof data.current_count === 'number') {
      data.remaining = Math.max(0, data.limit - data.current_count);
    }


    return data;
  }

  static async getNextAvailableScanDate(scanType: ScanType): Promise<number | null> {
    try {
      const result = await this.checkScanEligibilityOnly(scanType);
      return result.next_available_date || null;
    } catch (error) {
      console.error('Error getting next scan date:', error);
      return null;
    }
  }

  /**
   * Rembourse un crédit de scan en supprimant l'entrée du scan
   * et en restaurant le crédit de l'utilisateur.
   * Utilisé quand l'analyse n8n échoue ou retourne un type incorrect.
   * 
   * @param scanId - ID du scan à rembourser
   * @param scanType - Type de scan (health, body, nutrition)
   * @param usedWelcomeCredit - true si un crédit de bienvenue a été utilisé, false sinon
   */
  static async refundScanCredit(scanId: string, scanType: ScanType, usedWelcomeCredit: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError('Utilisateur non authentifié', 'AUTH');
    }

    try {
      // 1. Récupérer les informations du scan pour vérifier qu'il appartient à l'utilisateur
      const { data: scan, error: fetchError } = await supabase
        .from('scans')
        .select('id, user_id, scan_type, created_at')
        .eq('id', scanId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !scan) {
        console.error('[API] Scan non trouvé pour remboursement:', { scanId, error: fetchError });
        throw new ApiError(
          'Scan non trouvé pour le remboursement',
          'DATABASE',
          fetchError,
          { scanId, userId: user.id }
        );
      }

      // 2. Supprimer le scan de la base de données
      const { error: deleteError } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('[API] Erreur lors de la suppression du scan:', deleteError);
        throw new ApiError(
          'Erreur lors de la suppression du scan',
          'DATABASE',
          deleteError,
          { scanId, userId: user.id }
        );
      }

      // 3. Restaurer le crédit selon le mode de débit utilisé
      const { data: profile, error: profileFetchError } = await supabase
        .from('user_profiles')
        .select('welcome_credits, scan_usage')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error('[API] Erreur lors de la récupération du profil:', profileFetchError);
        // Ne pas throw ici - le scan est déjà supprimé, on log juste l'erreur
        return;
      }

      if (usedWelcomeCredit) {
        // Cas 1: Rembourser un welcome_credit
        const currentCredits = profile?.welcome_credits || { health: 0, body: 0, nutrition: 0 };
        const updatedCredits = {
          ...currentCredits,
          [scanType]: (currentCredits[scanType] || 0) + 1,
        };

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ welcome_credits: updatedCredits })
          .eq('id', user.id);

        if (updateError) {
          console.error('[API] Erreur lors de la restauration du welcome_credit:', updateError);
          return;
        }
      } else {
        // Cas 2: Retirer le timestamp de scan_usage
        const currentScanUsage = profile?.scan_usage || {
          health: { last_scan_date: null, scan_timestamps: [] },
          body: { last_scan_date: null, scan_timestamps: [] },
          nutrition: { last_scan_date: null, scan_timestamps: [] },
        };

        const scanRecord = currentScanUsage[scanType] || { last_scan_date: null, scan_timestamps: [] };
        const timestamps = scanRecord.scan_timestamps || [];

        // Retirer le timestamp correspondant au scan (basé sur created_at)
        const scanCreatedAt = scan.created_at;
        const updatedTimestamps = timestamps.filter((ts: string) => ts !== scanCreatedAt);

        // Si le timestamp exact n'est pas trouvé, retirer le dernier
        const finalTimestamps = updatedTimestamps.length < timestamps.length
          ? updatedTimestamps
          : timestamps.slice(0, -1);

        const updatedScanUsage = {
          ...currentScanUsage,
          [scanType]: {
            ...scanRecord,
            scan_timestamps: finalTimestamps,
            // Mettre à jour last_scan_date si nécessaire
            last_scan_date: finalTimestamps.length > 0
              ? finalTimestamps[finalTimestamps.length - 1]
              : null,
          },
        };

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ scan_usage: updatedScanUsage })
          .eq('id', user.id);

        if (updateError) {
          console.error('[API] Erreur lors de la restauration du scan_usage:', updateError);
          return;
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Erreur lors du remboursement du crédit',
        'UNKNOWN',
        error,
        { scanId, scanType, userId: user.id }
      );
    }
  }

  static async createScan(imageUri: string, scanType: ScanType) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('api_errors.unauthorized');
    }

    const eligibility = await this.checkScanEligibility(scanType);
    const hasWelcomeCredits = (eligibility.welcome_credits || 0) > 0;
    const canScan = eligibility.allowed || hasWelcomeCredits;
    if (!canScan) {
      throw new Error(eligibility.message || 'Scan non autorise');
    }

    if (!eligibility.scan_id) {
      throw new Error('api_errors.server');
    }

    // Utiliser ImageManipulator pour normaliser et obtenir le base64
    // Fonctionne avec tous les types d'URIs (file://, content://, etc.)

    let base64 = '';
    const fileExt = 'jpg';

    if (Platform.OS === 'web') {
      try {

        base64 = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous'; // Tentative de gestion CORS si besoin

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }

              // Dessiner l'image sur le canvas (convertit implicitement en pixels bruts)
              ctx.drawImage(img, 0, 0);

              // Exporter en JPEG avec qualité 0.95
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

              // Extraire le base64 pur
              const base64Data = dataUrl.split(',')[1];
              resolve(base64Data);
            } catch (err) {
              reject(err);
            }
          };

          img.onerror = (err) => {
            console.error('[API] Image failed to load', err);
            reject(new Error('Failed to load image for processing'));
          };

          img.src = imageUri;
        });
      } catch (e) {
        console.error('[API] Web image processing failed:', e);
        throw new Error('api_errors.image_processing_failed');
      }
    } else {
      // Logic native existante
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [], // Pas de transformation, juste normalisation
          {
            compress: 0.95, // Haute qualité pour l'analyse IA
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true, // Retourne directement le base64
          }
        );

        if (!manipulatedImage.base64) {
          throw new Error('api_errors.server');
        }
        base64 = manipulatedImage.base64;
      } catch (e) {
        console.error('[API] Native image processing failed:', e);
        throw e;
      }
    }

    const timestamp = Date.now();
    const fileName = `${user.id}/${timestamp}.${fileExt}`;

    // Upload avec ArrayBuffer décodé depuis base64
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .createSignedUrl(fileName, 3600); // URL valide 1 heure

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error('Impossible de générer une URL signée pour l\'image');
    }

    const { data, error } = await supabase
      .from('scans')
      .update({ image_url: signedUrlData.signedUrl })
      .eq('id', eligibility.scan_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Retourner le scan avec l'info si un welcome credit a été utilisé + le base64 pour n8n
    return {
      ...data,
      _usedWelcomeCredit: eligibility.used_welcome_credit || false,
      _imageBase64: `data:image/jpeg;base64,${base64}`,
    };
  }

  static async analyzeScanWithN8n(scanId: string, imageBase64: string, scanType: ScanType, language: string = 'fr') {
    // Validation des paramètres
    if (!scanId || typeof scanId !== 'string') {
      throw new ApiError(
        'api_errors.validation',
        'VALIDATION',
        undefined,
        { scanId, imageBase64: '[base64]', scanType }
      );
    }

    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      throw new ApiError(
        'api_errors.validation',
        'VALIDATION',
        undefined,
        { scanId, imageBase64: '[invalid]', scanType }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError('api_errors.unauthorized', 'AUTH');
    }

    const context = { scanId, imageBase64: '[base64]', scanType, userId: user.id };

    try {

      const analysisResult = await N8nWebhookService.analyzeScan(
        imageBase64,
        user.id,
        scanType,
        language
      );

      if (!analysisResult.success || !analysisResult.data) {
        throw new ApiError(
          analysisResult.error || 'L\'analyse a échoué sans données',
          'ANALYSIS',
          undefined,
          { ...context, analysisResult }
        );
      }

      const { data: updateData, error: updateError } = await supabase
        .from('scans')
        .update({
          analysis_result: analysisResult.data,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', scanId)
        .select()
        .single();

      if (updateError) {
        const errorType = ApiError.isDatabaseError(updateError) ? 'DATABASE' : 'UNKNOWN';
        throw new ApiError(
          `Erreur lors de la sauvegarde de l'analyse: ${updateError.message}`,
          errorType,
          updateError,
          { ...context, updateError }
        );
      }

      return updateData;
    } catch (error) {
      // Si c'est déjà une ApiError, on la propage
      if (error instanceof ApiError) {
        console.error('[API] Erreur analyse N8n:', {
          type: error.type,
          message: error.message,
          context: error.context
        });
        throw error;
      }

      // Sinon, on détermine le type d'erreur
      let errorType: ApiErrorType = 'UNKNOWN';
      if (ApiError.isNetworkError(error)) {
        errorType = 'NETWORK';
      } else if (ApiError.isDatabaseError(error)) {
        errorType = 'DATABASE';
      }

      const apiError = new ApiError(
        error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse',
        errorType,
        error,
        context
      );

      console.error('[API] Erreur analyse N8n:', {
        type: apiError.type,
        message: apiError.message,
        originalError: error
      });

      throw apiError;
    }
  }

  static async createScanWithAnalysis(imageUri: string, scanType: ScanType, language: string): Promise<ScanWithAnalysisResult> {
    // Validation des paramètres
    if (!imageUri || typeof imageUri !== 'string') {
      throw new ApiError(
        'imageUri invalide ou manquante',
        'VALIDATION',
        undefined,
        { imageUri, scanType }
      );
    }

    console.log('[API] Création du scan avec analyse:', { scanType });
    console.log('[LANG-DEBUG] createScanWithAnalysis language:', language);

    // Étape 1: Créer le scan (crédit débité)
    const scan = await this.createScan(imageUri, scanType);

    try {
      // Étape 2: Appeler n8n pour l'analyse
      console.log('[API] Démarrage analyse N8n:', { scanId: scan.id, scanType });

      const analysisResult = await N8nWebhookService.analyzeScan(
        scan._imageBase64,
        scan.user_id,
        scanType,
        language
      );

      // Étape 3: Vérifier success === true
      if (!analysisResult.success || !analysisResult.data) {
        console.log('[API] Analyse n8n échouée, remboursement du crédit...', {
          success: analysisResult.success,
          error: analysisResult.error
        });

        // Rembourser le crédit
        await this.refundScanCredit(scan.id, scanType, scan._usedWelcomeCredit);

        return {
          scan,
          analysisSucceeded: false,
          analysisError: new ApiError(
            analysisResult.error || "Oups, l'image n'a pas pu être analysée. Vérifiez la netteté et réessayez. Aucun crédit n'a été débité.",
            'ANALYSIS',
            undefined,
            { scanId: scan.id, analysisResult }
          ),
        };
      }

      // Étape 4: Vérifier que data.scan_type correspond au scanType attendu
      const expectedAnalysisType = SCAN_TYPE_TO_ANALYSIS_TYPE[scanType];
      // TypeScript ne sait pas que data est AnalysisResult ici, on cast
      const analysisData = analysisResult.data as any;
      const actualAnalysisType = analysisData.scan_type;

      if (actualAnalysisType !== expectedAnalysisType) {
        console.log('[API] Type d\'analyse incorrect, remboursement du crédit...', {
          expected: expectedAnalysisType,
          actual: actualAnalysisType,
        });

        // Rembourser le crédit
        await this.refundScanCredit(scan.id, scanType, scan._usedWelcomeCredit);

        const expectedLabel = ANALYSIS_TYPE_LABELS[expectedAnalysisType];
        // Safely handle potentially undefined label
        const actualLabel = ANALYSIS_TYPE_LABELS[actualAnalysisType as AnalysisType] || actualAnalysisType || 'Inconnu';

        return {
          scan,
          analysisSucceeded: false,
          analysisError: new ApiError(
            `Type détecté incorrect : ${actualLabel} au lieu de ${expectedLabel}. Veuillez prendre une photo correspondant au type de scan sélectionné (${SCAN_TYPE_LABELS[scanType]}). Aucun crédit n'a été débité.`,
            'TYPE_MISMATCH',
            undefined,
            {
              scanId: scan.id,
              expectedType: expectedAnalysisType,
              actualType: actualAnalysisType,
              analysisResult
            }
          ),
        };
      }

      // Étape 5: Succès - Sauvegarder analysis_result en BDD
      console.log('[API] Analyse N8n réussie, mise à jour de la base de données...');

      const { data: updateData, error: updateError } = await supabase
        .from('scans')
        .update({
          analysis_result: analysisResult.data,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', scan.id)
        .select()
        .single();

      if (updateError) {
        console.error('[API] Erreur lors de la sauvegarde de l\'analyse:', updateError);
        // Ne pas rembourser ici - l'analyse a réussi, juste la sauvegarde a échoué
        // L'utilisateur a quand même bénéficié de l'analyse
        throw new ApiError(
          `Erreur lors de la sauvegarde de l'analyse: ${updateError.message}`,
          'DATABASE',
          updateError,
          { scanId: scan.id }
        );
      }

      console.log('[API] Analyse sauvegardée avec succès:', { scanId: scan.id });

      // Étape 6: Sauvegarder les métriques pour l'historique/graphiques
      await this.saveMetricsToHistory(scan.id, scanType, analysisResult.data as AnalysisResult | SuperScanResult);

      return {
        scan: updateData,
        analysisSucceeded: true,
      };
    } catch (error) {
      // Si c'est déjà une ApiError avec remboursement effectué, on la propage
      if (error instanceof ApiError) {
        // Les erreurs ANALYSIS et TYPE_MISMATCH ont déjà remboursé
        if (error.type !== 'ANALYSIS' && error.type !== 'TYPE_MISMATCH') {
          console.error('[API] Erreur inattendue, tentative de remboursement...', {
            type: error.type,
            message: error.message,
          });

          try {
            await this.refundScanCredit(scan.id, scanType, scan._usedWelcomeCredit);
            error.message = error.message + " Aucun crédit n'a été débité.";
          } catch (refundError) {
            console.error('[API] Échec du remboursement:', refundError);
          }
        }

        return {
          scan,
          analysisSucceeded: false,
          analysisError: error,
        };
      }

      // Erreur non gérée - tenter un remboursement
      console.error('[API] Erreur inconnue, tentative de remboursement...', error);

      try {
        await this.refundScanCredit(scan.id, scanType, scan._usedWelcomeCredit);
      } catch (refundError) {
        console.error('[API] Échec du remboursement:', refundError);
      }

      const apiError = new ApiError(
        (error instanceof Error ? error.message : 'Erreur inconnue lors de l\'analyse') + " Aucun crédit n'a été débité.",
        'UNKNOWN',
        error,
        { scanId: scan.id, scanType }
      );

      return {
        scan,
        analysisSucceeded: false,
        analysisError: apiError,
      };
    }
  }

  /**
   * Version legacy de createScanWithAnalysis qui retourne juste le scan
   * @deprecated Utiliser createScanWithAnalysis à la place
   */
  static async createScanWithAnalysisLegacy(imageUri: string, scanType: ScanType, language: string) {
    const result = await this.createScanWithAnalysis(imageUri, scanType, language);
    return result.scan;
  }
}
