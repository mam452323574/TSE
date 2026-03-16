import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { UserProfile, OAuthProvider } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDeviceFingerprint } from '@/services/deviceFingerprint';

import Purchases from 'react-native-purchases';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ needsVerification: boolean; userId: string }>;
  signUp: (email: string, password: string) => Promise<{ userId: string; email: string }>;
  completeSignUp: (userId: string, username: string, avatarUrl?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isDisposableEmail: (email: string) => Promise<boolean>;
  sendVerificationEmail: (email: string, userId: string, type?: 'signup' | 'login') => Promise<void>;
  verifyEmailCode: (code: string, userId: string, type?: 'signup' | 'login') => Promise<boolean>;
  checkTrustedDevice: (deviceFingerprint: string, userId: string) => Promise<boolean>;
  addTrustedDevice: (deviceFingerprint: string, deviceName: string, userId: string) => Promise<void>;
  cleanupOrphanUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const authVersionRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    const initVersion = ++authVersionRef.current;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current || authVersionRef.current !== initVersion) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
        if (authVersionRef.current !== initVersion) return;
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('[AuthProvider] Error loading session:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      (async () => {
        const currentVersion = ++authVersionRef.current;
        if (!isMountedRef.current) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await loadUserProfile(session.user.id);
            if (authVersionRef.current !== currentVersion) return;
          } catch (profileError) {
            console.error('[Auth] Error loading profile on state change:', profileError);
          }
        } else if (isMountedRef.current) {
          setUserProfile(null);
        }

        // Terminer le chargement après traitement de l'événement d'auth
        if (isMountedRef.current) {
          setLoading(false);
        }
      })();
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Admin users get permanent premium — skip RevenueCat check entirely
        if (data.account_tier === 'admin') {
          console.log('[Auth] Admin user detected, skipping RevenueCat check');
        } else if (Platform.OS !== 'web') {
          // Check RevenueCat entitlements for premium status (native only)
          try {
            // Fetch customer info with retry on 429 (rate limit from concurrent requests after configure())
            let customerInfo;
            try {
              customerInfo = await Purchases.getCustomerInfo();
            } catch (rcError: any) {
              if (rcError?.code === 16) {
                // Rate limited — retry once after short delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                customerInfo = await Purchases.getCustomerInfo();
              } else {
                throw rcError;
              }
            }

            if (typeof customerInfo.entitlements.active['Health Scan Pro'] !== 'undefined') {
              // User has active 'Health Scan Pro' entitlement via RevenueCat
              if (data.account_tier !== 'premium') {
                console.log('[Auth] RevenueCat: Health Scan Pro active, upgrading to premium');
                data.account_tier = 'premium';

                // Sync premium status to Supabase in background
                supabase
                  .from('user_profiles')
                  .update({ account_tier: 'premium' })
                  .eq('id', userId)
                  .then(({ error: syncError }) => {
                    if (syncError) console.error('[Auth] Error syncing premium to Supabase:', syncError);
                  });
              }
            } else {
              // No active entitlement — downgrade to free (but never admin)
              if (data.account_tier === 'premium') {
                console.log('[Auth] RevenueCat: No active entitlement, downgrading to free');
                data.account_tier = 'free';

                // Sync free status to Supabase in background
                supabase
                  .from('user_profiles')
                  .update({ account_tier: 'free' })
                  .eq('id', userId)
                  .then(({ error: syncError }) => {
                    if (syncError) console.error('[Auth] Error syncing free tier to Supabase:', syncError);
                  });
              }
            }
          } catch (e) {
            console.error('[Auth] Error fetching RevenueCat customer info:', e);
            // Fallback: use existing Supabase expiry check if RevenueCat is unavailable
            if (data.account_tier === 'premium' && data.subscription_expiry_date) {
              const expiryDate = new Date(data.subscription_expiry_date);
              const now = new Date();

              if (expiryDate < now) {
                console.log('[Auth] Subscription expired locally, downgrading state...');
                data.account_tier = 'free';
                syncSubscriptionStatus();
              }
            }
          }
        }

        if (isMountedRef.current) {
          setUserProfile(data);
        }
      }
    } catch (error) {
      console.error('[Auth] Error loading user profile:', error);
    }
  };

  const syncSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-subscription-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('[Auth] Background sync failed:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ needsVerification: boolean; userId: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const userId = data.user.id;

    const fingerprint = await getDeviceFingerprint();
    const isTrusted = await checkTrustedDevice(fingerprint, userId);

    if (!isTrusted) {
      return { needsVerification: true, userId };
    }

    return { needsVerification: false, userId };
  };

  const checkIpEligibility = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/check-ip-signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'check' }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(t('auth.error_ip_limit_reached') || 'Signup limit reached for this network.');
        }
        console.warn('[SignUp] IP Check failed but allowing:', data.error);
        // Fail open if server error? Or fail closed? 
        // For now, let's treat non-429 errors as warnings to avoid blocking valid users on technical glitches
      }
    } catch (error) {
      // If it's our specific error, rethrow it
      if (error instanceof Error && (error.message.includes('limit reached') || error.message.includes('limite atteinte'))) {
        throw error;
      }
      console.error('[SignUp] IP Check exception:', error);
      // Decide: Fail open (allow signup) on network error?
      // Keeping it open for now to prevent blocking on connectivity issues
    }
  };

  const recordIpSignup = async (userId: string) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/check-ip-signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'record', userId }),
        }
      );
    } catch (error) {
      console.error('[SignUp] Failed to record IP:', error);
      // Non-blocking background error
    }
  };

  const signUp = async (email: string, password: string): Promise<{ userId: string; email: string }> => {
    // 1. Check IP Eligibility BEFORE trying to create account
    await checkIpEligibility();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error(t('auth.error_account_creation'));
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: data.user.email || email,
        username: null,
        avatar_url: null,
        account_tier: 'free',
        email_verified: false,
        has_seen_tutorial: false,
        welcome_credits: {
          health: 1,
          body: 1,
          nutrition: 1,
        },
      });

    if (profileError) {
      console.error('[SignUp] Error creating initial profile:', profileError);
    }

    // 2. Record IP for rate limiting
    // Fire and forget - don't await this to speed up UI response
    recordIpSignup(data.user.id);

    return { userId: data.user.id, email: data.user.email || email };
  };

  const completeSignUp = async (userId: string, username: string, avatarUrl?: string) => {
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error(t('auth.error_username_taken'));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error(t('auth.error_session_invalid'));
    }

    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username,
          avatar_url: avatarUrl || null,
        })
        .eq('id', userId);

      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error(t('auth.error_username_taken'));
        }
        if (profileError.message?.includes('Email must be verified')) {
          throw new Error(t('auth.error_email_verification_required'));
        }
        throw profileError;
      }

      const { error: oauthError } = await supabase.from('oauth_connections').insert({
        user_id: userId,
        provider: 'email',
        provider_user_id: userId,
        provider_email: user.email,
      });

      if (oauthError && !oauthError.message?.includes('duplicate')) {
        console.error('[SignUp] OAuth connection error:', oauthError);
      }

      const today = new Date().toISOString().split('T')[0];
      const { error: healthError } = await supabase.from('health_scores').insert({
        user_id: userId,
        score: 0,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 0,
        muscle: 40,
        date: today,
      });

      if (healthError && !healthError.message?.includes('duplicate')) {
        console.error('[SignUp] Health score error:', healthError);
      }

      await loadUserProfile(userId);
    } catch (profileError) {
      console.error('[SignUp] Profile update failed:', profileError);
      throw profileError;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const redirectUrl = Platform.OS === 'web'
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
        console.error('[OAuth] Error initiating OAuth:', error);
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
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token as string,
              refresh_token: params.refresh_token as string,
            });

            if (sessionError) {
              console.error('[OAuth] Error setting session:', sessionError);
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
      console.error('[OAuth] Error in OAuth flow:', error);
      throw error;
    }
  };

  const handleOAuthUserSetup = async (user: User, provider: 'google' | 'apple') => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        return;
      }

      const email = user.email || `${user.id}@oauth.temp`;

      // 1. Check IP Eligibility & Disposable Email
      // Do this BEFORE creating profile to avoid ghost accounts
      try {
        await checkIpEligibility();
      } catch (error) {
        console.warn('[OAuth] IP Limit blocked signup:', error);
        await cleanupOrphanUser(user.id);
        throw error;
      }

      // Verifier l'email jetable AVANT de creer le profil
      const isDisposable = await checkDisposableEmail(email);

      if (isDisposable) {
        // Nettoyer l'utilisateur orphelin cree par OAuth
        console.log('[OAuth] Disposable email detected, cleaning up orphan user');
        await cleanupOrphanUser(user.id);
        throw new Error(t('auth.error_disposable_email'));
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: email,
          username: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          account_tier: 'free',
          email_verified: true,
          has_seen_tutorial: false,
          welcome_credits: {
            health: 1,
            body: 1,
            nutrition: 1,
          },
        });

      if (profileError) {
        console.error('[OAuth] Error creating profile:', profileError);
        // Nettoyer l'utilisateur si la creation du profil echoue
        await cleanupOrphanUser(user.id);
        throw profileError;
      }

      // 2. Record IP for rate limiting
      recordIpSignup(user.id);

      const { error: oauthError } = await supabase
        .from('oauth_connections')
        .insert({
          user_id: user.id,
          provider: provider,
          provider_user_id: user.user_metadata?.sub || user.id,
          provider_email: email,
        });

      if (oauthError && !oauthError.message?.includes('duplicate')) {
        console.error('[OAuth] Error creating OAuth connection:', oauthError);
      }

      const today = new Date().toISOString().split('T')[0];
      await supabase.from('health_scores').insert({
        user_id: user.id,
        score: 0,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 0,
        muscle: 40,
        date: today,
      });
    } catch (error) {
      console.error('[OAuth] Error in user setup:', error);
      throw error;
    }
  };

  const checkDisposableEmail = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const { data } = await supabase
      .from('disposable_email_domains')
      .select('domain')
      .eq('domain', domain)
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const checkUsernameAvailability = async (username: string, retryCount = 0): Promise<boolean> => {
    if (!username || username.length < 3) return false;

    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    const queryTimeout = 8000;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout exceeded')), queryTimeout);
      });

      const queryPromise = supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        throw error;
      }
      return !data;
    } catch (error) {
      if (retryCount < maxRetries && error instanceof Error &&
        (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('Query timeout'))) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return checkUsernameAvailability(username, retryCount + 1);
      }
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('[ProfileUpdate] Error checking profile existence:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error('[ProfileUpdate] UPDATE failed:', updateError);
          throw updateError;
        }
      } else {
        const profileData = {
          id: user.id,
          email: user.email || `${user.id}@oauth.temp`,
          account_tier: 'free',
          ...updates,
        };

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (insertError) {
          console.error('[ProfileUpdate] INSERT failed:', insertError);
          throw insertError;
        }
      }

      await loadUserProfile(user.id);
    } catch (error) {
      console.error('[ProfileUpdate] Critical error in updateUserProfile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) throw new Error('User not authenticated');
    await loadUserProfile(user.id);
  };

  const isDisposableEmail = async (email: string): Promise<boolean> => {
    return checkDisposableEmail(email);
  };

  const sendVerificationEmail = async (email: string, userId: string, type: 'signup' | 'login' = 'signup'): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-verification-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, userId, type, locale }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.error_verification_send'));
      }
    } catch (error) {
      console.error('[Verification] Error sending email:', error);
      throw error;
    }
  };

  const verifyEmailCode = async (code: string, userId: string, type: 'signup' | 'login' = 'signup'): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-email-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, userId, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Use errorKey for localized error message, with fallback to error code
        let errorMessage: string;

        if (data.errorKey) {
          // Try to use translation key
          const translatedError = t(data.errorKey);
          // If translation found, use it; otherwise fall back to error code
          errorMessage = translatedError !== data.errorKey ? translatedError : data.error;

          // Add remaining attempts info for incorrect code
          if (data.remainingAttempts !== undefined && data.remainingAttempts > 0) {
            errorMessage += ` (${t('auth.attempts_remaining', { count: data.remainingAttempts.toString() })})`;
          }
        } else {
          errorMessage = data.error || t('auth.error_verification_code');
        }

        console.error('[Verification] Error:', data.error);
        throw new Error(errorMessage);
      }

      return data.verified === true;
    } catch (error) {
      console.error('[Verification] Error verifying code:', error);
      throw error;
    }
  };

  const checkTrustedDevice = async (deviceFingerprint: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .maybeSingle();

      if (error) {
        console.error('[TrustedDevice] Error checking device:', error);
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
      console.error('[TrustedDevice] Error checking device:', error);
      return false;
    }
  };

  const addTrustedDevice = async (deviceFingerprint: string, deviceName: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .upsert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_name: deviceName,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_fingerprint',
        });

      if (error) {
        console.error('[TrustedDevice] Error adding device:', error);
        throw error;
      }
    } catch (error) {
      console.error('[TrustedDevice] Error adding device:', error);
      throw error;
    }
  };

  const cleanupOrphanUser = async (userId: string): Promise<void> => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-orphan-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error('[Cleanup] Error:', data.error);
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  };

  const signOut = async () => {
    try {
      // Réinitialiser immédiatement les états locaux
      setUserProfile(null);
      setUser(null);
      setSession(null);

      // Purger le cache React Query pour éviter la fuite de données entre comptes
      try {
        const { queryClient } = await import('@/app/_layout');
        queryClient.clear();
        console.log('[SignOut] React Query cache cleared');
      } catch (queryError) {
        console.error('[SignOut] React Query cache clear error:', queryError);
      }

      // Purger toutes les clés AsyncStorage liées à l'utilisateur
      try {
        await AsyncStorage.multiRemove([
          'supabase.auth.token',
          '@supabase.auth.token',
          'healthscan_badges', // BadgeContext cache
        ]);
        console.log('[SignOut] AsyncStorage cleaned');
      } catch (storageError) {
        console.error('[SignOut] AsyncStorage cleanup error:', storageError);
      }

      // Déconnecter de Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('[SignOut] Supabase sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SignOut] Error during sign out:', error);
      // S'assurer que les états sont réinitialisés même en cas d'erreur
      setUserProfile(null);
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  const isEmailVerified = userProfile?.email_verified ?? false;

  return (
    <AuthContext.Provider value={{
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
      updateUserProfile,
      refreshUserProfile,
      isDisposableEmail,
      sendVerificationEmail,
      verifyEmailCode,
      checkTrustedDevice,
      addTrustedDevice,
      cleanupOrphanUser,
    }}>
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
