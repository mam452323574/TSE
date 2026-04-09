import { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Circle } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';

import { useTheme } from '@/contexts/ThemeContext';
import {
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  mixColors,
  withAlpha,
} from '@/constants/theme';
import {
  RESULT_TEXT_PROPS,
  getResultLayoutState,
  getResultSurfaceChrome,
} from '@/utils/resultLayout';
import {
  TRAJECTORY_PREVIEW_LINE_CHART_PROPS,
  createTrajectoryPreviewLineChartConfig,
} from '@/utils/chartStyles';
import type { ResultTrajectoryViewModel } from '@/utils/resultViewModels';

export interface TrajectoryPreviewCardProps {
  model: ResultTrajectoryViewModel;
  onPress?: () => void;
}

export function TrajectoryPreviewCard({
  model,
  onPress,
}: TrajectoryPreviewCardProps) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const layout = useMemo(
    () => getResultLayoutState(windowWidth),
    [windowWidth],
  );
  const styles = useMemo(
    () => createStyles(colors, isDark, layout),
    [colors, isDark, layout],
  );
  const isLocked = model.premiumRenderState === 'locked';
  const isLoading = model.premiumRenderState === 'loading';
  const surfaceAccent = isLoading ? colors.primaryText : colors.gold;
  const chartStrokeWidth = isLoading ? 2 : 2.25;
  const chartLineOpacity = isLoading ? 0.68 : isLocked ? 0.82 : 0.86;
  const chartLineColor = isLoading
    ? mixColors(colors.gray, colors.white, isDark ? 0.08 : 0.02)
    : mixColors(colors.gold, colors.white, isDark ? 0.18 : 0.08);
  const chartFillStart = isLoading
    ? withAlpha(chartLineColor, isDark ? 0.1 : 0.08)
    : withAlpha(
        mixColors(colors.gold, colors.white, isDark ? 0.12 : 0.06),
        isLocked ? (isDark ? 0.18 : 0.14) : isDark ? 0.16 : 0.12,
      );
  const chartFillEnd = isLoading
    ? withAlpha(colors.gray, 0.015)
    : withAlpha(mixColors(colors.warning, colors.gold, 0.35), isDark ? 0.02 : 0.03);
  const chartGridColor = isLoading
    ? withAlpha(colors.gray, isDark ? 0.16 : 0.12)
    : withAlpha(chartLineColor, isDark ? 0.18 : 0.14);

  const chartWidth = Math.max(
    windowWidth - SPACING.page * 2 - layout.blockPadding * 2,
    220,
  );
  const hiddenDotIndexes = useMemo(
    () =>
      model.points.reduce<number[]>((indexes, point, index) => {
        if (point.day !== 0 && point.day !== 15 && point.day !== 30) {
          indexes.push(index);
        }

        return indexes;
      }, []),
    [model.points],
  );
  const projectedDotIndex = model.points.length - 1;
  const chartData = useMemo(
    () => ({
      labels: model.series.map(() => ''),
      datasets: [
        {
          data: model.series,
          color: (opacity = 1) =>
            withAlpha(chartLineColor, Math.max(opacity, chartLineOpacity)),
          strokeWidth: chartStrokeWidth,
        },
      ],
    }),
    [chartLineColor, chartLineOpacity, chartStrokeWidth, model.series],
  );
  const chartConfig = useMemo(
    () =>
      createTrajectoryPreviewLineChartConfig({
        isDark,
        lineColor: chartLineColor,
        fillShadowGradientFrom: chartFillStart,
        fillShadowGradientTo: chartFillEnd,
        backgroundLineColor: chartGridColor,
        dotStrokeColor: colors.cardBackground,
        borderRadius: layout.featureRadius,
        strokeWidth: chartStrokeWidth,
      }),
    [
      chartFillEnd,
      chartFillStart,
      chartGridColor,
      chartLineColor,
      chartStrokeWidth,
      colors.cardBackground,
      isDark,
      layout.featureRadius,
    ],
  );
  const getDotProps = useMemo(
    () => (_dataPoint: number, index: number) => ({
      r: index === projectedDotIndex && !isLoading ? '4.2' : '3.2',
      strokeWidth: index === projectedDotIndex && !isLoading ? '2' : '1.5',
      stroke: colors.cardBackground,
      fill: withAlpha(
        chartLineColor,
        index === projectedDotIndex && !isLoading ? 0.96 : isLoading ? 0.56 : 0.74,
      ),
    }),
    [chartLineColor, colors.cardBackground, isLoading, projectedDotIndex],
  );
  const renderDotContent = useMemo(
    () => {
      const RenderDotContent = ({
        x,
        y,
        index,
      }: {
        x: number;
        y: number;
        index: number;
        indexData: number;
      }) => {
        if (index !== projectedDotIndex || isLoading) {
          return null;
        }

        return (
          <Circle
            cx={x}
            cy={y}
            fill="none"
            r={layout.isCompact ? 7 : 7.75}
            stroke={withAlpha(chartLineColor, isLocked ? 0.34 : 0.42)}
            strokeWidth={layout.isCompact ? 1.1 : 1.2}
          />
        );
      };

      RenderDotContent.displayName = 'TrajectoryPreviewDotContent';

      return RenderDotContent;
    },
    [chartLineColor, isLoading, isLocked, layout.isCompact, projectedDotIndex],
  );
  const ctaColors = isDark
    ? ([
        mixColors(colors.gold, colors.white, 0.18),
        mixColors(colors.warning, colors.gold, 0.72),
      ] as const)
    : ([
        mixColors(colors.gold, colors.white, 0.24),
        mixColors(colors.warning, colors.gold, 0.58),
      ] as const);

  return (
    <View style={styles.shell} testID="trajectory-preview-card">
      <View
        style={[
          styles.surface,
          getResultSurfaceChrome({
            colors,
            isDark,
            kind: 'feature',
            accentColor: surfaceAccent,
          }),
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text
              {...RESULT_TEXT_PROPS}
              testID="trajectory-preview-hook"
              numberOfLines={1}
              style={[
                styles.hookLabel,
                { color: isLoading ? colors.gray : colors.gold },
              ]}
            >
              {model.hookLabel}
            </Text>
            <Text
              {...RESULT_TEXT_PROPS}
              testID="trajectory-preview-title"
              numberOfLines={2}
              style={styles.cardTitle}
            >
              {model.title}
            </Text>
          </View>
          <View
            style={[
              styles.premiumTag,
              isLoading ? styles.loadingTag : null,
              {
                backgroundColor: isLoading
                  ? withAlpha(colors.primaryText, isDark ? 0.08 : 0.06)
                  : withAlpha(colors.gold, isDark ? 0.24 : 0.16),
                borderColor: isLoading
                  ? withAlpha(colors.primaryText, isDark ? 0.12 : 0.1)
                  : withAlpha(colors.gold, isDark ? 0.26 : 0.22),
              },
            ]}
          >
            <Text
              {...RESULT_TEXT_PROPS}
              testID="trajectory-preview-badge"
              numberOfLines={1}
              style={[
                styles.premiumTagText,
                { color: isLoading ? colors.gray : colors.gold },
              ]}
            >
              {model.badgeLabel}
            </Text>
          </View>
        </View>

        <View
          accessibilityElementsHidden={isLocked}
          importantForAccessibility={isLocked ? 'no-hide-descendants' : 'auto'}
          style={styles.chartFrame}
        >
          <LineChart
            data={chartData}
            width={chartWidth}
            height={layout.chartHeight}
            chartConfig={chartConfig}
            {...TRAJECTORY_PREVIEW_LINE_CHART_PROPS}
            withDots
            hidePointsAtIndex={hiddenDotIndexes}
            getDotProps={getDotProps}
            renderDotContent={renderDotContent}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            transparent
            style={styles.chart}
          />

          {isLocked ? (
            <View style={styles.chartOverlay} pointerEvents="none">
              <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={100}
                blurReductionFactor={1}
                experimentalBlurMethod={
                  Platform.OS === 'android' ? 'dimezisBlurView' : undefined
                }
                style={styles.blurLayer}
                testID="trajectory-preview-blur"
              />
              <View style={styles.chartScrim} />
              <View style={styles.lockBadge} testID="trajectory-preview-lock">
                <Lock color={colors.gold} size={28} strokeWidth={2.4} />
              </View>
            </View>
          ) : isLoading ? (
            <View
              pointerEvents="none"
              style={styles.loadingScrim}
              testID="trajectory-preview-loading-state"
            />
          ) : null}
        </View>

        <View style={styles.copyBlock}>
          <Text
            {...RESULT_TEXT_PROPS}
            testID="trajectory-preview-headline"
            style={[styles.headline, isLoading ? styles.loadingHeadline : null]}
          >
            {model.headline}
          </Text>
          <Text
            {...RESULT_TEXT_PROPS}
            testID="trajectory-preview-subtitle"
            style={[styles.subtitle, isLoading ? styles.loadingSubtitle : null]}
          >
            {model.subtitle}
          </Text>
        </View>

        {model.premiumRenderState === 'unlocked' ? (
          <>
            <View
              style={styles.checkpointsRow}
              testID="trajectory-preview-checkpoints"
            >
              {model.checkpoints.map((item) => (
                <View
                  key={item.id}
                  testID={`trajectory-preview-checkpoint-${item.id}`}
                  style={[
                    styles.checkpointCard,
                    item.isHighlighted ? styles.checkpointCardHighlighted : null,
                  ]}
                >
                  <Text
                    {...RESULT_TEXT_PROPS}
                    numberOfLines={1}
                    style={[
                      styles.checkpointLabel,
                      item.isHighlighted ? styles.checkpointLabelHighlighted : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    {...RESULT_TEXT_PROPS}
                    numberOfLines={1}
                    style={[
                      styles.checkpointValue,
                      item.isHighlighted ? styles.checkpointValueHighlighted : null,
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {model.footnote ? (
              <Text
                {...RESULT_TEXT_PROPS}
                testID="trajectory-preview-note"
                style={styles.note}
              >
                {model.footnote}
              </Text>
            ) : null}
          </>
        ) : null}

        {isLocked && model.ctaLabel && onPress ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onPress}
            style={styles.ctaShell}
            testID="trajectory-preview-cta"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={ctaColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text
                {...RESULT_TEXT_PROPS}
                testID="trajectory-preview-cta-text"
                numberOfLines={2}
                style={styles.ctaText}
              >
                {model.ctaLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (
  colors: any,
  isDark: boolean,
  layout: ReturnType<typeof getResultLayoutState>,
) =>
  StyleSheet.create({
    shell: {
      borderRadius: layout.featureRadius,
    },
    surface: {
      borderRadius: layout.featureRadius,
      padding: layout.blockPadding,
      borderWidth: 1,
      overflow: 'hidden',
      gap: layout.contentGap,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: layout.isCompact ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    hookLabel: {
      fontSize: SIZES.xs,
      lineHeight: layout.isCompact ? 16 : 17,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: 0.35,
      textTransform: 'uppercase',
      includeFontPadding: false,
    },
    cardTitle: {
      fontSize: SIZES.md,
      lineHeight: 22,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      letterSpacing: -0.2,
      includeFontPadding: false,
    },
    premiumTag: {
      borderRadius: 9999,
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: layout.isCompact ? 3 : SPACING.xs,
      borderWidth: 1,
      flexShrink: 0,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingTag: {
      minWidth: 74,
    },
    premiumTagText: {
      fontSize: SIZES.xs,
      lineHeight: layout.heroBadgeLineHeight,
      fontWeight: FONT_WEIGHTS.bold,
      letterSpacing: layout.isCompact ? 0.45 : 0.6,
      textAlign: 'center',
      includeFontPadding: false,
    },
    chartFrame: {
      borderRadius: layout.featureRadius,
      overflow: 'hidden',
      backgroundColor: isDark
        ? withAlpha(colors.white, 0.022)
        : withAlpha(colors.white, 0.72),
      borderWidth: 1,
      borderColor: isDark
        ? withAlpha(colors.gold, 0.1)
        : withAlpha(colors.gold, 0.08),
      minHeight: layout.chartHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chart: {
      marginLeft: layout.isCompact ? -SPACING.sm : -(SPACING.sm + 2),
      paddingRight: layout.isCompact ? SPACING.md + 2 : SPACING.lg,
      paddingTop: layout.isCompact ? SPACING.sm + 2 : SPACING.md,
      paddingBottom: layout.isCompact ? SPACING.sm : SPACING.sm + 2,
    },
    chartOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blurLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    chartScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? 'rgba(7, 10, 18, 0.34)'
        : 'rgba(255, 248, 235, 0.36)',
    },
    loadingScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? withAlpha(colors.white, 0.03)
        : withAlpha(colors.primaryText, 0.02),
    },
    lockBadge: {
      width: layout.chartLockSize,
      height: layout.chartLockSize,
      borderRadius: layout.chartLockSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? withAlpha(colors.cardBackground, 0.92)
        : withAlpha(colors.white, 0.9),
      borderWidth: 1,
      borderColor: withAlpha(colors.gold, isDark ? 0.34 : 0.28),
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.24 : 0.12,
      shadowRadius: 16,
      elevation: 4,
    },
    copyBlock: {
      gap: SPACING.xs,
    },
    headline: {
      fontSize: layout.heroTitleFontSize,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      lineHeight: layout.heroTitleLineHeight,
      letterSpacing: -0.25,
      includeFontPadding: false,
    },
    loadingHeadline: {
      color: colors.gray,
    },
    subtitle: {
      fontSize: SIZES.sm,
      color: colors.gray,
      lineHeight: layout.bodyTextLineHeight,
      includeFontPadding: false,
    },
    loadingSubtitle: {
      color: withAlpha(colors.gray, 0.92),
    },
    checkpointsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    checkpointCard: {
      flexGrow: 1,
      flexBasis: layout.isCompact ? '30%' : '31%',
      minWidth: layout.isCompact ? 82 : 90,
      borderRadius: layout.standardRadius,
      paddingHorizontal: SPACING.sm,
      paddingVertical: layout.isCompact ? SPACING.sm : SPACING.sm + 2,
      backgroundColor: isDark
        ? withAlpha(colors.white, 0.05)
        : withAlpha(colors.white, 0.74),
      borderWidth: 1,
      borderColor: isDark
        ? withAlpha(colors.gold, 0.12)
        : withAlpha(colors.gold, 0.1),
      gap: 2,
    },
    checkpointCardHighlighted: {
      backgroundColor: isDark
        ? withAlpha(colors.gold, 0.18)
        : withAlpha(colors.gold, 0.14),
      borderColor: withAlpha(colors.gold, isDark ? 0.3 : 0.24),
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 14,
      elevation: 3,
    },
    checkpointLabel: {
      fontSize: SIZES.xs,
      lineHeight: layout.isCompact ? 14 : 15,
      color: colors.gray,
      fontWeight: FONT_WEIGHTS.medium,
      includeFontPadding: false,
    },
    checkpointLabelHighlighted: {
      color: isDark
        ? withAlpha(colors.white, 0.82)
        : withAlpha(colors.primaryText, 0.78),
    },
    checkpointValue: {
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      color: colors.primaryText,
      fontWeight: FONT_WEIGHTS.bold,
      includeFontPadding: false,
    },
    checkpointValueHighlighted: {
      color: colors.primaryText,
    },
    note: {
      fontSize: SIZES.xs,
      lineHeight: layout.isCompact ? 17 : 18,
      color: colors.gray,
      includeFontPadding: false,
    },
    ctaShell: {
      borderRadius: layout.ctaRadius,
      overflow: 'hidden',
    },
    ctaGradient: {
      minHeight: layout.ctaMinHeight,
      paddingHorizontal: layout.blockPadding,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.ctaRadius,
    },
    ctaText: {
      color: '#3B2A00',
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      fontWeight: FONT_WEIGHTS.bold,
      textAlign: 'center',
      letterSpacing: -0.1,
      includeFontPadding: false,
    },
  });

export default TrajectoryPreviewCard;
