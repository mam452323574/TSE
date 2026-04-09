import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, RefreshCw, ArrowLeft, Check, Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { COLORS, SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartupDiagnostics } from '@/contexts/StartupDiagnosticsContext';
import { getDeviceFingerprint, getDeviceName } from '@/services/deviceFingerprint';
import { AppScreen } from '@/components/AppScreen';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function EmailVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; userId?: string; type?: string; returnTo?: string }>();
  const { sendVerificationEmail, verifyEmailCode, addTrustedDevice, refreshUserProfile, user, signOut } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { markStartup, settleStartup } = useStartupDiagnostics();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(15 * 60);
  const [rememberDevice, setRememberDevice] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimeRef = useRef<number>(0);

  const email = params.email || user?.email || '';
  const userId = params.userId || user?.id || '';
  const type = (params.type as 'signup' | 'login') || 'signup';

  useEffect(() => {
    markStartup('email-verification-rendered', {
      type,
    });
    settleStartup('email-verification-rendered');
  }, [markStartup, settleStartup, type]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (expiryRef.current) clearTimeout(expiryRef.current);
      if (redirectRef.current) clearTimeout(redirectRef.current);
    };
  }, []);

  // Gerer le timer quand l'app passe en arriere-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        // L'app passe en arriere-plan - enregistrer le temps
        backgroundTimeRef.current = Date.now();
      } else if (nextState === 'active' && backgroundTimeRef.current > 0) {
        // L'app revient au premier plan - ajuster le timer
        const elapsedSeconds = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        if (isMountedRef.current && elapsedSeconds > 0) {
          setExpiresIn(prev => Math.max(0, prev - elapsedSeconds));
          setCooldown(prev => Math.max(0, prev - elapsedSeconds));
        }
        backgroundTimeRef.current = 0;
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setCooldown(cooldown - 1);
        }
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, [cooldown]);

  useEffect(() => {
    if (expiresIn > 0 && !success) {
      expiryRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setExpiresIn(expiresIn - 1);
        }
      }, 1000);
    }
    return () => {
      if (expiryRef.current) clearTimeout(expiryRef.current);
    };
  }, [expiresIn, success]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      const chars = text.replace(/[^0-9]/g, '').split('').slice(0, CODE_LENGTH);
      chars.forEach((char, i) => {
        if (i < CODE_LENGTH) {
          newCode[i] = char;
        }
      });
      setCode(newCode);
      const lastFilledIndex = Math.min(chars.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const cleanedText = text.replace(/[^0-9]/g, '');
    newCode[index] = cleanedText;
    setCode(newCode);

    if (cleanedText && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      setError(t('auth.code_incomplete'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await verifyEmailCode(fullCode, userId, type);

      if (isValid) {
        setSuccess(true);

        await refreshUserProfile();

        if (rememberDevice && type === 'login') {
          try {
            const fingerprint = await getDeviceFingerprint();
            const deviceName = getDeviceName();
            await addTrustedDevice(fingerprint, deviceName, userId);
          } catch (deviceError) {
            console.error('[Verification] Error saving trusted device:', deviceError);
          }
        }

        redirectRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          if (type === 'signup') {
            router.replace('/username-setup');
          } else if (params.returnTo) {
            router.replace(params.returnTo as any);
          } else {
            router.replace('/(tabs)');
          }
        }, 1500);
      } else {
        setError(t('auth.code_invalid'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error_login_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);

    try {
      await sendVerificationEmail(email, userId, type);
      setCooldown(RESEND_COOLDOWN);
      setExpiresIn(15 * 60);
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    try {
      if (type === 'signup') {
        await signOut();
      }
      router.back();
    } catch (err) {
      console.error('[EmailVerification] Error during cancel:', err);
      setError(t('common.error'));
    }
  };

  if (success) {
    return (
      <AppScreen style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Check color={colors.white} size={48} />
          </View>
          <Text style={styles.successTitle}>{t('auth.verification_sent_title')}</Text>
          <Text style={styles.successSubtitle}>
            {type === 'signup' ? t('auth.verification_sent_subtitle_signup') : t('auth.verification_sent_subtitle_login')}
          </Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: SPACING.lg }} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll keyboard style={styles.container} topInset={false}>
      <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
        <ArrowLeft color={colors.primaryText} size={24} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail color={colors.primary} size={32} />
          </View>
          <Text style={styles.title}>{t('auth.verify_title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.verify_subtitle')}
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                error ? styles.codeInputError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, expiresIn < 60 ? styles.timerWarning : null]}>
            {t('auth.code_expired')} {formatTime(expiresIn)}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {type === 'login' && (
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberDevice(!rememberDevice)}
          >
            <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
              {rememberDevice && <Check color={colors.white} size={14} />}
            </View>
            <View style={styles.rememberTextContainer}>
              <Shield color={colors.gray} size={16} />
              <Text style={styles.rememberText}>{t('auth.remember_device')}</Text>
            </View>
          </TouchableOpacity>
        )}

        <Button
          title={loading ? t('auth.verifying') : t('auth.verify_btn')}
          onPress={handleVerify}
          loading={loading}
          disabled={loading || code.join('').length !== CODE_LENGTH}
        />

        <TouchableOpacity
          style={[styles.resendButton, (cooldown > 0 || resending) && styles.resendDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <RefreshCw color={cooldown > 0 ? colors.gray : colors.primary} size={18} />
              <Text style={[styles.resendText, cooldown > 0 && styles.resendTextDisabled]}>
                {cooldown > 0 ? t('auth.resend_in', { seconds: cooldown.toString() }) : t('auth.resend_code')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: insets.top + SPACING.xl * 2,
  },
  backButton: {
    position: 'absolute',
    top: insets.top + SPACING.sm,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: colors.gray,
    textAlign: 'center',
  },
  email: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: SPACING.xs,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center',
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: colors.primaryText,
    backgroundColor: colors.cardBackground,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: SIZES.sm,
    color: colors.gray,
  },
  timerWarning: {
    color: colors.error,
    fontWeight: '600',
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 4,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rememberText: {
    fontSize: SIZES.sm,
    color: colors.gray,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  resendDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: SIZES.md,
    color: colors.primary,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: colors.gray,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: SIZES.md,
    color: colors.gray,
    textAlign: 'center',
  },
});
