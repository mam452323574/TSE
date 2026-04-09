import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { SOCIAL_COMMENTS_QUERY_KEY } from './useSocialComments';
import { SOCIAL_FEED_QUERY_KEY } from './useSocialFeed';

import { useAuth } from '@/contexts/AuthContext';
import {
  applyOptimisticReactionToSocialPost,
  applyServerReactionStateToSocialPost,
  createSocialComment,
  createSocialPost,
  reportSocialContent,
  setReactionOnSocialPost,
  updateSocialPostLikeState,
} from '@/services/social';
import { trackEvent, trackFailureEvent } from '@/services/analytics';
import type {
  ShareStoryPayload,
  SocialCategory,
  SocialComment,
  SocialFeedPage,
  SocialReactionState,
  SocialReportContentRequest,
  SocialSetReactionResponse,
} from '@/types';

interface CreateSocialPostDraft {
  category: SocialCategory;
  contentText?: string | null;
  scanId?: string | null;
  sharePayload?: ShareStoryPayload | null;
  assetSourceUri?: string | null;
}

interface CreateSocialCommentDraft {
  postId: string;
  contentText: string;
}

interface SetSocialReactionDraft {
  postId: string;
  reaction: SocialReactionState;
}

type SocialFeedInfiniteData = InfiniteData<SocialFeedPage, string | null>;

function applyServerReactionState(
  pages: SocialFeedPage[] | undefined,
  response: SocialSetReactionResponse,
) {
  return updateSocialPostLikeState(pages, response.post_id, (post) => ({
    ...applyServerReactionStateToSocialPost(post, response),
  }));
}

export const useSocialMutations = () => {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const setReactionMutation = useMutation({
    mutationFn: ({ postId, reaction }: SetSocialReactionDraft) =>
      setReactionOnSocialPost(postId, reaction),
    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: ['socialFeed'] });

      const previousSnapshots = queryClient.getQueriesData<SocialFeedInfiniteData>({
        queryKey: ['socialFeed'],
      });

      for (const [queryKey, snapshot] of previousSnapshots) {
        if (!snapshot) {
          continue;
        }

        queryClient.setQueryData<SocialFeedInfiniteData>(queryKey, {
          ...snapshot,
          pages: updateSocialPostLikeState(
            snapshot.pages,
            postId,
            (post) => applyOptimisticReactionToSocialPost(post, reaction),
          ) ?? snapshot.pages,
        });
      }

      return {
        previousSnapshots,
      };
    },
    onError: (_error, _draft, context) => {
      for (const [queryKey, snapshot] of context?.previousSnapshots ?? []) {
        queryClient.setQueryData(queryKey, snapshot);
      }
    },
    onSuccess: (response) => {
      const snapshots = queryClient.getQueriesData<SocialFeedInfiniteData>({
        queryKey: ['socialFeed'],
      });

      for (const [queryKey, snapshot] of snapshots) {
        if (!snapshot) {
          continue;
        }

        queryClient.setQueryData<SocialFeedInfiniteData>(queryKey, {
          ...snapshot,
          pages:
            applyServerReactionState(snapshot.pages, response) ?? snapshot.pages,
        });
      }
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (draft: CreateSocialPostDraft) => {
      if (!userProfile?.id) {
        throw new Error('Authentication required');
      }

      return createSocialPost({
        viewerProfile: {
          id: userProfile.id,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url,
        },
        ...draft,
      });
    },
    onSuccess: async (post) => {
      trackEvent(
        post.moderation_state === 'rejected'
          ? 'social_post_rejected'
          : 'social_post_published',
        {
          category: post.category,
          moderation_state:
            post.moderation_state ?? post.moderation_status ?? 'pending',
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    },
    onError: (error, draft) => {
      if (!draft.assetSourceUri) {
        return;
      }

      trackFailureEvent('social_upload_failed', error, {
        category: draft.category,
        has_scan_id: !!draft.scanId,
        has_share_payload: !!draft.sharePayload,
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (draft: CreateSocialCommentDraft) => {
      if (!userProfile?.id) {
        throw new Error('Authentication required');
      }

      return createSocialComment({
        viewerProfile: {
          id: userProfile.id,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url,
        },
        postId: draft.postId,
        contentText: draft.contentText,
      });
    },
    onSuccess: async (comment: SocialComment) => {
      trackEvent(
        comment.moderation_state === 'rejected'
          ? 'social_comment_rejected'
          : 'social_comment_created',
        {
          moderation_state:
            comment.moderation_state ?? comment.moderation_status ?? 'pending',
        },
      );
      await queryClient.invalidateQueries({
        queryKey: SOCIAL_COMMENTS_QUERY_KEY(comment.post_id),
      });
      await queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    },
  });

  const reportContentMutation = useMutation({
    mutationFn: (request: SocialReportContentRequest) =>
      reportSocialContent(request),
    onError: (error, request) => {
      trackFailureEvent('moderation_report_submission_failed', error, {
        target_type: request.target_type,
        reason_code: request.reason_code,
      });
    },
    onSuccess: (_response, request) => {
      trackEvent('social_report_submitted', {
        target_type: request.target_type,
        reason_code: request.reason_code,
      });
      void queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      if (request.target_post_id) {
        void queryClient.invalidateQueries({
          queryKey: SOCIAL_COMMENTS_QUERY_KEY(request.target_post_id),
        });
      }
    },
  });

  return {
    createPostMutation,
    createCommentMutation,
    setReactionMutation,
    reportContentMutation,
  };
};

export type UseSocialMutationsResult = ReturnType<typeof useSocialMutations>;
