import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import SocialScreen from '@/screens/SocialScreen';
import { SocialServiceError } from '@/services/social';

const mockPush = jest.fn();
const mockUseSocialFeed = jest.fn();
const mockUseFeatureFlags = jest.fn();
const mockUseSocialMutations = jest.fn();
const mockRecordSocialPostImpressions = jest.fn();
const mockShareSocialPostAsset = jest.fn();
const mockTrackEvent = jest.fn();
const mockTrackFailureEvent = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: ({
    data,
    renderItem,
    ListEmptyComponent,
    onViewableItemsChanged,
  }: {
    data: unknown[];
    renderItem: (item: { item: any; index: number }) => React.ReactNode;
    ListEmptyComponent?: React.ReactNode;
    onViewableItemsChanged?: (info: { viewableItems: Array<{ item: any; isViewable: boolean }> }) => void;
  }) => {
    if (!data.length) {
      return <>{ListEmptyComponent ?? null}</>;
    }

    const ReactLocal = require('react');
    const { View: RNView } = require('react-native');

    return (
      <RNView testID="mock-flash-list">
        {onViewableItemsChanged?.({
          viewableItems: (data as any[]).map((item) => ({
            item,
            isViewable: true,
          })),
        })}
        {(data as any[]).map((item, index) => (
          <ReactLocal.Fragment key={item.id ?? index}>
            {renderItem({ item, index })}
          </ReactLocal.Fragment>
        ))}
      </RNView>
    );
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: {
      id: 'viewer-1',
    },
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertElement: null,
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
}));

jest.mock('@/hooks/queries', () => ({
  useFeatureFlags: () => mockUseFeatureFlags(),
  useSocialFeed: (...args: unknown[]) => mockUseSocialFeed(...args),
  useSocialMutations: () => mockUseSocialMutations(),
  flattenSocialFeedPages: (pages: Array<{ items: unknown[] }> | undefined) =>
    pages?.flatMap((page) => page.items) ?? [],
}));

jest.mock('@/services/social', () => {
  const actual = jest.requireActual('@/services/social');
  return {
    ...actual,
    recordSocialPostImpressions: (...args: unknown[]) =>
      mockRecordSocialPostImpressions(...args),
    shareSocialPostAsset: (...args: unknown[]) => mockShareSocialPostAsset(...args),
  };
});

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  trackFailureEvent: (...args: unknown[]) => mockTrackFailureEvent(...args),
}));

jest.mock('@/components/social/SocialCategoryPill', () => ({
  SocialCategoryPill: ({
    category,
    onPress,
  }: {
    category: string;
    onPress?: () => void;
  }) => {
    const ReactLocal = require('react');
    const { Pressable, Text } = require('react-native');
    return ReactLocal.createElement(
      Pressable,
      { onPress, testID: `social-pill-${category}` },
      ReactLocal.createElement(Text, null, category),
    );
  },
}));

jest.mock('@/components/social/SocialPostCard', () => ({
  SocialPostCard: ({
    post,
    commentsEnabled,
    onCommentPress,
    onDislikePress,
    onLikePress,
    onSharePress,
  }: {
    post: { id: string; content_text: string };
    commentsEnabled?: boolean;
    onDislikePress: () => void;
    onLikePress: () => void;
    onCommentPress: () => void;
    onSharePress?: (() => void) | null;
  }) => {
    const ReactLocal = require('react');
    const { Pressable, Text, View } = require('react-native');
    return ReactLocal.createElement(
      View,
      { testID: `social-post-${post.id}` },
      ReactLocal.createElement(Text, null, post.content_text),
      ReactLocal.createElement(
        Pressable,
        { onPress: onLikePress, testID: `like-enabled-${post.id}` },
        ReactLocal.createElement(Text, null, 'like'),
      ),
      ReactLocal.createElement(
        Pressable,
        { onPress: onDislikePress, testID: `dislike-enabled-${post.id}` },
        ReactLocal.createElement(Text, null, 'dislike'),
      ),
      onSharePress
        ? ReactLocal.createElement(
            Pressable,
            { onPress: onSharePress, testID: `share-enabled-${post.id}` },
            ReactLocal.createElement(Text, null, 'share'),
          )
        : null,
      commentsEnabled
        ? ReactLocal.createElement(
            Pressable,
            { onPress: onCommentPress, testID: `comments-enabled-${post.id}` },
            ReactLocal.createElement(Text, null, 'comments'),
          )
        : null,
    );
  },
}));

