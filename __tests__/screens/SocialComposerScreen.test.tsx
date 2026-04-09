import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import SocialComposerScreen from '@/screens/SocialComposerScreen';
import { SPACING } from '@/constants/theme';
import { SocialServiceError } from '@/services/social';

const mockBack = jest.fn();
const mockParams = jest.fn();
const mockMutateAsync = jest.fn();
const mockShowAlert = jest.fn();
const mockTrackEvent = jest.fn();
const mockGetSocialComposerDraft = jest.fn();
const mockRemoveSocialComposerDraft = jest.fn();
const mockImagePicker = jest.requireMock('expo-image-picker') as {
  launchImageLibraryAsync: jest.Mock;
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams(),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'social.composer.caption_count') {
        return `${options?.count ?? 0} / ${options?.max ?? 0} characters`;
      }

      return key;
    },
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: {
      id: 'viewer-1',
      username: 'alice',
      avatar_url: null,
    },
  }),
}));

jest.mock('@/hooks/queries', () => ({
  useSocialMutations: () => ({
    createPostMutation: {
      isPending: false,
      mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    },
  }),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertElement: null,
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
}));

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

jest.mock('@/services/socialDraftStore', () => ({
  getSocialComposerDraft: (...args: unknown[]) => mockGetSocialComposerDraft(...args),
  removeSocialComposerDraft: (...args: unknown[]) => mockRemoveSocialComposerDraft(...args),
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
      { onPress, testID: `composer-category-${category}` },
      ReactLocal.createElement(Text, null, category),
    );
  },
}));

jest.mock('@/components/share/ShareStoryCard', () => ({
  ShareStoryCard: ({
    onHeroImageLoadEnd,
  }: {
    onHeroImageLoadEnd?: () => void;
  }) => {
    const ReactLocal = require('react');
    const { Pressable } = require('react-native');

    return ReactLocal.createElement(Pressable, {
      onPress: onHeroImageLoadEnd,
      testID: 'mock-share-story-card',
    });
  },
}));

jest.mock('@/components/social/SocialIdentityRow', () => ({
  SocialIdentityRow: ({ username, meta }: { username?: string; meta?: string }) => {
    const ReactLocal = require('react');
    const { View, Text } = require('react-native');
    return ReactLocal.createElement(
      View,
      { testID: 'mock-social-identity-row' },
      ReactLocal.createElement(Text, null, username),
      meta ? ReactLocal.createElement(Text, null, meta) : null,
    );
  },
}));

