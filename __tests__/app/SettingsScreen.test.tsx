import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import SettingsScreen from '@/app/settings';

const mockUseAuth = jest.fn();
const mockUseAllScanEligibility = jest.fn();
let latestFocusEffectCallback: (() => void) | undefined;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    latestFocusEffectCallback = callback;
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Warning: 'warning',
  },
}));

jest.mock('lucide-react-native', () => ({
  Crown: 'Crown',
  ChevronRight: 'ChevronRight',
  Shield: 'Shield',
  LogOut: 'LogOut',
  Bell: 'Bell',
  ChevronLeft: 'ChevronLeft',
  AlertTriangle: 'AlertTriangle',
  Settings: 'Settings',
  Globe: 'Globe',
  Check: 'Check',
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#F2F2F7',
      cardBackground: '#FFFFFF',
      primaryText: '#1D1D1F',
      primary: '#007AFF',
      gray: '#8E8E93',
      lightGray: '#E5E5EA',
      gold: '#FFD700',
      error: '#FF3B30',
      white: '#FFFFFF',
    },
    isDark: false,
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          'settings.title': 'Settings',
          'settings.section_subscription': 'Subscription',
          'settings.section_preferences': 'Preferences',
          'settings.section_app': 'App',
          'settings.upgrade_premium': 'Upgrade Premium',
          'settings.upgrade_subtitle': 'Unlock all scans & features',
          'settings.language': 'Language',
          'settings.notifications': 'Notifications',
          'settings.notifications_preferences': 'Notification Preferences',
          'settings.privacy_policy': 'Privacy Policy',
          'settings.danger_zone_title': 'Danger zone',
          'settings.danger_zone_desc': 'Sign out safely at any time.',
          'settings.sign_out_button': 'Sign Out',
          'settings.sign_out_loading': 'Signing out...',
          'settings.footer_version': 'Version',
          'settings.cancel': 'Cancel',
          'settings.ok': 'OK',
          'home.items_available': 'Available Scans',
          'scan_types.health': 'Face',
          'scan_types.body': 'Body',
          'scan_types.nutrition': 'Nutrition',
          'scan_types.super': 'Super Scan',
          'scan_limit.loading': 'Loading',
          'scan_limit.unavailable': 'Unavailable',
          'scan_limit.auth_unready': 'Connecting',
          'scan_limit.query_error': 'Quota error',
          'scan_limit.backend_unavailable': 'Service unavailable',
          'scan_limit.missing_payload': 'Data unavailable',
          'scan_limits.premium_only': 'Premium only',
        } as Record<string, string>
      )[key] ?? key,
    locale: 'en',
    changeLanguage: jest.fn(),
    isChangingLanguage: false,
  }),
}));

jest.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({
    notificationCount: 0,
  }),
}));

jest.mock('@/hooks/queries', () => ({
  useAllScanEligibility: () => mockUseAllScanEligibility(),
}));

jest.mock('@/hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    showAlert: jest.fn(),
    alertElement: null,
  }),
}));

jest.mock('@/components/AvatarPicker', () => ({
  AvatarPicker: () => 'AvatarPicker',
}));

jest.mock('@/components/AccountBadge', () => ({
  AccountBadge: ({ tier }: { tier: string }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return <Text>{`badge:${tier}`}</Text>;
  },
}));

jest.mock('@/components/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const React = require('react');
    const { Text } = require('react-native');

    return <Text>{title}</Text>;
  },
}));

jest.mock('@/components/ModalHandle', () => ({
  ModalHandle: () => null,
}));

jest.mock('@/services/navigation', () => ({
  navigationService: {
    navigateToNotifications: jest.fn(),
  },
}));

const buildEligibilityHookResult = (overrides: Partial<Record<string, any>> = {}) => ({
  data: {},
  errors: {},
  loadingByScanType: {
    body: false,
    health: false,
    nutrition: false,
    super: false,
  },
  isLoading: false,
  isAuthReady: true,
  canQuery: true,
  refetchAll: jest.fn(),
  ...overrides,
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestFocusEffectCallback = undefined;
    mockUseAuth.mockReturnValue({
      userProfile: {
        id: 'user-1',
        username: 'AdminUser',
        email: 'admin@example.com',
        avatar_url: null,
        account_tier: 'admin',
      },
      signOut: jest.fn(),
      updateAvatarUrl: jest.fn(),
    });
    mockUseAllScanEligibility.mockReturnValue(
      buildEligibilityHookResult({
        data: {
          body: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          health: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          nutrition: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          super: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        },
      })
    );
  });

  it('renders numeric admin quotas inside the subscription card', () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId('settings-quota-summary')).toBeTruthy();
    expect(screen.getAllByText('20/20')).toHaveLength(4);
    expect(screen.queryByText('...')).toBeNull();
  });

  it('renders explicit loading text for unresolved quota rows', () => {
    mockUseAllScanEligibility.mockReturnValue(
      buildEligibilityHookResult({
        data: {
          body: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          nutrition: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          super: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        },
        loadingByScanType: {
          body: false,
          health: true,
          nutrition: false,
          super: false,
        },
      })
    );

    render(<SettingsScreen />);

    expect(screen.getByText('Loading')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
  });

  it('renders explicit unavailable text when quota data fails to resolve', () => {
    mockUseAllScanEligibility.mockReturnValue(
      buildEligibilityHookResult({
        data: {
          body: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          nutrition: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
          super: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        },
        errors: {
          health: new Error('failed'),
        },
      })
    );

    render(<SettingsScreen />);

    expect(screen.getByText('Quota error')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
  });

  it('refetches eligibility when settings gains focus', async () => {
    const refetchAll = jest.fn().mockResolvedValue([]);
    mockUseAllScanEligibility.mockReturnValue(
      buildEligibilityHookResult({
        refetchAll,
      })
    );

    render(<SettingsScreen />);

    await act(async () => {
      latestFocusEffectCallback?.();
      await Promise.resolve();
    });

    expect(refetchAll).toHaveBeenCalledTimes(1);
  });
});
