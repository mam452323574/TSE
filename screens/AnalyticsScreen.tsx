import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Crown, Activity, Utensils, Sparkles, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/queries';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnalyticsPeriod } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { ContextualPaywall } from '@/components/ContextualPaywall';
import { paywallSession } from '@/utils/paywallSession';
import { useCustomAlert } from '@/hooks/useCustomAlert';

// Périodes disponibles avec leurs labels et restriction premium
const PERIODS: { value: AnalyticsPeriod; labelKey: string; premium: boolean }[] = [
  { value: '7days', labelKey: 'analytics.periods.days_7', premium: false },
  { value: '30days', labelKey: 'analytics.periods.days_30', premium: false },
  { value: '3months', labelKey: 'analytics.periods.months_3', premium: true },
  { value: '1year', labelKey: 'analytics.periods.year_1', premium: true },
];

// Fonction d'agregation generique pour grouper les donnees en buckets
const aggregateData = <T extends { date: string }>(
  data: T[],
  bucketSize: number,
  valueExtractor: (item: T) => number
): { date: string; value: number }[] => {
  if (bucketSize <= 1) {
    return data.map(item => ({
      date: item.date,
      value: valueExtractor(item),
    }));
  }

  const result: { date: string; value: number }[] = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;

    const avgValue = bucket.reduce((sum, item) => sum + valueExtractor(item), 0) / bucket.length;
    const startDate = bucket[0].date;
    const endDate = bucket[bucket.length - 1].date;

    result.push({
      date: bucket.length > 1 ? `${startDate}|${endDate}` : startDate,
      value: Math.round(avgValue),
    });
  }

  return result;
};

// Taille des buckets selon la periode selectionnee
const getBucketSize = (selectedPeriod: AnalyticsPeriod): number => {
  switch (selectedPeriod) {
    case '7days': return 1;    // Pas d'agregation - 1 jour par point
    case '30days': return 3;   // Moyenne sur 3 jours - ~10 points
    case '3months': return 7;  // Moyenne sur 7 jours - ~13 points
    case '1year': return 30;   // Moyenne sur 30 jours - ~12 points
    default: return 1;
  }
};

// Nombre max de labels affichés sur l'axe X pour éviter le chevauchement
const getMaxLabels = (selectedPeriod: AnalyticsPeriod): number => {
  switch (selectedPeriod) {
    case '7days': return 7;
    case '30days': return 8;
    case '3months': return 7;
    case '1year': return 6;
    default: return 7;
  }
};

