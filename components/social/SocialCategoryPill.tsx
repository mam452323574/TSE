import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, FONT_WEIGHTS, SIZES, SPACING, withAlpha } from '@/constants/theme';
import type { SocialCategoryFilter } from '@/types';

interface SocialCategoryPillProps {
  category: SocialCategoryFilter;
  selected?: boolean;
  onPress?: () => void;
}

export function SocialCategoryPill({
  category,
  selected = false,
  onPress,
}: SocialCategoryPillProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.pill,
        selected ? styles.pillSelected : styles.pillIdle,
      ]}
      testID={`social-category-pill-${category}`}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}>
        {t(`social.categories.${category}`)}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    pill: {
      minHeight: 38,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    pillIdle: {
      backgroundColor: colors.cardBackground,
      borderColor: withAlpha(colors.primaryText, 0.08),
    },
    pillSelected: {
      backgroundColor: withAlpha(colors.primary, 0.12),
      borderColor: withAlpha(colors.primary, 0.22),
    },
    label: {
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.semiBold,
    },
    labelIdle: {
      color: colors.primaryText,
    },
    labelSelected: {
      color: colors.primary,
    },
  });

export default SocialCategoryPill;