describe('SocialComposerScreen', () => {
  const mockedCaptureRef = captureRef as jest.Mock;
  const renderScreen = async () => {
    const screen = render(<SocialComposerScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    return screen;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockedCaptureRef.mockResolvedValue('file:///tmp/share-social.png');
    mockGetSocialComposerDraft.mockResolvedValue({
      version: 1,
      id: 'draft-1',
      source: 'share_story',
      scanId: 'scan-55',
      category: 'food',
      caption: '',
      asset: {
        kind: 'share_story',
        payload: {
          variant: 'nutrition',
          variantLabel: 'Nutrition',
          score: 82,
          scoreLabel: 'Plate score',
          heroImageUri: 'file:///meal.jpg',
          metrics: [],
          accentColor: '#FF9500',
          footerBrand: 'HEALTH SCAN',
          footerCta: 'Track your progress',
        },
      },
      createdAt: '2026-04-07T10:00:00.000Z',
      updatedAt: '2026-04-07T10:00:00.000Z',
    });
    mockParams.mockReturnValue({
      draftId: 'draft-1',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captures the generated share card and publishes a prefilled social post', async () => {
    const screen = await renderScreen();

    expect(mockGetSocialComposerDraft).toHaveBeenCalledWith('draft-1');
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'social_post_started',
      expect.objectContaining({
        source: 'share_story',
        has_scan_id: true,
      }),
    );

    fireEvent.press(screen.getByTestId('mock-share-story-card'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    await waitFor(() => {
      expect(mockedCaptureRef).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          format: 'png',
          width: 1080,
          height: 1920,
        }),
      );
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      category: 'food',
      contentText: '',
      scanId: 'scan-55',
      sharePayload: expect.objectContaining({
        variant: 'nutrition',
        heroImageUri: 'file:///meal.jpg',
      }),
      assetSourceUri: 'file:///tmp/share-social.png',
    });

    await waitFor(() => {
      expect(mockRemoveSocialComposerDraft).toHaveBeenCalledWith('draft-1');
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('lets the user switch category before publishing', async () => {
    const screen = await renderScreen();

    expect(mockGetSocialComposerDraft).toHaveBeenCalledWith('draft-1');

    fireEvent.press(screen.getByTestId('mock-share-story-card'));
    fireEvent.press(screen.getByTestId('composer-category-before_after'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'before_after',
        }),
      );
    });
  });

  it('falls back to the legacy route payload when the stored draft is missing', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      draftId: 'missing-draft',
      sharePayload: JSON.stringify({
        variant: 'nutrition',
        variantLabel: 'Nutrition',
        score: 82,
        scoreLabel: 'Plate score',
        heroImageUri: 'file:///meal.jpg',
        metrics: [],
        accentColor: '#FF9500',
        footerBrand: 'HEALTH SCAN',
        footerCta: 'Track your progress',
      }),
      scanId: 'scan-legacy',
      defaultCategory: 'food',
    });

    const screen = await renderScreen();

    expect(mockGetSocialComposerDraft).toHaveBeenCalledWith('missing-draft');
    expect(mockShowAlert).toHaveBeenCalledWith(
      'social.composer.error_title',
      'social.composer.draft_missing',
      [{ text: 'common.ok' }],
    );

    fireEvent.press(screen.getByTestId('mock-share-story-card'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          scanId: 'scan-legacy',
          category: 'food',
          sharePayload: expect.objectContaining({
            variant: 'nutrition',
          }),
        }),
      );
    });
  });

  it('prevents duplicate post submissions from repeated taps', async () => {
    let resolvePublish: (() => void) | null = null;
    mockMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePublish = () => resolve({});
        }),
    );

    const screen = await renderScreen();

    fireEvent.press(screen.getByTestId('mock-share-story-card'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePublish?.();
      await Promise.resolve();
    });
  });

  it('shows a large preview after choosing a photo from the library and keeps caption editing available', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///selected-social-photo.jpg' }],
    });

    const screen = await renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-library-button'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('social-compose-image-preview')).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId('social-compose-caption-input'),
      'Quick update',
    );

    expect(screen.getByDisplayValue('Quick update')).toBeTruthy();
    expect(screen.getByTestId('social-compose-asset-card')).toBeTruthy();
  });

  it('re-subscribes keyboard handling when the caption gains focus', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    let keyboardDidShowListener: (() => void) | null = null;
    const addListenerSpy = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((eventName, listener) => {
        if (eventName === 'keyboardDidShow') {
          keyboardDidShowListener = listener as () => void;
        }

        return {
          remove: jest.fn(),
        } as any;
      });

    const screen = await renderScreen();

    expect(addListenerSpy).toHaveBeenCalledWith(
      'keyboardDidShow',
      expect.any(Function),
    );
    const initialListenerCallCount = addListenerSpy.mock.calls.length;

    await act(async () => {
      fireEvent(screen.getByTestId('social-compose-caption-input'), 'focus');
      await Promise.resolve();
    });

    expect(addListenerSpy.mock.calls.length).toBeGreaterThan(initialListenerCallCount);
    expect(keyboardDidShowListener).toEqual(expect.any(Function));

    act(() => {
      keyboardDidShowListener?.();
    });

    expect(screen.getByTestId('social-compose-caption-input')).toBeTruthy();
  });

  it('applies the measured header height to the keyboard shell offset', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    const screen = await renderScreen();
    const keyboardShell = screen.UNSAFE_getByType(KeyboardAvoidingView);

    expect(keyboardShell.props.keyboardVerticalOffset).toBe(0);

    fireEvent(screen.getByTestId('social-compose-header'), 'layout', {
      nativeEvent: {
        layout: {
          height: 76,
          width: 320,
          x: 0,
          y: 0,
        },
      },
    });

    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.keyboardVerticalOffset).toBe(
      Platform.OS === 'ios' ? 76 : 0,
    );
  });

  it('uses a stronger footer-aware caption scroll target on focus', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    const scrollToKeyboardSpy = jest.spyOn(
      ScrollView.prototype as any,
      'scrollResponderScrollNativeHandleToKeyboard',
    );
    jest.spyOn(require('react-native'), 'findNodeHandle').mockReturnValue(42);

    const screen = await renderScreen();

    fireEvent(screen.getByTestId('social-compose-footer'), 'layout', {
      nativeEvent: {
        layout: {
          height: 132,
          width: 320,
          x: 0,
          y: 0,
        },
      },
    });

    await act(async () => {
      fireEvent(screen.getByTestId('social-compose-caption-input'), 'focus');
      await Promise.resolve();
    });

    expect(scrollToKeyboardSpy).toHaveBeenCalledWith(
      42,
      132 + (Platform.OS === 'ios' ? SPACING.xxxl : SPACING.lg),
      true,
    );
  });

  it('uses manual keyboard scroll props and footer-aware bottom spacing', async () => {
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    const screen = await renderScreen();
    const scrollView = screen.getByTestId('social-compose-scroll-view');

    expect(scrollView.props.automaticallyAdjustKeyboardInsets).toBe(false);
    expect(scrollView.props.keyboardDismissMode).toBe(
      Platform.OS === 'ios' ? 'interactive' : undefined,
    );
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');

    fireEvent(screen.getByTestId('social-compose-footer'), 'layout', {
      nativeEvent: {
        layout: {
          height: 132,
          width: 320,
          x: 0,
          y: 0,
        },
      },
    });

    const updatedScrollView = screen.getByTestId('social-compose-scroll-view');
    const contentContainerStyle = StyleSheet.flatten(
      updatedScrollView.props.contentContainerStyle,
    );

    expect(contentContainerStyle.paddingBottom).toBe(132 + SPACING.lg);

    await act(async () => {
      fireEvent(screen.getByTestId('social-compose-caption-input'), 'focus');
      await Promise.resolve();
    });

    const focusedScrollView = screen.getByTestId('social-compose-scroll-view');
    const focusedContentContainerStyle = StyleSheet.flatten(
      focusedScrollView.props.contentContainerStyle,
    );

    expect(focusedContentContainerStyle.paddingBottom).toBe(
      132 + SPACING.lg + (Platform.OS === 'ios' ? SPACING.xxxl : 0),
    );
  });

  it('maps upload resolution failures to the generic publish alert copy', async () => {
    mockMutateAsync.mockRejectedValueOnce(
      new SocialServiceError('The reserved social upload does not exist', {
        code: 'reserved_upload_not_found',
        status: 404,
        requestId: 'req-social-1',
      }),
    );
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    const screen = await renderScreen();

    fireEvent.changeText(
      screen.getByTestId('social-compose-caption-input'),
      'Fresh update',
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'social.composer.error_title',
        'social.composer.error_submit',
        [{ text: 'common.ok' }],
      );
    });
  });

  it('surfaces a precise publish-route error when the backend function is missing', async () => {
    mockMutateAsync.mockRejectedValueOnce(
      new SocialServiceError(
        'Social route "social-create-post" is not deployed on Supabase project "test" (404).',
        {
          code: 'edge_function_route_missing',
          status: 404,
          functionName: 'social-create-post',
        },
      ),
    );
    mockGetSocialComposerDraft.mockResolvedValueOnce(null);
    mockParams.mockReturnValue({
      defaultCategory: 'food',
    });

    const screen = await renderScreen();

    fireEvent.changeText(
      screen.getByTestId('social-compose-caption-input'),
      'Fresh update',
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId('social-compose-submit'));
    });

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'social.composer.error_title',
        expect.stringContaining('social-create-post'),
        [{ text: 'common.ok' }],
      );
    });
  });
});
