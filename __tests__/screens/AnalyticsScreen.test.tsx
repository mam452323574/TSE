import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import AnalyticsScreen from '@/screens/AnalyticsScreen';

const mockLineChartProps: any[] = [];
const mockPush = jest.fn();
const mockUseAuth = jest.fn();
const mockUseAnalytics = jest.fn();
const mockUseWindowDimensions = jest.fn();

const defaultDimensions = {
  width: 390,
  height: 844,
  scale: 3,
  fontScale: 1,
};

const compactDimensions = {
  width: 320,
  height: 568,
  scale: 2,
  fontScale: 1,
};

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}));

jest.mock('react-native-chart-kit', () => {
  const ReactLocal = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    LineChart: (props: any) => {
      mockLineChartProps.push(props);
      return ReactLocal.createElement(View, { testID: 'mock-line-chart' });
    },
  };
});

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
    push: mockPush,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => 'LoadingSpinner',
}));

jest.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => `ErrorMessage: ${message}`,
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'fr-FR', textDirection: 'ltr' }],
  locale: 'fr-FR',
}));

jest.mock('@/hooks/queries', () => ({
  useAnalytics: (period: string) => mockUseAnalytics(period),
}));

const periodToDays: Record<string, number> = {
  '7days': 7,
  '30days': 30,
  '3months': 90,
  '1year': 365,
};

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const makeDateRange = (startDate: string, days: number): string[] => {
  const [year, month, day] = startDate.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day);

  return Array.from({ length: days }, (_, index) => {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + index);
    return formatDateString(nextDate);
  });
};

const makeAnalyticsData = (days: number) => {
  const dates = makeDateRange('2024-01-01', days);

  return {
    healthScoreHistory: dates.map((date, index) => ({
      date,
      value: 60 + (index % 30),
    })),
    calorieHistory: [],
    bodyCompositionHistory: [],
    bodyScoreHistory: dates.map((date, index) => ({
      date,
      bodyScore: 58 + (index % 28),
      bodyFatPercentage: 20,
    })),
    faceScoreHistory: [],
    nutritionHistory: dates.map((date, index) => ({
      date,
      caloriesEstimate: 500 + index,
      proteinGrams: 20,
      nutritionScore: 62 + (index % 25),
    })),
    superScanHistory: dates.map((date, index) => ({
      date,
      globalRiskScore: 15 + (index % 20),
    })),
  };
};

const makeQueryState = (period: string, overrides: Partial<any> = {}) => ({
  data: makeAnalyticsData(periodToDays[period] || 7),
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  isRefetching: false,
  ...overrides,
});