// Sanitiser une valeur pour le chart : NaN/null/undefined → 0, clamp [0, 100]
const sanitizeScore = (v: number | null | undefined): number => {
  if (v === null || v === undefined || isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
};

// Format JJ/MM ou MM/DD selon la locale
const formatDayMonth = (day: number, month: number, locale: string): string => {
  return locale === 'en' ? `${month}/${day}` : `${day}/${month}`;
};

// Formater un label de date (simple ou plage) — évite les doublons, adapté à la locale
const formatDateLabel = (dateStr: string, period: AnalyticsPeriod, t: any, locale: string): string => {
  if (dateStr.includes('|')) {
    const [, end] = dateStr.split('|');
    const endDate = new Date(end);
    if (period === '1year') {
      return t(`months_short.${endDate.getMonth()}`);
    }
    if (period === '3months') {
      return `${endDate.getDate()} ${t(`months_short.${endDate.getMonth()}`).slice(0, 3)}`;
    }
    return formatDayMonth(endDate.getDate(), endDate.getMonth() + 1, locale);
  }
  const date = new Date(dateStr);
  if (period === '1year') {
    return t(`months_short.${date.getMonth()}`);
  }
  if (period === '3months') {
    return `${date.getDate()} ${t(`months_short.${date.getMonth()}`).slice(0, 3)}`;
  }
  return formatDayMonth(date.getDate(), date.getMonth() + 1, locale);
};

// Filtrer les labels pour n'en afficher que maxLabels (les autres deviennent "")
const sparseLabels = (labels: string[], maxLabels: number): string[] => {
  if (labels.length <= maxLabels) return labels;
  const step = Math.ceil(labels.length / maxLabels);
  return labels.map((label, i) => (i % step === 0 || i === labels.length - 1) ? label : '');
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [period, setPeriod] = useState<AnalyticsPeriod>('7days');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const { showAlert, alertElement } = useCustomAlert();
  const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

  // React Query hook - se met à jour automatiquement quand period change
  const { data, isLoading, error, refetch, isRefetching } = useAnalytics(period);

  const [isManualRefresh, setIsManualRefresh] = useState(false);
  // isRefreshingSilently handles background updates without visual loaders
  const isRefreshingSilently = isRefetching && !isManualRefresh;

  const onRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    await refetch();
    setIsManualRefresh(false);
  }, [refetch]);

  const handlePeriodSelect = (selectedPeriod: AnalyticsPeriod, requiresPremium: boolean) => {
    if (requiresPremium && !isPremium) {
      if (paywallSession.canShowPaywall()) {
        setPaywallVisible(true);
        paywallSession.markPaywallShown();
      } else {
        showAlert(
          t('analytics.premium_feature'),
          t('analytics.premium_feature_msg'),
          [
            { text: t('common.later'), style: 'cancel' },
            {
              text: t('premium.upgrade_premium'),
              onPress: () => router.push('/premium-upgrade'),
            },
          ]
        );
      }
      return;
    }
    setPeriod(selectedPeriod);
  };

  // Données vides par défaut pour affichage passif (même en cas d'erreur)
  const healthScoreHistory = data?.healthScoreHistory || [];
  const calorieHistory = data?.calorieHistory || [];
  const bodyCompositionHistory = data?.bodyCompositionHistory || [];

  // Nouvelles données depuis scan_metrics
  const bodyScoreHistory = data?.bodyScoreHistory || [];

  const nutritionHistory = data?.nutritionHistory || [];
  const superScanHistory = data?.superScanHistory || [];

  const hasData = healthScoreHistory.length > 0 || bodyScoreHistory.length > 0 || nutritionHistory.length > 0 || superScanHistory.length > 0;

  // Chart config iOS-style
  const chartConfig = useMemo(() => ({
    backgroundColor: colors.cardBackground,
    backgroundGradientFrom: colors.cardBackground,
    backgroundGradientTo: colors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: () => colors.gray,
    style: {
      borderRadius: BORDER_RADIUS.lg,
    },
    propsForBackgroundLines: {
      strokeDasharray: '6',
      stroke: colors.gray,
      strokeOpacity: 0.1,
      strokeWidth: 1,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.cardBackground,
    },
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientTo: colors.cardBackground,
    fillShadowGradientOpacity: 0.2,
  }), [colors]);

  // Nombre max de labels et taille des buckets
  const bucketSize = getBucketSize(period);
  const maxLabels = getMaxLabels(period);

  // Rotation des labels pour les vues denses
  const labelRotation = (period === '3months' || period === '1year') ? 45 : 0;

  // Helper pour construire les datasets d'un graphique (avec sanitization anti-crash)
  const buildChartData = useCallback(
    (aggregated: { date: string; value: number }[], colorRgba: string) => {
      if (aggregated.length === 0) return null;
      const rawLabels = aggregated.map((item) => formatDateLabel(item.date, period, t, locale));
      return {
        labels: sparseLabels(rawLabels, maxLabels),
        datasets: [
          {
            data: aggregated.map((item) => sanitizeScore(item.value)),
            color: (opacity = 1) => colorRgba.replace('OPACITY', String(opacity)),
            strokeWidth: 3,
          },
          { data: [0], withDots: false, strokeWidth: 0, color: () => 'transparent' },
          { data: [100], withDots: false, strokeWidth: 0, color: () => 'transparent' },
        ],
      };
    },
    [period, t, locale, maxLabels]
  );

  // Agréger et préparer les données des graphiques (mémoïsé)
  const { healthScoreData, physicalEvolutionData, nutritionScoreData, superScanData } = useMemo(() => {
    const healthAgg = aggregateData(healthScoreHistory, bucketSize, (item) => item.value);
    const bodyAgg = aggregateData(bodyScoreHistory, bucketSize, (item) => item.bodyScore);
    const nutritionAgg = aggregateData(nutritionHistory, bucketSize, (item) => item.nutritionScore);
    const superAgg = aggregateData(superScanHistory, bucketSize, (item) => item.globalRiskScore);

    return {
      healthScoreData: buildChartData(healthAgg, 'rgba(50, 173, 230, OPACITY)'),
      physicalEvolutionData: buildChartData(bodyAgg, 'rgba(0, 122, 255, OPACITY)'),
      nutritionScoreData: buildChartData(nutritionAgg, 'rgba(52, 199, 89, OPACITY)'),
      superScanData: buildChartData(superAgg, 'rgba(175, 82, 222, OPACITY)'),
    };
  }, [healthScoreHistory, bodyScoreHistory, nutritionHistory, superScanHistory, bucketSize, buildChartData]);

  // Largeur du graphique réactive
  const chartWidth = screenWidth - SPACING.page * 2 - SPACING.lg * 2;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {alertElement}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('analytics.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl refreshing={isManualRefresh} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* Sélecteur de période iOS-style */}
        <View style={styles.periodSelectorContainer} >
          <View style={styles.periodSelector}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.periodButton,
                  period === p.value && styles.periodButtonActive,
                ]}
                onPress={() => handlePeriodSelect(p.value, p.premium)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t(p.labelKey)}
                accessibilityState={{ selected: period === p.value }}
                accessibilityHint={p.premium && !isPremium ? t('analytics.premium_feature') : undefined}
              >
                {p.premium && !isPremium && (
                  <Crown
                    color={period === p.value ? colors.white : colors.gold}
                    size={12}
                    fill={period === p.value ? colors.white : colors.gold}
                    style={styles.crownIcon}
                  />
                )}
                <Text style={[
                  styles.periodButtonText,
                  period === p.value && styles.periodButtonTextActive,
                  p.premium && !isPremium && styles.periodButtonTextPremium,
                ]}>
                  {t(p.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View >

        {/* Message d'erreur inline avec bouton Réessayer */}
        {error && (
          <View style={styles.errorContainer}>
            <ErrorMessage
              message={error.message}
              onRetry={() => refetch()}
              fullScreen={false}
            />
          </View>
        )}

        {/* Message si aucune donnée */}
        {
          !hasData && !error && (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>
                {t('analytics.empty_state')}
              </Text>
            </View>
          )
        }

        {/* Score Santé */}
        <View style={styles.chartCard} accessible={true} accessibilityLabel={
          healthScoreData
            ? `${t('analytics.health_score')}: ${healthScoreData.datasets[0].data.slice(-1)[0]}/100`
            : `${t('analytics.health_score')}: ${t('analytics.empty_state')}`
        }>
          <View style={styles.chartHeaderWithIcon}>
            <Heart color="#32ADE6" size={20} />
            <Text style={styles.chartTitle}>{t('analytics.health_score')}</Text>
          </View>
          <Text style={styles.chartSubtitle}>{t('analytics.health_score_subtitle')}</Text>
          {healthScoreData ? (
            <LineChart
              data={healthScoreData}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                fillShadowGradientFrom: '#32ADE6',
                fillShadowGradientTo: colors.cardBackground,
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              yAxisInterval={10}
              fromZero={true}
              verticalLabelRotation={labelRotation}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>{t('analytics.empty_state')}</Text>
            </View>
          )}
        </View>

        {/* Graphique A: Évolution Physique */}
        <View style={styles.chartCard} accessible={true} accessibilityLabel={
          physicalEvolutionData
            ? `${t('analytics.physical_evolution')}: ${physicalEvolutionData.datasets[0].data.slice(-1)[0]}/100`
            : `${t('analytics.physical_evolution')}: ${t('analytics.empty_state')}`
        }>
          <View style={styles.chartHeaderWithIcon}>
            <Activity color="#007AFF" size={20} />
            <Text style={styles.chartTitle}>{t('analytics.physical_evolution')}</Text>
          </View>
          <Text style={styles.chartSubtitle}>{t('analytics.physical_evolution_subtitle')}</Text>
          {physicalEvolutionData ? (
            <LineChart
              data={physicalEvolutionData}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                fillShadowGradientFrom: '#007AFF',
                fillShadowGradientTo: colors.cardBackground,
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
              verticalLabelRotation={labelRotation}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>{t('analytics.empty_state')}</Text>
            </View>
          )}
        </View>



        {/* Graphique C: Score Nutrition */}
        <View style={styles.chartCard} accessible={true} accessibilityLabel={
          nutritionScoreData
            ? `${t('analytics.nutrition_score')}: ${nutritionScoreData.datasets[0].data.slice(-1)[0]}/100`
            : `${t('analytics.nutrition_score')}: ${t('analytics.empty_state')}`
        }>
          <View style={styles.chartHeaderWithIcon}>
            <Utensils color="#34C759" size={20} />
            <Text style={styles.chartTitle}>{t('analytics.nutrition_score')}</Text>
          </View>
          <Text style={styles.chartSubtitle}>{t('analytics.nutrition_score_subtitle')}</Text>
          {nutritionScoreData ? (
            <LineChart
              data={nutritionScoreData}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                fillShadowGradientFrom: '#34C759',
                fillShadowGradientTo: colors.cardBackground,
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
              verticalLabelRotation={labelRotation}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>{t('analytics.empty_state')}</Text>
            </View>
          )}
        </View>

        {/* Graphique D: Super Scan Score */}
        <View style={styles.chartCard} accessible={true} accessibilityLabel={
          superScanData
            ? `${t('analytics.super_scan_score')}: ${superScanData.datasets[0].data.slice(-1)[0]}/100`
            : `${t('analytics.super_scan_score')}: ${t('analytics.empty_state')}`
        }>
          <View style={styles.chartHeaderWithIcon}>
            <Sparkles color="#AF52DE" size={20} />
            <Text style={styles.chartTitle}>{t('analytics.super_scan_score')}</Text>
          </View>
          <Text style={styles.chartSubtitle}>{t('analytics.super_scan_score_subtitle')}</Text>
          {superScanData ? (
            <LineChart
              data={superScanData}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                fillShadowGradientFrom: '#AF52DE',
                fillShadowGradientTo: colors.cardBackground,
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={true}
              verticalLabelRotation={labelRotation}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>{t('analytics.empty_state')}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer} />
      </ScrollView >

      <ContextualPaywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        title="Suivez votre progression santé"
        description="Accédez à vos graphiques sur 7j, 30j, 3 mois et 1 an"
        primaryButtonText="Voir les offres"
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cardBackground,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: colors.cardBackground,
    ...SHADOWS.header,
  },
  headerTitle: {
    fontSize: SIZES.text20,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
  },
  headerSubtitle: {
    fontSize: SIZES.text14,
    color: colors.gray,
    marginTop: SPACING.xs,
  },
  periodSelectorContainer: {
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.lg,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md - 2,
  },
  periodButtonActive: {
    backgroundColor: colors.cardBackground,
    ...SHADOWS.card,
  },
  periodButtonText: {
    fontSize: SIZES.text12,
    color: colors.gray,
    fontWeight: FONT_WEIGHTS.medium,
  },
  periodButtonTextActive: {
    color: colors.primaryText,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  periodButtonTextPremium: {
    color: colors.gold,
  },
  crownIcon: {
    marginRight: 4,
  },
  chartCard: {
    marginHorizontal: SPACING.page,
    marginBottom: SPACING.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  chartHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  chartTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.xs,
  },
  chartSubtitle: {
    fontSize: SIZES.text12,
    color: colors.gray,
    marginBottom: SPACING.md,
  },
  chart: {
    marginLeft: -SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: SIZES.text12,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: SIZES.text16,
    color: colors.gray,
    textAlign: 'center',
  },
  emptyStateCard: {
    marginHorizontal: SPACING.page,
    marginBottom: SPACING.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emptyStateText: {
    fontSize: SIZES.text14,
    color: colors.gray,
    textAlign: 'center',
  },
  errorContainer: {
    marginHorizontal: SPACING.page,
    marginBottom: SPACING.lg,
  },
  footer: {
    height: SPACING.xxl,
  },
  emptyChartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyChartText: {
    fontSize: SIZES.text14,
    color: colors.gray,
    textAlign: 'center',
  },
});

