import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContextualPaywallProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  bulletPoints?: string[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  icon?: React.ReactNode;
}

export const ContextualPaywall: React.FC<ContextualPaywallProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  description,
  bulletPoints,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  icon,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const handlePrimaryPress = () => {
    onClose();
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      router.push('/premium-upgrade');
    }
  };

  const defaultPrimaryText = t('premium.upgrade_btn') || "Découvrir Premium";
  const defaultSecondaryText = t('common.later') || "Plus tard";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color={colors.gray} size={24} />
              </TouchableOpacity>

              {/* Icon Overlay */}
              <View style={[styles.iconContainer, { backgroundColor: colors.primary, borderColor: colors.cardBackground }]}>
                {icon || <Crown color={colors.white} size={32} />}
              </View>

              <Text style={[styles.title, { color: colors.primaryText }]}>{title}</Text>
              
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.primary }]}>{subtitle}</Text>
              )}

              {description && (
                <Text style={[styles.description, { color: colors.gray }]}>{description}</Text>
              )}

              {bulletPoints && bulletPoints.length > 0 && (
                <View style={styles.bulletList}>
                  {bulletPoints.map((point, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <Check color={colors.primary} size={16} strokeWidth={3} style={styles.bulletIcon} />
                      <Text style={[styles.bulletText, { color: colors.primaryText }]}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.footer}>
                <View style={styles.primaryButton}>
                  <Button 
                    title={primaryButtonText || defaultPrimaryText} 
                    onPress={handlePrimaryPress} 
                  />
                </View>
                <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                  <Text style={[styles.secondaryButtonText, { color: colors.gray }]}>
                    {secondaryButtonText || defaultSecondaryText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl + SPACING.md,
    alignItems: 'center',
    ...SHADOWS.card,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.xs,
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -32,
    ...SHADOWS.card,
    borderWidth: 4,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  subtitle: {
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  bulletList: {
    width: '100%',
    marginBottom: SPACING.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bulletIcon: {
    marginRight: SPACING.sm,
  },
  bulletText: {
    fontSize: SIZES.sm,
    flex: 1,
  },
  footer: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
