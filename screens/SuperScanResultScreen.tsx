import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Sparkles, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModalHandle } from '@/components/ModalHandle';
import { UrgencyModal } from '@/components/UrgencyModal';
import { ConditionCard } from '@/components/ConditionCard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SuperScanResult, DetectedCondition, ConditionSeverity } from '@/types';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

// Ordre de tri par sévérité (Élevée en premier)
const SEVERITY_ORDER: Record<ConditionSeverity, number> = {
    'Élevée': 0,
    'Modérée': 1,
    'Faible': 2,
};

export default function SuperScanResultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userProfile } = useAuth();
    const { colors } = useTheme();
    const { t } = useLanguage();
    // Création des styles dynamiques
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

    // Parse les données d'analyse
    const analysisData = params.analysisData
        ? (JSON.parse(params.analysisData as string) as SuperScanResult)
        : null;

    // État pour la modale d'urgence
    const [showUrgencyModal, setShowUrgencyModal] = useState(false);
    const [hasAcknowledgedUrgency, setHasAcknowledgedUrgency] = useState(false);

    // Animation de slide-up
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Afficher la modale si urgency_flag est true
        if (analysisData?.urgency_flag && !hasAcknowledgedUrgency) {
            setShowUrgencyModal(true);
        }
    }, [analysisData?.urgency_flag, hasAcknowledgedUrgency]);

    useEffect(() => {
        // Lancer l'animation seulement si pas de modale d'urgence ou si déjà acquittée
        if (!showUrgencyModal) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showUrgencyModal]);

    const handleUrgencyDismiss = () => {
        setShowUrgencyModal(false);
        setHasAcknowledgedUrgency(true);
    };

    const handleClose = () => {
        if (router.canDismiss()) {
            router.dismissAll();
        } else {
            router.replace('/(tabs)');
        }
    };

    // Trier les conditions par sévérité
    const sortedConditions = analysisData?.detected_conditions
        ? [...analysisData.detected_conditions].sort(
            (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
        )
        : [];

    // Pas de données
    if (!analysisData) {
        return (
            <View style={styles.container}>
                <ModalHandle />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('components.super_scan.title')}</Text>
                </View>
                <View style={styles.errorContainer}>
                    <AlertCircle color={colors.error} size={48} />
                    <Text style={[styles.errorText, { color: colors.gray }]}>{t('scan_result.no_data')}</Text>
                    <TouchableOpacity style={[styles.errorButton, { backgroundColor: colors.primary }]} onPress={handleClose}>
                        <Text style={[styles.errorButtonText, { color: colors.white }]}>{t('common.home_back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Calculer la couleur du score de risque
    const getRiskScoreColor = (score: number) => {
        if (score >= 70) return colors.error;
        if (score >= 40) return colors.warning;
        return colors.success;
    };

    return (
        <View style={styles.container}>
            {/* Modale d'urgence */}
            <UrgencyModal
                visible={showUrgencyModal}
                onDismiss={handleUrgencyDismiss}
            />

            <ModalHandle />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('components.super_scan.title')}</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header Card avec Score */}
                    <LinearGradient
                        colors={[colors.goldLight, colors.cardBackground]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.scoreCard}
                    >
                        <View style={styles.scoreHeader}>
                            <View style={styles.scoreIconContainer}>
                                <Sparkles color={colors.gold} size={32} fill={colors.gold} />
                            </View>
                            <View style={styles.scoreTextContainer}>
                                <Text style={styles.scoreTitle}>{t('super_scan_features.global_risk_score')}</Text>
                                <View style={styles.scoreValueRow}>
                                    <Text
                                        style={[
                                            styles.scoreValue,
                                            { color: getRiskScoreColor(analysisData.global_risk_score) },
                                        ]}
                                    >
                                        {analysisData.global_risk_score}
                                    </Text>
                                    <Text style={styles.scoreSuffix}>/100</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Résumé */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{t('super_scan_features.analysis_summary')}</Text>
                        <Text style={styles.summaryText}>{analysisData.analysis_summary}</Text>
                    </View>

                    {/* Conditions détectées */}
                    <View style={styles.conditionsSection}>
                        <Text style={styles.sectionTitle}>{t('super_scan_features.conditions_detected')}</Text>

                        {sortedConditions.length === 0 ? (
                            // Aucune condition - Badge RAS
                            <View style={styles.rasCard}>
                                <View style={styles.rasIconContainer}>
                                    <CheckCircle color={colors.success} size={48} strokeWidth={2} />
                                </View>
                                <Text style={styles.rasTitle}>{t('super_scan_features.ras_title')}</Text>
                                <Text style={styles.rasSubtitle}>{t('super_scan_features.ras_subtitle')}</Text>
                                <Text style={styles.rasDescription}>
                                    {t('super_scan_features.ras_description')}
                                </Text>
                            </View>
                        ) : (
                            // Liste des conditions triées par sévérité
                            sortedConditions.map((condition, index) => (
                                <ConditionCard
                                    key={`${condition.condition_name}-${index}`}
                                    condition={condition}
                                    isPremium={isPremium}
                                />
                            ))
                        )}
                    </View>

                    {/* Bouton retour */}
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={handleClose}>
                        <Text style={[styles.backButtonText, { color: colors.white }]}>{t('common.home_back')}</Text>
                    </TouchableOpacity>

                    {/* Disclaimer */}
                    <Text style={styles.disclaimer}>{analysisData.disclaimer_text}</Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.page,
        paddingVertical: SPACING.md,
    },
    headerTitle: {
        fontSize: SIZES.lg,
        fontWeight: FONT_WEIGHTS.semiBold,
        color: colors.primaryText,
    },
    scrollContent: {
        padding: SPACING.page,
        paddingBottom: SPACING.xxxl,
    },
    content: {
        gap: SPACING.lg,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.page,
    },
    errorText: {
        fontSize: SIZES.lg,
        color: colors.gray,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.button,
        marginTop: SPACING.md,
    },
    errorButtonText: {
        color: colors.white,
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
    },
    scoreCard: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: colors.gold,
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    scoreTextContainer: {
        marginLeft: SPACING.lg,
        flex: 1,
    },
    scoreTitle: {
        fontSize: SIZES.sm,
        color: colors.gray,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: FONT_WEIGHTS.semiBold,
    },
    scoreValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: FONT_WEIGHTS.bold,
        letterSpacing: -1,
    },
    scoreSuffix: {
        fontSize: SIZES.lg,
        color: colors.gray,
        fontWeight: FONT_WEIGHTS.medium,
        marginLeft: 2,
    },
    summaryCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: SIZES.sm,
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.primary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryText: {
        fontSize: SIZES.md,
        color: colors.primaryText,
        lineHeight: 24,
    },
    conditionsSection: {
        gap: SPACING.md,
    },
    sectionTitle: {
        fontSize: SIZES.lg,
        fontWeight: FONT_WEIGHTS.semiBold,
        color: colors.primaryText,
        marginBottom: SPACING.xs,
    },
    rasCard: {
        backgroundColor: colors.successLight,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xxl,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.success,
    },
    rasIconContainer: {
        marginBottom: SPACING.md,
    },
    rasTitle: {
        fontSize: SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        color: colors.success,
        marginBottom: SPACING.xs,
    },
    rasSubtitle: {
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
        color: colors.success,
        marginBottom: SPACING.md,
    },
    rasDescription: {
        fontSize: SIZES.md,
        color: colors.primaryText,
        textAlign: 'center',
        lineHeight: 22,
    },
    backButton: {
        backgroundColor: colors.primary,
        borderRadius: BORDER_RADIUS.button,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    backButtonText: {
        color: colors.white,
        fontSize: SIZES.md,
        fontWeight: FONT_WEIGHTS.semiBold,
    },
    disclaimer: {
        fontSize: SIZES.xs,
        color: colors.gray,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: SPACING.lg,
        paddingHorizontal: SPACING.md,
    },
});
