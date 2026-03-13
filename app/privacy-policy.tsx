import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SIZES, SPACING, FONT_WEIGHTS } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ChevronLeft color={colors.primaryText} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('privacy.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>{t('privacy.last_updated')}</Text>

        {/* 1. Introduction */}
        <Text style={styles.sectionTitle}>{t('privacy.intro_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.intro_content')}</Text>

        {/* 2. Data Collected */}
        <Text style={styles.sectionTitle}>{t('privacy.data_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.data_content')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.data_account')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.data_scans')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.data_device')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.data_usage')}</Text>

        {/* 3. Camera Usage */}
        <Text style={styles.sectionTitle}>{t('privacy.camera_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.camera_content')}</Text>

        {/* 4. Data Usage */}
        <Text style={styles.sectionTitle}>{t('privacy.usage_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.usage_content')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.usage_analysis')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.usage_improve')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.usage_personalize')}</Text>

        {/* 5. Storage and Security */}
        <Text style={styles.sectionTitle}>{t('privacy.storage_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.storage_content')}</Text>

        {/* 6. Data Sharing */}
        <Text style={styles.sectionTitle}>{t('privacy.sharing_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.sharing_content')}</Text>

        {/* 7. Your Rights */}
        <Text style={styles.sectionTitle}>{t('privacy.rights_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.rights_content')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.rights_access')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.rights_delete')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.rights_export')}</Text>
        <Text style={styles.bulletPoint}>• {t('privacy.rights_withdraw')}</Text>

        {/* 8. Children */}
        <Text style={styles.sectionTitle}>{t('privacy.children_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.children_content')}</Text>

        {/* 9. Updates */}
        <Text style={styles.sectionTitle}>{t('privacy.updates_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.updates_content')}</Text>

        {/* 10. Contact */}
        <Text style={styles.sectionTitle}>{t('privacy.contact_title')}</Text>
        <Text style={styles.paragraph}>{t('privacy.contact_content')}</Text>
        <Text style={styles.contactInfo}>Email : privacy@healthscan.cloud</Text>
        <Text style={styles.contactInfo}>Support : support@healthscan.cloud</Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, SPACING.md) : SPACING.xxxl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.page,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.lg,
  },
  lastUpdated: {
    fontSize: SIZES.text12,
    color: colors.gray,
    fontStyle: 'italic',
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: SIZES.text18,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  paragraph: {
    fontSize: SIZES.text16,
    color: colors.primaryText,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  bulletPoint: {
    fontSize: SIZES.text14,
    color: colors.primaryText,
    lineHeight: 22,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.md,
  },
  contactInfo: {
    fontSize: SIZES.text16,
    color: colors.primary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  bottomSpacing: {
    height: SPACING.xxxl,
  },
});
