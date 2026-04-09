import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Check, X, AlertCircle, Sun, Moon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useStartupDiagnostics } from '@/contexts/StartupDiagnosticsContext';
import { AppScreen } from '@/components/AppScreen';
import { markPostSignupOnboardingPending } from '@/utils/postSignupOnboarding';
import { normalizeUsernameInput, validateCanonicalUsername } from '@/utils/username';

export default function UsernameSetupScreen() {
  const router = useRouter();
  const {
    user,
    userProfile,
    isEmailVerified,
    checkUsernameAvailability,
    setUsername: persistUsername,
    completeSignUp,
  } = useAuth();
  const { colors, setTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const { showAlert, alertElement } = useCustomAlert();
  const { markStartup, settleStartup } = useStartupDiagnostics();

  const [step, setStep] = useState<'username' | 'theme'>('username');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const checkTimeoutRef = useRef<any>(null);

  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const isNewSignup = !userProfile?.username;

  useEffect(() => {
    if (!user) {
      return;
    }

    markStartup('username-setup-rendered', {
      hasUsername: !!userProfile?.username,
      isNewSignup,
    });
    settleStartup('username-setup-rendered');
  }, [
    isNewSignup,
    markStartup,
    settleStartup,
    user,
    userProfile?.username,
  ]);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isEmailVerified) {
      router.replace({
        pathname: '/email-verification',
        params: { email: user.email || '', userId: user.id, type: 'signup' },
      });
      return;
    }
  }, [user, isEmailVerified]);

  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    if (!username) {
      setUsernameStatus('idle');
      return;
    }

    const { valid } = validateCanonicalUsername(username);

    if (!valid) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 300);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username, checkUsernameAvailability]);

  const handleUsernameChange = (text: string) => {
    setUsername(normalizeUsernameInput(text));
  };

  const handleContinue = async () => {
    if (!user) {
      setError(t('onboarding.error_session'));
      router.replace('/login');
      return;
    }

    if (!isEmailVerified) {
      setError(t('onboarding.error_email'));
      router.replace({
        pathname: '/email-verification',
        params: { email: user.email || '', userId: user.id, type: 'signup' },
      });
      return;
    }

    if (step === 'username') {
      if (!username) {
        setError(t('onboarding.error_username_empty'));
        return;
      }
      if (usernameStatus !== 'available') {
        setError(t('onboarding.error_username_taken'));
        return;
      }
      setStep('theme');
      return;
    }

    // Step === theme (Finalize)
    try {
      setLoading(true);
      setError(null);

      const isOAuthUser = user.app_metadata?.provider && user.app_metadata.provider !== 'email';

      if (isOAuthUser) {
        await persistUsername(username);
      } else {
        await completeSignUp(user.id, username, undefined);
      }

      try {
        await markPostSignupOnboardingPending(user.id);
      } catch (onboardingError) {
        console.error(
          '[UsernameSetup] Failed to persist post-signup onboarding flag:',
          onboardingError
        );
      }

      router.replace('/post-signup-onboarding' as any);
    } catch (err) {
      console.error('[UsernameSetup] Critical error during setup:', err);

      const errorMessage = err instanceof Error ? err.message : t('common.error_config');

      if (errorMessage.includes('Email must be verified') || errorMessage.includes('verifier votre email')) {
        router.replace({
          pathname: '/email-verification',
          params: { email: user.email || '', userId: user.id, type: 'signup' },
        });
        return;
      }

      setError(errorMessage);

      showAlert(
        t('common.error'),
        `Error: ${errorMessage}.`,
        [
          { text: t('common.ok'), style: 'default' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return null;
      case 'available':
        return <Check color={colors.success} size={20} />;
      case 'taken':
        return <X color={colors.error} size={20} />;
      case 'invalid':
        return <AlertCircle color={colors.error} size={20} />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case 'checking':
        return t('onboarding.username_status.checking');
      case 'available':
        return t('onboarding.username_status.available');
      case 'taken':
        return t('onboarding.username_status.taken');
      case 'invalid':
        return t('onboarding.username_status.invalid');
      default:
        return '';
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'available':
        return colors.success;
      case 'taken':
      case 'invalid':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  if (!user) return null;

  return (
    <AppScreen scroll keyboard style={styles.container} topInset={false}>
      {alertElement}
      <View style={styles.languageContainer}>
        <LanguageSelector />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Heart color={colors.primary} size={48} fill={colors.primary} />
          <Text style={styles.title}>{t('onboarding.welcome_title')}</Text>
          <Text style={styles.subtitle}>
            {step === 'username' ? t('onboarding.setup_profile') : t('onboarding.choose_style')}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'username' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('onboarding.username_label')}</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, styles.inputWithStatus]}
                  placeholder={t('onboarding.username_placeholder')}
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholderTextColor={colors.gray}
                />
                <View style={styles.statusIcon}>
                  {getUsernameStatusIcon()}
                </View>
              </View>
              {usernameStatus !== 'idle' && (
                <Text style={[styles.statusText, { color: getUsernameStatusColor() }]}>
                  {getUsernameStatusText()}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.themeContainer}>
              <TouchableOpacity
                style={[styles.themeOption, isDark && styles.themeOptionSelected]}
                onPress={() => setTheme('dark')}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#000' }]}>
                  <Moon color="#FFF" size={32} />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text style={[styles.themeTitle, { color: colors.primaryText }]}>{t('onboarding.theme.dark')}</Text>
                  <Text style={[styles.themeSubtitle, { color: colors.gray }]}>{t('onboarding.theme.dark_desc')}</Text>
                </View>
                {isDark && <Check color={colors.primary} size={24} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeOption, !isDark && styles.themeOptionSelected]}
                onPress={() => setTheme('light')}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#ccc' }]}>
                  <Sun color="#000" size={32} />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text style={[styles.themeTitle, { color: colors.primaryText }]}>{t('onboarding.theme.light')}</Text>
                  <Text style={[styles.themeSubtitle, { color: colors.gray }]}>{t('onboarding.theme.light_desc')}</Text>
                </View>
                {!isDark && <Check color={colors.primary} size={24} />}
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title={step === 'username' ? t('onboarding.next_btn') : t('onboarding.start_btn')}
            onPress={handleContinue}
            loading={loading}
            disabled={step === 'username' && usernameStatus !== 'available'}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  languageContainer: {
    position: 'absolute',
    top: insets.top + SPACING.sm,
    right: SPACING.lg,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingTop: insets.top + SPACING.xl,
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
    position: 'relative',
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    color: colors.primaryText,
  },
  inputWithStatus: {
    paddingRight: 40,
  },
  statusIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  statusText: {
    fontSize: SIZES.sm,
    marginTop: SPACING.xs,
  },
  themeContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.card,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20', // Add some transparency
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: SIZES.sm,
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
});
