import React from 'react';
import { render } from '@testing-library/react-native';
import { RadialScoreGauge } from '../../components/RadialScoreGauge';
import { useTheme } from '../../contexts/ThemeContext';

jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: jest.fn(),
}));
jest.mock('react-native-svg', () => ({
    __esModule: true,
    default: 'Svg',
    Circle: 'Circle',
}));

describe('RadialScoreGauge', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useTheme as jest.Mock).mockReturnValue({
            colors: {
                cardBackground: '#FFFFFF',
                gray: '#808080',
                lightGray: '#D3D3D3',
            },
        });
    });

    it('renders correctly with given props', () => {
        const { getByText } = render(
            <RadialScoreGauge score={75} maxScore={100} label="Performance" color="#4CAF50" />
        );

        expect(getByText('Performance')).toBeTruthy();
        expect(getByText('75')).toBeTruthy();
        expect(getByText('/100')).toBeTruthy();
    });

    it('renders with low score', () => {
        const { getByText } = render(
            <RadialScoreGauge score={10} maxScore={50} label="Low Score" color="#F44336" />
        );

        expect(getByText('Low Score')).toBeTruthy();
        expect(getByText('10')).toBeTruthy();
        expect(getByText('/50')).toBeTruthy();
    });

    it('handles score greater than maxScore gracefully', () => {
        const { getByText } = render(
            <RadialScoreGauge score={120} maxScore={100} label="Over Score" color="#2196F3" />
        );

        expect(getByText('Over Score')).toBeTruthy();
        expect(getByText('120')).toBeTruthy();
        expect(getByText('/100')).toBeTruthy();
    });
});
