import { Platform, ViewStyle } from 'react-native';
import {
  SHADOWS,
  SIZES,
  SPACING,
  ThemeColors,
  getAndroidLightSurface,
  mixColors,
  withAlpha,
} from '@/constants/theme';

export const RESULT_COMPACT_BREAKPOINT = 360;
export const RESULT_NARROW_BREAKPOINT = 336;
export const RESULT_TEXT_PROPS = {
  android_hyphenationFrequency: 'none' as const,
  lineBreakStrategyIOS: 'standard' as const,
  textBreakStrategy: 'simple' as const,
};

export const RESULT_SURFACE_RADII = {
  standard: 16,
  feature: 22,
  hero: 28,
} as const;

export type ResultSurfaceKind = keyof typeof RESULT_SURFACE_RADII;

export type ResultSurfaceChrome = ViewStyle;

export interface ResultLayoutState {
  isCompact: boolean;
  isNarrow: boolean;
  standardRadius: number;
  featureRadius: number;
  heroRadius: number;
  cardPadding: number;
  blockPadding: number;
  largeBlockPadding: number;
  contentGap: number;
  sectionGap: number;
  headerMinHeight: number;
  headerSlotSize: number;
  ctaMinHeight: number;
  ctaRadius: number;
  quickStatMinHeight: number;
  metricMinHeight: number;
  metricCardPaddingHorizontal: number;
  metricCardPaddingVertical: number;
  metricCardGap: number;
  metricCardTextGap: number;
  metricCardIconSize: number;
  metricCardIconGlyphSize: number;
  metricCardLabelFontSize: number;
  metricCardLabelLineHeight: number;
  metricCardValueFontSize: number;
  metricCardValueLineHeight: number;
  summaryMinHeight: number;
  headerTitleFontSize: number;
  headerTitleLineHeight: number;
  sectionTitleFontSize: number;
  sectionTitleLineHeight: number;
  heroTitleFontSize: number;
  heroTitleLineHeight: number;
  bodyTextFontSize: number;
  bodyTextLineHeight: number;
  emphasizedBodyLineHeight: number;
  quickStatIconSize: number;
  typeIconSize: number;
  scoreGaugeSize: number;
  gaugeValueFontSize: number;
  gaugeValueLineHeight: number;
  gaugeMaxFontSize: number;
  gaugeMaxLineHeight: number;
  heroScoreValueFontSize: number;
  heroScoreValueLineHeight: number;
  heroScoreSuffixFontSize: number;
  heroScoreSuffixLineHeight: number;
  heroBadgeFontSize: number;
  heroBadgeLineHeight: number;
  chartHeight: number;
  chartLockSize: number;
}

export function getResultScaledRadius(
  kind: ResultSurfaceKind,
  scale = 1,
) {
  return Math.round(RESULT_SURFACE_RADII[kind] * scale);
}

export function getResultSurfaceChrome(options: {
  colors: ThemeColors;
  isDark: boolean;
  kind: ResultSurfaceKind;
  accentColor?: string;
}): ResultSurfaceChrome {
  const { colors, isDark, kind, accentColor = colors.primary } = options;
  const isAndroidLight = Platform.OS === 'android' && !isDark && kind !== 'standard';

  if (isAndroidLight) {
    const androidSurface = getAndroidLightSurface(colors, {
      accentColor,
      shadowColor: accentColor,
      backgroundAlpha: kind === 'hero' ? 0.1 : 0.06,
      borderAlpha: kind === 'hero' ? 0.18 : 0.14,
      overlayAlpha: kind === 'hero' ? 0.14 : 0.1,
      shadowOpacity: kind === 'hero' ? 0.14 : 0.1,
      shadowRadius: kind === 'hero' ? 20 : 18,
      shadowOffsetY: kind === 'hero' ? 10 : 8,
      elevation: kind === 'hero' ? 6 : 4,
    });

    return {
      backgroundColor: androidSurface.backgroundColor,
      borderColor: androidSurface.borderColor,
      ...androidSurface.shadowStyle,
    };
  }

  if (kind === 'standard') {
    return {
      backgroundColor: colors.cardBackground,
      borderColor: isDark
        ? withAlpha(colors.white, 0.08)
        : withAlpha(colors.primaryText, 0.06),
      ...SHADOWS.card,
    };
  }

  const tintOpacity = kind === 'hero' ? (isDark ? 0.15 : 0.08) : isDark ? 0.1 : 0.05;
  const borderOpacity = kind === 'hero' ? (isDark ? 0.28 : 0.18) : isDark ? 0.18 : 0.12;

  return {
    backgroundColor: isDark
      ? mixColors(colors.cardBackground, accentColor, tintOpacity)
      : mixColors(colors.cardBackground, accentColor, tintOpacity),
    borderColor: withAlpha(accentColor, borderOpacity),
    ...(kind === 'hero' ? SHADOWS.cardHover : SHADOWS.card),
  };
}

