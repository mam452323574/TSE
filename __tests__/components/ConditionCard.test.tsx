import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConditionCard } from '@/components/ConditionCard';

// Mock dependencies
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

jest.mock('@/contexts/ThemeContext', () => ({
    useTheme: () => ({
        colors: {
            primaryText: '#000',
            gray: '#ccc',
            bg: '#fff',
            border: '#000',
            text: '#000',
            lightGray: '#eee',
            white: '#fff',
            primary: '#007AFF',
        },
    }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => ({
    Lock: 'Lock',
}));

describe('ConditionCard', () => {
    const mockCondition = {
        condition_name: 'Test Condition',
        category: 'Test Category',
        probability: 85,
        severity: 'Modérée' as const,
        explanation: 'Test Explanation',
        actionable_advice: 'Test Advice',
    };

    beforeEach(() => {
        mockPush.mockClear();
    });

    it('navigates to premium upgrade when unlock is pressed (non-premium user)', () => {
        const { getByText, getAllByText } = render(
            <ConditionCard condition={mockCondition} isPremium={false} />
        );

        // Find the unlock buttons/text
        const unlockButtons = getAllByText('condition_card.unlock');
        expect(unlockButtons.length).toBeGreaterThan(0);

        // Press the first one
        fireEvent.press(unlockButtons[0]);

        // Verify navigation to NEW premium page
        expect(mockPush).toHaveBeenCalledWith('/premium-upgrade');
    });

    it('does NOT show unlock button when user is premium', () => {
        const { queryByText } = render(
            <ConditionCard condition={mockCondition} isPremium={true} />
        );

        expect(queryByText('condition_card.unlock')).toBeNull();
    });
});
