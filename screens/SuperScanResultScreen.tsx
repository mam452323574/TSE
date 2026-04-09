import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, Share2, Sparkles, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModalHandle } from '@/components/ModalHandle';
import { TrajectoryPreviewCard } from '@/components/TrajectoryPreviewCard';
import { UrgencyModal } from '@/components/UrgencyModal';
import { ConditionCard } from '@/components/ConditionCard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useFeatureFlags, usePremiumPotential } from '@/hooks/queries';
import { SuperScanResult } from '@/types';
import { FONT_WEIGHTS, SIZES, SPACING, withAlpha } from '@/constants/theme';
import { tryNormalizeAnalysisResult } from '@/utils/analysisNormalization';
import { openResultShareFlow } from '@/utils/resultShareFlow';
import {
  buildResultTrajectoryViewModel,
  buildSuperScanResultViewModel,
} from '@/utils/resultViewModels';
import {
  RESULT_TEXT_PROPS,
  getResultLayoutState,
  getResultSurfaceChrome,
} from '@/utils/resultLayout';
import { resolvePremiumRenderStateFromProfile } from '@/utils/subscription';

const parseAnalysisData = (value: string | string[] | undefined): SuperScanResult | null => {
  if (!value) return null;

  const payload = Array.isArray(value) ? value[0] : value;
  if (!payload) return null;

  try {
    const normalized = tryNormalizeAnalysisResult(JSON.parse(payload));
    return normalized?.scan_type === 'super_health_v2'
      ? (normalized as SuperScanResult)
      : null;
  } catch {
    return null;
  }
};

const parseRouteParam = (value: string | string[] | undefined) =>
  typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value[0]
      : undefined;

