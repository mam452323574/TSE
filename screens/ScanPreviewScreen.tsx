import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Sparkles, Activity, Utensils, PersonStanding, Smile } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ApiService, ApiError } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { useBadges } from '@/contexts/BadgeContext';
import { ScanType } from '@/types';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';
import { useCustomAlert } from '@/hooks/useCustomAlert';

// Loading step messages for different languages and scan types (with emojis)
const LOADING_STEPS: Record<string, Record<ScanType, string[]>> = {
  fr: {
    health: ['🔍 Scan du visage...', '🧬 Analyse de la peau...', '📐 Détection des symétries...', '✨ Finalisation du score...'],
    body: ['📸 Scan de la silhouette...', '⚖️ Estimation de la masse...', '🧘 Analyse de la posture...', '📊 Calcul des indicateurs...'],
    nutrition: ['🍽️ Reconnaissance du plat...', '🔥 Estimation calorique...', '🥗 Analyse des nutriments...', '⭐ Score nutritionnel...'],
    super: ['🚀 Scan complet initié...', '🤖 Analyse croisée IA...', '🧠 Détection biométrique...', '🎯 Synthèse globale...'],
  },
  en: {
    health: ['🔍 Scanning face...', '🧬 Analyzing skin...', '📐 Detecting symmetry...', '✨ Finalizing score...'],
    body: ['📸 Scanning body shape...', '⚖️ Estimating mass...', '🧘 Analyzing posture...', '📊 Calculating metrics...'],
    nutrition: ['🍽️ Identifying dish...', '🔥 Estimating calories...', '🥗 Analyzing nutrients...', '⭐ Nutrition score...'],
    super: ['🚀 Full scan initiated...', '🤖 Cross-referencing AI...', '🧠 Biometric detection...', '🎯 Global synthesis...'],
  },
  de: {
    health: ['🔍 Gesichtsscan...', '🧬 Hautanalyse...', '📐 Symmetrieerkennung...', '✨ Punkteberechnung...'],
    body: ['📸 Körperscan...', '⚖️ Masseschätzung...', '🧘 Haltungsanalyse...', '📊 Kennzahlen berechnen...'],
    nutrition: ['🍽️ Gericht erkennen...', '🔥 Kalorienschätzung...', '🥗 Nährstoffanalyse...', '⭐ Ernährungswert...'],
    super: ['🚀 Vollständiger Scan...', '🤖 KI-Kreuzanalyse...', '🧠 Biometrische Erkennung...', '🎯 Gesamtauswertung...'],
  },
  es: {
    health: ['🔍 Escaneando rostro...', '🧬 Análisis de piel...', '📐 Detectando simetría...', '✨ Finalizando puntuación...'],
    body: ['📸 Escaneando cuerpo...', '⚖️ Estimación de masa...', '🧘 Análisis de postura...', '📊 Calculando métricas...'],
    nutrition: ['🍽️ Identificando plato...', '🔥 Estimación calórica...', '🥗 Análisis de nutrientes...', '⭐ Puntuación nutricional...'],
    super: ['🚀 Escaneo completo...', '🤖 Análisis IA cruzado...', '🧠 Detección biométrica...', '🎯 Síntesis global...'],
  },
  it: {
    health: ['🔍 Scansione volto...', '🧬 Analisi della pelle...', '📐 Rilevamento simmetria...', '✨ Calcolo punteggio...'],
    body: ['📸 Scansione corpo...', '⚖️ Stima della massa...', '🧘 Analisi postura...', '📊 Calcolo metriche...'],
    nutrition: ['🍽️ Identificazione piatto...', '🔥 Stima calorie...', '🥗 Analisi nutrienti...', '⭐ Punteggio nutrizionale...'],
    super: ['🚀 Scansione completa...', '🤖 Analisi IA incrociata...', '🧠 Rilevamento biometrico...', '🎯 Sintesi globale...'],
  },
  pt: {
    health: ['🔍 Escanear rosto...', '🧬 Análise da pele...', '📐 Detecção de simetria...', '✨ Finalizando pontuação...'],
    body: ['📸 Escanear corpo...', '⚖️ Estimativa de massa...', '🧘 Análise de postura...', '📊 Calculando métricas...'],
    nutrition: ['🍽️ Identificando prato...', '🔥 Estimativa calórica...', '🥗 Análise de nutrientes...', '⭐ Pontuação nutricional...'],
    super: ['🚀 Escaneamento completo...', '🤖 Análise cruzada de IA...', '🧠 Detecção biométrica...', '🎯 Síntese global...'],
  },
};

