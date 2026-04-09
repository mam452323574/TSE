import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import { getGamificationAssetSource } from '@/constants/gamificationAssets';

const mockPush = jest.fn();
const mockUseAuth = jest.fn();

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('lucide-react-native', () => ({
  Sparkles: 'Sparkles',
  Crown: 'Crown',
  ChevronRight: 'ChevronRight',
  Sun: 'Sun',
  Moon: 'Moon',
  Heart: 'Heart',
  Check: 'Check',
  X: 'X',
  AlertCircle: 'AlertCircle',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useFocusEffect: (callback: any) => callback(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({
    checkForAchievements: jest.fn().mockResolvedValue(undefined),
    scheduleScanReadyNotification: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      cardBackground: '#F2F2F7',
      primaryText: '#000000',
      text: '#000000',
      error: '#FF3B30',
      success: '#34C759',
      gray: '#8E8E93',
      lightGray: '#D1D1D6',
      warning: '#FF9500',
      gold: '#FFD700',
      white: '#FFFFFF',
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, options: Record<string, string | number> = {}) => {
      switch (key) {
        case 'scan_limit.auth_unready':
          return 'Connecting';
        case 'scan_limit.loading':
          return 'Loading';
        case 'scan_limit.query_error':
          return 'Quota error';
        case 'scan_limit.backend_unavailable':
          return 'Service unavailable';
        case 'scan_limit.missing_payload':
          return 'Data unavailable';
        case 'scan_limit.unavailable':
          return 'Unavailable';
        case 'home.fox_evolution.eyebrow':
          return 'Fox evolution';
        case 'home.fox_evolution.scan_total':
          return `${options.count} scans`;
        case 'home.fox_evolution.stage_label':
          return `Stage ${options.stage}`;
        case 'home.fox_evolution.stage_range':
          return `${options.start} -> ${options.end} scans`;
        case 'home.fox_evolution.stage_range_max':
          return `${options.start}+ scans`;
        case 'home.fox_evolution.stage_progress':
          return `${options.current} / ${options.total}`;
        case 'home.fox_evolution.scans_remaining':
          return `${options.count} scans before the next evolution`;
        case 'home.fox_evolution.max_stage':
          return 'Final evolution reached';
        default:
          return key;
      }
    },
  }),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', textDirection: 'ltr' }],
  locale: 'en-US',
}));

const mockUseDashboard = jest.fn();
const mockUseAllScanEligibility = jest.fn();
const mockUseFeatureFlags = jest.fn();
const mockUseGrowthExperience = jest.fn();
const mockUseGamification = jest.fn();
const getStyles = (style: any) => (Array.isArray(style) ? style : [style]);
const originalPlatform = Platform.OS;
const reactNativeModule = jest.requireActual<typeof import('react-native')>('react-native');
const useWindowDimensionsSpy = jest.spyOn(reactNativeModule, 'useWindowDimensions');
const mockGamification = {
  scanCount: 12,
  mascotStage: 4,
  mascotFilename: 'stade_4.png',
  mascotImageUrl: 'https://example.com/gamification/stade_4.png',
};
const buildDashboardData = (gamification = mockGamification) => ({
  healthScore: 75,
  calories: { current: 1500, goal: 2000 },
  bodyfat: 20,
  recommendedProducts: [],
  gamification,
});
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

jest.mock('@/hooks/queries', () => ({
  useDashboard: () => mockUseDashboard(),
  useAllScanEligibility: () => mockUseAllScanEligibility(),
  useFeatureFlags: () => mockUseFeatureFlags(),
  useGrowthExperience: () => mockUseGrowthExperience(),
}));

jest.mock('@/contexts/GamificationContext', () => ({
  useGamification: () => mockUseGamification(),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => 'LoadingSpinner',
}));

jest.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => `ErrorMessage: ${message}`,
}));

jest.mock('@/components/DailyStat', () => ({
  DailyStat: () => 'DailyStat',
}));

jest.mock('@/components/SuperScanIndicator', () => ({
  SuperScanIndicator: ({ isPremium, eligibility }: any) => {
    const React = require('react');
    const { Text } = require('react-native');

    if (!isPremium) {
      return <Text>super:locked</Text>;
    }

    const limit = eligibility?.limit ?? 1;
    const remaining = eligibility?.remaining ?? Math.max(0, limit - (eligibility?.current_count ?? 0));

    return <Text>{`super:${remaining}/${limit}`}</Text>;
  },
}));

