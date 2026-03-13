import { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { OAuthButton } from '@/components/OAuthButton';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LanguageSelector } from '@/components/LanguageSelector';

// TODO: Activer quand les API OAuth seront configurées
const SHOW_OAUTH_BUTTONS = false;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, sendVerificationEmail } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.errors.fill_all'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { needsVerification, userId } = await signIn(email, password);

      if (needsVerification) {
        try {
          await sendVerificationEmail(email, userId, 'login');
          router.push({
            pathname: '/email-verification',
            params: { email, userId, type: 'login' },
          });
        } catch (verificationError) {
          console.error('[Login] Failed to send verification email:', verificationError);
          setError(t('auth.errors.general_error'));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      if (errorMessage.includes('Invalid login credentials')) {
        setError(t('auth.errors.invalid_credentials'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setOauthLoading(provider);
      setError(null);
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.oauth_login', { provider }));
    } finally {
      setOauthLoading(null);
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
            <Text style={styles.title}>{t('auth.login_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>
          </View>

          {SHOW_OAUTH_BUTTONS && (
            <>
              <View style={styles.oauthSection}>
                <OAuthButton
                  provider="google"
                  onPress={() => handleOAuthLogin('google')}
                  loading={oauthLoading === 'google'}
                  disabled={oauthLoading !== null || loading}
                />
                <View style={{ height: SPACING.md }} />
                <OAuthButton
                  provider="apple"
                  onPress={() => handleOAuthLogin('apple')}
                  loading={oauthLoading === 'apple'}
                  disabled={oauthLoading !== null || loading}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or_divider')}</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

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
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={t('auth.login_btn')}
              onPress={handleLogin}
              loading={loading}
            />

            <TouchableOpacity
              style={styles.signupContainer}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.signupText}>
                {t('auth.no_account')}{' '}
                <Text style={styles.signupLink}>{t('auth.signup_link')}</Text>
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
  oauthSection: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: SIZES.sm,
    color: colors.gray,
    fontWeight: '500',
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
  signupContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  signupText: {
    fontSize: SIZES.md,
    color: colors.gray,
  },
  signupLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
