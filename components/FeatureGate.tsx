import { useRef, useEffect, useState, useMemo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Crown, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

interface FeatureGateProps {
  featureKey: string;
  featureName: string;
  featureDescription?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  featureKey,
  featureName,
  featureDescription,
  children,
  fallback,
}: FeatureGateProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

  const handleUpgrade = () => {
    router.push('/premium-upgrade');
  };

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockContainer}>
        <View style={styles.iconBackground}>
          <Lock color={colors.primary} size={48} />
        </View>
        <View style={styles.crownBadge}>
          <Crown color={colors.white} size={20} fill={colors.white} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Crown color="#FFD700" size={32} fill="#FFD700" />
        </View>
        <Text style={styles.title}>{t('components.feature_gate.title')}</Text>
      </View>
      <Text style={styles.featureName}>{featureName}</Text>

      {featureDescription && (
        <Text style={styles.description}>{featureDescription}</Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.upgradeButton, pressed && styles.upgradeButtonPressed]}
        onPress={handleUpgrade}
      >
        <Crown color={colors.white} size={20} fill={colors.white} />
        <Text style={styles.upgradeButtonText}>{t('components.feature_gate.upgrade_btn')}</Text>
      </Pressable>

      <Text style={styles.hint}>
        {t('components.feature_gate.hint')}
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  content: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  upgradeButtonPressed: {
    opacity: 0.8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: colors.background,
  },
  lockContainer: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  crownBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.cardBackground,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: SPACING.sm,
  },
  featureName: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: SIZES.md,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  upgradeButtonText: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: colors.white,
  },
  hint: {
    fontSize: SIZES.sm,
    color: colors.gray,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
