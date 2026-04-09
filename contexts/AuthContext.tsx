import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/services/supabase';
import { UserProfile } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStartupDiagnostics } from '@/contexts/StartupDiagnosticsContext';
import { getDeviceFingerprint } from '@/services/deviceFingerprint';
import { loadPurchasesModule } from '@/services/purchasesRuntime';
import { getRuntimeConfig, getSupabaseFunctionUrl } from '@/services/runtimeConfig';
import { clearAvatarUrlCache } from '@/services/avatar';
import { trackFailureEvent } from '@/services/analytics';
import {
  DEFAULT_COACH_PERSONA_KEY,
  hasCoachPersonaAccess,
  isCoachPersonaKey,
} from '@/shared/coachPersonas';
import {
  logOperationalError,
  type SafeObservabilityProperties,
} from '@/utils/observability';
import { validateCanonicalUsername } from '@/utils/username';
import {
  getRuntimeCapabilities,
  logRuntimeDecision,
  logRuntimeDecisionOnce,
} from '@/utils/runtimeCapabilities';
import { invalidateScanEligibilityQueries } from '@/utils/scanEligibilityQuery';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ needsVerification: boolean; userId: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ userId: string; email: string }>;
  completeSignUp: (
    userId: string,
    username: string,
    avatarUrl?: string
  ) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  setUsername: (username: string, avatarUrl?: string | null) => Promise<void>;
  updateNotificationSettings: (
    notificationSettings: UserProfile['notification_settings']
  ) => Promise<void>;
  markTutorialSeen: () => Promise<void>;
  updateAvatarUrl: (avatarUrl: string | null) => Promise<void>;
  updateCoachPersona: (
    personaKey: UserProfile['coach_persona_key']
  ) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isDisposableEmail: (email: string) => Promise<boolean>;
  sendVerificationEmail: (
    email: string,
    userId: string,
    type?: 'signup' | 'login'
  ) => Promise<void>;
  verifyEmailCode: (
    code: string,
    userId: string,
    type?: 'signup' | 'login'
  ) => Promise<boolean>;
  checkTrustedDevice: (
    deviceFingerprint: string,
    userId: string
  ) => Promise<boolean>;
  addTrustedDevice: (
    deviceFingerprint: string,
    deviceName: string,
    userId: string
  ) => Promise<void>;
  cleanupOrphanUser: (userId: string) => Promise<void>;
}

type SafeProfileMutationInput = {
  username?: string | null;
  avatar_url?: string | null;
  notification_settings?: UserProfile['notification_settings'];
  push_token?: string | null;
  has_seen_tutorial?: boolean;
  coach_persona_key?: UserProfile['coach_persona_key'];
};