jest.mock('@/components/ProductCard', () => ({
  ProductCard: () => 'ProductCard',
}));

jest.mock('@/components/ScanLimitIndicator', () => ({
  ScanLimitIndicator: ({ eligibility }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    const limit = eligibility?.limit ?? 0;
    const remaining = eligibility?.remaining ?? Math.max(0, limit - (eligibility?.current_count ?? 0));

    return <Text>{`quota:${remaining}/${limit}`}</Text>;
  },
}));

jest.mock('@/components/FadeInView', () => ({
  FadeInView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/SettingsCog', () => ({
  SettingsCog: () => 'SettingsCog',
}));

jest.mock('@/components/NotificationBell', () => ({
  NotificationBell: () => 'NotificationBell',
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    useWindowDimensionsSpy.mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });
    mockUseGamification.mockReturnValue({
      scanCount: 0,
      setScanCount: jest.fn(),
      incrementScanCount: jest.fn(),
      resetInMemoryStateOnUserChange: jest.fn(),
      isHydrated: true,
    });
    mockUseAuth.mockReturnValue({
      userProfile: {
        id: 'user-1',
        username: 'TestUser',
        account_tier: 'free',
        has_seen_tutorial: false,
      },
    });
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: false,
        social_comments_enabled: false,
        entry_offer_offering_id: 'entry-offer',
        rollout_percentage: 100,
      },
    });
    mockUseGrowthExperience.mockReturnValue({
      data: {
        user_id: 'user-1',
        growth_state: 'entry_offer_ready',
        entry_offer_eligible: true,
        entry_offer_shown_at: null,
        entry_offer_dismissed_at: null,
        entry_offer_claimed_at: null,
        entry_offer_offering_id: 'entry-offer',
        coach_seen_at: null,
        coach_cooldown_until: null,
        growth_state_updated_at: '2026-04-06T08:00:00.000Z',
        updated_at: '2026-04-06T08:00:00.000Z',
      },
    });
  });

  it('renders loading state', () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: true,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);
    // Loading spinner should be shown
  });

  it('renders error state', () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load dashboard'),
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);
    // Error message should be displayed
  });

  it('renders dashboard when data is available', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue(buildEligibilityHookResult({
      data: {
        body: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        health: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        nutrition: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        super: { allowed: false, remaining: 0, limit: 0, current_count: 0, message: 'locked' },
      },
    }));

    render(<HomeScreen />);

    expect(screen.getByText('home.items_available')).toBeTruthy();
    expect(screen.getByText('TestUser')).toBeTruthy();
    expect(screen.getByTestId('fox-evolution-hero')).toBeTruthy();
    expect(screen.getAllByText('quota:3/3')).toHaveLength(3);
    expect(screen.getByText('super:locked')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
    expect(screen.queryByText('home.hero_title')).toBeNull();
    expect(screen.queryByText('CircularProgress')).toBeNull();
  });

  it('renders explicit loading text instead of dots while a scan quota is resolving', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue(buildEligibilityHookResult({
      data: {
        body: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        nutrition: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        super: { allowed: false, remaining: 0, limit: 0, current_count: 0, message: 'locked' },
      },
      loadingByScanType: {
        body: false,
        health: true,
        nutrition: false,
        super: false,
      },
    }));

    render(<HomeScreen />);

    expect(screen.getByText('Loading')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
  });

  it('renders explicit unavailable text instead of dots when a scan quota fails', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue(buildEligibilityHookResult({
      data: {
        body: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        health: { allowed: true, remaining: 3, limit: 3, current_count: 0, message: 'OK' },
        super: { allowed: false, remaining: 0, limit: 0, current_count: 0, message: 'locked' },
      },
      errors: {
        nutrition: new Error('failed'),
      },
    }));

    render(<HomeScreen />);

    expect(screen.getByText('Quota error')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
  });

  it('renders admin quotas numerically on the home screen', () => {
    mockUseAuth.mockReturnValue({
      userProfile: {
        id: 'user-1',
        username: 'AdminUser',
        account_tier: 'admin',
        has_seen_tutorial: false,
      },
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue(buildEligibilityHookResult({
      data: {
        body: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        health: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        nutrition: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
        super: { allowed: true, remaining: 20, limit: 20, current_count: 0, message: 'OK' },
      },
    }));

    render(<HomeScreen />);

    expect(screen.getByText('AdminUser')).toBeTruthy();
    expect(screen.getAllByText('quota:20/20')).toHaveLength(3);
    expect(screen.getByText('super:20/20')).toBeTruthy();
    expect(screen.queryByText('...')).toBeNull();
  });

  it('displays username from profile', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText('TestUser')).toBeTruthy();
  });

  it('uses responsive Android light card shells on narrow layouts', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    useWindowDimensionsSpy.mockReturnValue({
      width: 320,
      height: 640,
      scale: 2,
      fontScale: 1,
    });

    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: {
        body: { allowed: true, remaining: 3, limit: 3, current_count: 0 },
        health: { allowed: true, remaining: 3, limit: 3, current_count: 0 },
        nutrition: { allowed: true, remaining: 3, limit: 3, current_count: 0 },
        super: { allowed: false, remaining: 0, message: 'locked' },
      },
      isLoading: false,
      refetchAll: jest.fn(),
    });

    const { getAllByTestId, getByTestId } = render(<HomeScreen />);

    const cardShellStyles = getStyles(getAllByTestId('scan-limit-card-shell')[0].props.style);
    expect(cardShellStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 140,
          elevation: 2,
        }),
      ])
    );

    const bannerShellStyles = getStyles(getByTestId('home-premium-banner-shell').props.style);
    const bannerSurfaceStyles = getStyles(getByTestId('home-premium-banner-surface').props.style);

    expect(bannerShellStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          elevation: 4,
        }),
      ])
    );
    expect(bannerSurfaceStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          overflow: 'hidden',
          borderWidth: 1,
        }),
      ])
    );
  });

  it('renders the stage 0 fox evolution hero with empty stage progress', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 0,
        mascotStage: 0,
        mascotFilename: 'image_vide.png',
        mascotImageUrl: 'https://example.com/gamification/image_vide.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByTestId('fox-evolution-hero')).toBeTruthy();
    expect(screen.getByText('0 scans')).toBeTruthy();
    expect(screen.getByText('Stage 0')).toBeTruthy();
    expect(screen.getByText('1 scans before the next evolution')).toBeTruthy();
    expect(screen.getByText('0 -> 1 scans')).toBeTruthy();
    expect(screen.getByText('0 / 1')).toBeTruthy();
    expect(screen.getByTestId('fox-evolution-progress-fill').props.style).toEqual(
      expect.arrayContaining([{ width: '0%' }])
    );
    expect(screen.getByTestId('fox-evolution-mascot-image').props.source).toBe(
      getGamificationAssetSource('stade_0.png')
    );
  });

  it('uses the higher local scan count when backend gamification lags behind', () => {
    mockUseGamification.mockReturnValue({
      scanCount: 30,
      setScanCount: jest.fn(),
      incrementScanCount: jest.fn(),
      resetInMemoryStateOnUserChange: jest.fn(),
      isHydrated: true,
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 0,
        mascotStage: 0,
        mascotFilename: 'image_vide.png',
        mascotImageUrl: 'https://example.com/gamification/image_vide.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByTestId('fox-evolution-hero')).toBeTruthy();
    expect(screen.getByText('30 scans')).toBeTruthy();
    expect(screen.getByText('Stage 6')).toBeTruthy();
    expect(screen.getByTestId('fox-evolution-mascot-image').props.source).toBe(
      getGamificationAssetSource('stade_6.png')
    );
  });

  it('uses scan count as the hero source of truth when backend mascot metadata drifts', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 103,
        mascotStage: 4,
        mascotFilename: 'stade_4.png',
        mascotImageUrl: 'https://example.com/gamification/stade_4.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText('103 scans')).toBeTruthy();
    expect(screen.getByText('Stage 8')).toBeTruthy();
    expect(screen.getByText('47 scans before the next evolution')).toBeTruthy();
    expect(screen.getByText('100 -> 150 scans')).toBeTruthy();
    expect(screen.getByText('3 / 50')).toBeTruthy();
    expect(screen.getByTestId('fox-evolution-progress-fill').props.style).toEqual(
      expect.arrayContaining([{ width: '6%' }])
    );
    expect(screen.getByTestId('fox-evolution-mascot-image').props.source).toBe(
      getGamificationAssetSource('stade_8.png')
    );
  });

  it('renders a full bar and final message at the last stage', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 240,
        mascotStage: 10,
        mascotFilename: 'stade_10.png',
        mascotImageUrl: 'https://example.com/gamification/stade_10.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText('240 scans')).toBeTruthy();
    expect(screen.getByText('Stage 10')).toBeTruthy();
    expect(screen.getByText('Final evolution reached')).toBeTruthy();
    expect(screen.getByText('200+ scans')).toBeTruthy();
    expect(screen.queryByTestId('fox-evolution-stage-progress')).toBeNull();
    expect(screen.getByTestId('fox-evolution-progress-fill').props.style).toEqual(
      expect.arrayContaining([{ width: '100%' }])
    );
    expect(screen.getByTestId('fox-evolution-mascot-image').props.source).toBe(
      getGamificationAssetSource('stade_10.png')
    );
  });

  it('uses the updated compact hero mascot sizes on narrow mobile widths', () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 360,
      height: 780,
      scale: 3,
      fontScale: 1,
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 30,
        mascotStage: 6,
        mascotFilename: 'stade_6.png',
        mascotImageUrl: 'https://example.com/gamification/stade_6.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    const mascotShellStyles = getStyles(
      screen.getByTestId('fox-evolution-mascot-shell').props.style
    );
    const mascotImageStyles = getStyles(
      screen.getByTestId('fox-evolution-mascot-image').props.style
    );

    expect(mascotShellStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 248,
          height: 248,
        }),
      ])
    );
    expect(mascotImageStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 224,
          height: 224,
        }),
      ])
    );
  });

  it('uses the updated hero mascot sizes on standard phone widths and preserves contain fitting', () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 30,
        mascotStage: 6,
        mascotFilename: 'stade_6.png',
        mascotImageUrl: 'https://example.com/gamification/stade_6.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    const mascotShellStyles = getStyles(
      screen.getByTestId('fox-evolution-mascot-shell').props.style
    );
    const mascotImage = screen.getByTestId('fox-evolution-mascot-image');
    const mascotImageStyles = getStyles(mascotImage.props.style);

    expect(mascotShellStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 280,
          height: 280,
        }),
      ])
    );
    expect(mascotImageStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 256,
          height: 256,
        }),
      ])
    );
    expect(mascotImage.props.contentFit).toBe('contain');
  });

  it('uses the updated hero mascot sizes on tablet widths', () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 768,
      height: 1024,
      scale: 2,
      fontScale: 1,
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData({
        scanCount: 30,
        mascotStage: 6,
        mascotFilename: 'stade_6.png',
        mascotImageUrl: 'https://example.com/gamification/stade_6.png',
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    const mascotShellStyles = getStyles(
      screen.getByTestId('fox-evolution-mascot-shell').props.style
    );
    const mascotImageStyles = getStyles(
      screen.getByTestId('fox-evolution-mascot-image').props.style
    );

    expect(mascotShellStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 320,
          height: 320,
        }),
      ])
    );
    expect(mascotImageStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 296,
          height: 296,
        }),
      ])
    );
  });

  it('shows and opens the coach card for authenticated free users even when core flags are false', () => {
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    const coachCard = screen.getByTestId('home-coach-card');

    expect(coachCard).toBeTruthy();

    fireEvent.press(coachCard);

    expect(mockPush).toHaveBeenCalledWith('/coach');
  });

  it('shows the coach card for authenticated premium users even when core flags are false', () => {
    mockUseAuth.mockReturnValue({
      userProfile: {
        id: 'user-1',
        username: 'TestUser',
        account_tier: 'premium',
        has_seen_tutorial: false,
      },
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByTestId('home-coach-card')).toBeTruthy();
  });

  it('auto-opens the entry offer once for eligible onboarded users', async () => {
    mockUseAuth.mockReturnValue({
      userProfile: {
        id: 'user-1',
        username: 'TestUser',
        account_tier: 'free',
        has_seen_tutorial: true,
      },
    });
    mockUseFeatureFlags.mockReturnValue({
      data: {
        social_enabled: false,
        coach_enabled: false,
        entry_offer_enabled: true,
        social_comments_enabled: false,
        entry_offer_offering_id: 'entry-offer',
        rollout_percentage: 100,
      },
    });
    mockUseDashboard.mockReturnValue({
      data: buildDashboardData(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: null,
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/entry-offer');
    });
  });
});
