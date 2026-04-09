import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';

interface CoachPromptCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function CoachPromptCard({
  title,
  subtitle,
  onPress,
  busy = false,
  disabled = false,
  testID,
}: CoachPromptCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        (disabled || busy) && styles.cardDisabled,
        pressed && styles.cardPressed,
      ]}
      testID={testID}
    >
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.trailing}>
        {busy ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <ChevronRight color={colors.primary} size={18} />
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 4,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.primaryText, 0.08),
    },
    cardPressed: {
      transform: [{ scale: 0.99 }],
    },
    cardDisabled: {
      opacity: 0.64,
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
      lineHeight: 18,
      color: colors.gray,
    },
    trailing: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, 0.12),
    },
  });