export function getResultLayoutState(width: number): ResultLayoutState {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : RESULT_COMPACT_BREAKPOINT + 1;
  const isCompact = safeWidth <= RESULT_COMPACT_BREAKPOINT;
  const isNarrow = safeWidth <= RESULT_NARROW_BREAKPOINT;

  return {
    isCompact,
    isNarrow,
    standardRadius: RESULT_SURFACE_RADII.standard,
    featureRadius: RESULT_SURFACE_RADII.feature,
    heroRadius: RESULT_SURFACE_RADII.hero,
    cardPadding: isCompact ? SPACING.sm + 2 : SPACING.md,
    blockPadding: isCompact ? SPACING.md : SPACING.lg,
    largeBlockPadding: isNarrow ? SPACING.md : isCompact ? SPACING.lg : SPACING.xl,
    contentGap: isCompact ? SPACING.md : SPACING.lg,
    sectionGap: isCompact ? SPACING.sm + 2 : SPACING.md,
    headerMinHeight: 56,
    headerSlotSize: 44,
    ctaMinHeight: 54,
    ctaRadius: 18,
    quickStatMinHeight: isCompact ? 108 : 120,
    metricMinHeight: isCompact ? 82 : 88,
    metricCardPaddingHorizontal: isCompact ? 10 : 12,
    metricCardPaddingVertical: isCompact ? 8 : 10,
    metricCardGap: isCompact ? 8 : 10,
    metricCardTextGap: isCompact ? 2 : 3,
    metricCardIconSize: isCompact ? 42 : 44,
    metricCardIconGlyphSize: isCompact ? 20 : 21,
    metricCardLabelFontSize: 13,
    metricCardLabelLineHeight: 16,
    metricCardValueFontSize: isCompact ? 15 : SIZES.md,
    metricCardValueLineHeight: isCompact ? 19 : 20,
    summaryMinHeight: isCompact ? 120 : 132,
    headerTitleFontSize: isCompact ? SIZES.md : SIZES.lg,
    headerTitleLineHeight: isCompact ? 22 : 24,
    sectionTitleFontSize: isCompact ? SIZES.md : SIZES.lg,
    sectionTitleLineHeight: isCompact ? 22 : 24,
    heroTitleFontSize: isNarrow ? SIZES.md : isCompact ? SIZES.lg : SIZES.xl,
    heroTitleLineHeight: isNarrow ? 22 : isCompact ? 24 : 28,
    bodyTextFontSize: isCompact ? SIZES.sm : SIZES.md,
    bodyTextLineHeight: isCompact ? 20 : 22,
    emphasizedBodyLineHeight: isCompact ? 22 : 24,
    quickStatIconSize: isNarrow ? 38 : isCompact ? 40 : 42,
    typeIconSize: isCompact ? 52 : 56,
    scoreGaugeSize: isNarrow ? 146 : isCompact ? 152 : 160,
    gaugeValueFontSize: isNarrow ? 40 : isCompact ? 43 : 46,
    gaugeValueLineHeight: isNarrow ? 44 : isCompact ? 47 : 50,
    gaugeMaxFontSize: isCompact ? SIZES.md : SIZES.lg,
    gaugeMaxLineHeight: isCompact ? 22 : 24,
    heroScoreValueFontSize: isNarrow ? 44 : isCompact ? 47 : 50,
    heroScoreValueLineHeight: isNarrow ? 48 : isCompact ? 51 : 54,
    heroScoreSuffixFontSize: isCompact ? SIZES.md : SIZES.lg,
    heroScoreSuffixLineHeight: isCompact ? 22 : 24,
    heroBadgeFontSize: SIZES.xs,
    heroBadgeLineHeight: isCompact ? 15 : 16,
    chartHeight: isCompact ? 156 : 170,
    chartLockSize: isCompact ? 64 : 72,
  };
}
