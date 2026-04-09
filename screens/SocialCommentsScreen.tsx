import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Flag, Send } from 'lucide-react-native';

import { SocialIdentityRow } from '@/components/social/SocialIdentityRow';
import { SOCIAL_REPORT_REASON_CODES } from '@/constants/social';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';
import { useSocialComments, useSocialMutations } from '@/hooks/queries';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { SocialServiceError, validateSocialCommentInput } from '@/services/social';
import type { SocialComment, SocialReportReasonCode } from '@/types';

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SocialCommentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = getSingleParam(params.postId) ?? '';
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { alertElement, showAlert } = useCustomAlert();
  const [draft, setDraft] = useState('');
  const {
    data: comments,
    error: commentsError,
    isFetching,
    refetch,
  } = useSocialComments(postId);
  const { createCommentMutation, reportContentMutation } = useSocialMutations();
  const threadUnavailable =
    !postId ||
    (commentsError instanceof SocialServiceError &&
      commentsError.code === 'post_not_found');
  const backendError =
    commentsError instanceof Error && !threadUnavailable ? commentsError : null;

  const handleSubmit = async () => {
    try {
      const normalizedComment = validateSocialCommentInput(draft);
      await createCommentMutation.mutateAsync({
        postId,
        contentText: normalizedComment,
      });
      setDraft('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('social.comments.error_submit');
      showAlert(t('social.comments.error_title'), message, [{ text: t('common.ok') }]);
    }
  };

  const handleReportComment = (comment: SocialComment) => {
    showAlert(
      t('social.comments.report_title'),
      t('social.comments.report_message'),
      [
        ...SOCIAL_REPORT_REASON_CODES.filter((reasonCode) => reasonCode !== 'other').map(
          (reasonCode) => ({
            text: t(`social.report.reasons.${reasonCode}`),
            onPress: () => {
              void reportContentMutation
                .mutateAsync({
                  target_type: 'comment',
                  target_comment_id: comment.id,
                  reason_code: reasonCode as SocialReportReasonCode,
                })
                .catch((error) => {
                  const message =
                    error instanceof SocialServiceError
                      ? error.message
                      : t('social.comments.report_error');
                  showAlert(t('social.report.error_title'), message, [
                    { text: t('common.ok') },
                  ]);
                });
            },
          }),
        ),
        {
          text: t('common.cancel'),
          style: 'cancel' as const,
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {alertElement}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
            testID="social-comments-back-button"
          >
            <ChevronLeft color={colors.primaryText} size={20} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('social.comments.title')}</Text>
            <Text style={styles.subtitle}>{t('social.comments.subtitle')}</Text>
          </View>
        </View>

        {threadUnavailable ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('social.comments.missing_title')}</Text>
            <Text style={styles.emptyBody}>{t('social.comments.missing_body')}</Text>
          </View>
        ) : backendError ? (
          <View style={styles.emptyState} testID="social-comments-error-state">
            <Text style={styles.emptyTitle}>{t('social.comments.error_title')}</Text>
            <Text style={styles.emptyBody}>{backendError.message}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                void refetch();
              }}
              style={styles.retryButton}
              testID="social-comments-retry"
            >
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={isFetching}
            onRefresh={() => {
              void refetch();
            }}
            ListEmptyComponent={
              isFetching ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>{t('social.comments.empty_title')}</Text>
                  <Text style={styles.emptyBody}>{t('social.comments.empty_body')}</Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View style={styles.commentCard}>
                <SocialIdentityRow
                  username={item.author_username}
                  avatarUrl={item.author_avatar_url}
                  avatarSize={38}
                  meta={
                    item.moderation_status !== 'approved' &&
                    item.author_id === userProfile?.id
                      ? t(`social.moderation.${item.moderation_status}`)
                      : null
                  }
                  testID={`social-comment-identity-${item.id}`}
                />
                <Text style={styles.commentBody}>{item.content_text}</Text>
                {item.author_id !== userProfile?.id ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => handleReportComment(item)}
                    style={styles.commentAction}
                    testID={`social-comment-report-${item.id}`}
                  >
                    <Flag color={colors.primaryText} size={16} />
                    <Text style={styles.commentActionLabel}>
                      {t('social.actions.report')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            testID="social-comments-list"
          />
        )}

        <View style={styles.composer}>
          <TextInput
            multiline
            value={draft}
            onChangeText={setDraft}
            placeholder={t('social.comments.placeholder')}
            placeholderTextColor={colors.gray}
            style={styles.input}
            testID="social-comments-input"
          />
          <TouchableOpacity
            accessibilityRole="button"
            disabled={
              !draft.trim() ||
              createCommentMutation.isPending ||
              !postId ||
              threadUnavailable ||
              !!backendError
            }
            onPress={() => {
              void handleSubmit();
            }}
            style={[
              styles.sendButton,
              (!draft.trim() ||
                createCommentMutation.isPending ||
                !postId ||
                threadUnavailable ||
                !!backendError) &&
                styles.sendButtonDisabled,
            ]}
            testID="social-comments-submit"
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Send color={colors.white} size={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: SIZES.text18,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    subtitle: {
      fontSize: SIZES.text14,
      color: colors.gray,
    },
    listContent: {
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.lg,
      gap: SPACING.md,
    },
    commentCard: {
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.cardBackground,
      gap: SPACING.sm,
    },
    commentBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.primaryText,
    },
    commentAction: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: SPACING.xs,
    },
    commentActionLabel: {
      fontSize: SIZES.text12,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xxxl,
      gap: SPACING.sm,
    },
    emptyTitle: {
      fontSize: SIZES.text16,
      fontWeight: FONT_WEIGHTS.bold,
      color: colors.primaryText,
    },
    emptyBody: {
      fontSize: SIZES.text14,
      lineHeight: 22,
      color: colors.gray,
      textAlign: 'center',
    },
    retryButton: {
      minHeight: 40,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, 0.12),
    },
    retryButtonLabel: {
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primary,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.page,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: withAlpha(colors.primaryText, 0.08),
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.cardBackground,
      color: colors.primaryText,
      fontSize: SIZES.text14,
      textAlignVertical: 'top',
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
