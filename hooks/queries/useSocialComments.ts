import { useQuery } from '@tanstack/react-query';

import { useFeatureFlags } from './useFeatureFlags';

import { fetchSocialComments, SocialServiceError } from '@/services/social';
import type { SocialComment } from '@/types';

export const SOCIAL_COMMENTS_QUERY_KEY = (postId: string) =>
  ['socialComments', postId] as const;

export const useSocialComments = (postId: string | null | undefined) => {
  const { data: featureFlags } = useFeatureFlags();
  const normalizedPostId = postId ?? '';

  return useQuery<SocialComment[], Error>({
    queryKey: SOCIAL_COMMENTS_QUERY_KEY(normalizedPostId),
    queryFn: () => fetchSocialComments(normalizedPostId),
    enabled: !!normalizedPostId && featureFlags.social_comments_enabled,
    initialData: [],
    staleTime: 1000 * 30,
    retry: (_failureCount, error) =>
      !(error instanceof SocialServiceError && error.code === 'post_not_found'),
  });
};
