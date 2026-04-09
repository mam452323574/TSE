import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getGamificationAssetSource } from '@/constants/gamificationAssets';
import { type GamificationStageProgress } from '@/constants/gamification';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SHADOWS,
  SIZES,
  SPACING,
  mixColors,
  withAlpha,
} from '@/constants/theme';
import type { GamificationData } from '@/types';

interface FoxEvolutionHeroProps {
  gamification: GamificationData;
  progress: GamificationStageProgress;
}

export function FoxEvolutionHero({
  gamification,
  progress,
}: FoxEvolutionHeroProps) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();

  const styles = useMemo(
    () => createStyles(colors, isDark, windowWidth),
    [colors, isDark, windowWidth]
  );
  const backgroundGradientColors = useMemo(
    () =>
      [
        withAlpha(colors.primary, isDark ? 0.2 : 0.08),
        withAlpha(colors.gold, isDark ? 0.12 : 0.1),
        withAlpha(colors.cardBackground, 0),
      ] as const,
    [colors.cardBackground, colors.gold, colors.primary, isDark]
  );
  const mascotAssetSource = useMemo(
    () => getGamificationAssetSource(gamification.mascotFilename),
    [gamification.mascotFilename]
  );
  const progressWidth: `${number}%` = progress.isFinalStage
    ? '100%'
    : `${Number(progress.progressPercent.toFixed(2))}%`;
  const stageSpan = progress.isFinalStage
    ? 0
    : Math.max(
        (progress.nextStageMinScans ?? progress.currentStageMinScans) -
          progress.currentStageMinScans,
        0
      );

  return (
    <View style={styles.shell} testID="fox-evolution-hero">
      <LinearGradient
        colors={backgroundGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      <View style={[styles.glow, styles.glowPrimary]} />
      <View style={[styles.glow, styles.glowSecondary]} />

      <View style={styles.topRow}>
        <View style={styles.eyebrowBadge} testID="fox-evolution-eyebrow">
          <Text style={styles.eyebrowText}>
            {t('home.fox_evolution.eyebrow')}
          </Text>
        </View>
        <View style={styles.totalBadge} testID="fox-evolution-total-badge">
          <Text
            style={styles.totalBadgeText}
            testID="fox-evolution-total-badge-text"
          >
            {t('home.fox_evolution.scan_total', {
              count: gamification.scanCount,
            })}
          </Text>
        </View>
      </View>

      <View style={styles.mascotShell} testID="fox-evolution-mascot-shell">
        <View style={styles.mascotHalo} />
        <ExpoImage
          source={mascotAssetSource}
          style={styles.mascotImage}
          contentFit="contain"
          testID="fox-evolution-mascot-image"
          accessibilityLabel={`Mascot stage ${progress.currentStage}`}
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.stageLabel} testID="fox-evolution-stage-label">
          {t('home.fox_evolution.stage_label', {
            stage: progress.currentStage,
          })}
        </Text>
        <Text
          style={styles.supportingText}
          testID="fox-evolution-supporting-text"
        >
          {progress.isFinalStage
            ? t('home.fox_evolution.max_stage')
            : t('home.fox_evolution.scans_remaining', {
                count: progress.scansRemaining,
              })}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[colors.primary, mixColors(colors.primary, colors.gold, 0.45)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressFill, { width: progressWidth }]}
            testID="fox-evolution-progress-fill"
          />
        </View>

        <View style={styles.progressMeta}>
          <Text
            style={styles.progressRangeText}
            testID="fox-evolution-progress-range"
          >
            {progress.isFinalStage
              ? t('home.fox_evolution.stage_range_max', {
                  start: progress.currentStageMinScans,
                })
              : t('home.fox_evolution.stage_range', {
                  start: progress.currentStageMinScans,
                  end: progress.nextStageMinScans,
                })}
          </Text>
          {!progress.isFinalStage ? (
            <Text
              style={styles.progressValueText}
              testID="fox-evolution-stage-progress"
            >
              {t('home.fox_evolution.stage_progress', {
                current: progress.scansIntoStage,
                total: stageSpan,
              })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean, windowWidth: number) => {
  const isCompact = windowWidth < 390;
  const isTablet = windowWidth >= 768;
  const mascotShellSize = isTablet ? 320 : isCompact ? 248 : 280;
  const mascotImageSize = isTablet ? 296 : isCompact ? 224 : 256;
  const shellPaddingHorizontal = isTablet ? SPACING.xl : SPACING.lg;
  const shellPaddingVertical = isTablet ? SPACING.xl : SPACING.lg;
  const surfaceBackground = isDark
    ? withAlpha(colors.cardBackground, 0.92)
    : colors.cardBackground;
  const borderColor = withAlpha(colors.primary, isDark ? 0.28 : 0.08);
  const eyebrowBackground = isDark
    ? withAlpha(colors.background, 0.32)
    : withAlpha(colors.primary, 0.08);
  const badgeBackground = isDark
    ? withAlpha(colors.background, 0.28)
    : withAlpha(colors.gold, 0.16);

  return StyleSheet.create({
    shell: {
      width: '100%',
      borderRadius: 28,
      paddingHorizontal: shellPaddingHorizontal,
      paddingVertical: shellPaddingVertical,
      backgroundColor: surfaceBackground,
      borderWidth: 1,
      borderColor,
      overflow: 'hidden',
      alignItems: 'center',
      position: 'relative',
      ...(Platform.OS === 'android'
        ? {
            elevation: 4,
          }
        : {
            ...SHADOWS.card,
            shadowColor: colors.primary,
            shadowOpacity: 0.1,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }),
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    glow: {
      position: 'absolute',
      borderRadius: BORDER_RADIUS.full,
      opacity: isDark ? 0.22 : 0.3,
    },
    glowPrimary: {
      width: 180,
      height: 180,
      top: -56,
      left: -28,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.3 : 0.12),
    },
    glowSecondary: {
      width: 156,
      height: 156,
      right: -36,
      bottom: 54,
      backgroundColor: withAlpha(colors.gold, isDark ? 0.18 : 0.12),
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isCompact ? SPACING.md : SPACING.lg,
      gap: SPACING.sm,
    },
    eyebrowBadge: {
      borderRadius: BORDER_RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: eyebrowBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1),
    },
    eyebrowText: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
      letterSpacing: 0.2,
    },
    totalBadge: {
      borderRadius: BORDER_RADIUS.full,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: badgeBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.gold, isDark ? 0.32 : 0.16),
    },
    totalBadgeText: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    mascotShell: {
      width: mascotShellSize,
      height: mascotShellSize,
      borderRadius: BORDER_RADIUS.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      position: 'relative',
    },
    mascotHalo: {
      position: 'absolute',
      width: mascotShellSize,
      height: mascotShellSize,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.08),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.24 : 0.1),
      transform: [{ scale: 1.02 }],
    },
    mascotImage: {
      width: mascotImageSize,
      height: mascotImageSize,
    },
    textBlock: {
      alignItems: 'center',
      gap: SPACING.xs,
      marginBottom: SPACING.lg,
    },
    stageLabel: {
      fontSize: isTablet ? SIZES.xxl : 28,
      lineHeight: isTablet ? SIZES.xxl + 6 : 34,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textAlign: 'center',
    },
    supportingText: {
      fontSize: SIZES.text14,
      lineHeight: SIZES.text14 + 6,
      fontWeight: FONT_WEIGHTS.medium,
      color: colors.gray,
      textAlign: 'center',
    },
    progressSection: {
      width: '100%',
      gap: SPACING.sm,
    },
    progressTrack: {
      width: '100%',
      height: 10,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.08),
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: BORDER_RADIUS.full,
    },
    progressMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    progressRangeText: {
      flex: 1,
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.medium,
      color: colors.gray,
    },
    progressValueText: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textAlign: 'right',
    },
  });
};

export default FoxEvolutionHero;
