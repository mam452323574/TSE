import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { MetricCard } from '../../components/MetricCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    Lock: () => <Text>LockIcon</Text>,
  };
});

const useWindowDimensionsSpy = jest.spyOn(
  require('react-native'),
  'useWindowDimensions',
);

function MockMetricIcon({ size }: { size?: number }) {
  return <Text testID="metric-card-custom-icon">{`size:${size ?? 'none'}`}</Text>;
}

describe('MetricCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowDimensionsSpy.mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    (useTheme as jest.Mock).mockReturnValue({
      colors: {
        cardBackground: '#FFFFFF',
        gray: '#808080',
        grayLight: '#F2F2F7',
        grayMedium: '#A0A0A0',
        primary: '#FF5733',
        primaryText: '#000000',
        primaryLight: '#FFCCCB',
        white: '#FFFFFF',
      },
      isDark: false,
    });

    (useLanguage as jest.Mock).mockReturnValue({
      t: (key: string) =>
        ({
          'metric_card.premium_label': 'PREMIUM',
          'metric_card.loading_label': 'Loading',
        })[key] ?? key,
    });
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <MetricCard
        title="Total Users"
        value="1,234"
        icon="icon"
        valueVariant="numeric"
      />,
    );

    expect(getByText('icon')).toBeTruthy();
    expect(getByText('Total Users')).toBeTruthy();
    expect(getByText('1,234')).toBeTruthy();
  });

  it('applies denser default proportions above the compact breakpoint', () => {
    const { getByTestId } = render(
      <MetricCard
        title="Hydration"
        value="88/100"
        icon={<MockMetricIcon />}
        valueVariant="fraction"
      />,
    );

    const rootStyle = StyleSheet.flatten(
      getByTestId('metric-card-root').props.style,
    );
    const iconWrapStyle = StyleSheet.flatten(
      getByTestId('metric-card-icon-wrap').props.style,
    );
    const titleStyle = StyleSheet.flatten(
      getByTestId('metric-card-title').props.style,
    );
    const valueStyle = StyleSheet.flatten(
      getByTestId('metric-card-value').props.style,
    );

    expect(rootStyle.paddingHorizontal).toBe(12);
    expect(rootStyle.paddingVertical).toBe(10);
    expect(rootStyle.minHeight).toBe(88);
    expect(rootStyle.gap).toBe(10);
    expect(iconWrapStyle.width).toBe(44);
    expect(iconWrapStyle.height).toBe(44);
    expect(titleStyle.fontSize).toBe(13);
    expect(titleStyle.lineHeight).toBe(16);
    expect(titleStyle.fontWeight).toBe('500');
    expect(valueStyle.fontSize).toBe(16);
    expect(valueStyle.lineHeight).toBe(20);
    expect(valueStyle.fontWeight).toBe('700');
    expect(getByTestId('metric-card-custom-icon')).toHaveTextContent('size:21');
  });

  it('renders locked state without exposing the premium value', () => {
    const { UNSAFE_getByProps, getByText, queryByText } = render(
      <MetricCard title="Premium Feature" value="Secret" icon="star" isLocked />,
    );

    expect(getByText('star')).toBeTruthy();
    expect(getByText('Premium Feature')).toBeTruthy();
    expect(UNSAFE_getByProps({ testID: 'metric-card-blur-overlay' })).toBeTruthy();
    expect(getByText('PREMIUM')).toBeTruthy();
    expect(getByText('LockIcon')).toBeTruthy();
    expect(queryByText('Secret')).toBeNull();
  });

  it('handles premium press when locked', () => {
    const mockOnPremiumPress = jest.fn();
    const { getByLabelText } = render(
      <MetricCard
        title="Premium Mode"
        value="Secret"
        icon="lock"
        isLocked
        onPremiumPress={mockOnPremiumPress}
      />,
    );

    fireEvent.press(getByLabelText('Premium Mode. PREMIUM'));
    expect(mockOnPremiumPress).toHaveBeenCalledTimes(1);
  });

  it('renders a neutral loading state without exposing the premium value', () => {
    const { getByTestId, queryByText } = render(
      <MetricCard
        title="Premium Feature"
        value="Secret"
        icon="star"
        premiumRenderState="loading"
      />,
    );

    expect(getByTestId('metric-card-loading-overlay')).toBeTruthy();
    expect(getByTestId('metric-card-loading-tag')).toBeTruthy();
    expect(queryByText('Secret')).toBeNull();
  });

  it('keeps long text metrics multi-line without a premium press handler', () => {
    const mockOnPremiumPress = jest.fn();
    const { getByTestId, getByText } = render(
      <MetricCard
        title="Quality"
        value="Ultra processed but still readable"
        icon="leaf"
        onPremiumPress={mockOnPremiumPress}
        valueVariant="text"
        valueMaxLines={3}
      />,
    );

    const value = getByText('Ultra processed but still readable');
    const valueStyle = StyleSheet.flatten(
      getByTestId('metric-card-value').props.style,
    );

    fireEvent.press(getByText('Quality'));
    expect(mockOnPremiumPress).not.toHaveBeenCalled();
    expect(value.props.numberOfLines).toBe(3);
    expect(value.props.adjustsFontSizeToFit).toBeUndefined();
    expect(value.props.minimumFontScale).toBeUndefined();
    expect(value.props.textBreakStrategy).toBe('simple');
    expect(value.props.android_hyphenationFrequency).toBe('none');
    expect(valueStyle.fontWeight).toBe('600');
  });

  it('switches to compact spacing and typography under 360px', () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 320,
      height: 640,
      scale: 2,
      fontScale: 1,
    });

    const { getByTestId } = render(
      <MetricCard
        title="Glycemic index"
        value="Very high value"
        icon={<MockMetricIcon />}
      />,
    );

    const rootStyle = StyleSheet.flatten(
      getByTestId('metric-card-root').props.style,
    );
    const iconWrapStyle = StyleSheet.flatten(
      getByTestId('metric-card-icon-wrap').props.style,
    );
    const titleStyle = StyleSheet.flatten(
      getByTestId('metric-card-title').props.style,
    );
    const valueStyle = StyleSheet.flatten(
      getByTestId('metric-card-value').props.style,
    );

    expect(rootStyle.paddingHorizontal).toBe(10);
    expect(rootStyle.paddingVertical).toBe(8);
    expect(rootStyle.minHeight).toBe(82);
    expect(rootStyle.alignItems).toBe('flex-start');
    expect(rootStyle.gap).toBe(8);
    expect(iconWrapStyle.width).toBe(42);
    expect(iconWrapStyle.height).toBe(42);
    expect(titleStyle.fontSize).toBe(13);
    expect(titleStyle.lineHeight).toBe(16);
    expect(valueStyle.fontSize).toBe(15);
    expect(valueStyle.lineHeight).toBe(19);
    expect(valueStyle.fontWeight).toBe('600');
    expect(getByTestId('metric-card-custom-icon')).toHaveTextContent('size:20');
  });
});
