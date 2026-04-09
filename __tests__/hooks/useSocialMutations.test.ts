import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useSocialMutations } from '@/hooks/queries/useSocialMutations';
import type { SocialFeedPage } from '@/types';

const mockCreateSocialPost = jest.fn();
const mockReportSocialContent = jest.fn();
const mockSetReactionOnSocialPost = jest.fn();
const mockTrackFailureEvent = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: {
      id: 'viewer-1',
      username: 'viewer',
      avatar_url: null,
    },
  }),
}));

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  trackFailureEvent: (...args: unknown[]) => mockTrackFailureEvent(...args),
}));

jest.mock('@/services/social', () => {
  const actual = jest.requireActual('@/services/social');
  return {
    ...actual,
    createSocialComment: jest.fn(),
    createSocialPost: (...args: unknown[]) => mockCreateSocialPost(...args),
    reportSocialContent: (...args: unknown[]) => mockReportSocialContent(...args),
    setReactionOnSocialPost: (...args: unknown[]) =>
      mockSetReactionOnSocialPost(...args),
  };
});

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function getInitialFeedPage(): SocialFeedPage {
  return {
    items: [
      {
        id: 'post-1',
        author_id: 'author-1',
        author_username: 'alice',
        author_avatar_url: null,
        category: 'food',
        content_text: 'Breakfast',
        image_url: null,
        created_at: '2026-04-06T08:00:00.000Z',
        like_count: 3,
        dislike_count: 1,
        impression_count: 2,
        comment_count: 1,
        viewer_reaction: 'neutral',
        viewer_has_liked: false,
        moderation_status: 'approved',
      },
    ],
    next_cursor: null,
  };
}

describe('useSocialMutations', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rolls back optimistic reactions when the mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { retry: false, gcTime: Infinity },
      },
    });

    queryClient.setQueryData(['socialFeed', 'all'], {
      pageParams: [null],
      pages: [getInitialFeedPage()],
    });

    let rejectMutation: ((reason?: unknown) => void) | null = null;
    mockSetReactionOnSocialPost.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectMutation = reject;
        }),
    );

    const { result, unmount } = renderHook(() => useSocialMutations(), {
      wrapper: createWrapper(queryClient),
    });

    let mutationPromise: Promise<unknown> | null = null;
    act(() => {
      mutationPromise = result.current.setReactionMutation
        .mutateAsync({
          postId: 'post-1',
          reaction: 'dislike',
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData<{
          pages: SocialFeedPage[];
        }>(['socialFeed', 'all'])?.pages[0].items[0],
      ).toEqual(
        expect.objectContaining({
          viewer_reaction: 'dislike',
          like_count: 3,
          dislike_count: 2,
        }),
      );
    });

    await act(async () => {
      rejectMutation?.(new Error('Network failed'));
      await mutationPromise;
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData<{
          pages: SocialFeedPage[];
        }>(['socialFeed', 'all'])?.pages[0].items[0],
      ).toEqual(
        expect.objectContaining({
          viewer_reaction: 'neutral',
          viewer_has_liked: false,
          like_count: 3,
          dislike_count: 1,
        }),
      );
    });

    unmount();
    queryClient.clear();
  });

  it('tracks social upload failures with safe metadata', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { retry: false, gcTime: Infinity },
      },
    });

    mockCreateSocialPost.mockRejectedValueOnce({
      code: 'upload_failed',
      status: 502,
    });

    const { result } = renderHook(() => useSocialMutations(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(
        result.current.createPostMutation.mutateAsync({
          category: 'food',
          contentText: 'Fresh meal',
          assetSourceUri: 'file:///story.jpg',
        }),
      ).rejects.toMatchObject({
        code: 'upload_failed',
      });
    });

    expect(mockTrackFailureEvent).toHaveBeenCalledWith(
      'social_upload_failed',
      expect.objectContaining({
        code: 'upload_failed',
        status: 502,
      }),
      expect.objectContaining({
        category: 'food',
        has_scan_id: false,
        has_share_payload: false,
      }),
    );
  });

  it('tracks moderation report submission failures', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { retry: false, gcTime: Infinity },
      },
    });

    mockReportSocialContent.mockRejectedValueOnce({
      code: 'report_failed',
      status: 503,
    });

    const { result } = renderHook(() => useSocialMutations(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(
        result.current.reportContentMutation.mutateAsync({
          target_type: 'post',
          target_post_id: 'post-1',
          reason_code: 'harassment',
        } as any),
      ).rejects.toMatchObject({
        code: 'report_failed',
      });
    });

    expect(mockTrackFailureEvent).toHaveBeenCalledWith(
      'moderation_report_submission_failed',
      expect.objectContaining({
        code: 'report_failed',
        status: 503,
      }),
      expect.objectContaining({
        target_type: 'post',
        reason_code: 'harassment',
      }),
    );
  });
});
