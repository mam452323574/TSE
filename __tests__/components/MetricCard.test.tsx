import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MetricCard } from '../../components/MetricCard';
import { useTheme } from '../../contexts/ThemeContext';

jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: jest.fn(),
}));
jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Lock: () => <Text>LockIcon</Text>,
    };
});

describe('MetricCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useTheme as jest.Mock).mockReturnValue({
            colors: {
                cardBackground: '#FFFFFF',
                gray: '#808080',
                grayMedium: '#A0A0A0',
                primary: '#FF5733',
                primaryText: '#000000',
                primaryLight: '#FFCCCB',
                white: '#FFFFFF',
            },
        });
    });

    it('renders correctly with default props', () => {
        const { getByText } = render(
            <MetricCard title="Total Users" value="1,234" icon="👥" />
        );

        expect(getByText('👥')).toBeTruthy();
        expect(getByText('Total Users')).toBeTruthy();
        expect(getByText('1,234')).toBeTruthy();
    });

    it('renders locked state correctly', () => {
        const { getByText } = render(
            <MetricCard title="Premium Feature" value="Secret" icon="⭐" isLocked={true} />
        );

        expect(getByText('⭐')).toBeTruthy();
        expect(getByText('Premium Feature')).toBeTruthy();
        expect(getByText('••••••')).toBeTruthy();
        expect(getByText('PREMIUM')).toBeTruthy();
        expect(getByText('LockIcon')).toBeTruthy();
    });

    it('handles premium press when locked', () => {
        const mockOnPremiumPress = jest.fn();
        const { getByText } = render(
            <MetricCard
                title="Premium Mode"
                value="Secret"
                icon="🔒"
                isLocked={true}
                onPremiumPress={mockOnPremiumPress}
            />
        );

        fireEvent.press(getByText('Premium Mode'));
        expect(mockOnPremiumPress).toHaveBeenCalledTimes(1);
    });

    it('does not call premium press when not locked', () => {
        const mockOnPremiumPress = jest.fn();
        const { getByText } = render(
            <MetricCard
                title="Open Mode"
                value="100"
                icon="🔓"
                isLocked={false}
                onPremiumPress={mockOnPremiumPress}
            />
        );

        // Pressing should not crash and not trigger anything
        fireEvent.press(getByText('Open Mode'));
        expect(mockOnPremiumPress).not.toHaveBeenCalled();
    });
});
