import { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, sendVerificationEmail, isDisposableEmail } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError(t('auth.errors.fill_all'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.errors.invalid_email'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.password_mismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.password_short'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isDisposable = await isDisposableEmail(email);
      if (isDisposable) {
        setError(t('auth.errors.disposable_email'));
        return;
      }

      const { userId, email: userEmail } = await signUp(email, password);

      await sendVerificationEmail(userEmail, userId, 'signup');

      router.push({
        pathname: '/email-verification',
        params: { email: userEmail, userId, type: 'signup' },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.errors.general_error');
      if (errorMessage.includes('already registered')) {
        setError(t('auth.errors.email_in_use'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.languageContainer}>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Heart color={colors.primary} size={48} fill={colors.primary} />
            <Text style={styles.title}>{t('auth.signup_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signup_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email_label')}</Text>
              <View style={styles.inputWithIcon}>
                <Mail color={colors.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.password')}</Text>
              <View style={styles.inputWithIcon}>
                <Lock color={colors.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder={t('auth.password_min_placeholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  placeholderTextColor={colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff color={colors.gray} size={20} />
                  ) : (
                    <Eye color={colors.gray} size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password_confirm')}</Text>
              <View style={styles.inputWithIcon}>
                <Lock color={colors.gray} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithPadding}
                  placeholder={t('auth.password_confirm_placeholder')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  placeholderTextColor={colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <EyeOff color={colors.gray} size={20} />
                  ) : (
                    <Eye color={colors.gray} size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {t('auth.verification_note')}
              </Text>
            </View>

            <Button
              title={t('auth.signup_btn')}
              onPress={handleSignUp}
              loading={loading}
              disabled={loading || !email || !password || !confirmPassword}
            />

            <TouchableOpacity
              style={styles.loginContainer}
              onPress={() => router.back()}
            >
              <Text style={styles.loginText}>
                {t('auth.has_account')}{' '}
                <Text style={styles.loginLink}>{t('auth.login_link')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  languageContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? insets.top + SPACING.sm : SPACING.xl,
    right: SPACING.lg,
    zIndex: 10,
  },

  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: colors.gray,
    marginTop: SPACING.sm,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: SIZES.md,
    fontWeight: '500',
    color: colors.primaryText,
    marginBottom: SPACING.sm,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputWithPadding: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: colors.primaryText,
  },
  eyeIcon: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: `${colors.primary}20`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    color: colors.primaryText,
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  loginContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  loginText: {
    fontSize: SIZES.md,
    color: colors.gray,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
