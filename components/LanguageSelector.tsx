import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Check, ChevronDown, X } from 'lucide-react-native';

type Language = 'fr' | 'en' | 'de' | 'it' | 'es' | 'pt';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

interface LanguageSelectorProps {
    style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ style }) => {
    const { locale, changeLanguage, t } = useLanguage();
    const { colors, isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);

    const currentLang = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

    const handleSelect = (langCode: Language) => {
        changeLanguage(langCode);
        setModalVisible(false);
    };

    const renderItem = ({ item }: { item: typeof LANGUAGES[0] }) => {
        const isSelected = item.code === locale;
        return (
            <TouchableOpacity
                style={[
                    styles.languageOption,
                    {
                        backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.lightGray
                    }
                ]}
                onPress={() => handleSelect(item.code)}
            >
                <Text style={styles.flagLarge}>{item.flag}</Text>
                <Text style={[
                    styles.languageLabel,
                    {
                        color: isSelected ? colors.primary : colors.primaryText,
                        fontWeight: isSelected ? '700' : '500'
                    }
                ]}>
                    {item.label}
                </Text>
                {isSelected && <Check color={colors.primary} size={20} />}
            </TouchableOpacity>
        );
    };

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                        borderColor: colors.lightGray
                    },
                    style
                ]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.flag}>{currentLang.flag}</Text>
                <Text style={[styles.code, { color: colors.primaryText }]}>{currentLang.code.toUpperCase()}</Text>
                <ChevronDown size={14} color={colors.gray} />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        testID="modal-backdrop"
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.primaryText }]}>{t('settings.select_language_title')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <X size={20} color={colors.gray} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={LANGUAGES}
                            renderItem={renderItem}
                            keyExtractor={item => item.code}
                            contentContainerStyle={styles.listContent}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        ...SHADOWS.header,
    },
    flag: {
        fontSize: 18,
        marginRight: 6,
    },
    code: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 4,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '85%',
        maxWidth: 340,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.lg,
        ...SHADOWS.cardHover,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    modalTitle: {
        fontSize: SIZES.lg,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    closeButton: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
    },
    flagLarge: {
        fontSize: 24,
        marginRight: SPACING.md,
    },
    languageLabel: {
        flex: 1,
        fontSize: SIZES.md,
    },
});
