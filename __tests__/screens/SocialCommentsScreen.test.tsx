import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SocialCommentsScreen from '@/screens/SocialCommentsScreen';
import { SocialServiceError } from '@/services/social';

const mockBack = jest.fn();
const mockParams = jest.fn();
const mockUseSocialComments = jest.fn();
const mockUseSocialMutations = jest.fn();
const mockShowAlert = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams(),
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: ({
    data,
    renderItem,
    ListEmptyComponent,
  }: {
    data: unknown[];
    renderItem: (item: { item: any; index: number }) => React.ReactNode;
    ListEmptyComponent?: React.ReactNode;
  }) => {
    if (!data.length) {
      return <>{ListEmptyComponent ?? null}</>;
    }

    const ReactLocal = require('react');
    const { View: RNView } = require('react-native');

    return (
      <RNView testID="mock-comments-list">
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

jest.mock('@/hooks/queries', () => ({
  useSocialComments: (...args: unknown[]) => mockUseSocialComments(...args),
  useSocialMutations: () => mockUseSocialMutations(),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertElement: null,
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
}));

describe('SocialCommentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({
      postId: 'post-1',
    });
    mockUseSocialComments.mockReturnValue({
      data: [
        {
          id: 'comment-1',
          post_id: 'post-1',
          author_id: 'author-2',
          author_username: 'bob',
          author_avatar_url: null,
          content_text: 'Nice progress',
          created_at: '2026-04-06T12:00:00.000Z',
          moderation_status: 'approved',
        },
      ],
      error: null,
      isFetching: false,
      refetch: jest.fn(),
    });
    mockUseSocialMutations.mockReturnValue({
      createCommentMutation: {
        isPending: false,
        mutateAsync: jest.fn(),
      },
      reportContentMutation: {
        mutateAsync: jest.fn().mockResolvedValue({ success: true }),
      },
    });
  });

  it('shows the unavailable state when the parent post is no longer visible', () => {
    mockUseSocialComments.mockReturnValue({
      data: [],
      error: new SocialServiceError('Social post not found', {
        code: 'post_not_found',
      }),
      isFetching: false,
      refetch: jest.fn(),
    });

    const screen = render(<SocialCommentsScreen />);

    expect(screen.getByText('social.comments.missing_title')).toBeTruthy();
    expect(screen.getByText('social.comments.missing_body')).toBeTruthy();
  });

  it('shows a backend error state when comment loading fails for another reason', () => {
    mockUseSocialComments.mockReturnValue({
      data: [],
      error: new SocialServiceError(
        'Social comments query "get_social_comments_for_post" is unavailable on Supabase project "test".',
        {
          code: 'social_comments_query_unavailable',
          status: 503,
        },
      ),
      isFetching: false,
      refetch: jest.fn(),
    });

    const screen = render(<SocialCommentsScreen />);

    expect(screen.getByTestId('social-comments-error-state')).toBeTruthy();
    expect(
      screen.getByText(/get_social_comments_for_post/i),
    ).toBeTruthy();
  });

  it('opens a comment report flow and submits the selected reason', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });
    mockUseSocialMutations.mockReturnValue({
      createCommentMutation: {
        isPending: false,
        mutateAsync: jest.fn(),
      },
      reportContentMutation: {
        mutateAsync: mockMutateAsync,
      },
    });

    const screen = render(<SocialCommentsScreen />);

    fireEvent.press(screen.getByTestId('social-comment-report-comment-1'));

    const buttons = mockShowAlert.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const harassmentButton = buttons.find(
      (button) => button.text === 'social.report.reasons.harassment',
    );

    harassmentButton?.onPress?.();

    expect(mockMutateAsync).toHaveBeenCalledWith({
      target_type: 'comment',
      target_comment_id: 'comment-1',
      reason_code: 'harassment',
    });
  });

  it('renders the shared avatar fallback when a comment has no avatar', () => {
    const screen = render(<SocialCommentsScreen />);

    expect(
      screen.getByTestId('social-comment-identity-comment-1-avatar-fallback'),
    ).toBeTruthy();
  });
});
