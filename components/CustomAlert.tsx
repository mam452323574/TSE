import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SIZES, SPACING, BORDER_RADIUS, FONT_WEIGHTS } from '@/constants/theme';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  icon?: React.ReactNode;
  onDismiss: () => void;
}

export function CustomAlert({ visible, title, message, buttons, icon, onDismiss }: CustomAlertProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const resolvedButtons: CustomAlertButton[] = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', style: 'default' }];

  const handleButtonPress = (button: CustomAlertButton) => {
    onDismiss();
    button.onPress?.();
  };

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return styles.buttonDestructive;
      case 'cancel':
        return styles.buttonCancel;
      default:
        return styles.buttonDefault;
    }
  };

  const getButtonTextStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return styles.buttonTextDestructive;
      case 'cancel':
        return styles.buttonTextCancel;
      default:
        return styles.buttonTextDefault;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {icon && (
                <View style={styles.iconContainer}>
                  {icon}
                </View>
              )}

              <Text style={styles.title}>{title}</Text>

              {message ? (
                <Text style={styles.message}>{message}</Text>
              ) : null}

              <View style={[
                styles.buttonRow,
                resolvedButtons.length >= 3 && styles.buttonColumn,
              ]}>
                {resolvedButtons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      getButtonStyle(button.style),
                      resolvedButtons.length < 3 && resolvedButtons.length > 1 && { flex: 1 },
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    borderRadius: 24,
    padding: SPACING.xxl,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: colors.primaryText,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: SIZES.md,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    marginTop: SPACING.md,
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  buttonTextDefault: {
    color: colors.white,
  },
  buttonTextCancel: {
    color: colors.primaryText,
  },
  buttonTextDestructive: {
    color: colors.white,
  },
});
