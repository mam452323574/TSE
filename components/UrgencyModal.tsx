import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

interface UrgencyModalProps {
    visible: boolean;
    onDismiss: () => void;
}

export function UrgencyModal({ visible, onDismiss }: UrgencyModalProps) {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Warning Icon */}
                    <View style={styles.iconContainer}>
                        <AlertTriangle color={colors.warning} size={48} strokeWidth={2} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('components.urgency.title')}</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        {t('components.urgency.message')}
                    </Text>

                    {/* Dismiss Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onDismiss}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{t('components.urgency.dismiss')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContainer: {
        backgroundColor: colors.cardBackground,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        maxWidth: 340,
        width: '100%',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 149, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: SIZES.xl,
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.primaryText,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    message: {
        fontSize: SIZES.md,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    button: {
        backgroundColor: colors.warning,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.button,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
    },
});
