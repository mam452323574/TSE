import { useInfiniteQuery } from '@tanstack/react-query';

import type { SocialCategoryFilter, SocialPost } from '@/types';
import {
  DEFAULT_SOCIAL_FEED_PAGE,
  fetchSocialFeed,
} from '@/services/social';

export const SOCIAL_FEED_QUERY_KEY = (
  category: SocialCategoryFilter = 'all',
) => ['socialFeed', category] as const;

export function flattenSocialFeedPages(
  pages: Array<{ items: SocialPost[] }> | undefined,
) {
  if (!pages) {
    return [];
  }

  const seenIds = new Set<string>();
  const items: SocialPost[] = [];

  for (const page of pages) {
    for (const item of page.items) {
      if (seenIds.has(item.id)) {
        continue;
      }

      seenIds.add(item.id);
      items.push(item);
    }
  }

  return items;
}

export const useSocialFeed = (category: SocialCategoryFilter = 'all') => {
  return useInfiniteQuery({
    queryKey: SOCIAL_FEED_QUERY_KEY(category),
    queryFn: ({ pageParam }) => fetchSocialFeed(category, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 1000 * 30,
    initialData: {
      pageParams: [null],
      pages: [DEFAULT_SOCIAL_FEED_PAGE],
    },
  });
};