describe('SocialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: true,
      },
    });
    mockUseSocialFeed.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: 'post-1',
                author_id: 'author-1',
                author_username: 'alice',
                author_avatar_url: null,
                category: 'food',
                content_text: 'Fresh meal',
                image_url: null,
                asset_url: 'https://cdn.example.com/post-1.jpg',
                created_at: '2026-04-06T12:00:00.000Z',
                like_count: 2,
                dislike_count: 0,
                impression_count: 0,
                comment_count: 1,
                viewer_reaction: 'neutral',
                viewer_has_liked: false,
                moderation_status: 'approved',
              },
            ],
          },
        ],
      },
      error: null,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });
    mockUseSocialMutations.mockReturnValue({
      setReactionMutation: { mutate: jest.fn() },
      reportContentMutation: { mutate: jest.fn(), mutateAsync: jest.fn() },
    });
    mockRecordSocialPostImpressions.mockResolvedValue({
      success: true,
      recorded_count: 1,
    });
  });

  it('opens the composer route from the header CTA', () => {
    const screen = render(<SocialScreen />);

    fireEvent.press(screen.getByTestId('social-compose-button'));

    expect(mockPush).toHaveBeenCalledWith('/social-compose');
  });

  it('tracks the social tab view on mount', () => {
    render(<SocialScreen />);

    expect(mockTrackEvent).toHaveBeenCalledWith('social_tab_viewed');
  });

  it('switches category filters and refetches the feed with the selected category', () => {
    const screen = render(<SocialScreen />);

    expect(mockUseSocialFeed).toHaveBeenLastCalledWith('all');

    fireEvent.press(screen.getByTestId('social-pill-food'));

    expect(mockUseSocialFeed).toHaveBeenLastCalledWith('food');
  });

  it('hides comment actions when the comments flag is disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
    });

    const screen = render(<SocialScreen />);

    expect(screen.queryByTestId('comments-enabled-post-1')).toBeNull();
  });

  it('routes like and dislike taps through the explicit reaction mutation', () => {
    const mockMutate = jest.fn();
    mockUseSocialMutations.mockReturnValue({
      setReactionMutation: { mutate: mockMutate },
      reportContentMutation: { mutate: jest.fn(), mutateAsync: jest.fn() },
    });

    const screen = render(<SocialScreen />);

    fireEvent.press(screen.getByTestId('like-enabled-post-1'));
    fireEvent.press(screen.getByTestId('dislike-enabled-post-1'));

    expect(mockMutate).toHaveBeenNthCalledWith(1, {
      postId: 'post-1',
      reaction: 'like',
    });
    expect(mockMutate).toHaveBeenNthCalledWith(2, {
      postId: 'post-1',
      reaction: 'dislike',
    });
  });

  it('tracks share failures without exposing raw provider payloads', async () => {
    mockShareSocialPostAsset.mockRejectedValueOnce(
      new SocialServiceError('Internal share failure', {
        code: 'sharing_failed',
        status: 500,
      }),
    );

    const screen = render(<SocialScreen />);

    fireEvent.press(screen.getByTestId('share-enabled-post-1'));

    await waitFor(() => {
      expect(mockTrackFailureEvent).toHaveBeenCalledWith(
        'social_share_failed',
        expect.objectContaining({
          code: 'sharing_failed',
          status: 500,
        }),
        {
          post_id: 'post-1',
        },
      );
      expect(mockShowAlert).toHaveBeenCalledWith(
        'social.errors.share_title',
        'Internal share failure',
        [{ text: 'common.ok' }],
      );
    });
  });

  it('shows a backend error card when impression recording hits a missing route', async () => {
    jest.useFakeTimers();
    const mockRefetch = jest.fn();
    mockUseSocialFeed.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              {
                id: 'post-1',
                author_id: 'author-1',
                author_username: 'alice',
                author_avatar_url: null,
                category: 'food',
                content_text: 'Fresh meal',
                image_url: null,
                asset_url: 'https://cdn.example.com/post-1.jpg',
                created_at: '2026-04-06T12:00:00.000Z',
                like_count: 2,
                dislike_count: 0,
                impression_count: 0,
                comment_count: 1,
                viewer_reaction: 'neutral',
                viewer_has_liked: false,
                moderation_status: 'approved',
              },
            ],
          },
        ],
      },
      error: null,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
    });
    mockRecordSocialPostImpressions.mockRejectedValueOnce(
      new SocialServiceError(
        'Social route "social-record-impressions" is not deployed on Supabase project "test" (404).',
        {
          code: 'edge_function_route_missing',
          status: 404,
          functionName: 'social-record-impressions',
        },
      ),
    );

    const screen = render(<SocialScreen />);

    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(screen.getByTestId('social-error-state')).toBeTruthy();
    expect(
      screen.getByText(/social-record-impressions/i),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('social-error-retry'));

    expect(mockRefetch).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
