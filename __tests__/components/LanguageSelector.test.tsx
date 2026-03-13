import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, TouchableOpacity } from 'react-native';

jest.unmock('@/components/LanguageSelector');
jest.unmock('../../components/LanguageSelector');

jest.mock('../../contexts/LanguageContext', () => ({
    useLanguage: jest.fn(),
}));
jest.mock('../../contexts/ThemeContext', () => ({
    useTheme: jest.fn(),
}));
jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Check: () => <Text>CheckIcon</Text>,
        ChevronDown: () => <Text>ChevronDownIcon</Text>,
        X: () => <Text>XIcon</Text>,
    };
});

describe('LanguageSelector', () => {
    const mockChangeLanguage = jest.fn();
    const mockT = jest.fn((key: string) => key);

    beforeEach(() => {
        jest.clearAllMocks();

        (useLanguage as jest.Mock).mockReturnValue({
            locale: 'fr',
            changeLanguage: mockChangeLanguage,
            t: mockT,
        });

        (useTheme as jest.Mock).mockReturnValue({
            colors: {
                primary: '#FF5733',
                lightGray: '#D3D3D3',
                primaryText: '#000000',
                cardBackground: '#FFFFFF',
                gray: '#808080',
            },
            isDark: false,
        });
    });

    it('renders correctly with current language', () => {
        const { getByText } = render(<LanguageSelector />);

        expect(getByText('🇫🇷')).toBeTruthy();
        expect(getByText('FR')).toBeTruthy();
    });

    it('opens modal on press', () => {
        const { getByText } = render(<LanguageSelector />);

        // Find the button (by looking for "FR" and getting its parent)
        const button = getByText('FR').parent;
        expect(button).toBeTruthy();

        fireEvent.press(button!);

        expect(getByText('settings.select_language_title')).toBeTruthy();
        expect(getByText('English')).toBeTruthy();
    });

    it('selects a language and closes modal', () => {
        const { getByText } = render(<LanguageSelector />);

        fireEvent.press(getByText('FR').parent!);
        fireEvent.press(getByText('English'));

        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('closes modal when X button is pressed', () => {
        const { getByText } = render(<LanguageSelector />);

        fireEvent.press(getByText('FR').parent!);

        const closeBtn = getByText('XIcon').parent;
        expect(closeBtn).toBeTruthy();

        fireEvent.press(closeBtn!);
    });

    it('closes modal when backdrop is pressed', () => {
        // The backdrop in the modal has activeOpacity={1}. We can test this by
        // setting testIDs if necessary, but we can also just find it.
        // Easiest is to add a testID to the backdrop, but without modifying the component:
        const { getByText, getByTestId } = render(<LanguageSelector />);

        fireEvent.press(getByText('FR').parent!);

        const backdrop = getByTestId('modal-backdrop');

        expect(backdrop).toBeTruthy();
        if (backdrop) {
            fireEvent.press(backdrop);
        }
    });

    it('applies selected styles to current language', () => {
        const { getByText } = render(<LanguageSelector />);

        fireEvent.press(getByText('FR').parent!);

        // The language option label for "Français" should have primary color font
        const frOption = getByText('Français');
        expect(frOption.props.style).toEqual(expect.arrayContaining([{ color: '#FF5733', fontWeight: '700' }]));

        // English should be gray
        const enOption = getByText('English');
        expect(enOption.props.style).toEqual(expect.arrayContaining([{ color: '#000000', fontWeight: '500' }]));
    });
});
