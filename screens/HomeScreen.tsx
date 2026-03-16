import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Sun, Moon, Crown, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { useDashboard, useAllScanEligibility } from '@/hooks/queries';

import { ScanType } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
// DailyStat removed
import { CircularProgress } from '@/components/CircularProgress';


import { ScanLimitIndicator } from '@/components/ScanLimitIndicator';
import { SuperScanIndicator } from '@/components/SuperScanIndicator';
import { SettingsCog } from '@/components/SettingsCog';
import { NotificationBell } from '@/components/NotificationBell';
import { SCAN_TYPE_LABELS } from '@/constants/scan';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { checkForAchievements, scheduleScanReadyNotification } = useNotificationContext();


  // React Query hooks
  const {
    data,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
    isRefetching: dashboardRefetching,
  } = useDashboard();

  const {
    data: scanEligibility,
    isLoading: eligibilityLoading,
    refetchAll: refetchEligibility,
  } = useAllScanEligibility();



  const isLoading = dashboardLoading;
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  // isRefreshingSilently handles background updates without visual loaders
  const isRefreshingSilently = dashboardRefetching && !isManualRefresh;
  const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

  // Refetch eligibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchEligibility();
    }, [refetchEligibility])
  );

  // Program the local notifications when fetch brings new data
  useEffect(() => {
    if (scanEligibility) {
      Object.entries(scanEligibility).forEach(([scanType, eligibility]) => {
        if (eligibility && eligibility.next_available_date) {
          scheduleScanReadyNotification(scanType as ScanType, eligibility.next_available_date).catch(err => {
            console.error('[HomeScreen] Error scheduling scan ready notification:', err);
          });
        }
      });
    }
  }, [scanEligibility, scheduleScanReadyNotification]);





  useEffect(() => {
    checkForAchievements().catch((err) => {
      console.error('[HomeScreen] Error checking achievements:', err);
    });
  }, [checkForAchievements]);

  const onRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    await Promise.all([refetchDashboard(), refetchEligibility()]);
    setIsManualRefresh(false);
  }, [refetchDashboard, refetchEligibility]);

  // Header avec logo et branding
  const renderFixedHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.headerLeft}>
        <Text style={styles.username}>{userProfile?.username || t('common.unknown_user')}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          {isDark ? (
            <Moon color={colors.primary} size={24} />
          ) : (
            <Sun color={colors.gold} size={24} />
          )}
        </TouchableOpacity>
        <NotificationBell />
        <SettingsCog />
      </View>
    </View >
  );

  // Contenu scrollable du header
  const renderScrollableHeader = useCallback(() => {
    if (!data) return null;

    return (
      <>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('home.hero_title')}</Text>
          <View style={styles.heroScoreContainer}>
            <CircularProgress
              value={data.healthScore}
              size={180}
              strokeWidth={15}
              showText={true}
              textStyle={{ fontSize: 48, fontWeight: 'bold' }}
            />
          </View>
        </View>

        <View style={styles.scanLimitsSection}>
          <Text style={styles.sectionTitle}>{t('home.items_available')}</Text>

          {/* Grille des 3 types de scan standards */}
          <View style={styles.scanLimitsGrid}>
            {(['health', 'body', 'nutrition'] as ScanType[])
              .map((scanType) => (
                <View key={scanType} style={styles.scanLimitCard}>
                  <Text style={styles.scanLimitLabel}>
                    {t(SCAN_TYPE_LABELS[scanType])}
                  </Text>
                  {scanEligibility ? (
                    <ScanLimitIndicator
                      eligibility={scanEligibility[scanType]}
                      isPremium={isPremium}
                      onLimitReachedPress={!isPremium ? () => router.push('/premium-upgrade') : undefined}
                    />
                  ) : (
                    <Text style={styles.loadingText}>...</Text>
                  )}
                </View>
              ))}
          </View>

          {/* Super Scan - indicateur séparé avec style premium */}
          <View style={styles.superScanContainer}>
            <SuperScanIndicator
              isPremium={isPremium}
              eligibility={scanEligibility?.super}
              onLockedPress={() => router.push('/premium-upgrade')}
            />
          </View>
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/premium-upgrade')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#B8860B', '#8B6914'] as const : ['#FFD700', '#FFA500'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBannerGradient}
            >
              <Crown color="#FFFFFF" size={24} fill="#FFFFFF" />
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>{t('home.premium_banner_title')}</Text>
                <Text style={styles.premiumBannerSubtitle}>{t('home.premium_banner_subtitle')}</Text>
              </View>
              <ChevronRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </>
    );
  }, [data, scanEligibility, isPremium, isDark]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (dashboardError) {
    return <ErrorMessage message={dashboardError.message} />;
  }

  if (!data) {
    return <ErrorMessage message={t('scan_result.no_data')} />;
  }

  return (
    <View style={styles.container}>
      {/* Header fixe */}
      {renderFixedHeader()}

      {/* Contenu scrollable */}
      <ScrollView
        style={styles.listContainer}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        refreshControl={
          <RefreshControl refreshing={isManualRefresh} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderScrollableHeader()}
        <View style={styles.listFooter} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: colors.cardBackground,
    ...SHADOWS.header,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  username: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  themeToggle: {
    padding: SPACING.sm,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: colors.background,
  },
  heroTitle: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  heroScoreContainer: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scanLimitsSection: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.xl,
  },
  scanLimitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  scanLimitCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  scanLimitLabel: {
    fontSize: SIZES.text12,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  superScanContainer: {
    marginTop: SPACING.md,
  },
  productsSectionHeader: {
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  productItemContainer: {
    paddingHorizontal: SPACING.page,
  },
  listFooter: {
    height: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: SIZES.text16,
    color: colors.gray,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  premiumBanner: {
    marginHorizontal: SPACING.page,
    marginTop: SPACING.xl,
  },
  premiumBannerGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
  },
  premiumBannerSubtitle: {
    fontSize: SIZES.text12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});

