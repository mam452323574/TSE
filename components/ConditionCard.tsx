import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { DetectedCondition, ConditionSeverity } from '@/types';
import { useRef, useMemo } from 'react'; // Added useMemo although useRef is not used here but imports need to be correct
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConditionCardProps {
    condition: DetectedCondition;
    isPremium: boolean;
}

// Couleurs par sévérité
const SEVERITY_COLORS: Record<ConditionSeverity, { bg: string; border: string; text: string }> = {
    'Élevée': { bg: 'rgba(255, 59, 48, 0.1)', border: '#FF3B30', text: '#FF3B30' },
    'Modérée': { bg: 'rgba(255, 149, 0, 0.1)', border: '#FF9500', text: '#FF9500' },
    'Faible': { bg: 'rgba(52, 199, 89, 0.1)', border: '#34C759', text: '#34C759' },
};

export function ConditionCard({ condition, isPremium }: ConditionCardProps) {
    const router = useRouter();
    const { colors: themeColors } = useTheme();
    // Add useLanguage hook
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(themeColors), [themeColors]);

    const colors = SEVERITY_COLORS[condition.severity] || SEVERITY_COLORS['Faible'];

    const handleUnlock = () => {
        router.push('/premium-upgrade');
    };

    // Mapping for translation keys
    const getSeverityTranslation = (severity: ConditionSeverity) => {
        const map: Record<string, string> = {
            'Faible': 'low',
            'Modérée': 'moderate',
            'Élevée': 'high'
        };
        const key = map[severity] || 'low';
        return t(`scan_values.severity.${key}`);
    };

    return (
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.conditionName}>{condition.condition_name}</Text>
                    <View style={styles.badgesContainer}>
                        <View style={[styles.severityBadge, { backgroundColor: colors.border }]}>
                            <Text style={styles.severityText}>{getSeverityTranslation(condition.severity)}</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{condition.category}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.probabilityContainer}>
                    <Text style={[styles.probabilityValue, { color: colors.text }]}>
                        {condition.probability}%
                    </Text>
                    <Text style={styles.probabilityLabel}>{t('condition_card.probability')}</Text>
                </View>
            </View>

            {/* Explanation Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('condition_card.explanation')}</Text>
                {isPremium ? (
                    <Text style={styles.sectionContent}>{condition.explanation}</Text>
                ) : (
                    <TouchableOpacity onPress={handleUnlock} activeOpacity={0.8}>
                        <View style={styles.blurredContainer}>
                            <Text style={styles.blurredText} numberOfLines={2}>
                                {condition.explanation}
                            </Text>
                            <View style={styles.lockOverlay}>
                                <View style={styles.lockButton}>
                                    <Lock color={themeColors.white} size={20} />
                                    <Text style={styles.lockText}>{t('condition_card.unlock')}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Actionable Advice Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('condition_card.advice')}</Text>
                {isPremium ? (
                    <Text style={styles.sectionContent}>{condition.actionable_advice}</Text>
                ) : (
                    <TouchableOpacity onPress={handleUnlock} activeOpacity={0.8}>
                        <View style={styles.blurredContainer}>
                            <Text style={styles.blurredText} numberOfLines={2}>
                                {condition.actionable_advice}
                            </Text>
                            <View style={styles.lockOverlay}>
                                <View style={styles.lockButton}>
                                    <Lock color={themeColors.white} size={20} />
                                    <Text style={styles.lockText}>{t('condition_card.unlock')}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const createStyles = (themeColors: any) => StyleSheet.create({
    card: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        shadowColor: themeColors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    headerLeft: {
        flex: 1,
        marginRight: SPACING.md,
    },
    conditionName: {
        fontSize: SIZES.lg + 2,
        fontWeight: FONT_WEIGHTS.bold,
        color: themeColors.primaryText,
        marginBottom: SPACING.sm,
        letterSpacing: -0.5,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(128, 128, 128, 0.1)', // More generic
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    categoryText: {
        fontSize: SIZES.xs,
        color: themeColors.gray,
        fontWeight: FONT_WEIGHTS.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    severityBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    severityText: {
        fontSize: SIZES.xs,
        fontWeight: FONT_WEIGHTS.bold,
        color: themeColors.white,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    probabilityContainer: {
        alignItems: 'flex-end',
    },
    probabilityValue: {
        fontSize: 32,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: -1,
    },
    probabilityLabel: {
        fontSize: SIZES.xs,
        color: themeColors.gray,
        fontWeight: FONT_WEIGHTS.medium,
        textTransform: 'uppercase',
    },
    section: {
        marginTop: SPACING.md,
    },
    sectionTitle: {
        fontSize: SIZES.sm,
        fontWeight: FONT_WEIGHTS.semiBold,
        color: themeColors.gray,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        fontSize: SIZES.md,
        color: themeColors.primaryText,
        lineHeight: 22,
    },
    blurredContainer: {
        position: 'relative',
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        backgroundColor: themeColors.lightGray,
        padding: SPACING.md,
    },
    blurredText: {
        fontSize: SIZES.md,
        color: 'transparent',
        lineHeight: 22,
        // Simulate blur with text shadow
        textShadowColor: themeColors.gray,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    lockButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.xs,
    },
    lockText: {
        fontSize: SIZES.sm,
        fontWeight: FONT_WEIGHTS.semiBold,
        color: themeColors.white,
    },
});
