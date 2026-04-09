import React, { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_WEIGHTS, SIZES, SPACING, withAlpha } from '@/constants/theme';
import {
  RESULT_TEXT_PROPS,
  getResultLayoutState,
  getResultSurfaceChrome,
} from '@/utils/resultLayout';

interface ResultQuickStatCardProps {
  icon?: React.ReactNode | string;
  label: string;
  value: string;
  valueVariant?: 'numeric' | 'fraction' | 'text';
  labelMaxLines?: number;
  valueMaxLines?: number;
  fullWidth?: boolean;
}

export function ResultQuickStatCard({
  icon,
  label,
  value,
  valueVariant = 'text',
  labelMaxLines = 2,
  valueMaxLines = valueVariant === 'text' ? 3 : 1,
  fullWidth = false,
}: ResultQuickStatCardProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getResultLayoutState(width), [width]);
  const styles = useMemo(() => createStyles(layout), [layout]);

  const valueTextProps =
    valueVariant === 'text'
      ? {
          numberOfLines: valueMaxLines,
        }
      : {
          adjustsFontSizeToFit: true,
          minimumFontScale: valueVariant === 'fraction' ? 0.82 : 0.84,
          numberOfLines: 1 as const,
        };

  return (
    <View
      testID="result-quick-stat-card"
      style={[
        styles.card,
        fullWidth ? styles.fullWidthCard : styles.halfWidthCard,
        getResultSurfaceChrome({
          colors,
          isDark,
          kind: 'standard',
        }),
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? withAlpha(colors.white, 0.06) : withAlpha(colors.primary, 0.08) }]}>
        {typeof icon === 'string' ? <Text style={styles.iconText}>{icon}</Text> : icon}
      </View>

      <View style={styles.content}>
        <Text
          {...RESULT_TEXT_PROPS}
          testID="result-quick-stat-label"
          numberOfLines={labelMaxLines}
          style={[styles.label, { color: colors.gray }]}
        >
          {label}
        </Text>
        <Text
          {...RESULT_TEXT_PROPS}
          {...valueTextProps}
          testID="result-quick-stat-value"
          style={[
            styles.value,
            valueVariant === 'text' ? styles.valueText : styles.valueCompact,
            { color: colors.primaryText },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (layout: ReturnType<typeof getResultLayoutState>) =>
  StyleSheet.create({
    card: {
      minHeight: layout.quickStatMinHeight,
      borderRadius: layout.standardRadius,
      borderWidth: 1,
      padding: layout.cardPadding,
      gap: layout.sectionGap,
      justifyContent: 'flex-start',
    },
    halfWidthCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minWidth: 0,
    },
    fullWidthCard: {
      width: '100%',
      minWidth: 0,
    },
    iconWrap: {
      width: layout.quickStatIconSize,
      height: layout.quickStatIconSize,
      borderRadius: layout.standardRadius,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xs,
    },
    iconText: {
      fontSize: layout.isCompact ? SIZES.md : SIZES.lg,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      justifyContent: 'space-between',
      gap: layout.isCompact ? SPACING.xs + 1 : SPACING.xs,
    },
    label: {
      fontSize: SIZES.xs,
      lineHeight: layout.isCompact ? 15 : 16,
      textTransform: 'uppercase',
      fontWeight: FONT_WEIGHTS.semiBold,
      letterSpacing: layout.isCompact ? 0.35 : 0.45,
      flexShrink: 1,
      includeFontPadding: false,
    },
    value: {
      fontWeight: FONT_WEIGHTS.bold,
      flexShrink: 1,
      includeFontPadding: false,
    },
    valueCompact: {
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
    },
    valueText: {
      fontSize: layout.bodyTextFontSize,
      lineHeight: layout.bodyTextLineHeight,
      alignSelf: 'stretch',
    },
  });
