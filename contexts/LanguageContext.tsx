import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { i18n } from '@/i18n/translations';

type Language = 'fr' | 'en' | 'de' | 'it' | 'es' | 'pt';

interface LanguageContextType {
    locale: Language;
    changeLanguage: (lang: Language) => Promise<void>;
    t: (scope: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocale] = useState<Language>('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user_language');
            if (savedLanguage) {
                setLocale(savedLanguage as Language);
                i18n.locale = savedLanguage;
            } else {
                // Get device locale (e.g. "en-US" -> "en")
                const deviceLocale = Localization.getLocales()[0]?.languageCode;
                if (deviceLocale && ['fr', 'en', 'de', 'it', 'es', 'pt'].includes(deviceLocale)) {
                    setLocale(deviceLocale as Language);
                    i18n.locale = deviceLocale;
                } else {
                    // Default to English
                    setLocale('en');
                    i18n.locale = 'en';
                }
            }
        } catch (error) {
            console.error('Failed to load language', error);
            setLocale('en');
            i18n.locale = 'en';
        }
    };

    const changeLanguage = async (lang: Language) => {
        try {
            setLocale(lang);
            i18n.locale = lang;
            await AsyncStorage.setItem('user_language', lang);
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    const t = useCallback((scope: string, options?: any) => {
        return i18n.t(scope, options);
    }, [locale]); // Recréer la fonction uniquement quand la locale change

    const value = React.useMemo(() => ({
        locale,
        changeLanguage,
        t
    }), [locale, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
