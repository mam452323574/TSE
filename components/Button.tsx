import { Text, StyleSheet, ActivityIndicator, Pressable, View, Platform } from 'react-native';
import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.95 : 1 }] }
      ]}
    >
      <View
        style={[
          styles.button,
          variant === 'primary' && styles.primaryButton,
          variant === 'secondary' && styles.secondaryButton,
          variant === 'outline' && styles.outlineButton,
          (disabled || loading) && styles.disabledButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
        ) : (
          <Text
            style={[
              styles.text,
              variant === 'primary' && styles.primaryText,
              variant === 'secondary' && styles.secondaryText,
              variant === 'outline' && styles.outlineText,
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
});
