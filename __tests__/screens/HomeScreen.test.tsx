import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '@/screens/HomeScreen';

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
  Sun: 'Sun',
  Moon: 'Moon',
  Heart: 'Heart',
  Check: 'Check',
  X: 'X',
  AlertCircle: 'AlertCircle',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useFocusEffect: (callback: any) => callback(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { username: 'TestUser', account_tier: 'free' },
  }),
}));

jest.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({
    checkForAchievements: jest.fn().mockResolvedValue(undefined),
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
      gold: '#FFD700',
      white: '#FFFFFF',
    },
    isDark: false,
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', textDirection: 'ltr' }],
  locale: 'en-US',
}));

const mockUseDashboard = jest.fn();
const mockUseAllScanEligibility = jest.fn();

jest.mock('@/hooks/queries', () => ({
  useDashboard: () => mockUseDashboard(),
  useAllScanEligibility: () => mockUseAllScanEligibility(),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => 'LoadingSpinner',
}));

jest.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => `ErrorMessage: ${message}`,
}));

jest.mock('@/components/CircularProgress', () => ({
  CircularProgress: () => 'CircularProgress',
}));

jest.mock('@/components/DailyStat', () => ({
  DailyStat: () => 'DailyStat',
}));

jest.mock('@/components/SuperScanIndicator', () => ({
  SuperScanIndicator: () => 'SuperScanIndicator',
}));

jest.mock('@/components/ProductCard', () => ({
  ProductCard: () => 'ProductCard',
}));

jest.mock('@/components/ScanLimitIndicator', () => ({
  ScanLimitIndicator: () => 'ScanLimitIndicator',
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
      data: {
        healthScore: 75,
        calories: { current: 1500, goal: 2000 },
        bodyfat: 20,
        recommendedProducts: [],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });
    mockUseAllScanEligibility.mockReturnValue({
      data: {
        body: { canScan: true, remainingScans: 3 },
        health: { canScan: true, remainingScans: 3 },
        nutrition: { canScan: true, remainingScans: 3 },
      },
      isLoading: false,
      refetchAll: jest.fn(),
    });

    render(<HomeScreen />);

    expect(screen.getByText('All Scan')).toBeTruthy();
    expect(screen.getByText('TestUser')).toBeTruthy();
  });

  it('displays username from profile', () => {
    mockUseDashboard.mockReturnValue({
      data: {
        healthScore: 75,
        calories: { current: 1500, goal: 2000 },
        bodyfat: 20,
        recommendedProducts: [],
      },
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
});