type ProfileWriteError = Error & {
  code?: string;
  status?: number;
  details?: unknown;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_NOTIFICATION_SETTINGS: UserProfile['notification_settings'] = {
  reminders: true,
  achievements: true,
  newContent: true,
};

const normalizeLoadedUserProfile = (
  profile: UserProfile | null,
): UserProfile | null => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    coach_persona_key: isCoachPersonaKey(profile.coach_persona_key)
      ? profile.coach_persona_key
      : DEFAULT_COACH_PERSONA_KEY,
  };
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage();
  const { markStartup } = useStartupDiagnostics();
  const runtime = getRuntimeCapabilities();
  const runtimeConfig = getRuntimeConfig();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const authVersionRef = useRef(0);
  const lastProfileStartupSignatureRef = useRef<string | null>(null);

  const applyUserProfile = (
    profile: UserProfile | null,
    version: number,
    extra: SafeObservabilityProperties = {}
  ) => {
    if (!isMountedRef.current || authVersionRef.current !== version) {
      return;
    }

    setUserProfile(profile);
    const startupPayload = {
      hasProfile: !!profile,
      userId: profile?.id || extra.userId || '',
      ...extra,
    };
    const startupSignature = JSON.stringify(startupPayload);

    if (lastProfileStartupSignatureRef.current === startupSignature) {
      return;
    }

    lastProfileStartupSignatureRef.current = startupSignature;
    markStartup('profile-loaded', startupPayload);
  };

  const getFunctionHeaders = (token?: string | null) => ({
    Authorization: `Bearer ${token || runtimeConfig.supabaseAnonKey}`,
    Accept: 'application/json; charset=utf-8',
    'Content-Type': 'application/json',
  });

  const buildFunctionError = (
    functionName: string,
    status: number,
    payload: unknown,
  ) => {
    const errorPayload =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as {
            error?: unknown;
            code?: unknown;
            request_id?: unknown;
          })
        : {};
    const error = new Error(
      typeof errorPayload.error === 'string' && errorPayload.error.length > 0
        ? errorPayload.error
        : `${functionName} failed (${status})`,
    ) as Error & {
      code?: string;
      status?: number;
      requestId?: string;
    };

    error.code =
      typeof errorPayload.code === 'string' ? errorPayload.code : undefined;
    error.status = status;
    error.requestId =
      typeof errorPayload.request_id === 'string'
        ? errorPayload.request_id
        : undefined;

    return error;
  };

  const invalidateProfileDependentQueries = async () => {
    try {
      const { queryClient } = require('@/app/_layout');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['socialFeed'] }),
        queryClient.invalidateQueries({ queryKey: ['socialComments'] }),
      ]);
    } catch (error) {
      logOperationalError(
        '[ProfileUpdate] Failed to invalidate profile dependent queries',
        error,
      );
    }
  };

  const invalidateScanEligibilityCache = async (userId: string | null | undefined) => {
    try {
      const { queryClient } = require('@/app/_layout');
      await invalidateScanEligibilityQueries(queryClient, userId);
    } catch (error) {
      logOperationalError(
        '[ProfileUpdate] Failed to invalidate scan eligibility queries',
        error,
        { user_id: userId ?? undefined },
      );
    }
  };

  const invokeJsonFunction = async <TResponse,>(
    functionName: string,
    payload: Record<string, unknown>,
    options: { accessToken?: string | null } = {}
  ): Promise<TResponse> => {
    const response = await fetch(getSupabaseFunctionUrl(functionName), {
      method: 'POST',
      headers: getFunctionHeaders(options.accessToken),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw buildFunctionError(functionName, response.status, data);
    }

    return data as TResponse;
  };

  const syncSubscriptionStatus = async (accessToken?: string | null) => {
    try {
      const currentAccessToken =
        accessToken ??
        (await supabase.auth.getSession()).data.session?.access_token;
      if (!currentAccessToken) {
        return;
      }

      const response = await fetch(getSupabaseFunctionUrl('sync-subscription-status'), {
        method: 'POST',
        headers: getFunctionHeaders(currentAccessToken),
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        // New accounts without RevenueCat history return 400/404 — expected, not an error
        if (response.status === 400 || response.status === 404) {
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw buildFunctionError('sync-subscription-status', response.status, data);
      }
    } catch (error) {
      trackFailureEvent('subscription_entitlement_sync_failed', error, {
        source: 'auth_context',
      });
      logOperationalError('[Auth] Background subscription sync failed', error, {
        source: 'auth_context',
      });
    }
  };

  const syncRevenueCatIdentity = async (userId: string | null) => {
    if (!runtime.canUseNativePurchases) {
      logRuntimeDecisionOnce(
        'RevenueCat identity sync skipped',
        {
          reason: runtime.isExpoGo
            ? 'development-build-required'
            : 'unsupported-runtime',
        },
        runtime.isExpoGo
          ? 'revenuecat-identity-sync-skipped-expo-go'
          : 'revenuecat-identity-sync-skipped-unsupported',
      );
      return;
    }

    try {
      const purchasesModule = await loadPurchasesModule();
      if (!purchasesModule) {
        return;
      }

      const Purchases = purchasesModule.default;
      if (!userId) {
        await Purchases.logOut();
        return;
      }

      await Purchases.logIn(userId);
    } catch (error) {
      logOperationalError('[Auth] RevenueCat identity sync failed', error);
    }
  };

  const loadUserProfile = async (
    userId: string,
    version = authVersionRef.current
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const profile = normalizeLoadedUserProfile(data ?? null);
      applyUserProfile(profile, version, {
        userId,
        source: profile ? 'supabase' : 'missing-profile',
      });

      return profile;
    } catch (error) {
      logOperationalError('[Auth] Failed to load user profile', error, {
        user_id: userId,
      });
      applyUserProfile(null, version, {
        userId,
        source: 'profile-error',
      });
      return null;
    }
  };

  const buildInitialProfileInsert = (
    currentUser: Pick<User, 'id' | 'email'>,
    safeFields: SafeProfileMutationInput = {}
  ) => ({
    id: currentUser.id,
    email: currentUser.email || `${currentUser.id}@oauth.temp`,
    username:
      safeFields.username === undefined ? null : safeFields.username,
    avatar_url:
      safeFields.avatar_url === undefined ? null : safeFields.avatar_url,
    ...(safeFields.notification_settings
      ? { notification_settings: safeFields.notification_settings }
      : {}),
    ...(safeFields.push_token !== undefined
      ? { push_token: safeFields.push_token }
      : {}),
    ...(safeFields.has_seen_tutorial !== undefined
      ? { has_seen_tutorial: safeFields.has_seen_tutorial }
      : {}),
    ...(safeFields.coach_persona_key !== undefined
      ? { coach_persona_key: safeFields.coach_persona_key }
      : {}),
  });

  const extractMissingProfileColumn = (error: unknown) => {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const errorRecord = error as Record<string, unknown>;
    const errorMessages = [
      errorRecord.message,
      errorRecord.details,
      errorRecord.hint,
    ].filter((value): value is string => typeof value === 'string');

    for (const errorMessage of errorMessages) {
      const quotedMatch = errorMessage.match(/'([^']+)' column/i);
      if (quotedMatch?.[1]) {
        return quotedMatch[1];
      }

      const directMatch = errorMessage.match(/\bcolumn\s+([a-z_][a-z0-9_]*)\b/i);
      if (directMatch?.[1]) {
        return directMatch[1];
      }
    }

    return undefined;
  };

  const buildProfileWriteErrorHaystack = (error: unknown) => {
    if (!error || typeof error !== 'object') {
      return '';
    }

    const errorRecord = error as Record<string, unknown>;
    return [
      errorRecord.message,
      errorRecord.details,
      errorRecord.hint,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();
  };

  const createProfileWriteError = (
    message: string,
    options: {
      code?: string;
      status?: number;
      details?: unknown;
    } = {}
  ): ProfileWriteError => {
    const error = new Error(message) as ProfileWriteError;
    error.code = options.code;
    error.status = options.status;
    error.details = options.details;
    return error;
  };

  const mapCoachPersonaProfileWriteError = (
    error: unknown,
    attemptedFieldKeys: string[],
  ): ProfileWriteError | null => {
    if (!attemptedFieldKeys.includes('coach_persona_key')) {
      return null;
    }

    const errorCode =
      error && typeof error === 'object'
        ? (error as { code?: string }).code
        : undefined;
    const missingColumn = extractMissingProfileColumn(error);
    const haystack = buildProfileWriteErrorHaystack(error);

    if (
      missingColumn === 'coach_persona_key' ||
      errorCode === 'PGRST204' ||
      errorCode === '42703'
    ) {
      return createProfileWriteError(
        'Coach persona is unavailable because "user_profiles.coach_persona_key" is missing on the configured Supabase project.',
        {
          code: 'coach_persona_schema_mismatch',
          status: 503,
          details: error,
        }
      );
    }

    if (
      errorCode === '42501' ||
      haystack.includes('permission denied') ||
      haystack.includes('row-level security')
    ) {
      return createProfileWriteError(
        'Coach persona could not be saved because Supabase denied access to "user_profiles.coach_persona_key".',
        {
          code: 'coach_persona_policy_denied',
          status: 403,
          details: error,
        }
      );
    }

    if (errorCode === '23514') {
      return createProfileWriteError(
        'Coach persona could not be saved because the database rejected the selected persona value.',
        {
          code: 'coach_persona_constraint_failed',
          status: 400,
          details: error,
        }
      );
    }

    return null;
  };

  const logProfileMutationError = (
    error: unknown,
    operation: 'insert' | 'update',
    attemptedFieldKeys: string[],
  ) => {
    const metadata = {
      operation,
      attempted_fields: attemptedFieldKeys.join(','),
      attempted_field_count: attemptedFieldKeys.length,
      missing_profile_column: extractMissingProfileColumn(error),
    };

    if (
      error &&
      typeof error === 'object' &&
      (error as { code?: unknown }).code === 'PGRST204'
    ) {
      logOperationalError(
        '[ProfileUpdate] user_profiles schema cache mismatch',
        error,
        metadata,
      );
      return;
    }

    logOperationalError('[ProfileUpdate] Safe profile mutation failed', error, metadata);
  };

  const mapProfileWriteError = (
    error: any,
    attemptedFieldKeys: string[],
  ): never => {
    const coachPersonaError = mapCoachPersonaProfileWriteError(
      error,
      attemptedFieldKeys,
    );
    if (coachPersonaError) {
      throw coachPersonaError;
    }

    if (error?.code === '23505') {
      throw new Error(t('auth.error_username_taken'));
    }

    if (
      typeof error?.message === 'string' &&
      error.message.includes('Email must be verified')
    ) {
      throw new Error(t('auth.error_email_verification_required'));
    }

    throw error;
  };

  const upsertSafeProfile = async (safeFields: SafeProfileMutationInput) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const sanitizedFields: SafeProfileMutationInput = {};
    if (safeFields.username !== undefined) {
      sanitizedFields.username = safeFields.username;
    }
    if (safeFields.avatar_url !== undefined) {
      sanitizedFields.avatar_url = safeFields.avatar_url;
    }
    if (safeFields.notification_settings !== undefined) {
      sanitizedFields.notification_settings = safeFields.notification_settings;
    }
    if (safeFields.push_token !== undefined) {
      sanitizedFields.push_token = safeFields.push_token;
    }
    if (safeFields.has_seen_tutorial !== undefined) {
      sanitizedFields.has_seen_tutorial = safeFields.has_seen_tutorial;
    }
    if (safeFields.coach_persona_key !== undefined) {
      sanitizedFields.coach_persona_key = safeFields.coach_persona_key;
    }

    try {
      const attemptedFieldKeys = Object.keys(sanitizedFields).sort();
      const shouldRefreshSocialIdentity =
        safeFields.username !== undefined || safeFields.avatar_url !== undefined;

      if (safeFields.avatar_url !== undefined) {
        clearAvatarUrlCache(safeFields.avatar_url);
      }

      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(sanitizedFields)
          .eq('id', user.id);

        if (updateError) {
          logProfileMutationError(updateError, 'update', attemptedFieldKeys);
          mapProfileWriteError(updateError, attemptedFieldKeys);
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(buildInitialProfileInsert(user, sanitizedFields));

        if (insertError) {
          if (insertError.code === '23505') {
            const { error: retryUpdateError } = await supabase
              .from('user_profiles')
              .update(sanitizedFields)
              .eq('id', user.id);

            if (retryUpdateError) {
              logProfileMutationError(
                retryUpdateError,
                'update',
                attemptedFieldKeys,
              );
              mapProfileWriteError(retryUpdateError, attemptedFieldKeys);
            }
          } else {
            logProfileMutationError(insertError, 'insert', attemptedFieldKeys);
            mapProfileWriteError(insertError, attemptedFieldKeys);
          }
        }
      }

      await refreshUserProfileForUser(user.id);

      if (shouldRefreshSocialIdentity) {
        await invalidateProfileDependentQueries();
      }
    } catch (error) {
      if (
        !(
          error &&
          typeof error === 'object' &&
          ((error as { code?: unknown }).code === '23505' ||
            (error as { code?: unknown }).code === 'PGRST204')
        )
      ) {
        logOperationalError('[ProfileUpdate] Safe profile mutation failed', error);
      }
      throw error;
    }
  };

  const ensureHealthScoreSeed = async (userId: string, initialScore = 0) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('health_scores').insert({
      user_id: userId,
      score: initialScore,
      calories_current: 0,
      calories_goal: 2000,
      bodyfat: initialScore === 50 ? 20 : 0,
      muscle: 40,
      date: today,
    });

    if (error && !error.message?.includes('duplicate')) {
      logOperationalError('[Auth] Health score seed failed', error, {
        user_id: userId,
      });
    }
  };

  const ensureOauthConnection = async (
    payload: {
      user_id: string;
      provider: string;
      provider_user_id: string;
      provider_email?: string | null;
      metadata?: Record<string, unknown>;
    }
  ) => {
    const { error } = await supabase.from('oauth_connections').insert(payload);
    if (error && !error.message?.includes('duplicate')) {
      logOperationalError('[Auth] OAuth connection seed failed', error, {
        user_id: payload.user_id,
      });
    }
  };

  async function refreshUserProfileForUser(userId: string) {
    await syncRevenueCatIdentity(userId);
    await syncSubscriptionStatus();
    const profile = await loadUserProfile(userId, authVersionRef.current);
    await invalidateScanEligibilityCache(userId);
    return profile;
  }

  useEffect(() => {
    isMountedRef.current = true;

    const hydrateAuthState = async (
      nextSession: Session | null,
      version: number,
      source: string
    ) => {
      if (!isMountedRef.current || authVersionRef.current !== version) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      markStartup('session-loaded', {
        hasSession: !!nextSession,
        userId: nextSession?.user?.id || '',
        source,
      });

      if (nextSession?.user) {
        await syncRevenueCatIdentity(nextSession.user.id);
        await syncSubscriptionStatus(nextSession.access_token);
        await loadUserProfile(nextSession.user.id, version);
      } else {
        await syncRevenueCatIdentity(null);
        applyUserProfile(null, version, {
          source: 'no-session',
        });
        logRuntimeDecision('RevenueCat profile sync skipped', {
          reason: 'no-session',
        });
      }

      if (!isMountedRef.current || authVersionRef.current !== version) {
        return;
      }

      setLoading(false);
    };

    const initVersion = ++authVersionRef.current;

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) =>
        hydrateAuthState(initialSession, initVersion, 'initial-session')
      )
      .catch((error) => {
        logOperationalError('[AuthProvider] Failed to load session', error);
        if (isMountedRef.current) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        const currentVersion = ++authVersionRef.current;

        void hydrateAuthState(
          nextSession,
          currentVersion,
          `auth-state-change:${event}`
        );
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ needsVerification: boolean; userId: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const userId = data.user.id;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('account_tier')
      .eq('id', userId)
      .single();

    if (profile?.account_tier === 'admin') {
      return { needsVerification: false, userId };
    }

    const fingerprint = await getDeviceFingerprint();
    const isTrusted = await checkTrustedDevice(fingerprint, userId);

    if (!isTrusted) {
      return { needsVerification: true, userId };
    }

    return { needsVerification: false, userId };
  };

  const checkIpEligibility = async () => {
    try {
      const response = await fetch(getSupabaseFunctionUrl('check-ip-signup'), {
        method: 'POST',
        headers: getFunctionHeaders(),
        body: JSON.stringify({ action: 'check' }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            t('auth.error_ip_limit_reached') ||
              'Signup limit reached for this network.'
          );
        }

        console.warn('[SignUp] IP check failed but allowing signup:', {
          status: response.status,
          code:
            typeof (data as { code?: unknown }).code === 'string'
              ? (data as { code: string }).code
              : undefined,
          request_id:
            typeof (data as { request_id?: unknown }).request_id === 'string'
              ? (data as { request_id: string }).request_id
              : undefined,
        });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('limit reached') ||
          error.message.includes('limite atteinte'))
      ) {
        throw error;
      }

      logOperationalError('[SignUp] IP check failed', error);
    }
  };

  const recordIpSignup = async (userId: string) => {
    try {
      await fetch(getSupabaseFunctionUrl('check-ip-signup'), {
        method: 'POST',
        headers: getFunctionHeaders(),
        body: JSON.stringify({ action: 'record', userId }),
      });
    } catch (error) {
      logOperationalError('[SignUp] Failed to record IP signup', error, {
        user_id: userId,
      });
    }
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ userId: string; email: string }> => {
    await checkIpEligibility();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(t('auth.error_account_creation'));
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(
        buildInitialProfileInsert({
          id: data.user.id,
          email: data.user.email || email,
        })
      );

    if (profileError) {
      logOperationalError('[SignUp] Failed to create initial profile', profileError, {
        user_id: data.user.id,
      });
    }

    void recordIpSignup(data.user.id);

    return { userId: data.user.id, email: data.user.email || email };
  };

  const completeSignUp = async (
    userId: string,
    username: string,
    avatarUrl?: string
  ) => {
    const { normalizedUsername, valid } = validateCanonicalUsername(username);
    if (!valid) {
      throw new Error(t('onboarding.username_status.invalid'));
    }

    const isAvailable = await checkUsernameAvailability(normalizedUsername);
    if (!isAvailable) {
      throw new Error(t('auth.error_username_taken'));
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser || currentUser.id !== userId) {
      throw new Error(t('auth.error_session_invalid'));
    }

    try {
      await upsertSafeProfile({
        username: normalizedUsername,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl || null } : {}),
      });

      await ensureOauthConnection({
        user_id: userId,
        provider: 'email',
        provider_user_id: userId,
        provider_email: currentUser.email,
      });

      await ensureHealthScoreSeed(userId);
      await refreshUserProfileForUser(userId);
    } catch (profileError) {
      logOperationalError('[SignUp] Profile completion failed', profileError, {
        user_id: userId,
      });
      throw profileError;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl =
        Platform.OS === 'web'
          ? window.location.origin
          : Linking.createURL('oauth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) {
        logOperationalError('[OAuth] Failed to initiate OAuth', error, {
          provider,
        });
        throw error;
      }

      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          const parsed = Linking.parse(result.url);
          const params = parsed.queryParams;

          if (params?.access_token && params?.refresh_token) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: params.access_token as string,
                refresh_token: params.refresh_token as string,
              });

            if (sessionError) {
              logOperationalError('[OAuth] Failed to set OAuth session', sessionError, {
                provider,
              });
              throw sessionError;
            }

            if (sessionData.user) {
              await handleOAuthUserSetup(sessionData.user, provider);
            }
          }
        } else if (result.type === 'cancel') {
          throw new Error(t('auth.error_auth_cancelled'));
        }
      }
    } catch (error) {
      logOperationalError('[OAuth] OAuth flow failed', error, {
        provider,
      });
      throw error;
    }
  };

  const handleOAuthUserSetup = async (
    oauthUser: User,
    provider: 'google' | 'apple'
  ) => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', oauthUser.id)
        .maybeSingle();

      if (existingProfile) {
        await refreshUserProfileForUser(oauthUser.id);
        return;
      }

      const email = oauthUser.email || `${oauthUser.id}@oauth.temp`;

      try {
        await checkIpEligibility();
      } catch (error) {
        logOperationalError('[OAuth] IP eligibility blocked signup', error, {
          provider,
        });
        await cleanupOrphanUser(oauthUser.id);
        throw error;
      }

      const isDisposable = await checkDisposableEmail(email);

      if (isDisposable) {
        await cleanupOrphanUser(oauthUser.id);
        throw new Error(t('auth.error_disposable_email'));
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(
          buildInitialProfileInsert(
            {
              id: oauthUser.id,
              email,
            },
            {
              avatar_url: oauthUser.user_metadata?.avatar_url || null,
            }
          )
        );

      if (profileError) {
        logOperationalError('[OAuth] Failed to create OAuth profile', profileError, {
          provider,
          user_id: oauthUser.id,
        });
        await cleanupOrphanUser(oauthUser.id);
        throw profileError;
      }

      void recordIpSignup(oauthUser.id);

      await ensureOauthConnection({
        user_id: oauthUser.id,
        provider,
        provider_user_id: oauthUser.user_metadata?.sub || oauthUser.id,
        provider_email: email,
        metadata: oauthUser.user_metadata || {},
      });

      await ensureHealthScoreSeed(oauthUser.id, 50);
      await refreshUserProfileForUser(oauthUser.id);
    } catch (error) {
      logOperationalError('[OAuth] OAuth user setup failed', error, {
        provider,
        user_id: oauthUser.id,
      });
      throw error;
    }
  };

  const checkDisposableEmail = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    const { data } = await supabase
      .from('disposable_email_domains')
      .select('domain')
      .eq('domain', domain)
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const checkUsernameAvailability = async (
    username: string,
    retryCount = 0
  ): Promise<boolean> => {
    const { normalizedUsername, valid } = validateCanonicalUsername(username);
    if (!valid) {
      return false;
    }

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * 2 ** retryCount, 5000);
    const queryTimeout = 8000;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Query timeout exceeded')),
          queryTimeout
        );
      });

      const queryPromise = supabase
        .from('user_profiles')
        .select('id, username')
        .eq('username', normalizedUsername)
        .maybeSingle();

      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as Awaited<typeof queryPromise>;

      if (error) {
        throw error;
      }

      if (!data) {
        return true;
      }

      return data.id === user?.id;
    } catch (error) {
      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('Query timeout'))
      ) {
        await sleep(retryDelay);
        return checkUsernameAvailability(normalizedUsername, retryCount + 1);
      }

      throw error;
    }
  };

  const setUsername = async (username: string, avatarUrl?: string | null) => {
    const { normalizedUsername, valid } = validateCanonicalUsername(username);
    if (!valid) {
      throw new Error(t('onboarding.username_status.invalid'));
    }

    const isAvailable = await checkUsernameAvailability(normalizedUsername);
    if (!isAvailable) {
      throw new Error(t('auth.error_username_taken'));
    }

    await upsertSafeProfile({
      username: normalizedUsername,
      ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
    });
  };

  const updateNotificationSettings = async (
    notificationSettings: UserProfile['notification_settings']
  ) => {
    const fallbackSettings =
      userProfile?.notification_settings ?? DEFAULT_NOTIFICATION_SETTINGS;
    const sanitizedSettings: UserProfile['notification_settings'] = {
      reminders:
        typeof notificationSettings?.reminders === 'boolean'
          ? notificationSettings.reminders
          : fallbackSettings.reminders,
      achievements:
        typeof notificationSettings?.achievements === 'boolean'
          ? notificationSettings.achievements
          : fallbackSettings.achievements,
      newContent:
        typeof notificationSettings?.newContent === 'boolean'
          ? notificationSettings.newContent
          : fallbackSettings.newContent,
    };

    await upsertSafeProfile({
      notification_settings: sanitizedSettings,
    });
  };

  const markTutorialSeen = async () => {
    await upsertSafeProfile({
      has_seen_tutorial: true,
    });
  };

  const updateAvatarUrl = async (avatarUrl: string | null) => {
    await upsertSafeProfile({
      avatar_url: avatarUrl,
    });
  };

  const updateCoachPersona = async (
    personaKey: UserProfile['coach_persona_key']
  ) => {
    if (!isCoachPersonaKey(personaKey)) {
      throw new Error('Invalid coach persona');
    }

    if (!hasCoachPersonaAccess(personaKey, userProfile?.account_tier)) {
      throw new Error('Coach persona requires premium');
    }

    await upsertSafeProfile({
      coach_persona_key: personaKey,
    });
  };

  const refreshUserProfile = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    await refreshUserProfileForUser(user.id);
  };

  const isDisposableEmail = async (email: string): Promise<boolean> => {
    return checkDisposableEmail(email);
  };

  const sendVerificationEmail = async (
    email: string,
    userId: string,
    type: 'signup' | 'login' = 'signup'
  ): Promise<void> => {
    try {
      await invokeJsonFunction('send-verification-email', {
        email,
        userId,
        type,
        locale,
      });
    } catch (error) {
      logOperationalError('[Verification] Failed to send verification email', error, {
        type,
        user_id: userId,
      });
      throw error;
    }
  };

  const verifyEmailCode = async (
    code: string,
    userId: string,
    type: 'signup' | 'login' = 'signup'
  ): Promise<boolean> => {
    try {
      const data = await invokeJsonFunction<{
        verified?: boolean;
        error?: string;
        errorKey?: string;
        remainingAttempts?: number;
      }>('verify-email-code', {
        code,
        userId,
        type,
      });

      return data.verified === true;
    } catch (error: any) {
      const payload = error?.message;
      logOperationalError('[Verification] Failed to verify code', error, {
        type,
        user_id: userId,
      });
      throw new Error(payload || t('auth.error_verification_code'));
    }
  };

  const checkTrustedDevice = async (
    deviceFingerprint: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();

      if (error) {
        logOperationalError('[TrustedDevice] Failed to check trusted device', error, {
          user_id: userId,
        });
        return false;
      }

      const isTrusted = !!data;

      if (isTrusted) {
        await supabase
          .from('trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', data.id);
      }

      return isTrusted;
    } catch (error) {
      logOperationalError('[TrustedDevice] Failed to check trusted device', error, {
        user_id: userId,
      });
      return false;
    }
  };

  const addTrustedDevice = async (
    deviceFingerprint: string,
    deviceName: string,
    userId: string
  ): Promise<void> => {
    try {
      const { error } = await supabase.from('trusted_devices').upsert(
        {
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,device_fingerprint',
        }
      );

      if (error) {
        logOperationalError('[TrustedDevice] Failed to add trusted device', error, {
          user_id: userId,
        });
        throw error;
      }
    } catch (error) {
      logOperationalError('[TrustedDevice] Failed to add trusted device', error, {
        user_id: userId,
      });
      throw error;
    }
  };

  const cleanupOrphanUser = async (userId: string): Promise<void> => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const accessToken = currentSession?.access_token || runtimeConfig.supabaseAnonKey;

      const response = await fetch(
        getSupabaseFunctionUrl('cleanup-orphan-user'),
        {
          method: 'POST',
          headers: getFunctionHeaders(accessToken),
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        logOperationalError(
          '[Cleanup] Failed to clean up orphan user',
          buildFunctionError('cleanup-orphan-user', response.status, data),
          {
            user_id: userId,
          },
        );
      }

      await supabase.auth.signOut();
    } catch (error) {
      logOperationalError('[Cleanup] Failed to clean up orphan user', error, {
        user_id: userId,
      });
    }
  };

  const signOut = async () => {
    try {
      setUserProfile(null);
      setUser(null);
      setSession(null);

      await syncRevenueCatIdentity(null);

      try {
        const { queryClient } = require('@/app/_layout');
        queryClient.clear();
      } catch (queryError) {
        logOperationalError('[SignOut] Failed to clear React Query cache', queryError);
      }

      try {
        await AsyncStorage.multiRemove([
          'supabase.auth.token',
          '@supabase.auth.token',
          'healthscan_badges',
        ]);
      } catch (storageError) {
        logOperationalError('[SignOut] Failed to clear AsyncStorage', storageError);
      }

      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        logOperationalError('[SignOut] Failed to sign out from Supabase', error);
        throw error;
      }
    } catch (error) {
      logOperationalError('[SignOut] Sign-out flow failed', error);
      setUserProfile(null);
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  const isEmailVerified = userProfile?.email_verified ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isEmailVerified,
        signIn,
        signUp,
        completeSignUp,
        signInWithOAuth,
        signOut,
        checkUsernameAvailability,
        setUsername,
        updateNotificationSettings,
        markTutorialSeen,
        updateAvatarUrl,
        updateCoachPersona,
        refreshUserProfile,
        isDisposableEmail,
        sendVerificationEmail,
        verifyEmailCode,
        checkTrustedDevice,
        addTrustedDevice,
        cleanupOrphanUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