export default function SuperScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userProfile, loading: authLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const { data: featureFlags } = useFeatureFlags();
  const { alertElement, showAlert } = useCustomAlert();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getResultLayoutState(width), [width]);
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(colors, isDark, insets, layout), [colors, insets, isDark, layout]);

  const premiumRenderState = resolvePremiumRenderStateFromProfile(
    userProfile,
    authLoading,
  );
  const analysisData = useMemo(() => parseAnalysisData(params.analysisData), [params.analysisData]);
  const scanId = parseRouteParam(params.scanId);
  const imageUri =
    typeof params.imageUri === 'string'
      ? params.imageUri
      : Array.isArray(params.imageUri)
        ? params.imageUri[0]
        : undefined;
  const { data: premiumPotential } = usePremiumPotential(
    'super',
    scanId ?? null,
    !!analysisData,
  );

  const viewModel = useMemo(() => {
    if (!analysisData) {
      return null;
    }

    return buildSuperScanResultViewModel({
      analysisData,
      t,
    });
  }, [analysisData, t]);
  const trajectoryViewModel = useMemo(() => {
    if (!analysisData) {
      return null;
    }

    return buildResultTrajectoryViewModel({
      analysisData,
      t,
      locale,
      premiumRenderState,
      historicalAverage30d: premiumPotential?.historicalAverage30d ?? null,
      recentScoreHistory: premiumPotential?.recentScoreHistory ?? [],
      currentScanDate:
        premiumPotential?.currentScan?.analyzed_at ??
        premiumPotential?.currentScan?.created_at ??
        null,
    });
  }, [
    analysisData,
    locale,
    premiumRenderState,
    premiumPotential?.currentScan?.analyzed_at,
    premiumPotential?.currentScan?.created_at,
    premiumPotential?.historicalAverage30d,
    premiumPotential?.recentScoreHistory,
    t,
  ]);

  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [hasAcknowledgedUrgency, setHasAcknowledgedUrgency] = useState(false);
  const [isPreparingCommunityShare, setIsPreparingCommunityShare] = useState(false);

  const slideAnim = useRef(new Animated.Value(34)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analysisData?.urgency_flag && !hasAcknowledgedUrgency) {
      setShowUrgencyModal(true);
    }
  }, [analysisData?.urgency_flag, hasAcknowledgedUrgency]);

  useEffect(() => {
    if (!showUrgencyModal) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 18,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fadeAnim, showUrgencyModal, slideAnim]);

  const handleUrgencyDismiss = () => {
    setShowUrgencyModal(false);
    setHasAcknowledgedUrgency(true);
  };

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSharePress = () => {
    if (!analysisData) {
      return;
    }

    openResultShareFlow({
      analysisData,
      imageUri,
      scanId,
      locale,
      t,
      userProfile,
      socialEnabled: featureFlags?.social_enabled,
      isPreparingCommunityShare,
      setIsPreparingCommunityShare,
      router,
      showAlert,
    });
  };

  const handleTrajectoryPress = () => {
    router.push('/premium-upgrade');
  };

  const getRiskTone = (score: number) => {
    if (score >= 70) return colors.error;
    if (score >= 40) return colors.warning;
    return colors.success;
  };

  if (!analysisData || !viewModel) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={isDark ? ['#12141A', colors.background] : ['#EEF2FF', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundLayer}
        />
        <ModalHandle />

        <View style={styles.header}>
          <View style={styles.headerSidePlaceholder} />
          <Text {...RESULT_TEXT_PROPS} numberOfLines={1} style={styles.headerTitle}>
            {t('common.results.title')}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
            <X color={colors.primaryText} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.errorCard} testID="super-scan-empty-state">
          <View style={styles.errorIconContainer}>
            <AlertCircle color={colors.error} size={34} />
          </View>
          <Text {...RESULT_TEXT_PROPS} style={styles.errorText}>
            {t('common.results.no_data')}
          </Text>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleClose}>
            <Text {...RESULT_TEXT_PROPS} style={styles.primaryButtonText}>
              {t('common.home_back')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alertElement}
      <LinearGradient
        colors={isDark ? ['#12141A', colors.background] : ['#EEF2FF', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundLayer}
      />

      <UrgencyModal visible={showUrgencyModal} onDismiss={handleUrgencyDismiss} />

      <ModalHandle />

      <View style={styles.header}>
        <View style={styles.headerSidePlaceholder} />
        <Text {...RESULT_TEXT_PROPS} numberOfLines={1} style={styles.headerTitle}>
          {t('common.results.title')}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <X color={colors.primaryText} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['rgba(255,214,10,0.15)', 'rgba(255,255,255,0.03)'] : ['#FFF9EE', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.metricBadge}>
                <Text {...RESULT_TEXT_PROPS} numberOfLines={2} style={styles.metricBadgeText}>
                  {t('scan.super.score_label')}
                </Text>
              </View>
              {analysisData.urgency_flag ? (
                <View style={[styles.urgencyBadge, { borderColor: colors.error }]}>
                  <Text {...RESULT_TEXT_PROPS} testID="super-scan-urgency-badge-text" numberOfLines={1} style={[styles.urgencyBadgeText, { color: colors.error }]}>
                    {t('components.urgency.title')}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.scoreMainRow}>
              <View style={styles.scoreIconContainer}>
                <Sparkles color={colors.gold} size={30} fill={colors.gold} />
              </View>

              <View style={styles.scoreTextContainer}>
                <View style={styles.scoreValueRow}>
                  <Text {...RESULT_TEXT_PROPS} testID="super-scan-score-value" numberOfLines={1} style={[styles.scoreValue, { color: getRiskTone(viewModel.globalRiskScore) }]}>
                    {viewModel.globalRiskScore}
                  </Text>
                  <Text {...RESULT_TEXT_PROPS} testID="super-scan-score-suffix" numberOfLines={1} style={styles.scoreSuffix}>
                    /100
                  </Text>
                </View>
                <Text {...RESULT_TEXT_PROPS} numberOfLines={2} style={styles.scoreMeta}>
                  {t('common.results.ai_complete')}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {trajectoryViewModel?.shouldRender ? (
            <TrajectoryPreviewCard
              model={trajectoryViewModel}
              onPress={
                trajectoryViewModel.premiumRenderState === 'locked'
                  ? handleTrajectoryPress
                  : undefined
              }
            />
          ) : null}

          <View style={styles.summaryCard}>
            <Text {...RESULT_TEXT_PROPS} numberOfLines={1} style={styles.summaryLabel}>
              {t('scan.super.summary_label')}
            </Text>
            <Text {...RESULT_TEXT_PROPS} style={styles.summaryText}>
              {viewModel.analysisSummary}
            </Text>
          </View>

          <View style={styles.conditionsWrapper} testID="super-scan-conditions">
            <View style={styles.conditionsHeader}>
              <Text {...RESULT_TEXT_PROPS} numberOfLines={2} style={styles.sectionTitle}>
                {t('scan.super.conditions_label')}
              </Text>
              <View style={styles.countBadge}>
                <Text {...RESULT_TEXT_PROPS} numberOfLines={1} style={styles.countBadgeText}>
                  {viewModel.conditions.length}
                </Text>
              </View>
            </View>

            {viewModel.conditions.length === 0 ? (
              <View style={styles.rasCard} testID="super-scan-ras">
                <View style={styles.rasIconContainer}>
                  <CheckCircle color={colors.success} size={48} strokeWidth={2} />
                </View>
                <Text {...RESULT_TEXT_PROPS} style={styles.rasTitle}>
                  {t('scan.super.ras_title')}
                </Text>
                <Text {...RESULT_TEXT_PROPS} style={styles.rasSubtitle}>
                  {t('scan.super.ras_subtitle')}
                </Text>
                <Text {...RESULT_TEXT_PROPS} style={styles.rasDescription}>
                  {t('scan.super.ras_description')}
                </Text>
              </View>
            ) : (
              viewModel.conditions.map((condition, index) => (
                <ConditionCard
                  key={`${condition.condition_key}-${index}`}
                  condition={condition}
                  premiumRenderState={premiumRenderState}
                />
              ))
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.shareButton,
              {
                borderColor: analysisData.urgency_flag ? colors.warning : colors.primary,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
              },
            ]}
            disabled={isPreparingCommunityShare}
            onPress={handleSharePress}
            testID="super-scan-share-button"
          >
            <Share2 color={analysisData.urgency_flag ? colors.warning : colors.primary} size={18} />
            <Text
              {...RESULT_TEXT_PROPS}
              adjustsFontSizeToFit
              minimumFontScale={0.84}
              numberOfLines={2}
              style={styles.shareButtonText}
            >
              {t('share_story.actions.share_report')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonLarge, { backgroundColor: colors.primary }]}
            onPress={handleClose}
            testID="super-scan-back-button"
          >
            <Text
              {...RESULT_TEXT_PROPS}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
              numberOfLines={2}
              style={styles.primaryButtonText}
            >
              {t('common.home_back')}
            </Text>
          </TouchableOpacity>

          <View style={styles.disclaimerCard}>
            <Text {...RESULT_TEXT_PROPS} style={styles.disclaimer}>
              {viewModel.disclaimerText}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: any,
  isDark: boolean,
  insets: any,
  layout: ReturnType<typeof getResultLayoutState>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.page,
      paddingTop: insets.top + SPACING.sm,
      paddingBottom: SPACING.md,
      minHeight: layout.headerMinHeight,
    },
    headerSidePlaceholder: {
      width: layout.headerSlotSize,
      height: layout.headerSlotSize,
    },
    iconButton: {
      width: layout.headerSlotSize,
      height: layout.headerSlotSize,
      borderRadius: layout.headerSlotSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? withAlpha(colors.white, 0.06)
        : withAlpha(colors.primaryText, 0.04),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? withAlpha(colors.white, 0.08)
        : withAlpha(colors.primaryText, 0.08),
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      paddingHorizontal: SPACING.md,
      fontSize: layout.headerTitleFontSize,
      lineHeight: layout.headerTitleLineHeight,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
      includeFontPadding: false,
    },
    scrollContent: {
      padding: SPACING.page,
      paddingBottom: SPACING.xxxl + insets.bottom,
    },
    content: {
      gap: layout.contentGap,
    },
    errorCard: {
      marginHorizontal: SPACING.page,
      marginTop: SPACING.xxxl,
      borderRadius: layout.heroRadius,
      padding: layout.largeBlockPadding,
      gap: SPACING.sm,
      alignItems: 'center',
      ...getResultSurfaceChrome({
        colors,
        isDark,
        kind: 'hero',
        accentColor: colors.error,
      }),
    },
    errorIconContainer: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: isDark ? 'rgba(255,69,58,0.16)' : '#FEECEC',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xs,
    },
    errorText: {
      fontSize: layout.bodyTextFontSize,
      color: colors.gray,
      textAlign: 'center',
      lineHeight: layout.bodyTextLineHeight,
      includeFontPadding: false,
    },
    scoreCard: {
      borderRadius: layout.heroRadius,
      padding: layout.largeBlockPadding,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3E8C8',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
    heroTopRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.sm,
      marginBottom: layout.blockPadding,
    },
    metricBadge: {
      flex: 1,
      minWidth: 0,
      borderRadius: 9999,
      paddingHorizontal: SPACING.md,
      paddingVertical: layout.isCompact ? SPACING.xs + 1 : SPACING.xs + 2,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F7F9FF',
    },
    metricBadgeText: {
      fontSize: layout.heroBadgeFontSize,
      lineHeight: layout.heroBadgeLineHeight,
      color: colors.gray,
      textTransform: 'uppercase',
      fontWeight: FONT_WEIGHTS.semiBold,
      letterSpacing: layout.isCompact ? 0.45 : 0.6,
      textAlign: 'center',
      includeFontPadding: false,
    },
    urgencyBadge: {
      borderRadius: 9999,
      borderWidth: 1,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: layout.isCompact ? SPACING.xs : SPACING.xs + 1,
      backgroundColor: isDark ? 'rgba(255,69,58,0.2)' : '#FEECEC',
      alignSelf: 'flex-start',
    },
    urgencyBadgeText: {
      fontSize: layout.heroBadgeFontSize,
      lineHeight: layout.isCompact ? 13 : 14,
      fontWeight: FONT_WEIGHTS.semiBold,
      textTransform: 'uppercase',
      letterSpacing: layout.isCompact ? 0.35 : 0.5,
      includeFontPadding: false,
    },
    scoreMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scoreIconContainer: {
      width: layout.isCompact ? 58 : 64,
      height: layout.isCompact ? 58 : 64,
      borderRadius: layout.isCompact ? 29 : 32,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5ECD5',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.15 : 0.07,
      shadowRadius: 12,
      elevation: 4,
    },
    scoreTextContainer: {
      marginLeft: layout.sectionGap,
      flex: 1,
      minWidth: 0,
    },
    scoreValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      minWidth: 0,
    },
    scoreValue: {
      fontSize: layout.heroScoreValueFontSize,
      lineHeight: layout.heroScoreValueLineHeight,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: -1.2,
      includeFontPadding: false,
    },
    scoreSuffix: {
      fontSize: layout.heroScoreSuffixFontSize,
      lineHeight: layout.heroScoreSuffixLineHeight,
      color: colors.gray,
      fontWeight: FONT_WEIGHTS.medium,
      marginLeft: 4,
      includeFontPadding: false,
    },
    scoreMeta: {
      marginTop: SPACING.xs,
      fontSize: SIZES.sm,
      lineHeight: layout.bodyTextLineHeight,
      color: colors.gray,
      includeFontPadding: false,
    },
    summaryCard: {
      minHeight: layout.summaryMinHeight,
      borderRadius: layout.featureRadius,
      padding: layout.largeBlockPadding,
      ...getResultSurfaceChrome({
        colors,
        isDark,
        kind: 'feature',
        accentColor: colors.primary,
      }),
    },
    summaryLabel: {
      fontSize: SIZES.sm,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.gray,
      marginBottom: SPACING.sm,
      textTransform: 'uppercase',
      letterSpacing: layout.isCompact ? 0.55 : 0.8,
      includeFontPadding: false,
    },
    summaryText: {
      fontSize: layout.bodyTextFontSize,
      color: colors.primaryText,
      lineHeight: layout.emphasizedBodyLineHeight,
      includeFontPadding: false,
    },
    conditionsWrapper: {
      gap: layout.sectionGap,
      borderRadius: layout.featureRadius,
      padding: layout.blockPadding,
      ...getResultSurfaceChrome({
        colors,
        isDark,
        kind: 'feature',
        accentColor: colors.primary,
      }),
    },
    conditionsHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    sectionTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: layout.sectionTitleFontSize,
      lineHeight: layout.sectionTitleLineHeight,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
      includeFontPadding: false,
    },
    countBadge: {
      borderRadius: 9999,
      minWidth: 34,
      height: 28,
      paddingHorizontal: SPACING.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#F4F6FA',
    },
    countBadgeText: {
      fontSize: SIZES.sm,
      color: colors.gray,
      fontWeight: FONT_WEIGHTS.semiBold,
      includeFontPadding: false,
    },
    rasCard: {
      backgroundColor: isDark ? 'rgba(48,209,88,0.1)' : '#ECFBF0',
      borderRadius: layout.featureRadius,
      padding: layout.largeBlockPadding,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(48,209,88,0.32)' : '#CDEFD8',
    },
    rasIconContainer: {
      marginBottom: SPACING.sm,
    },
    rasTitle: {
      fontSize: layout.heroTitleFontSize,
      lineHeight: layout.heroTitleLineHeight,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.success,
      marginBottom: SPACING.xs,
      textAlign: 'center',
      includeFontPadding: false,
    },
    rasSubtitle: {
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.success,
      marginBottom: SPACING.sm,
      textAlign: 'center',
      includeFontPadding: false,
    },
    rasDescription: {
      fontSize: layout.bodyTextFontSize,
      color: colors.primaryText,
      textAlign: 'center',
      lineHeight: layout.bodyTextLineHeight,
      includeFontPadding: false,
    },
    primaryButton: {
      paddingHorizontal: SPACING.xxl,
      paddingVertical: SPACING.md + 1,
      borderRadius: layout.ctaRadius,
      minHeight: layout.ctaMinHeight,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.28 : 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
    shareButton: {
      minHeight: layout.ctaMinHeight,
      borderRadius: layout.ctaRadius,
      borderWidth: 1,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    shareButtonText: {
      flexShrink: 1,
      minWidth: 0,
      color: colors.primaryText,
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      fontWeight: FONT_WEIGHTS.semiBold,
      textAlign: 'center',
      includeFontPadding: false,
    },
    primaryButtonLarge: {
      marginTop: SPACING.md,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      fontWeight: FONT_WEIGHTS.semiBold,
      letterSpacing: 0.1,
      includeFontPadding: false,
    },
    disclaimerCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F7F8FC',
      borderRadius: layout.standardRadius,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#ECEEF6',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
    },
    disclaimer: {
      fontSize: SIZES.xs,
      color: colors.gray,
      textAlign: 'center',
      lineHeight: layout.isCompact ? 17 : 18,
      includeFontPadding: false,
    },
  });
