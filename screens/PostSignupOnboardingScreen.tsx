import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AppScreen } from '@/components/AppScreen';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/Button';
import { BORDER_RADIUS, SHADOWS, SIZES, SPACING, withAlpha } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeatureFlags, useGrowthExperience } from '@/hooks/queries';
import { usePostSignupOnboardingPending } from '@/hooks/usePostSignupOnboardingPending';
import {
  ensureGrowthExperience,
  shouldPresentEntryOffer,
} from '@/services/growthExperience';
import {
  fetchRevenueCatCustomerInfo,
  hasPremiumEntitlement,
} from '@/services/revenueCatOfferings';
import {
  clearPostSignupOnboardingPending,
} from '@/utils/postSignupOnboarding';
import { entryOfferSession } from '@/utils/entryOfferSession';

import { NativePagerView } from '@/components/NativePagerView';

const TOTAL_SLIDES = 3;

export default function PostSignupOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { user, userProfile, isEmailVerified, markTutorialSeen, updateAvatarUrl } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const { data: growthExperience } = useGrowthExperience();
  const {
    isPending,
    isLoading: isPendingLoading,
  } = usePostSignupOnboardingPending(user?.id);

  const [stage, setStage] = useState<'avatar' | 'slides'>('avatar');
  const [currentPage, setCurrentPage] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [selectedAvatarReference, setSelectedAvatarReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pagerRef = useRef<any>(null);

  const styles = useMemo(
    () => createStyles(colors, insets, isDark),
    [colors, insets, isDark]
  );
  const gradientColors = useMemo<[string, string, string]>(
    () =>
      isDark
        ? ['#040507', '#080B10', '#111A24']
        : ['#F7F8FA', '#EEF1F5', '#E4EAF2'],
    [isDark]
  );
  const slides = useMemo(
    () => [
      {
        index: '01',
        title: t('onboarding.slide_1_title'),
        subtitle: t('onboarding.slide_1_subtitle'),
      },
      {
        index: '02',
        title: t('onboarding.slide_2_title'),
        subtitle: t('onboarding.slide_2_subtitle'),
      },
      {
        index: '03',
        title: t('onboarding.slide_3_title'),
        subtitle: t('onboarding.slide_3_subtitle'),
      },
    ],
    [t]
  );
  const hasAvatar = Boolean(selectedAvatarReference ?? userProfile?.avatar_url);
  const isAvatarStage = stage === 'avatar';

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isPendingLoading || completing) {
      return;
    }

    if (!user || !isEmailVerified || !userProfile?.username) {
      return;
    }

    if (!isPending || userProfile.has_seen_tutorial) {
      router.replace('/(tabs)');
    }
  }, [
    isEmailVerified,
    isPending,
    isPendingLoading,
    completing,
    router,
    user,
    userProfile?.has_seen_tutorial,
    userProfile?.username,
  ]);

  const goToPage = (nextPage: number) => {
    setCurrentPage(nextPage);

    if (Platform.OS !== 'web') {
      pagerRef.current?.setPage(nextPage);
    }
  };

  const handleAvatarStepContinue = () => {
    if (updatingAvatar || !hasAvatar) {
      return;
    }

    setError(null);
    setCurrentPage(0);
    setStage('slides');
  };

  const handleAvatarStepSkip = () => {
    if (updatingAvatar) {
      return;
    }

    setError(null);
    setCurrentPage(0);
    setStage('slides');
  };

  const handlePrimaryAction = async () => {
    if (isAvatarStage) {
      handleAvatarStepContinue();
      return;
    }

    if (currentPage < TOTAL_SLIDES - 1) {
      goToPage(currentPage + 1);
      return;
    }

    if (!user?.id || completing) {
      return;
    }

    try {
      setCompleting(true);
      setError(null);

      await markTutorialSeen();
      await clearPostSignupOnboardingPending(user.id);

      const ensuredGrowthExperience =
        growthExperience ??
        (await ensureGrowthExperience(featureFlags.entry_offer_offering_id));
      const customerInfo = await fetchRevenueCatCustomerInfo();
      const shouldOpenEntryOffer = shouldPresentEntryOffer({
        featureFlags,
        growthExperience: ensuredGrowthExperience,
        userProfile: {
          id: user.id,
          account_tier: userProfile?.account_tier ?? 'free',
        },
        hasActiveEntitlement: hasPremiumEntitlement(customerInfo),
      });

      if (shouldOpenEntryOffer) {
        entryOfferSession.markAutoPresentationStarted(user.id);
      }

      router.replace((shouldOpenEntryOffer ? '/entry-offer' : '/(tabs)') as any);
    } catch (completionError) {
      console.error(
        '[PostSignupOnboarding] Failed to complete onboarding:',
        completionError
      );
      setError(t('common.error'));
    } finally {
      setCompleting(false);
    }
  };

  const handleAvatarSelected = async (avatarReference: string) => {
    try {
      setUpdatingAvatar(true);
      setError(null);
      await updateAvatarUrl(avatarReference);
      setSelectedAvatarReference(avatarReference);
    } catch (avatarError) {
      console.error('[PostSignupOnboarding] Failed to update avatar:', avatarError);
      setError(t('components.avatar.error_download'));
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const renderSlide = (slide: (typeof slides)[number]) => (
    <View key={slide.index} style={styles.pageShell}>
      <View style={styles.slideCard}>
        <Text style={styles.slideIndex}>{slide.index}</Text>
        <View style={styles.slideRule} />
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );

  const renderAvatarStep = () => (
    <View style={styles.stepWrap} testID="post-signup-avatar-step">
      <View style={styles.profileCard}>
        <Text style={styles.profileCardTitle}>
          {hasAvatar
            ? t('onboarding.avatar_change_title')
            : t('onboarding.avatar_title')}
        </Text>
        <Text style={styles.profileCardSubtitle}>
          {hasAvatar
            ? t('onboarding.avatar_change_subtitle')
            : t('onboarding.avatar_subtitle')}
        </Text>
        {user ? (
          <AvatarPicker
            userId={user.id}
            currentAvatarUrl={selectedAvatarReference ?? userProfile?.avatar_url}
            onAvatarSelected={handleAvatarSelected}
            size={104}
          />
        ) : null}
      </View>
    </View>
  );

  const renderSlidesStep = () => (
    <View style={styles.stepWrap} testID="post-signup-slides-step">
      {Platform.OS === 'web' ? (
        renderSlide(slides[currentPage])
      ) : (
        <NativePagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          scrollEnabled={false}
          onPageSelected={(event: { nativeEvent: { position: number } }) =>
            setCurrentPage(event.nativeEvent.position)
          }
        >
          {slides.map((slide) => (
            <View key={slide.index} style={styles.nativePage}>
              {renderSlide(slide)}
            </View>
          ))}
        </NativePagerView>
      )}
    </View>
  );

  if (isPendingLoading || !userProfile?.username) {
    return (
      <AppScreen style={styles.container} topInset={false} bottomInset={false}>
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </LinearGradient>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.container} topInset={false} bottomInset={false}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brand}>HEALTH SCAN</Text>
            {!isAvatarStage ? (
              <Text style={styles.counter}>
                {currentPage + 1} / {TOTAL_SLIDES}
              </Text>
            ) : <View />}
          </View>

          <View style={styles.pagerWrap}>
            {isAvatarStage ? renderAvatarStep() : renderSlidesStep()}
          </View>

          <View style={styles.footer}>
            {!isAvatarStage ? (
              <View style={styles.progressRow}>
                {slides.map((slide, index) => (
                  <View
                    key={slide.index}
                    style={[
                      styles.progressDot,
                      index === currentPage && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {isAvatarStage && !hasAvatar ? (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={updatingAvatar}
                onPress={handleAvatarStepSkip}
                style={styles.skipAvatarButton}
                testID="post-signup-skip-avatar"
              >
                <Text style={styles.skipAvatarLabel}>{t('onboarding.avatar_skip')}</Text>
              </TouchableOpacity>
            ) : null}

            <Button
              title={
                !isAvatarStage && currentPage === TOTAL_SLIDES - 1
                  ? t('onboarding.enter_app')
                  : t('common.next')
              }
              onPress={handlePrimaryAction}
              loading={!isAvatarStage && completing}
              disabled={isAvatarStage && (updatingAvatar || !hasAvatar)}
            />
          </View>
        </View>
      </LinearGradient>
    </AppScreen>
  );
}

const createStyles = (colors: any, insets: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    orbTop: {
      position: 'absolute',
      top: -80,
      right: -40,
      width: 220,
      height: 220,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.12 : 0.08),
    },
    orbBottom: {
      position: 'absolute',
      bottom: -110,
      left: -50,
      width: 260,
      height: 260,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.08 : 0.05),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingTop: insets.top + SPACING.xl,
      paddingBottom: insets.bottom + SPACING.xl,
      paddingHorizontal: SPACING.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    brand: {
      fontSize: SIZES.sm,
      fontWeight: '700',
      letterSpacing: 3,
      color: colors.primaryText,
    },
    counter: {
      fontSize: SIZES.sm,
      fontWeight: '600',
      letterSpacing: 1,
      color: colors.gray,
    },
    pagerWrap: {
      flex: 1,
      minHeight: 0,
    },
    stepWrap: {
      flex: 1,
      minHeight: 0,
    },
    pager: {
      flex: 1,
    },
    nativePage: {
      flex: 1,
    },
    pageShell: {
      flex: 1,
      justifyContent: 'center',
    },
    slideCard: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xxxl,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.24 : 0.16),
      backgroundColor: withAlpha(colors.cardBackground, isDark ? 0.76 : 0.88),
      ...SHADOWS.card,
    },
    profileCard: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xxxl,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.24 : 0.16),
      backgroundColor: withAlpha(colors.cardBackground, isDark ? 0.76 : 0.88),
      alignItems: 'center',
      gap: SPACING.lg,
      ...SHADOWS.card,
    },
    profileCardTitle: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },
    profileCardSubtitle: {
      fontSize: SIZES.lg,
      lineHeight: 28,
      color: colors.gray,
      textAlign: 'center',
      maxWidth: 420,
    },
    skipAvatarButton: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: SPACING.md,
      alignSelf: 'center',
    },
    skipAvatarLabel: {
      color: colors.gray,
      fontSize: SIZES.sm,
      fontWeight: '600',
    },
    slideIndex: {
      fontSize: 56,
      fontWeight: '700',
      letterSpacing: 2,
      color: withAlpha(colors.primaryText, isDark ? 0.18 : 0.14),
      marginBottom: SPACING.lg,
    },
    slideRule: {
      width: 48,
      height: 3,
      borderRadius: 999,
      backgroundColor: colors.primary,
      marginBottom: SPACING.xl,
    },
    slideTitle: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: SPACING.lg,
    },
    slideSubtitle: {
      fontSize: SIZES.lg,
      lineHeight: 28,
      color: colors.gray,
      maxWidth: 420,
    },
    footer: {
      gap: SPACING.lg,
      paddingTop: SPACING.xl,
    },
    progressRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    progressDot: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primaryText, isDark ? 0.14 : 0.1),
    },
    progressDotActive: {
      backgroundColor: colors.primary,
    },
    errorContainer: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: withAlpha(colors.error, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(colors.error, 0.2),
    },
    errorText: {
      color: colors.error,
      fontSize: SIZES.sm,
      textAlign: 'center',
    },
  });