const getLatestLineCharts = () => mockLineChartProps.slice(-4);

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    mockUseAnalytics.mockClear();
    mockUseAuth.mockClear();
    mockPush.mockClear();
    mockLineChartProps.length = 0;
    mockUseWindowDimensions.mockReturnValue(defaultDimensions);

    mockUseAuth.mockReturnValue({
      userProfile: { account_tier: 'free' },
    });
  });

  it('renders loading state', () => {
    mockUseAnalytics.mockReturnValue(
      makeQueryState('7days', {
        data: null,
        isLoading: true,
        error: null,
      })
    );

    render(<AnalyticsScreen />);

    expect(mockUseAnalytics).toHaveBeenCalledWith('7days');
  });

  it('renders error state', () => {
    mockUseAnalytics.mockReturnValue(
      makeQueryState('7days', {
        data: null,
        isLoading: false,
        error: new Error('Failed to load analytics'),
      })
    );

    render(<AnalyticsScreen />);

    expect(screen.getAllByText('analytics.empty_state')).toHaveLength(4);
  });

  it('renders empty state when no data', () => {
    mockUseAnalytics.mockReturnValue(
      makeQueryState('7days', {
        data: {
          healthScoreHistory: [],
          calorieHistory: [],
          bodyCompositionHistory: [],
          bodyScoreHistory: [],
          faceScoreHistory: [],
          nutritionHistory: [],
          superScanHistory: [],
        },
      })
    );

    render(<AnalyticsScreen />);

    expect(screen.getAllByText('analytics.empty_state')).toHaveLength(5);
  });

  it('renders period selector buttons', () => {
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));

    render(<AnalyticsScreen />);

    expect(screen.getByText('analytics.periods.days_7')).toBeTruthy();
    expect(screen.getByText('analytics.periods.days_30')).toBeTruthy();
    expect(screen.getByText('analytics.periods.months_3')).toBeTruthy();
    expect(screen.getByText('analytics.periods.year_1')).toBeTruthy();
  });

  it('renders charts when data is available', () => {
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));

    render(<AnalyticsScreen />);

    expect(screen.getByText('analytics.health_score')).toBeTruthy();
    expect(screen.getByText('analytics.physical_evolution')).toBeTruthy();
    expect(screen.getByText('analytics.nutrition_score')).toBeTruthy();
    expect(screen.getByText('analytics.super_scan_score')).toBeTruthy();
    expect(screen.getAllByTestId('mock-line-chart')).toHaveLength(4);
  });

  it('changes period when free period button is pressed', () => {
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));

    render(<AnalyticsScreen />);

    fireEvent.press(screen.getByText('analytics.periods.days_30'));

    expect(mockUseAnalytics).toHaveBeenCalledWith('30days');
  });

  it('uses non-dense X label layout on 7days', () => {
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));

    render(<AnalyticsScreen />);

    const latestCharts = getLatestLineCharts();
    expect(latestCharts).toHaveLength(4);

    latestCharts.forEach((chartProps) => {
      expect(chartProps.verticalLabelRotation).toBe(0);
      expect(chartProps.xLabelsOffset).toBe(0);
      const flattenedStyle = StyleSheet.flatten(chartProps.style);
      expect(flattenedStyle.paddingBottom).toBeUndefined();
    });
  });

  it('renders full French month labels on 3months and keeps gaps between month changes', () => {
    mockUseAuth.mockReturnValue({
      userProfile: { account_tier: 'premium' },
    });
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));
    mockUseWindowDimensions.mockReturnValue(defaultDimensions);

    render(<AnalyticsScreen />);

    fireEvent.press(screen.getByText('analytics.periods.months_3'));

    const latestCharts = getLatestLineCharts();
    expect(latestCharts).toHaveLength(4);

    latestCharts.forEach((chartProps) => {
      const labels = chartProps.data.labels;
      const visibleLabels = labels.filter(Boolean);
      const flattenedStyle = StyleSheet.flatten(chartProps.style);

      expect(visibleLabels).toEqual(['Janvier', 'Février', 'Mars']);
      expect(labels.indexOf('Février') - labels.indexOf('Janvier')).toBeGreaterThan(1);
      expect(chartProps.verticalLabelRotation).toBe(45);
      expect(chartProps.xLabelsOffset).toBe(-6);
      expect(flattenedStyle.paddingBottom).toBeGreaterThan(34);
      expect(flattenedStyle.paddingBottom).not.toBe(30);
    });
  });

  it('uses a compact dense layout on 1year and hides every other month on small screens', () => {
    mockUseAuth.mockReturnValue({
      userProfile: { account_tier: 'premium' },
    });
    mockUseAnalytics.mockImplementation((period: string) => makeQueryState(period));
    mockUseWindowDimensions.mockReturnValue(compactDimensions);

    render(<AnalyticsScreen />);

    fireEvent.press(screen.getByText('analytics.periods.year_1'));

    const latestCharts = getLatestLineCharts();
    expect(latestCharts).toHaveLength(4);

    latestCharts.forEach((chartProps) => {
      const visibleLabels = chartProps.data.labels.filter(Boolean);
      const flattenedStyle = StyleSheet.flatten(chartProps.style);

      expect(visibleLabels).toEqual([
        'Janvier',
        'Mars',
        'Mai',
        'Juillet',
        'Septembre',
        'Novembre',
      ]);
      expect(chartProps.verticalLabelRotation).toBe(60);
      expect(chartProps.xLabelsOffset).toBe(-10);
      expect(flattenedStyle.paddingBottom).toBeGreaterThan(40);
      expect(flattenedStyle.paddingBottom).not.toBe(34);
    });
  });
});
