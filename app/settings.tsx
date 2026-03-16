import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform, Modal } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Crown, ChevronRight, Shield, LogOut, Bell, ChevronLeft, AlertTriangle, Settings, Globe, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { AccountBadge } from '@/components/AccountBadge';
import { Button } from '@/components/Button';
import { ModalHandle } from '@/components/ModalHandle';
import { navigationService } from '@/services/navigation';
import { COLORS, SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { notificationCount } = useNotificationContext();
  const { t, locale, changeLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { showAlert, alertElement } = useCustomAlert();

  useEffect(() => {
    setIsSigningOut(false);

    const timeout = setTimeout(() => {
      if (isSigningOut) {
        setIsSigningOut(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isSigningOut) {
      const resetTimeout = setTimeout(() => {
        setIsSigningOut(false);
      }, 15000);
      return () => clearTimeout(resetTimeout);
    }
  }, [isSigningOut]);

  const handleNotificationsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigationService.navigateToNotifications();
  };

  const handleNotificationSettingsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/notification-settings');
  };

  const performSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('[Settings] Starting sign out...');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      await signOut();
      console.log('[Settings] Sign out successful, redirecting to login...');
      router.replace('/login');
    } catch (error) {
      console.error('[Settings] Sign out error:', error);
      setIsSigningOut(false);
      if (Platform.OS === 'web') {
        alert(t('settings.sign_out_error_msg'));
      } else {
        showAlert(
          t('settings.sign_out_error_title'),
          t('settings.sign_out_error_msg'),
          [{ text: t('settings.ok') }]
        );
      }
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    console.log('[Settings] handleSignOut called, Platform:', Platform.OS);

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        t('settings.sign_out_confirm_msg')
      );
      if (confirmed) {
        await performSignOut();
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showAlert(
        t('settings.sign_out_confirm_title'),
        t('settings.sign_out_confirm_msg'),
        [
          { text: t('settings.cancel'), style: 'cancel' },
          {
            text: t('settings.sign_out_button'),
            style: 'destructive',
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      {alertElement}
      <ModalHandle />
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft color={colors.primaryText} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {userProfile.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userProfile.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>{userProfile.username}</Text>
          <Text style={styles.email}>{userProfile.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.section_subscription')}</Text>
          <View style={styles.subscriptionCard}>
            <AccountBadge tier={userProfile.account_tier} size="large" />
            {userProfile.account_tier === 'free' && (
              <TouchableOpacity
                style={styles.upgradeCard}
                onPress={() => router.push('/premium-upgrade')}
                activeOpacity={0.8}
              >
                <Crown color="#FFD700" size={28} fill="#FFD700" />
                <View style={styles.upgradeCardText}>
                  <Text style={styles.upgradeCardTitle}>{t('settings.upgrade_premium')}</Text>
                  <Text style={styles.upgradeCardSubtitle}>{t('settings.upgrade_subtitle')}</Text>
                </View>
                <ChevronRight color={colors.primary} size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.section_preferences')}</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Globe color={colors.primaryText} size={20} />
              <View>
                <Text style={styles.menuItemText}>{t('settings.language')}</Text>
                <Text style={styles.menuItemSubtext}>{t(`languages.${locale}`)}</Text>
              </View>
            </View>
            <ChevronRight color={colors.gray} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotificationsPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Bell color={colors.primaryText} size={20} />
              <View>
                <Text style={styles.menuItemText}>{t('settings.notifications')}</Text>
                {notificationCount > 0 && (
                  <Text style={styles.menuItemSubtext}>
                    {notificationCount} {t('settings.new_notifications')}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.menuItemRight}>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
              <ChevronRight color={colors.gray} size={20} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotificationSettingsPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Settings color={colors.primaryText} size={20} />
              <Text style={styles.menuItemText}>{t('settings.notifications_preferences')}</Text>
            </View>
            <ChevronRight color={colors.gray} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.section_app')}</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.8}
          >
            <View style={styles.menuItemLeft}>
              <Shield color={colors.primaryText} size={20} />
              <Text style={styles.menuItemText}>{t('settings.privacy_policy')}</Text>
            </View>
            <ChevronRight color={colors.gray} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <View style={styles.dangerZoneHeader}>
            <AlertTriangle color={colors.error} size={20} />
            <Text style={styles.dangerZoneTitle}>{t('settings.danger_zone_title')}</Text>
          </View>
          <Text style={styles.dangerZoneDescription}>
            {t('settings.danger_zone_desc')}
          </Text>
          <TouchableOpacity
            style={[styles.signOutButton, isSigningOut && styles.signOutButtonDisabled]}
            onPress={handleSignOut}
            activeOpacity={0.7}
            disabled={isSigningOut}
          >
            <View style={styles.signOutButtonContent}>
              {isSigningOut ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <LogOut color={colors.error} size={22} strokeWidth={2.5} />
              )}
              <Text style={styles.signOutText}>
                {isSigningOut ? t('settings.sign_out_loading') : t('settings.sign_out_button')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.footer_version')}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('settings.select_language_title')}</Text>
            {(['fr', 'en', 'de', 'it', 'es', 'pt'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.languageOption, locale === lang && styles.languageOptionSelected]}
                onPress={() => {
                  changeLanguage(lang);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={[styles.languageText, locale === lang && styles.languageTextSelected]}>
                  {t(`languages.${lang}`)}
                </Text>
                {locale === lang && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.page,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
    width: 40,
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: SPACING.xxxl + SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
    backgroundColor: colors.cardBackground,
  },
  avatarContainer: {
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.white,
  },
  username: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: SIZES.text14,
    color: colors.gray,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.page,
  },
  sectionTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.md,
  },
  subscriptionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    marginTop: SPACING.sm,
  },
  upgradeCardText: {
    flex: 1,
  },
  upgradeCardTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
  },
  upgradeCardSubtitle: {
    fontSize: SIZES.text12,
    color: colors.gray,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuItemText: {
    fontSize: SIZES.text16,
    color: colors.primaryText,
    fontWeight: FONT_WEIGHTS.regular,
  },
  menuItemSubtext: {
    fontSize: SIZES.text12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: FONT_WEIGHTS.medium,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationBadge: {
    backgroundColor: colors.error,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: SIZES.text12,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.white,
  },
  dangerZone: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    marginHorizontal: SPACING.page,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255, 69, 58, 0.1)', // Use opacity for dark mode compatibility
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dangerZoneTitle: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.error,
  },
  dangerZoneDescription: {
    fontSize: SIZES.text14,
    color: colors.gray,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    position: 'relative',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: SIZES.text16,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: colors.error,
    marginLeft: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: SIZES.text12,
    color: colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  languageOptionSelected: {
    backgroundColor: colors.background,
  },
  languageText: {
    fontSize: SIZES.text16,
    color: colors.primaryText,
  },
  languageTextSelected: {
    color: colors.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  closeButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    padding: SPACING.md,
  },
  closeButtonText: {
    fontSize: SIZES.text16,
    color: colors.gray,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
