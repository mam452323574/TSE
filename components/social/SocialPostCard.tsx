import { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Flag, Heart, MessageCircle, Share2, ThumbsDown } from 'lucide-react-native';

import { SocialCategoryPill } from './SocialCategoryPill';
import { SocialIdentityRow } from './SocialIdentityRow';
import { SocialModerationBadge } from './SocialModerationBadge';

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  BORDER_RADIUS,
  FONT_WEIGHTS,
  SHADOWS,
  SIZES,
  SPACING,
  withAlpha,
} from '@/constants/theme';
import type { SocialPost } from '@/types';

interface SocialPostCardProps {
  post: SocialPost;
  currentUserId?: string | null;
  commentsEnabled?: boolean;
  onLikePress: () => void;
  onDislikePress: () => void;
  onCommentPress: () => void;
  onReportPress: () => void;
  onSharePress?: (() => void) | null;
}

function formatRelativeTime(createdAt: string, t: (scope: string, options?: any) => string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return t('common.time_ago.just_now');
  }

  if (diffMinutes < 60) {
    return t('common.time_ago.minutes_ago', { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t('common.time_ago.hours_ago', { count: diffHours });
  }

  if (diffHours < 48) {
    return t('common.time_ago.yesterday');
  }

  return t('common.time_ago.days_ago', { count: Math.floor(diffHours / 24) });
}

export function SocialPostCard({
  post,
  currentUserId,
  commentsEnabled = true,
  onLikePress,
  onDislikePress,
  onCommentPress,
  onReportPress,
  onSharePress,
}: SocialPostCardProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOwnPost = currentUserId === post.author_id;
  const showModerationBadge = isOwnPost && post.moderation_status !== 'approved';
  const createdLabel = formatRelativeTime(post.created_at, t);

  return (
    <View style={styles.card} testID={`social-post-card-${post.id}`}>
      <View style={styles.header}>
        <SocialIdentityRow
          username={post.author_username}
          avatarUrl={post.author_avatar_url}
          meta={createdLabel}
          testID={`social-post-identity-${post.id}`}
          trailing={<SocialCategoryPill category={post.category} />}
        />
      </View>

      {showModerationBadge ? (
        <View style={styles.badgeRow}>
          <SocialModerationBadge moderationState={post.moderation_status} />
        </View>
      ) : null}

      {post.content_text ? (
        <Text style={styles.caption}>{post.content_text}</Text>
      ) : null}

      {post.image_url ? (
        <Pressable disabled={!onSharePress} onPress={onSharePress} style={styles.imageWrap}>
          <Image
            source={{ uri: post.image_url }}
            resizeMode="cover"
            style={styles.postImage}
            testID={`social-post-image-${post.id}`}
          />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onLikePress}
          style={styles.actionButton}
          testID={`social-post-like-${post.id}`}
        >
          <Heart
            color={post.viewer_reaction === 'like' ? colors.error : colors.primaryText}
            size={18}
          />
          <Text style={styles.actionLabel}>{post.like_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onDislikePress}
          style={styles.actionButton}
          testID={`social-post-dislike-${post.id}`}
        >
          <ThumbsDown
            color={
              post.viewer_reaction === 'dislike' ? colors.warning : colors.primaryText
            }
            size={18}
          />
          <Text style={styles.actionLabel}>{post.dislike_count}</Text>
        </TouchableOpacity>

        {commentsEnabled ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onCommentPress}
            style={styles.actionButton}
            testID={`social-post-comment-${post.id}`}
          >
            <MessageCircle color={colors.primaryText} size={18} />
            <Text style={styles.actionLabel}>{post.comment_count}</Text>
          </TouchableOpacity>
        ) : null}

        {onSharePress && post.asset_url ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSharePress}
            style={styles.actionButton}
            testID={`social-post-share-${post.id}`}
          >
            <Share2 color={colors.primaryText} size={18} />
            <Text style={styles.actionLabel}>{t('social.actions.share')}</Text>
          </TouchableOpacity>
        ) : null}

        {!isOwnPost ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onReportPress}
            style={styles.actionButton}
            testID={`social-post-report-${post.id}`}
          >
            <Flag color={colors.primaryText} size={18} />
            <Text style={styles.actionLabel}>{t('social.actions.report')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground,
      padding: SPACING.lg,
      gap: SPACING.md,
      ...SHADOWS.card,
    },
    header: {
      alignItems: 'stretch',
    },
    badgeRow: {
      marginTop: -4,
    },
    caption: {
      fontSize: SIZES.text16,
      lineHeight: 24,
      color: colors.primaryText,
    },
    imageWrap: {
      borderRadius: BORDER_RADIUS.lg,
      overflow: 'hidden',
    },
    postImage: {
      width: '100%',
      aspectRatio: 4 / 5,
      backgroundColor: withAlpha(colors.primaryText, 0.04),
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    actionLabel: {
      fontSize: SIZES.text14,
      fontWeight: FONT_WEIGHTS.semiBold,
      color: colors.primaryText,
    },
  });

export default SocialPostCard;
