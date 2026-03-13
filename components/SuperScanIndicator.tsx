import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Crown, Zap, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { NextScanTimer } from '@/components/NextScanTimer';

interface ScanEligibility {
    allowed: boolean;
    remaining?: number;
    message: string;
    next_available_date?: number;
    welcome_credits?: number;
}

interface SuperScanIndicatorProps {
    isPremium: boolean;
    eligibility?: ScanEligibility;
}

export function SuperScanIndicator({ isPremium, eligibility }: SuperScanIndicatorProps) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

    // Dériver isAvailable à partir de eligibility
    const isAvailable = isPremium && eligibility?.allowed === true;

    // Couleurs du dégradé adaptées au thème
    const gradientColors = isPremium
        ? ['#FFD700', '#FFA500', '#FFD700'] as const
        : isDark
            ? ['#3A3A3C', '#2C2C2E', '#3A3A3C'] as const
            : ['#E0E0E0', '#BDBDBD', '#E0E0E0'] as const;

    const progressGradientColors = isAvailable
        ? ['#FFD700', '#FFA500'] as const
        : isDark
            ? ['#3A3A3C', '#2C2C2E'] as const
            : ['#E0E0E0', '#BDBDBD'] as const;

    return (
        <View style={[styles.container, !isPremium && styles.containerLocked]}>
            {/* Background avec effet premium */}
            <View style={styles.backgroundGlow} />

            <View style={styles.content}>
                {/* Icône principale avec cercle lumineux */}
                <View style={[styles.iconWrapper, !isPremium && styles.iconWrapperLocked]}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradient}
                    >
                        <Sparkles
                            color={isPremium ? '#FFFFFF' : colors.gray}
                            size={22}
                            strokeWidth={2.5}
                            fill={isPremium ? '#FFFFFF' : 'transparent'}
                        />
                    </LinearGradient>
                    {isAvailable && (
                        <View style={styles.availableDot} />
                    )}
                </View>

                {/* Texte et statut */}
                <View style={styles.textContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, !isPremium && styles.titleLocked]}>
                            {t('components.super_scan.title')}
                        </Text>
                        {!isPremium && (
                            <View style={styles.premiumBadge}>
                                <Crown color="#FFD700" size={10} fill="#FFD700" />
                                <Text style={styles.premiumBadgeText}>{t('components.feature_list.premium')}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle}>
                        {!isPremium
                            ? t('components.super_scan.subtitle_locked')
                            : !isAvailable
                                ? t('components.super_scan.subtitle_used')
                                : t('components.super_scan.subtitle_available')}
                    </Text>
                </View>

                {/* Indicateur de statut */}
                <View style={styles.statusContainer}>
                    {!isPremium ? (
                        <View style={styles.lockedBadge}>
                            <Lock color={colors.gray} size={14} />
                        </View>
                    ) : isAvailable ? (
                        <View style={styles.availableBadge}>
                            <Zap color="#FFD700" size={14} fill="#FFD700" />
                            <Text style={styles.availableText}>{eligibility?.remaining ?? 1}</Text>
                        </View>
                    ) : (
                        <View style={styles.usedBadge}>
                            <Text style={styles.usedText}>{eligibility?.remaining ?? 0}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Barre de progression stylisée */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, !isPremium && styles.progressBarLocked]}>
                    <LinearGradient
                        colors={progressGradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.progressFill,
                            { width: isAvailable ? '100%' : '0%' }
                        ]}
                    />
                </View>
                <Text style={[styles.progressLabel, !isPremium && styles.progressLabelLocked]}>
                    {!isPremium
                        ? t('components.super_scan.status_locked')
                        : !isAvailable
                            ? t('components.super_scan.status_used')
                            : t('components.super_scan.status_available')}
                </Text>

                {isPremium && eligibility?.next_available_date && (
                    <View style={styles.timerContainer}>
                        <NextScanTimer
                            nextAvailableDate={eligibility.next_available_date}
                            scanLabel={t('scan_limit.recharge')}
                            textColor={colors.gray}
                            iconColor={colors.gray}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: isDark ? colors.cardBackground : '#FFFEF5',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        borderWidth: 1.5,
        borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.4)',
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    containerLocked: {
        backgroundColor: colors.grayLight,
        borderColor: colors.lightGray,
    },
    backgroundGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.15)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrapper: {
        position: 'relative',
    },
    iconWrapperLocked: {
        opacity: 0.6,
    },
    iconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.card,
    },
    availableDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: isDark ? colors.cardBackground : '#FFFEF5',
    },
    textContainer: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    title: {
        fontSize: SIZES.text16,
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.primaryText,
    },
    titleLocked: {
        color: colors.gray,
    },
    subtitle: {
        fontSize: SIZES.text12,
        color: colors.gray,
        marginTop: 2,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        gap: 3,
    },
    premiumBadgeText: {
        fontSize: SIZES.text10,
        fontWeight: FONT_WEIGHTS.bold,
        color: isDark ? '#FFD700' : '#B8860B',
    },
    statusContainer: {
        marginLeft: SPACING.sm,
    },
    lockedBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    availableBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.25)' : 'rgba(255, 215, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 2,
    },
    availableText: {
        fontSize: SIZES.text14,
        fontWeight: FONT_WEIGHTS.bold,
        color: isDark ? '#FFD700' : '#B8860B',
    },
    usedBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    usedText: {
        fontSize: SIZES.text14,
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.gray,
    },
    progressContainer: {
        marginTop: SPACING.md,
    },
    progressBar: {
        height: 6,
        backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarLocked: {
        backgroundColor: colors.lightGray,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressLabel: {
        fontSize: SIZES.text10,
        color: isDark ? '#FFD700' : '#B8860B',
        marginTop: SPACING.xs,
        textAlign: 'center',
        fontWeight: FONT_WEIGHTS.medium,
    },
    progressLabelLocked: {
        color: colors.gray,
    },
    timerContainer: {
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
