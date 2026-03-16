import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Smile, Activity, Utensils, Sparkles, AlertCircle, X } from 'lucide-react-native';
import { ModalHandle } from '@/components/ModalHandle';
import { RadialScoreGauge } from '@/components/RadialScoreGauge';
import { MetricCard } from '@/components/MetricCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { isFieldLocked } from '@/constants/premiumFields';
import { AnalysisResult, ScanFaceResult, ScanBodyResult, ScanNutritionResult } from '@/types';
import { ContextualPaywall } from '@/components/ContextualPaywall';
import { paywallSession } from '@/utils/paywallSession';
import { useState } from 'react';

export default function ScanResultScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

  // Helper pour traduire les valeurs dynamiques
  const translateValue = (category: string, value: string) => {
    if (!value) return '';
    // On essaie de trouver la traduction exacte
    // Les clés dans scan_values sont en PascalCase ou avec des espaces, 
    // on doit matcher exactement la clé définie dans translations.ts
    // Si la valeur contient des espaces, on peut essayer de la matcher telle quelle

    // Essai direct
    const key = `scan_values.${category}.${value}`;
    const translated = t(key);

    // Si la traduction est identique à la clé (ou contient scan_values), c'est qu'il n'a pas trouvé
    // i18n-js renvoie "[missing ...]" ou la clé si manquant selon config, 
    // mais dans notre wrapper t(), ça peut être différent.
    // Supposons que t() renvoie la clé si pas trouvé.
    if (translated && !translated.includes('scan_values')) {
      return translated;
    }

    return value;
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams();
  const analysisData = params.analysisData
    ? (JSON.parse(params.analysisData as string) as AnalysisResult)
    : null;

  // Animation de slide-up
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handlePremiumPress = () => {
    if (paywallSession.canShowPaywall()) {
      setPaywallVisible(true);
      paywallSession.markPaywallShown();
    } else {
      router.push('/premium-upgrade');
    }
  };

  if (!analysisData) {
    return (
      <View style={styles.container}>
        <ModalHandle />
        <View style={styles.header}>
          <View style={{ width: 28 }} />
          <Text style={styles.headerTitle}>{t('scan_result.title')}</Text>
          <TouchableOpacity onPress={handleClose}>
            <X color={colors.primaryText} size={28} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle color={colors.error} size={48} />
          <Text style={[styles.errorText, { color: colors.gray }]}>{t('scan_result.no_data')}</Text>
          <TouchableOpacity style={[styles.errorButton, { backgroundColor: colors.primary }]} onPress={handleClose}>
            <Text style={[styles.errorButtonText, { color: colors.white }]}>{t('common.home_back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderIcon = () => {
    const iconSize = 28;
    switch (analysisData.scan_type) {
      case 'face':
        return <Smile color={colors.white} size={iconSize} />;
      case 'body':
        return <Activity color={colors.white} size={iconSize} />;
      case 'nutrition':
        return <Utensils color={colors.white} size={iconSize} />;
    }
  };

  const getTypeLabel = () => {
    return t(`scan_result.analysis_${analysisData.scan_type}`);
  };

  const getTypeColor = () => {
    switch (analysisData.scan_type) {
      case 'face':
        return colors.primary;
      case 'body':
        return colors.accentGreen;
      case 'nutrition':
        return colors.warning;
    }
  };

  const renderFaceDetails = (data: ScanFaceResult) => (
    <>
      {/* Score Global - Radial Gauge */}
      <RadialScoreGauge
        score={data.face_score}
        label={t('scan_result.score_face')}
        color={colors.primary}
      />

      {/* Grille de métriques rapides */}
      <View style={styles.gridContainer}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>🎂</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]}>{data.perceived_age}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.perceived_age')}</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>👤</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]}>{translateValue('face_shape', data.face_shape)}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.face_shape')}</Text>
        </View>
      </View>

      {/* Métriques visibles */}
      <MetricCard title={t('scan_result.symmetry')} value={data.symmetry_percentage + '%'} icon="⚖️" />
      <MetricCard title={t('scan_result.fatigue')} value={data.fatigue_level + '/100'} icon="💤" />
      <MetricCard title={t('scan_result.hydration')} value={data.hydration_level + '/100'} icon="🌊" />
      <MetricCard title={t('scan_result.photogenic')} value={data.photogenic_score + '/10'} icon="📸" />

      {/* Métriques PREMIUM */}
      <MetricCard
        title={t('scan_result.skin_quality')}
        value={data.skin_quality_score + '/100'}
        icon="💧"
        isLocked={isFieldLocked('face', 'skin_quality_score', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
      <MetricCard
        title={t('scan_result.glow')}
        value={data.glow_index + '/10'}
        icon="✨"
        isLocked={isFieldLocked('face', 'glow_index', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
      <MetricCard
        title={t('scan_result.collagen')}
        value={data.collagen_level + '/100'}
        icon="🧬"
        isLocked={isFieldLocked('face', 'collagen_level', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
    </>
  );

  const renderBodyDetails = (data: ScanBodyResult) => (
    <>
      {/* Score Global - Radial Gauge */}
      <RadialScoreGauge
        score={data.body_score}
        label={t('scan_result.score_body')}
        color={colors.accentGreen}
      />

      {/* Grille de métriques rapides */}
      <View style={styles.gridContainer}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>🧬</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]}>{translateValue('body_type', data.body_type)}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.body_type')}</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>💪</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]}>{translateValue('muscle_mass', data.muscle_mass_label)}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.muscle_mass')}</Text>
        </View>
      </View>

      {/* Métriques visibles */}
      <MetricCard title={t('scan_result.waist')} value={data.waist_estimation_cm + ' cm'} icon="📏" />
      <MetricCard title={t('scan_result.strength')} value={data.strength_index + '/100'} icon="🏋️" />
      <MetricCard title={t('scan_result.bmi')} value={data.bmi_estimate.toString()} icon="📊" />
      <MetricCard title={t('scan_result.metabolic_age')} value={data.metabolic_age + ' ' + t('common.years_short', 'ans')} icon="🕰️" />

      {/* Métriques PREMIUM */}
      <MetricCard
        title={t('scan_result.body_fat')}
        value={data.body_fat_percentage + '%'}
        icon="📉"
        isLocked={isFieldLocked('body', 'body_fat_percentage', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
      <MetricCard
        title={t('scan_result.posture')}
        value={data.posture_score + '/10'}
        icon="🧍"
        isLocked={isFieldLocked('body', 'posture_score', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
      <MetricCard
        title={t('scan_result.body_symmetry')}
        value={data.body_symmetry + '/100'}
        icon="⚖️"
        isLocked={isFieldLocked('body', 'body_symmetry', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
    </>
  );

  const renderNutritionDetails = (data: ScanNutritionResult) => (
    <>
      {/* Score Global - Radial Gauge */}
      <RadialScoreGauge
        score={data.plate_health_score}
        label={t('scan_result.score_nutrition')}
        color={colors.warning}
      />

      {/* Grille de métriques rapides */}
      <View style={styles.gridContainer}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>🔥</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]}>{data.calories_estimate}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.calories')}</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
          <Text style={styles.quickStatIcon}>📝</Text>
          <Text style={[styles.quickStatValue, { color: colors.primaryText }]} numberOfLines={2}>{data.short_verdict}</Text>
          <Text style={[styles.quickStatLabel, { color: colors.gray }]}>{t('scan_result.verdict')}</Text>
        </View>
      </View>

      {/* Macros Card */}
      <ProportionsCard
        proteins={data.protein_grams}
        carbs={data.carbs_grams}
        fats={data.fat_grams}
        colors={colors}
        isDark={isDark}
        t={t}
      />

      {/* Métriques visibles */}
      <MetricCard title={t('scan_result.satiety')} value={data.satiety_index + '/10'} icon="🍽️" />
      <MetricCard title={t('scan_result.ingredients')} value={translateValue('ingredient_quality', data.ingredient_quality)} icon="🥗" />

      {/* Métriques PREMIUM */}
      <MetricCard
        title={t('scan_result.glycemic')}
        value={translateValue('glycemic_index', data.glycemic_index_label)}
        icon="🍬"
        isLocked={isFieldLocked('nutrition', 'glycemic_index_label', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
      <MetricCard
        title={t('scan_result.vitamins')}
        value={data.main_vitamins}
        icon="💊"
        isLocked={isFieldLocked('nutrition', 'main_vitamins', isPremium)}
        onPremiumPress={handlePremiumPress}
      />
    </>
  );

  const renderDetails = () => {
    switch (analysisData.scan_type) {
      case 'face':
        return renderFaceDetails(analysisData);
      case 'body':
        return renderBodyDetails(analysisData);
      case 'nutrition':
        return renderNutritionDetails(analysisData);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHandle />

      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Résultats</Text>
        <TouchableOpacity onPress={handleClose}>
          <X color={colors.primaryText} size={28} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header avec icône et type */}
          <View style={[styles.typeCard, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
            <View style={[styles.typeIconContainer, { backgroundColor: getTypeColor() }]}>
              {renderIcon()}
            </View>
            <View style={styles.typeTextContainer}>
              <Text style={[styles.typeTitle, { color: colors.primaryText }]}>{getTypeLabel()}</Text>
              <View style={styles.confidenceContainer}>
                <Sparkles color={colors.warning} size={14} />
                <Text style={[styles.confidenceText, { color: colors.gray }]}>
                  {t('scan_result.ai_complete')}
                </Text>
              </View>
            </View>
          </View>

          {/* Détails selon le type */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>{t('scan_result.details_title')}</Text>
            {renderDetails()}
          </View>

          {/* Bouton retour */}
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }, SHADOWS.button]} onPress={handleClose}>
            <Text style={[styles.backButtonText, { color: colors.white }]}>{t('common.home_back')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <ContextualPaywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Débloquez tous vos résultats avec Premium"
        primaryButtonText="Découvrir Premium"
      />
    </View>
  );
}

// Composant Proportions pour Nutrition
const ProportionsCard = ({
  proteins,
  carbs,
  fats,
  colors,
  isDark,
  t,
}: {
  proteins: number;
  carbs: number;
  fats: number;
  colors: any;
  isDark?: boolean;
  t: (key: string) => string;
}) => (
  <View style={[proportionsStyles.card, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
    <Text style={[proportionsStyles.title, { color: colors.gray }]}>{t('scan_result.macros_title')}</Text>
    <View style={proportionsStyles.row}>
      <View style={[proportionsStyles.item, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
        <Text style={[proportionsStyles.label, { color: colors.gray }]}>{t('scan_result.proteins')}</Text>
        <Text style={[proportionsStyles.value, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>{proteins}g</Text>
      </View>
      <View style={[proportionsStyles.item, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0' }]}>
        <Text style={[proportionsStyles.label, { color: colors.gray }]}>{t('scan_result.carbs')}</Text>
        <Text style={[proportionsStyles.value, { color: isDark ? '#FFB74D' : '#EF6C00' }]}>{carbs}g</Text>
      </View>
      <View style={[proportionsStyles.item, { backgroundColor: isDark ? 'rgba(233, 30, 99, 0.15)' : '#FCE4EC' }]}>
        <Text style={[proportionsStyles.label, { color: colors.gray }]}>{t('scan_result.fats')}</Text>
        <Text style={[proportionsStyles.value, { color: isDark ? '#F48FB1' : '#C2185B' }]}>{fats}g</Text>
      </View>
    </View>
  </View>
);

const proportionsStyles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: SIZES.sm,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  item: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  label: {
    fontSize: SIZES.xs,
  },
  value: {
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: 4,
  },
});

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: colors.primaryText,
  },
  scrollContent: {
    padding: SPACING.page,
    paddingBottom: SPACING.xxxl,
  },
  content: {
    gap: SPACING.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.page,
  },
  errorText: {
    fontSize: SIZES.lg,
    color: colors.gray,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    marginTop: SPACING.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  typeCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  typeTitle: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  confidenceText: {
    fontSize: SIZES.sm,
  },
  detailsSection: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    marginBottom: SPACING.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickStatCard: {
    minWidth: '45%',
    flexGrow: 1,
    flexShrink: 0,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  quickStatValue: {
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  quickStatLabel: {
    fontSize: SIZES.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  backButton: {
    borderRadius: BORDER_RADIUS.button,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  backButtonText: {
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});
