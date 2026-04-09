import React from 'react';
import { render } from '@testing-library/react-native';

const mockUseFeatureFlags = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'redirect-target', href });
  },
}));

jest.mock('@/hooks/queries', () => ({
  useFeatureFlags: () => mockUseFeatureFlags(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      primary: '#007AFF',
    },
  }),
}));

jest.mock('@/screens/CoachScreen', () => () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'coach-screen' });
});

jest.mock('@/screens/EntryOfferScreen', () => () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'entry-offer-screen' });
});

jest.mock('@/screens/SocialComposerScreen', () => () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'social-composer-screen' });
});

jest.mock('@/screens/SocialCommentsScreen', () => () => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, { testID: 'social-comments-screen' });
});

import CoachRoute from '@/app/coach';
import EntryOfferRoute from '@/app/entry-offer';
import SocialComposeRoute from '@/app/social-compose';
import SocialCommentsRoute from '@/app/social-comments';

describe('feature-flagged routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders coach even when the coach flag is disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<CoachRoute />);

    expect(screen.getByTestId('coach-screen')).toBeTruthy();
  });

  it('renders coach when the flag is enabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: true,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<CoachRoute />);

    expect(screen.getByTestId('coach-screen')).toBeTruthy();
  });

  it('redirects entry-offer back to tabs when the flag is disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<EntryOfferRoute />);

    expect(screen.getByTestId('redirect-target').props.href).toBe('/(tabs)');
  });

  it('renders entry-offer when the flag is enabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: true,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<EntryOfferRoute />);

    expect(screen.getByTestId('entry-offer-screen')).toBeTruthy();
  });

  it('renders social compose even when social is disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<SocialComposeRoute />);

    expect(screen.getByTestId('social-composer-screen')).toBeTruthy();
  });

  it('renders social compose when social is enabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<SocialComposeRoute />);

    expect(screen.getByTestId('social-composer-screen')).toBeTruthy();
  });

  it('redirects social comments to /social when comments are disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: true,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
      },
      isFetching: false,
    });

    const screen = render(<SocialCommentsRoute />);

    expect(screen.getByTestId('redirect-target').props.href).toBe('/(tabs)/social');
  });

  it('renders social comments when comments are enabled even if social is disabled', () => {
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: true,
      },
      isFetching: false,
    });

    const screen = render(<SocialCommentsRoute />);

    expect(screen.getByTestId('social-comments-screen')).toBeTruthy();
  });
});