const VALID_SCAN_TYPES: ScanType[] = ['body', 'health', 'nutrition', 'super'];

export default function ScanPreviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const scanType = params.scanType as ScanType;

  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { showAlert, alertElement } = useCustomAlert();
  const { setBadge } = useBadges();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulated progress state
  const [currentStep, setCurrentStep] = useState(0);
  const [isApiComplete, setIsApiComplete] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get loading steps based on language (default to English) and scan type
  const stepsForLocale = LOADING_STEPS[locale as keyof typeof LOADING_STEPS] || LOADING_STEPS.en;
  const loadingSteps = stepsForLocale[scanType] || stepsForLocale.health; // Fallback to health if type missing

  // Listen to progress animation changes
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setDisplayProgress(Math.round(value));
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  // Validation des parametres requis
  useEffect(() => {
    if (!imageUri || !scanType || !VALID_SCAN_TYPES.includes(scanType)) {
      showAlert(t('common.error'), t('scan_preview.error_validation'), [
        {
          text: t('common.ok'),
          onPress: () => router.back(),
        },
      ]);
    }
  }, [imageUri, scanType, router]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  // Simulated progress animation effect
  useEffect(() => {
    if (loading && !isApiComplete) {
      // Reset progress when loading starts
      progressAnim.setValue(0);
      setCurrentStep(0);

      // Animate progress from 0 to 90% over 25 seconds for realism
      Animated.timing(progressAnim, {
        toValue: 90,
        duration: 25000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      // Cycle through steps every 1.2 seconds
      stepIntervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = (prev + 1) % loadingSteps.length;
          return nextStep;
        });
      }, 1200);
    } else if (isApiComplete) {
      // API completed - animate to 100%
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      setCurrentStep(loadingSteps.length - 1); // Set to final step

      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, [loading, isApiComplete, loadingSteps.length]);

  const handleConfirm = async () => {
    // Protection contre les doubles clics
    if (loading) return;

    try {
      setLoading(true);
      setIsApiComplete(false);

      // Create a timeout promise that rejects after 45 seconds
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new ApiError('Scan analysis timed out after 45s', 'NETWORK'));
        }, 45000);
      });

      // Race between the actual API call and the timeout
      // Force a minimum loading time of 5 seconds to show the animation
      console.log('[LANG-DEBUG] ScanPreviewScreen locale:', locale);
      const [result] = await Promise.all([
        Promise.race([
          ApiService.createScanWithAnalysis(imageUri, scanType, locale),
          timeoutPromise
        ]) as Promise<Awaited<ReturnType<typeof ApiService.createScanWithAnalysis>>>,
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      // Vérifier si l'analyse a réussi
      if (result.analysisSucceeded && result.scan.analysis_result) {
        // Succès - afficher confetti et naviguer vers les résultats
        // NOTE: On ne met PAS setLoading(false) ici pour empêcher les doubles clics 
        // pendant l'animation et avant la navigation

        // Invalidate queries to ensure Home Screen and other views are updated
        await queryClient.invalidateQueries({ queryKey: ['scanEligibility'] });
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['analytics'] });

        // Force immediate refetch to ensure UI updates even if cached
        await queryClient.refetchQueries({ queryKey: ['scanEligibility'] });
        await queryClient.refetchQueries({ queryKey: ['dashboard'] });

        // Mark API as complete to trigger 100% progress
        setIsApiComplete(true);

        // Small delay to show 100% progress before confetti
        await new Promise(resolve => setTimeout(resolve, 300));

        setShowConfetti(true);
        setBadge('analytics');

        timeoutRef.current = setTimeout(() => {
          // Router vers l'écran approprié selon le type de scan
          const targetPath = scanType === 'super' ? '/super-scan-result' : '/scan-result';
          router.replace({
            pathname: targetPath,
            params: {
              analysisData: JSON.stringify(result.scan.analysis_result),
            },
          });
          // La navigation va démonter le composant, pas besoin de reset loading
        }, 1500);
      } else {
        // Échec de l'analyse - afficher le message d'erreur approprié
        setLoading(false); // On réactive le bouton pour permettre de réessayer
        const error = result.analysisError;

        // Déterminer le titre et le message selon le type d'erreur
        // Déterminer le titre et le message selon le type d'erreur
        let title = t('scan_preview.error_title_analysis');
        let message = t('scan_preview.error_msg_default');

        if (error instanceof ApiError) {
          if (error.type === 'TYPE_MISMATCH') {
            title = t('scan_preview.error_title_type');
            message = error.message;
          } else if (error.type === 'ANALYSIS') {
            title = t('scan_preview.error_title_analysis');
            message = error.message;
          } else if (error.type === 'NETWORK') {
            title = t('scan_preview.error_title_network');
            message = t('scan_preview.error_msg_network');
          } else {
            message = error.message || message;
          }
        } else if (error as any) {
          // Fallback pour les objets ressemblant à des erreurs
          const errAny = error as any;
          if (errAny.message) {
            message = errAny.message;
          }
        }

        showAlert(title, message, [
          {
            text: t('common.retry'),
            onPress: () => {
              // L'utilisateur peut réessayer avec la même image
            },
          },
          {
            text: t('common.back'),
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (err) {
      setLoading(false);

      // Erreur inattendue (validation, auth, etc.)
      let errorMessage = t('common.error');

      if (err instanceof ApiError) {
        if (err.type === 'VALIDATION') {
          errorMessage = t('scan_preview.error_validation');
        } else if (err.type === 'AUTH') {
          errorMessage = t('scan_preview.error_session');
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      showAlert(t('common.error'), errorMessage, [
        {
          text: t('common.ok'),
          onPress: () => router.back(),
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#050505' }]}>
      {alertElement}
      <SuccessConfetti active={showConfetti} onAnimationEnd={() => setShowConfetti(false)} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X color="#FFFFFF" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />
      </View>

      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.buttonsContent}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('scan_preview.type_label')}</Text>
            <Text style={styles.infoValue}>{t(SCAN_TYPE_LABELS[scanType])}</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            disabled={loading}
            testID="confirm-button"
          >
            <Text style={styles.primaryButtonText}>
              {loading ? t('scan_preview.confirm_loading') : t('scan_preview.confirm_button')}
            </Text>
          </TouchableOpacity>

          {!loading && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.progressContainer}>
            {/* Dynamic Icon */}
            <View style={[
              styles.iconContainer,
              {
                borderColor: scanType === 'super' ? colors.gold : colors.primary,
                backgroundColor: scanType === 'super' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(102, 126, 234, 0.1)',
              }
            ]}>
              {scanType === 'super' ? (
                <Sparkles color={colors.gold} size={32} />
              ) : scanType === 'health' ? (
                <Smile color={colors.primary} size={32} />
              ) : scanType === 'body' ? (
                <PersonStanding color={colors.primary} size={32} />
              ) : (
                <Utensils color={colors.primary} size={32} />
              )}
            </View>

            {/* Current Step Text - Main headline */}
            <Text style={styles.loadingStepText}>
              {loadingSteps[currentStep]}
            </Text>

            {/* Progress Bar with Gradient */}
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFillContainer,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      scanType === 'super'
                        ? [colors.goldLight || '#fde047', colors.gold] as const
                        : [colors.primary, colors.primaryDark || '#4338ca'] as const
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarGradient}
                  />
                </Animated.View>
              </View>

              {/* Percentage Badge */}
              <View style={[styles.percentageBadge, { backgroundColor: scanType === 'super' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(102, 126, 234, 0.15)' }]}>
                <Text style={[styles.progressPercentage, { color: scanType === 'super' ? colors.gold : colors.primary }]}>
                  {displayProgress}%
                </Text>
              </View>
            </View>

            {/* Subtitle / Hint */}
            <Text style={styles.loadingSubtext}>
              {t('scan_preview.loading_text')}
            </Text>

            {/* Progress dots indicator */}
            <View style={styles.dotsContainer}>
              {loadingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                    index < currentStep && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: SPACING.xl,
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
  },
  imageContainer: {
    flex: 1,
    paddingHorizontal: 20, // Slightly reduced to increase image width
    paddingTop: 100, // Reduced to give more vertical space while keeping X button clear
    paddingBottom: 310, // Reduced to make image taller without hitting the bottom panel
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    resizeMode: 'cover',
  },
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 22, 0.4)',
  },
  buttonsContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: 40,
  },
  infoCard: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  infoLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.text16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.text16,
    fontWeight: '500',
  },
  // Premium Loading Overlay Styles
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-start',
    paddingTop: 140,
    alignItems: 'center',
    zIndex: 999,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
    minHeight: 420,
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 36,
    paddingVertical: 56,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1.5,
  },
  loadingStepText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  progressBarWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarFillContainer: {
    height: '100%',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressBarGradient: {
    flex: 1,
    borderRadius: 7,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 7,
  },
  percentageBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(102, 126, 234, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 16,
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a78bfa',
    letterSpacing: 0.5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: SIZES.text16,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    fontWeight: FONT_WEIGHTS.medium,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#764ba2',
  },
  dotCompleted: {
    backgroundColor: 'rgba(102, 126, 234, 0.6)',
  },
});

