import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SIZES, SPACING, FONT_WEIGHTS, SHADOWS, BORDER_RADIUS } from '@/constants/theme';

interface MetricCardProps {
    title: string;
    value: string;
    icon: string;
    isLocked?: boolean;
    onPremiumPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon,
    isLocked = false,
    onPremiumPress,
}) => {
    const { colors } = useTheme();

    const CardContent = () => (
        <View style={[styles.container, { backgroundColor: colors.cardBackground }, SHADOWS.card]}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.gray }]}>{title}</Text>

                {isLocked ? (
                    <View style={styles.lockedContainer}>
                        <View style={[styles.blurOverlay, { backgroundColor: colors.grayMedium }]}>
                            <Text style={[styles.blurredText, { color: colors.grayMedium }]}>••••••</Text>
                        </View>
                        <View style={[styles.lockBadge, { backgroundColor: colors.primary }]}>
                            <Lock color={colors.white} size={12} />
                        </View>
                    </View>
                ) : (
                    <Text style={[styles.value, { color: colors.primaryText }]}>{value}</Text>
                )}
            </View>

            {isLocked && (
                <View style={[styles.premiumTag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.premiumText, { color: colors.primary }]}>PREMIUM</Text>
                </View>
            )}
        </View>
    );

    if (isLocked && onPremiumPress) {
        return (
            <TouchableOpacity onPress={onPremiumPress} activeOpacity={0.7}>
                <CardContent />
            </TouchableOpacity>
        );
    }

    return <CardContent />;
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    icon: {
        fontSize: 24,
        marginRight: SPACING.md,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: SIZES.sm,
        marginBottom: 2,
    },
    value: {
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
    },
    lockedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    blurOverlay: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    blurredText: {
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
        letterSpacing: 2,
    },
    lockBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumTag: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    premiumText: {
        fontSize: SIZES.xs,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: 0.5,
    },
});

export default MetricCard;
