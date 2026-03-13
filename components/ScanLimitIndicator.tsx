import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScanEligibilityResponse } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';
import { NextScanTimer } from '@/components/NextScanTimer';

interface ScanLimitIndicatorProps {
  eligibility?: ScanEligibilityResponse;
  isPremium?: boolean;
}

export function ScanLimitIndicator({ eligibility, isPremium }: ScanLimitIndicatorProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Guard against undefined eligibility (e.g., after sign-out)
  if (!eligibility) {
    return null;
  }

  const currentCount = eligibility.current_count || 0;  // Scans utilisés
  const limit = eligibility.limit || 1;                 // Limite totale
  const remaining = Math.max(0, limit - currentCount);  // Scans disponibles
  const progress = (remaining / limit) * 100;           // Barre de progression basée sur les scans restants (décroissante)
  const isLimitReached = !eligibility.allowed;



  return (
    <View style={styles.container}>
      <View style={styles.countContainer}>
        {/* Affiche les scans DISPONIBLES / limite totale */}
        <Text style={[styles.countText, isLimitReached && styles.countTextDisabled]}>
          {remaining}
        </Text>
        <Text style={styles.countSeparator}>/</Text>
        <Text style={styles.limitText}>{limit}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
              isLimitReached && styles.progressFillDisabled,
            ]}
          />
        </View>
      </View>

      <Text style={[styles.statusText, isLimitReached && styles.statusTextDisabled]}>
        {isLimitReached ? t('scan_limit.limit_reached') : t('scan_limit.available')}
      </Text>

      {isPremium && eligibility.next_available_date && (
        <View style={styles.timerContainer}>
          <NextScanTimer
            nextAvailableDate={eligibility.next_available_date}
            scanLabel={t('scan_limit.recharge')}
            textColor={colors.gray}
            iconColor={colors.gray}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  countText: {
    fontSize: SIZES.text20,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primary,
  },
  countTextDisabled: {
    color: colors.gray,
  },
  countSeparator: {
    fontSize: SIZES.text14,
    color: colors.grayMedium,
    marginHorizontal: 2,
  },
  limitText: {
    fontSize: SIZES.text14,
    color: colors.gray,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressContainer: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressFillDisabled: {
    backgroundColor: colors.grayMedium,
  },
  statusText: {
    fontSize: SIZES.text12,
    color: colors.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statusTextDisabled: {
    color: colors.gray,
  },
  timerContainer: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
