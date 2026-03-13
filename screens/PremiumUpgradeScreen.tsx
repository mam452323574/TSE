import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Check, X, RefreshCw, Sparkles, Lock, Star } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ModalHandle } from '@/components/ModalHandle';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { paymentService } from '@/services/payment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MIN_WIDTH = 280;

// ─── Feature list types ───
interface FeatureItem {
  label: string;
  included: boolean;
}

export default function PremiumUpgradeScreen() {
  const router = useRouter();
  const { userProfile, refreshUserProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  const [purchasing, setPurchasing] = useState(false);
  const [purchasingAnnual, setPurchasingAnnual] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [productPrice, setProductPrice] = useState<string>('9,99 €');

  // Animations
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializePayment();

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

    return () => {
      paymentService.cleanup();
    };
  }, []);

  const initializePayment = async () => {
    try {
      await paymentService.initialize();
      const product = await paymentService.getProductDetails();
      if (product && product.localizedPrice) {
        setProductPrice(product.localizedPrice);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
    }
  };

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismiss();
    } else {
      router.back();
    }
  };

  // ─── Monthly purchase (existing logic) ───
  const handlePurchase = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('premium.web_unavailable_title'),
        t('premium.web_disclaimer')
      );
      return;
    }

    try {
      setPurchasing(true);

      const result = await paymentService.purchaseProduct();

      if (result.success) {
        Alert.alert(
          t('premium.validation_title'),
          t('premium.processing')
        );

        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshUserProfile();

        Alert.alert(
          t('premium.purchase_success_title'),
          t('premium.purchase_success_msg'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error === 'cancelled') {
        // Purchase cancelled by user
      } else {
        Alert.alert(
          t('common.error'),
          result.message || t('premium.purchase_error_default')
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        t('common.error'),
        t('premium.purchase_error_generic')
      );
    } finally {
      setPurchasing(false);
    }
  };

  // ─── Annual purchase ───
  const handlePurchaseAnnual = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('premium.web_unavailable_title'),
        t('premium.web_disclaimer')
      );
      return;
    }

    try {
      setPurchasingAnnual(true);

      const result = await paymentService.purchaseProductAnnual();

      if (result.success) {
        Alert.alert(
          t('premium.validation_title'),
          t('premium.processing')
        );

        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshUserProfile();

        Alert.alert(
          t('premium.purchase_success_title'),
          t('premium.purchase_success_msg'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error === 'cancelled') {
        // Annual purchase cancelled by user
      } else {
        Alert.alert(
          t('common.error'),
          result.message || t('premium.purchase_error_default')
        );
      }
    } catch (error) {
      console.error('Annual purchase error:', error);
      Alert.alert(
        t('common.error'),
        t('premium.purchase_error_generic')
      );
    } finally {
      setPurchasingAnnual(false);
    }
  };

  // ─── Restore purchases ───
  const handleRestorePurchases = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('premium.web_unavailable_title'),
        t('premium.web_disclaimer')
      );
      return;
    }

    try {
      setRestoring(true);

      const result = await paymentService.restorePurchases();

      if (result.success) {
        await refreshUserProfile();

        Alert.alert(
          t('premium.restore_success_title'),
          t('premium.restore_success_msg'),
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.error === 'no_purchases' || result.error === 'no_premium_purchase') {
        Alert.alert(
          t('premium.restore_empty_title'),
          t('premium.restore_empty')
        );
      } else {
        Alert.alert(
          t('common.error'),
          result.message || t('premium.restore_error_default')
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        t('common.error'),
        t('premium.restore_error_generic')
      );
    } finally {
      setRestoring(false);
    }
  };

  const isPremium = userProfile?.account_tier === 'premium' || userProfile?.account_tier === 'admin';

  // ─── Feature lists ───
  const freeFeatures: FeatureItem[] = [
    { label: t('premium.subscription_page.free_feat_face'), included: true },
    { label: t('premium.subscription_page.free_feat_body'), included: true },
    { label: t('premium.subscription_page.free_feat_nutrition'), included: true },
    { label: t('premium.subscription_page.free_feat_partial'), included: true },
    { label: t('premium.subscription_page.free_feat_no_super'), included: false },
    { label: t('premium.subscription_page.free_feat_no_history'), included: false },
  ];

  const premiumFeatures: FeatureItem[] = [
    { label: t('premium.subscription_page.prem_feat_face'), included: true },
    { label: t('premium.subscription_page.prem_feat_body'), included: true },
    { label: t('premium.subscription_page.prem_feat_nutrition'), included: true },
    { label: t('premium.subscription_page.prem_feat_super'), included: true },
    { label: t('premium.subscription_page.prem_feat_unlocked'), included: true },
    { label: t('premium.subscription_page.prem_feat_history'), included: true },
    { label: t('premium.subscription_page.prem_feat_ai'), included: true },
  ];

  // ─── Manage subscription ───
  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions?package=com.healthscan.app');
    } else {
      Alert.alert(
        t('premium.web_unavailable_title'),
        t('premium.web_disclaimer')
      );
    }
  };

  // ─── Already premium view ───
  if (isPremium) {
    let formattedDate = '';
    if (userProfile?.subscription_expiry_date) {
      try {
        const date = new Date(userProfile.subscription_expiry_date);
        formattedDate = new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(date);
      } catch (e) {
        console.error('Error formatting date', e);
      }
    }

    return (
      <View style={styles.container}>
        <View style={styles.alreadyPremiumContainer}>
          <View style={styles.premiumBadge}>
            <Crown color={colors.white} size={64} fill={colors.white} />
          </View>
          <Text style={styles.alreadyPremiumTitle}>{t('premium.already_premium_title')}</Text>
          <Text style={[styles.alreadyPremiumText, { color: colors.primaryText, fontWeight: 'bold' }]}>
            {t('premium.already_premium_active')}
          </Text>
          {formattedDate ? (
            <Text style={styles.alreadyPremiumText}>
              {t('premium.renewal_date').replace('%{date}', formattedDate)}
            </Text>
          ) : (
            <Text style={styles.alreadyPremiumText}>
              {t('premium.already_premium_desc')}
            </Text>
          )}

          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: colors.primary, width: '100%', maxWidth: 300, marginBottom: SPACING.md }]} 
            onPress={handleManageSubscription}
          >
            <Text style={styles.ctaButtonText}>{t('premium.manage_subscription')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ padding: SPACING.md }} onPress={() => router.back()}>
            <Text style={[styles.ctaButtonText, { color: colors.gray }]}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Render a feature row ───
  const renderFeatureRow = (item: FeatureItem, index: number, isHighlighted: boolean) => (
    <View key={index} style={styles.featureRow}>
      <View
        style={[
          styles.featureIcon,
          {
            backgroundColor: item.included
              ? (isHighlighted ? colors.primary + '20' : colors.success + '20')
              : colors.error + '15',
          },
        ]}
      >
        {item.included ? (
          <Check color={isHighlighted ? colors.primary : colors.success} size={14} />
        ) : (
          <X color={colors.error} size={14} />
        )}
      </View>
      <Text
        style={[
          styles.featureText,
          {
            color: item.included ? colors.primaryText : colors.gray,
            opacity: item.included ? 1 : 0.7,
          },
        ]}
      >
        {item.label}
      </Text>
    </View>
  );

  // ─── Main render ───
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ModalHandle />

      {/* Header bar */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>{t('premium.title')}</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X color={colors.primaryText} size={28} />
        </TouchableOpacity>
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
          {/* ─── Hero section ─── */}
          <View style={styles.heroSection}>
            <View style={styles.heroCrownContainer}>
              <Crown color={colors.primary} size={44} fill={colors.primary} />
              <View style={styles.heroSparkle}>
                <Sparkles color={colors.warning} size={20} fill={colors.warning} />
              </View>
            </View>
            <Text style={[styles.heroTitle, { color: colors.primaryText }]}>
              {t('premium.subscription_page.hero_title')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.gray }]}>
              {t('premium.subscription_page.hero_subtitle')}
            </Text>
          </View>

          {/* ─── Cards horizontal scroll ─── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            snapToInterval={CARD_MIN_WIDTH + SPACING.md}
            decelerationRate="fast"
          >
            {/* ── Card 1: Gratuit ── */}
            <View style={[styles.card, styles.cardFree, { backgroundColor: isDark ? colors.cardBackground : '#F8F9FA', borderColor: colors.lightGray }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.gray }]}>
                  {t('premium.subscription_page.free_title')}
                </Text>
                <Text style={[styles.cardPrice, { color: colors.gray }]}>
                  {t('premium.subscription_page.free_price')}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.featuresList}>
                {freeFeatures.map((f, i) => renderFeatureRow(f, i, false))}
              </View>
            </View>

            {/* ── Card 2: Premium Mensuel ── */}
            <View style={[styles.card, styles.cardMonthly, { backgroundColor: colors.cardBackground, borderColor: colors.primary + '40' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.primaryText }]}>
                  {t('premium.subscription_page.monthly_title')}
                </Text>
                <Text style={[styles.cardPrice, { color: colors.primary }]}>
                  {t('premium.subscription_page.monthly_price')}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.featuresList}>
                {premiumFeatures.map((f, i) => renderFeatureRow(f, i, false))}
              </View>

              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.primary, opacity: purchasing ? 0.7 : 1 }, SHADOWS.button]}
                onPress={handlePurchase}
                disabled={purchasing || restoring || purchasingAnnual}
              >
                {purchasing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.ctaButtonText}>
                    {t('premium.subscription_page.cta_monthly')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Card 3: Premium Annuel (highlighted) ── */}
            <View style={[styles.card, styles.cardAnnual, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
              {/* Best value badge */}
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Star color={colors.white} size={12} fill={colors.white} />
                <Text style={styles.badgeText}>
                  {t('premium.subscription_page.annual_badge')}
                </Text>
              </View>

              <View style={[styles.cardHeader, { marginTop: SPACING.lg }]}>
                <Text style={[styles.cardTitle, { color: colors.primaryText }]}>
                  {t('premium.subscription_page.annual_title')}
                </Text>
                <Text style={[styles.cardPrice, { color: colors.primary }]}>
                  {t('premium.subscription_page.annual_price')}
                </Text>
                <Text style={[styles.cardSubPrice, { color: colors.gray }]}>
                  {t('premium.subscription_page.annual_monthly')}
                </Text>
                <Text style={[styles.crossedPrice, { color: colors.error }]}>
                  {t('premium.subscription_page.annual_crossed')}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.featuresList}>
                {premiumFeatures.map((f, i) => renderFeatureRow(f, i, true))}
              </View>

              <TouchableOpacity
                style={[styles.ctaButton, styles.ctaButtonAnnual, { backgroundColor: colors.primary, opacity: purchasingAnnual ? 0.7 : 1 }, SHADOWS.button]}
                onPress={handlePurchaseAnnual}
                disabled={purchasing || restoring || purchasingAnnual}
              >
                {purchasingAnnual ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.ctaButtonText}>
                    {t('premium.subscription_page.cta_annual')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ─── Bottom section ─── */}
          <View style={styles.bottomSection}>
            {/* Restore purchases */}
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestorePurchases}
                disabled={purchasing || restoring || purchasingAnnual}
              >
                <RefreshCw color={colors.primary} size={16} />
                <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
                  {restoring ? t('premium.restoring') : t('premium.restore_btn')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Legal text */}
            <Text style={[styles.legalText, { color: colors.gray }]}>
              {t('premium.subscription_page.legal')}
            </Text>

            {/* Links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('premium.subscription_page.privacy_link')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.linkSeparator, { color: colors.gray }]}>•</Text>
              <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {t('premium.subscription_page.terms_link')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Store note */}
            {Platform.OS !== 'web' ? (
              <Text style={[styles.storeNote, { color: colors.gray }]}>
                {t('premium.store_note', { store: Platform.OS === 'android' ? 'Google Play' : 'App Store' })}
              </Text>
            ) : (
              <Text style={[styles.storeNote, { color: colors.gray }]}>
                {t('premium.web_note')}
              </Text>
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const createStyles = (colors: any, insets: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },

  // ─── Header ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.page || 20,
    paddingVertical: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, SPACING.md) : SPACING.md,
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // ─── Scroll ───
  scrollContent: {
    paddingBottom: SPACING.xxxl + insets.bottom,
  },
  content: {
    gap: SPACING.xl,
  },

  // ─── Hero ───
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.md,
  },
  heroCrownContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  heroSparkle: {
    position: 'absolute',
    top: -6,
    right: -14,
  },
  heroTitle: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: SIZES.md,
    textAlign: 'center',
  },

  // ─── Cards container ───
  cardsContainer: {
    paddingHorizontal: SPACING.page,
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  // ─── Card base ───
  card: {
    width: CARD_MIN_WIDTH,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.lg,
    ...SHADOWS.card,
    overflow: 'visible',
  },
  cardFree: {
    opacity: 0.85,
  },
  cardMonthly: {
    // default styling
  },
  cardAnnual: {
    borderWidth: 2.5,
    position: 'relative',
    transform: [{ scale: 1.02 }],
  },

  // ─── Badge ───
  badge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -65,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Card header ───
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  cardPrice: {
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
  },
  cardSubPrice: {
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  crossedPrice: {
    fontSize: SIZES.sm,
    textDecorationLine: 'line-through',
    marginTop: 2,
    opacity: 0.8,
  },

  // ─── Card divider ───
  cardDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: SPACING.md,
  },

  // ─── Features list ───
  featuresList: {
    gap: SPACING.sm,
    flex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: SIZES.sm - 1,
    flex: 1,
    lineHeight: 18,
  },

  // ─── CTA button ───
  ctaButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  ctaButtonAnnual: {
    paddingVertical: SPACING.md + 2,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // ─── Bottom section ───
  bottomSection: {
    paddingHorizontal: SPACING.page,
    alignItems: 'center',
    gap: SPACING.md,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
  },
  restoreButtonText: {
    fontSize: SIZES.sm,
    fontWeight: '500' as const,
  },
  legalText: {
    fontSize: SIZES.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  linkText: {
    fontSize: SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  linkSeparator: {
    fontSize: SIZES.xs,
  },
  storeNote: {
    fontSize: SIZES.xs,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },

  // ─── Already premium ───
  alreadyPremiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  premiumBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  alreadyPremiumTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold' as const,
    marginBottom: SPACING.md,
    color: colors.primaryText,
  },
  alreadyPremiumText: {
    fontSize: SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: colors.gray,
  },
});
