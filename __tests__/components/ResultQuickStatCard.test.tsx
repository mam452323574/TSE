import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ResultQuickStatCard } from '@/components/ResultQuickStatCard';
import { useTheme } from '@/contexts/ThemeContext';

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const useWindowDimensionsSpy = jest.spyOn(require('react-native'), 'useWindowDimensions');

describe('ResultQuickStatCard', () => {
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
        primary: '#007AFF',
        primaryText: '#1D1D1F',
        white: '#FFFFFF',
      },
      isDark: false,
    });
  });

  it('keeps text values multi-line and numeric values fitted on one line', () => {
    const { getByTestId, rerender } = render(
      <ResultQuickStatCard label="Verdict" value="Very long text value" valueVariant="text" />
    );

    expect(getByTestId('result-quick-stat-value').props.numberOfLines).toBe(3);
    expect(getByTestId('result-quick-stat-value').props.adjustsFontSizeToFit).toBeUndefined();
    expect(getByTestId('result-quick-stat-value').props.minimumFontScale).toBeUndefined();
    expect(getByTestId('result-quick-stat-value').props.textBreakStrategy).toBe('simple');

    rerender(<ResultQuickStatCard label="Calories" value="1234" valueVariant="numeric" />);

    expect(getByTestId('result-quick-stat-value').props.numberOfLines).toBe(1);
    expect(getByTestId('result-quick-stat-value').props.adjustsFontSizeToFit).toBe(true);
    expect(getByTestId('result-quick-stat-value').props.minimumFontScale).toBe(0.84);
  });

  it('reduces padding and height in compact mode without collapsing the content', () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 320,
      height: 640,
      scale: 2,
      fontScale: 1,
    });

    const { getByTestId } = render(
      <ResultQuickStatCard label="Muscle mass" value="Balanced" valueVariant="text" />
    );

    const rootStyle = StyleSheet.flatten(getByTestId('result-quick-stat-card').props.style);
    const labelStyle = StyleSheet.flatten(getByTestId('result-quick-stat-label').props.style);

    expect(rootStyle.padding).toBe(10);
    expect(rootStyle.minHeight).toBe(108);
    expect(rootStyle.borderRadius).toBe(16);
    expect(labelStyle.lineHeight).toBe(15);
  });
});
