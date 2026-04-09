import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Plus } from 'lucide-react-native';

import { SocialCategoryPill } from '@/components/social/SocialCategoryPill';
import { SocialPostCard } from '@/components/social/SocialPostCard';
import { SOCIAL_REPORT_REASON_CODES } from '@/constants/social';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  flattenSocialFeedPages,
  useFeatureFlags,
  useSocialFeed,
  useSocialMutations,
} from '@/hooks/queries';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { trackEvent, trackFailureEvent } from '@/services/analytics';
import {
  recordSocialPostImpressions,
  shareSocialPostAsset,
  SocialServiceError,
} from '@/services/social';
import { logOperationalError } from '@/utils/observability';
import type {
  SocialPost,
  SocialReactionState,
  SocialReportReasonCode,
} from '@/types';

export default function SocialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { alertElement, showAlert } = useCustomAlert();
  const { data: featureFlags } = useFeatureFlags();
  const queuedImpressionsRef = useRef<Set<string>>(new Set());
  const sessionImpressionsRef = useRef<Set<string>>(new Set());
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'before_after' | 'food' | 'physique'>('all');
  const [impressionError, setImpressionError] = useState<Error | null>(null);
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);
  const {
    data,
    error: feedError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSocialFeed(selectedCategory);
  const {
    setReactionMutation,
    reportContentMutation,
  } = useSocialMutations();
  const quickReportReasonCodes = useMemo(
    () => SOCIAL_REPORT_REASON_CODES.filter((reasonCode) => reasonCode !== 'other'),
    [],
  );

  useEffect(() => {
    trackEvent('social_tab_viewed');
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  const posts = useMemo(() => flattenSocialFeedPages(data?.pages), [data?.pages]);
  const backendError = impressionError ?? (feedError instanceof Error ? feedError : null);
  const backendErrorTitle = 'Social unavailable';

  const flushQueuedImpressions = async () => {
    const queuedPostIds = Array.from(queuedImpressionsRef.current);
    queuedImpressionsRef.current.clear();

    if (queuedPostIds.length === 0) {
      return;
    }

    try {
      await recordSocialPostImpressions(queuedPostIds, 'feed');
      setImpressionError(null);
    } catch (error) {
      queuedPostIds.forEach((postId) => {
        sessionImpressionsRef.current.delete(postId);
      });
      logOperationalError('[Social] Failed to record social impressions', error, {
        batch_size: queuedPostIds.length,
      });
      setImpressionError(
        error instanceof Error
          ? error
          : new SocialServiceError(t('social.empty.body'), {
              code: 'social_impressions_failed',
              status: 500,
              details: error,
            }),
      );
    }
  };

  const queueImpressions = (postIds: string[]) => {
    let queuedAny = false;

    for (const postId of postIds) {
      if (sessionImpressionsRef.current.has(postId)) {
        continue;
      }

      sessionImpressionsRef.current.add(postId);
      queuedImpressionsRef.current.add(postId);
      queuedAny = true;
    }

    if (!queuedAny || flushTimeoutRef.current) {
      return;
    }

    flushTimeoutRef.current = setTimeout(() => {
      flushTimeoutRef.current = null;
      void flushQueuedImpressions();
    }, 800);
  };

  const handleOpenComposer = () => {
    router.push('/social-compose' as any);
  };

  const handleOpenComments = (postId: string) => {
    router.push({
      pathname: '/social-comments' as any,
      params: { postId },
    });
  };

  const handleSharePost = async (post: SocialPost) => {
    if (!post.asset_url) {
      return;
    }

    try {
      await shareSocialPostAsset(post.asset_url, post.id, t('social.actions.share'));
    } catch (error) {
      trackFailureEvent('social_share_failed', error, {
        post_id: post.id,
      });
      logOperationalError('[Social] Failed to share post asset', error, {
        post_id: post.id,
      });
      const message =
        error instanceof SocialServiceError
          ? error.message
          : t('social.errors.share_failed');
      showAlert(t('social.errors.share_title'), message, [{ text: t('common.ok') }]);
    }
  };

  const handleSetReaction = (post: SocialPost, nextReaction: SocialReactionState) => {
    setReactionMutation.mutate({
      postId: post.id,
      reaction: nextReaction,
    });
  };

  const submitReport = async (request: {
    target_type: 'post';
    target_post_id: string;
    reason_code: SocialReportReasonCode;
  }) => {
    try {
      await reportContentMutation.mutateAsync(request);
    } catch (error) {
      const message =
        error instanceof SocialServiceError
          ? error.message
          : t('social.report.error_submit');
      showAlert(t('social.report.error_title'), message, [{ text: t('common.ok') }]);
    }
  };

  const handleReportPost = (post: SocialPost) => {
    showAlert(
      t('social.report.title'),
      t('social.report.message'),
      [
        ...quickReportReasonCodes.map((reasonCode) => ({
          text: t(`social.report.reasons.${reasonCode}`),
          onPress: () => {
            void submitReport({
              target_type: 'post',
              target_post_id: post.id,
              reason_code: reasonCode as SocialReportReasonCode,
            });
          },
        })),
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
      ],
    );
  };

  const handleRetryBackendRequest = () => {
    setImpressionError(null);
    queuedImpressionsRef.current.clear();
    sessionImpressionsRef.current.clear();
    void refetch();
  };

  return (
    <SafeAreaView style={styles.container}>
      {alertElement}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('social.feed_title')}</Text>
          <Text style={styles.subtitle}>{t('social.feed_subtitle')}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleOpenComposer}
          style={styles.composeButton}
          testID="social-compose-button"
        >
          <Plus color={colors.white} size={18} />
          <Text style={styles.composeButtonLabel}>{t('social.actions.compose')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {(['all', 'before_after', 'food', 'physique'] as const).map((category) => (
          <SocialCategoryPill
            key={category}
            category={category}
            selected={selectedCategory === category}
            onPress={() => {
              setImpressionError(null);
              setSelectedCategory(category);
            }}
          />
        ))}
      </View>

      {backendError ? (
        <View style={styles.errorCard} testID="social-error-state">
          <Text style={styles.errorTitle}>{backendErrorTitle}</Text>
          <Text style={styles.errorBody}>{backendError.message}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleRetryBackendRequest}
            style={styles.errorButton}
            testID="social-error-retry"
          >
            <Text style={styles.errorButtonLabel}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlashList<SocialPost>
        data={posts}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={({ viewableItems }) => {
          const visiblePostIds = viewableItems
            .filter((viewableItem) => viewableItem.isViewable)
            .map((viewableItem) => viewableItem.item?.id)
            .filter(
              (postId): postId is string =>
                typeof postId === 'string' && postId.length > 0,
            );

          queueImpressions(visiblePostIds);
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 60,
          minimumViewTime: 600,
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={() => {
          void refetch();
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          isFetching ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : backendError ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('social.empty.title')}</Text>
              <Text style={styles.emptyBody}>{t('social.empty.body')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <SocialPostCard
            post={item}
            currentUserId={userProfile?.id}
            commentsEnabled={featureFlags.social_comments_enabled}
            onLikePress={() =>
              handleSetReaction(
                item,
                item.viewer_reaction === 'like' ? 'neutral' : 'like',
              )
            }
            onDislikePress={() =>
              handleSetReaction(
                item,
                item.viewer_reaction === 'dislike' ? 'neutral' : 'dislike',
              )
            }
            onCommentPress={() => handleOpenComments(item.id)}
            onReportPress={() => handleReportPost(item)}
            onSharePress={item.asset_url ? () => void handleSharePost(item) : null}
          />
        )}
        testID="social-feed-list"
      />

      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleOpenComposer}
        style={styles.fab}
        testID="social-compose-fab"
      >
        <Plus color={colors.white} size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
      gap: SPACING.md,
    },
    headerText: {
      gap: SPACING.xs,
    },
    title: {
      fontSize: SIZES.xl,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    subtitle: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.gray,
    },
    composeButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      minHeight: 42,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.primary,
    },
    composeButtonLabel: {
      color: colors.white,
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.semiBold,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.page,
      paddingBottom: SPACING.sm,
    },
    listContent: {
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.sm,
      paddingBottom: bottomInset + 96,
      gap: SPACING.md,
    },
    errorCard: {
      marginHorizontal: SPACING.page,
      marginBottom: SPACING.sm,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: withAlpha(colors.error, 0.2),
      gap: SPACING.sm,
    },
    errorTitle: {
      fontSize: SIZES.text16,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    errorBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.gray,
    },
    errorButton: {
      alignSelf: 'flex-start',
      minHeight: 36,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, 0.12),
    },
    errorButtonLabel: {
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primary,
    },
    emptyState: {
      paddingVertical: SPACING.xxxl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
    },
    emptyTitle: {
      fontSize: SIZES.text18,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.gray,
      textAlign: 'center',
    },
    footerLoader: {
      paddingVertical: SPACING.lg,
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      right: SPACING.page,
      bottom: bottomInset + SPACING.xl,
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
      borderWidth: 1,
      borderColor: withAlpha(colors.white, 0.18),
    },
  });
