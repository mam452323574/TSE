import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AnalyticsScreen from '@/screens/AnalyticsScreen';

// Mock dependencies
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
}));

jest.mock('lucide-react-native', () => ({
  Crown: 'Crown',
  Activity: 'Activity',
  Smile: 'Smile',
  Utensils: 'Utensils',
  Sparkles: 'Sparkles',
  Heart: 'Heart',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { account_tier: 'free' },
  }),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => 'LoadingSpinner',
}));

jest.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => `ErrorMessage: ${message}`,
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', textDirection: 'ltr' }],
  locale: 'en-US',
}));

const mockUseAnalytics = jest.fn();
jest.mock('@/hooks/queries', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    mockUseAnalytics.mockClear();
  });

  it('renders loading state', () => {
    mockUseAnalytics.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<AnalyticsScreen />);

    // Should show loading spinner
  });

  it('renders error state', () => {
    mockUseAnalytics.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load analytics'),
    });

    render(<AnalyticsScreen />);

    // Error message should be displayed
  });

  it('renders empty state when no data', () => {
    mockUseAnalytics.mockReturnValue({
      data: { healthScoreHistory: [] },
      isLoading: false,
      error: null,
    });

    render(<AnalyticsScreen />);

    // Should show 5 empty states (one global + one for each chart)
    expect(screen.getAllByText('analytics.empty_state')).toHaveLength(5);
  });

  it('renders period selector buttons', () => {
    mockUseAnalytics.mockReturnValue({
      data: {
        healthScoreHistory: [{ date: '2024-01-01', value: 75 }],
        calorieHistory: [{ date: '2024-01-01', consumed: 1800 }],
        bodyCompositionHistory: [{ date: '2024-01-01', bodyfat: 20, muscle: 40 }],
        superScanHistory: [],
      },
      isLoading: false,
      error: null,
    });

    render(<AnalyticsScreen />);

    expect(screen.getByText('analytics.periods.days_7')).toBeTruthy();
    expect(screen.getByText('analytics.periods.days_30')).toBeTruthy();
    expect(screen.getByText('analytics.periods.months_3')).toBeTruthy();
    expect(screen.getByText('analytics.periods.year_1')).toBeTruthy();
  });

  it('renders charts when data is available', () => {
    mockUseAnalytics.mockReturnValue({
      data: {
        healthScoreHistory: [{ date: '2024-01-01', value: 75 }],
        calorieHistory: [],
        bodyCompositionHistory: [],
        bodyScoreHistory: [{ date: '2024-01-01', bodyScore: 70, bodyFatPercentage: 20 }],
        faceScoreHistory: [],
        nutritionHistory: [{ date: '2024-01-01', caloriesEstimate: 500, proteinGrams: 20, nutritionScore: 8 }],
        superScanHistory: [{ date: '2024-01-01', globalRiskScore: 15 }],
      },
      isLoading: false,
      error: null,
    });

    render(<AnalyticsScreen />);

    expect(screen.getByText('analytics.health_score')).toBeTruthy();
    expect(screen.getByText('analytics.physical_evolution')).toBeTruthy();
    expect(screen.getByText('analytics.nutrition_score')).toBeTruthy();
    expect(screen.getByText('analytics.super_scan_score')).toBeTruthy();
  });

  it('changes period when free period button is pressed', () => {
    mockUseAnalytics.mockReturnValue({
      data: {
        healthScoreHistory: [{ date: '2024-01-01', value: 75 }],
        calorieHistory: [{ date: '2024-01-01', consumed: 1800 }],
        bodyCompositionHistory: [{ date: '2024-01-01', bodyfat: 20, muscle: 40 }],
      },
      isLoading: false,
      error: null,
    });

    render(<AnalyticsScreen />);

    fireEvent.press(screen.getByText('analytics.periods.days_7'));
    fireEvent.press(screen.getByText('analytics.periods.days_30'));
  });
});

