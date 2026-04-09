import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { SocialPostCard } from '@/components/social/SocialPostCard';

jest.mock('@/hooks/useResolvedAvatarUrl', () => ({
  useResolvedAvatarUrl: (value: string | null | undefined) => value ?? null,
}));

describe('SocialPostCard', () => {
  const basePost = {
    id: 'post-1',
    author_id: 'author-1',
    author_username: 'alice',
    author_avatar_url: null,
    category: 'food' as const,
    content_text: 'Fresh meal',
    image_url: null,
    asset_url: null,
    created_at: '2026-04-06T12:00:00.000Z',
    like_count: 1,
    dislike_count: 0,
    impression_count: 0,
    comment_count: 0,
    viewer_reaction: 'neutral' as const,
    viewer_has_liked: false,
    moderation_status: 'approved' as const,
  };

  const noop = () => {};

  it('renders the shared avatar fallback when the post author has no avatar', () => {
    const screen = render(
      <SocialPostCard
        post={basePost}
        onLikePress={noop}
        onDislikePress={noop}
        onCommentPress={noop}
        onReportPress={noop}
      />,
    );

    expect(
      screen.getByTestId('social-post-identity-post-1-avatar-fallback'),
    ).toBeTruthy();
  });

  it('renders the author image when the post author has an avatar', async () => {
    const screen = render(
      <SocialPostCard
        post={{
          ...basePost,
          author_avatar_url: 'https://cdn.example.com/avatar.jpg',
        }}
        onLikePress={noop}
        onDislikePress={noop}
        onCommentPress={noop}
        onReportPress={noop}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('social-post-identity-post-1-avatar')).toBeTruthy();
    });
  });
});
