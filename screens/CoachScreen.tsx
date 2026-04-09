import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { CoachPersonaCard } from '@/components/coach/CoachPersonaCard';
import { CoachPromptCard } from '@/components/coach/CoachPromptCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCoachEntries, useCoachGeneration } from '@/hooks/queries';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { trackEvent } from '@/services/analytics';
import {
  fetchRecentCoachScans,
  isCoachProviderUnavailableEntry,
  isCoachProviderUnavailableError,
} from '@/services/coach';
import { markCoachSeen } from '@/services/growthExperience';
import { getCoachPersona } from '@/shared/coachPersonas';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';
import type { CoachPersonaKey, CoachPromptType } from '@/types';
import {
  getCoachPersonaOptionsForProfile,
  isCoachPersonaLockedForProfile,
  resolveCoachPersonaDefinitionForProfile,
  resolveCoachPersonaKeyFromProfile,
} from '@/utils/coachPersona';

const PROMPT_TYPES: readonly CoachPromptType[] = [
  'latest_scan',
  'weekly_plan',
  'nutrition_focus',
  'body_focus',
  'face_focus',
] as const;

export default function CoachScreen() {
  const router = useRouter();
  const { user, userProfile, updateCoachPersona } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { alertElement, showAlert } = useCustomAlert();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const {
    data: entries = [],
    error: entriesError,
    isFetching: isEntriesFetching,
    refetch: refetchEntries,
  } = useCoachEntries();
  const coachGeneration = useCoachGeneration();
  const [selectedPrompt, setSelectedPrompt] = useState<CoachPromptType | null>(null);
  const [pendingPersonaKey, setPendingPersonaKey] = useState<CoachPersonaKey | null>(null);

  const {
    data: recentScans = [],
    error: recentScansError,
    isFetching: isScansFetching,
    refetch: refetchScans,
  } = useQuery({
    queryKey: ['coachScans', user?.id],
    queryFn: () => fetchRecentCoachScans(),
    enabled: !!user?.id,
    initialData: [],
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    trackEvent('coach_opened');
    void markCoachSeen();
  }, []);

  const previewProfile = useMemo(() => {
    if (!pendingPersonaKey || !userProfile) {
      return userProfile;
    }

    return {
      ...userProfile,
      coach_persona_key: pendingPersonaKey,
    };
  }, [pendingPersonaKey, userProfile]);

  const activePersonaKey = useMemo(
    () => resolveCoachPersonaKeyFromProfile(previewProfile),
    [previewProfile],
  );
  const activePersona = useMemo(
    () => resolveCoachPersonaDefinitionForProfile(previewProfile),
    [previewProfile],
  );
  const personaOptions = useMemo(
    () => getCoachPersonaOptionsForProfile(previewProfile),
    [previewProfile],
  );
  const isPersonaSaving = pendingPersonaKey !== null;

  const latestReadyEntry = useMemo(
    () =>
      entries.find(
        (entry) =>
          (entry.status ?? 'ready') === 'ready' &&
          entry.persona_key === activePersonaKey,
      ) ?? null,
    [activePersonaKey, entries],
  );
  const latestCoachEntry = entries[0] ?? null;
  const generationGuidance =
    coachGeneration.data?.persona_key === activePersonaKey
      ? {
        title: coachGeneration.data.title,
        body: coachGeneration.data.body,
        disclaimer: coachGeneration.data.disclaimer,
        persona_key: coachGeneration.data.persona_key,
        cta_label: coachGeneration.data.cta_label,
        cta_route: coachGeneration.data.cta_route,
        cached: coachGeneration.data.cached,
        fallback: coachGeneration.data.fallback,
      }
      : null;
  const activeGuidance = generationGuidance
    ? generationGuidance
    : latestReadyEntry
      ? {
          title: latestReadyEntry.title,
          body: latestReadyEntry.body,
          disclaimer: latestReadyEntry.disclaimer,
          persona_key: latestReadyEntry.persona_key,
          cta_label: latestReadyEntry.cta_label,
          cta_route: latestReadyEntry.cta_route,
          cached: true,
          fallback: false,
        }
      : null;
  const loadError =
    entriesError instanceof Error
      ? entriesError
      : recentScansError instanceof Error
        ? recentScansError
        : null;
  const persistedCoachProviderUnavailable = isCoachProviderUnavailableEntry(
    latestCoachEntry,
  );
  const generationCoachProviderUnavailable = isCoachProviderUnavailableError(
    coachGeneration.error,
  );
  const coachProviderUnavailable =
    !loadError &&
    (generationCoachProviderUnavailable || persistedCoachProviderUnavailable);
  const showLoadingState =
    (isEntriesFetching || isScansFetching) &&
    !loadError &&
    !coachGeneration.isPending &&
    !activeGuidance &&
    recentScans.length === 0;
  const showQueryErrorState = !showLoadingState && !!loadError;
  const showProviderUnavailableState =
    !showLoadingState && !showQueryErrorState && coachProviderUnavailable;
  const showGenerationErrorState =
    !showLoadingState &&
    !showQueryErrorState &&
    !showProviderUnavailableState &&
    coachGeneration.isError;
  const showEmptyState =
    !showLoadingState &&
    !showQueryErrorState &&
    !showProviderUnavailableState &&
    !showGenerationErrorState &&
    recentScans.length === 0 &&
    !activeGuidance &&
    !coachGeneration.isPending &&
    !isScansFetching;
  const arePromptCardsDisabled =
    coachGeneration.isPending || isPersonaSaving || coachProviderUnavailable;

  const handlePersonaPress = async (personaKey: CoachPersonaKey) => {
    const isLocked = isCoachPersonaLockedForProfile(personaKey, userProfile);
    if (isLocked) {
      trackEvent('coach_persona_locked_tapped', {
        persona_key: personaKey,
      });
      router.push('/premium-upgrade' as any);
      return;
    }

    if (!userProfile || activePersonaKey === personaKey || isPersonaSaving) {
      return;
    }

    setPendingPersonaKey(personaKey);
    trackEvent('coach_persona_selected', {
      persona_key: personaKey,
    });

    try {
      await updateCoachPersona(personaKey);
    } catch (error) {
      trackEvent('coach_persona_update_failed', {
        persona_key: personaKey,
        message: error instanceof Error ? error.message : 'unknown',
      });
      showAlert(
        t('coach.error_title'),
        error instanceof Error ? error.message : t('coach.error_body'),
        [{ text: t('common.ok') }],
      );
    } finally {
      setPendingPersonaKey(null);
    }
  };

  const handleGenerate = async (promptType: CoachPromptType) => {
    setSelectedPrompt(promptType);
    trackEvent('coach_prompt_submitted', {
      prompt_type: promptType,
      persona_key: activePersonaKey,
      has_recent_scans: recentScans.length > 0,
    });

    try {
      const response = await coachGeneration.mutateAsync({
        promptType,
        personaKey: activePersonaKey,
      });
      trackEvent('coach_response_received', {
        prompt_type: promptType,
        persona_key: response.persona_key,
        cached: response.cached,
        fallback: response.fallback,
        status: response.status,
      });
    } catch (error) {
      trackEvent('coach_generation_failed', {
        prompt_type: promptType,
        persona_key: activePersonaKey,
        message: error instanceof Error ? error.message : 'unknown',
      });
    } finally {
      setSelectedPrompt(null);
    }
  };

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismiss();
      return;
    }

    router.back();
  };

  const handleRetryQueries = () => {
    void refetchEntries();
    void refetchScans();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {alertElement}
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={handleClose}
            style={styles.backButton}
            testID="coach-back-button"
          >
            <ChevronLeft color={colors.primaryText} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('home.coach_card_eyebrow')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('coach.persona_section_title')}</Text>
            </View>
            <View style={styles.personaGrid}>
              {personaOptions.map((persona) => (
                <CoachPersonaCard
                  key={persona.key}
                  title={t(persona.titleTranslationKey)}
                  subtitle={t(persona.subtitleTranslationKey)}
                  active={activePersonaKey === persona.key}
                  locked={persona.locked}
                  disabled={coachGeneration.isPending || isPersonaSaving}
                  lockedBadgeLabel={t('coach.locked_badge')}
                  lockedHint={t('coach.locked_tap_hint')}
                  onPress={() => {
                    void handlePersonaPress(persona.key);
                  }}
                  testID={`coach-persona-${persona.key}`}
                />
              ))}
            </View>
            {!activePersona.requiresPremium ? (
              <View style={styles.personaHint}>
                <Text style={styles.personaHintText}>
                  {t('coach.free_persona_hint')}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>{t('coach.prompt_section_title')}</Text>
            </View>
            <View style={styles.activePersonaPill}>
              <Text style={styles.activePersonaLabel}>
                {t('coach.active_persona_label')}
              </Text>
              <Text style={styles.activePersonaValue}>
                {t(activePersona.titleTranslationKey)}
              </Text>
            </View>
            <View style={styles.promptGrid}>
              {PROMPT_TYPES.map((promptType) => (
                <CoachPromptCard
                  key={promptType}
                  title={t(`coach.prompts.${promptType}.title`)}
                  subtitle={t(`coach.prompts.${promptType}.subtitle`)}
                  onPress={() => {
                    void handleGenerate(promptType);
                  }}
                  busy={selectedPrompt === promptType && coachGeneration.isPending}
                  disabled={arePromptCardsDisabled}
                  testID={`coach-prompt-${promptType}`}
                />
              ))}
            </View>
          </View>

          {showLoadingState ? (
            <View style={styles.stateCard} testID="coach-loading-state">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {showQueryErrorState ? (
            <View style={styles.stateCard} testID="coach-query-error-state">
              <Text style={styles.stateTitle}>{t('coach.error_title')}</Text>
              <Text style={styles.stateBody}>{loadError.message}</Text>
              <Button title={t('common.retry')} onPress={handleRetryQueries} />
            </View>
          ) : null}

          {showProviderUnavailableState ? (
            <View style={styles.stateCard} testID="coach-unavailable-state">
              <Text style={styles.stateTitle}>{t('coach.unavailable_title')}</Text>
              <Text style={styles.stateBody}>{t('coach.unavailable_body')}</Text>
            </View>
          ) : null}

          {showGenerationErrorState ? (
            <View style={styles.stateCard} testID="coach-error-state">
              <Text style={styles.stateTitle}>{t('coach.error_title')}</Text>
              <Text style={styles.stateBody}>
                {coachGeneration.error?.message || t('coach.error_body')}
              </Text>
            </View>
          ) : null}

          {showEmptyState ? (
            <View style={styles.stateCard} testID="coach-empty-state">
              <Text style={styles.stateTitle}>{t('coach.empty_title')}</Text>
              <Text style={styles.stateBody}>{t('coach.empty_body')}</Text>
            </View>
          ) : null}

          {activeGuidance ? (
            <View style={styles.guidanceCard} testID="coach-guidance-card">
              <View style={styles.guidanceHeader}>
                <Text style={styles.guidanceLabel}>
                  {activeGuidance.cached
                    ? t('coach.cached_badge')
                    : t('coach.response_label')}
                </Text>
                {activeGuidance.fallback ? (
                  <Text style={styles.fallbackBadge}>{t('coach.fallback_badge')}</Text>
                ) : null}
              </View>

              <View style={styles.personaSummary}>
                <Text style={styles.personaSummaryLabel}>
                  {t('coach.active_persona_label')}
                </Text>
                <Text style={styles.personaSummaryValue}>
                  {t(getCoachPersona(activeGuidance.persona_key).titleTranslationKey)}
                </Text>
              </View>

              <Text style={styles.guidanceTitle}>{activeGuidance.title}</Text>
              <Text style={styles.guidanceBody}>{activeGuidance.body}</Text>

              <View style={styles.disclaimerCard}>
                <Text style={styles.disclaimerLabel}>{t('coach.disclaimer_label')}</Text>
                <Text style={styles.disclaimerText} testID="coach-guidance-disclaimer">
                  {activeGuidance.disclaimer}
                </Text>
              </View>

              {activeGuidance.cta_label && activeGuidance.cta_route ? (
                <Button
                  title={activeGuidance.cta_label}
                  onPress={() => router.push(activeGuidance.cta_route as any)}
                />
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, insets: { bottom: number }) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: withAlpha(colors.primaryText, 0.06),
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
    },
    headerTitle: {
      flex: 1,
      fontSize: SIZES.text18,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    content: {
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.md,
      paddingBottom: insets.bottom + SPACING.xxxl,
      gap: SPACING.lg,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      gap: SPACING.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    stepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, 0.12),
    },
    stepBadgeText: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primary,
    },
    sectionTitle: {
      flex: 1,
      fontSize: SIZES.text16,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    personaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    personaHint: {
      alignSelf: 'flex-start',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: withAlpha(colors.primary, 0.08),
    },
    personaHintText: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primary,
    },
    activePersonaPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      flexWrap: 'wrap',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: withAlpha(colors.primaryText, 0.04),
    },
    activePersonaLabel: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.gray,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    activePersonaValue: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
    },
    promptGrid: {
      gap: SPACING.sm,
    },
    stateCard: {
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.primaryText, 0.08),
      gap: SPACING.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stateTitle: {
      fontSize: SIZES.text16,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textAlign: 'center',
    },
    stateBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.gray,
      textAlign: 'center',
    },
    guidanceCard: {
      gap: SPACING.sm,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.1),
    },
    guidanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    guidanceLabel: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    fallbackBadge: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.warning,
    },
    personaSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      flexWrap: 'wrap',
    },
    personaSummaryLabel: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.gray,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    personaSummaryValue: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
    },
    guidanceTitle: {
      fontSize: SIZES.text18,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    guidanceBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.primaryText,
    },
    disclaimerCard: {
      gap: SPACING.xs,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: withAlpha(colors.primary, 0.06),
    },
    disclaimerLabel: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    disclaimerText: {
      fontSize: SIZES.text12,
      lineHeight: 20,
      color: colors.gray,
    },
  });
