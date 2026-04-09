import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, Crown, Lock } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';

interface CoachPersonaCardProps {
  title: string;
  subtitle: string;
  active?: boolean;
  locked?: boolean;
  disabled?: boolean;
  lockedBadgeLabel?: string;
  lockedHint?: string;
  onPress: () => void;
  testID?: string;
}

export function CoachPersonaCard({
  title,
  subtitle,
  active = false,
  locked = false,
  disabled = false,
  lockedBadgeLabel,
  lockedHint,
  onPress,
  testID,
}: CoachPersonaCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        active && styles.cardActive,
        locked && styles.cardLocked,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
      testID={testID}
    >
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>
        {active ? (
          <View style={styles.activeBadge}>
            <Check color={colors.white} size={14} strokeWidth={3} />
          </View>
        ) : null}
      </View>

      {locked ? (
        <BlurView intensity={35} tint="light" style={styles.lockOverlay}>
          <View style={styles.lockBadge}>
            <Lock color={colors.primaryText} size={14} />
            {lockedBadgeLabel ? (
              <Text style={styles.lockBadgeText}>{lockedBadgeLabel}</Text>
            ) : null}
          </View>
          {lockedHint ? (
            <Text numberOfLines={2} style={styles.lockHint}>
              {lockedHint}
            </Text>
          ) : null}
          <View style={styles.premiumPill}>
            <Crown color={colors.white} fill={colors.white} size={12} />
          </View>
        </BlurView>
      ) : null}
    </Pressable>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      position: 'relative',
      flexBasis: '48%',
      minHeight: 98,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.primaryText, 0.08),
      overflow: 'hidden',
      gap: SPACING.xs,
    },
    cardActive: {
      borderColor: withAlpha(colors.primary, 0.65),
      backgroundColor: withAlpha(colors.primary, 0.06),
    },
    cardLocked: {
      borderColor: withAlpha(colors.primaryText, 0.12),
    },
    cardDisabled: {
      opacity: 0.72,
    },
    cardPressed: {
      transform: [{ scale: 0.99 }],
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: SPACING.xs,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    subtitle: {
      fontSize: SIZES.text12,
      lineHeight: 16,
      color: colors.gray,
    },
    activeBadge: {
      width: 24,
      height: 24,
      borderRadius: BORDER_RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    lockOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      backgroundColor: withAlpha(colors.background, 0.18),
    },
    lockBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 5,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: withAlpha(colors.white, 0.68),
    },
    lockBadgeText: {
      fontSize: 10,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    lockHint: {
      fontSize: SIZES.text12,
      lineHeight: 16,
      color: colors.primaryText,
      fontWeight: FONT_WEIGHTS.semiBold,
      maxWidth: '88%',
    },
    premiumPill: {
      position: 'absolute',
      right: SPACING.md,
      bottom: SPACING.sm + 2,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
  });
