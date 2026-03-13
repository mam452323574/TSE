import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  isPublicRoute,
  isEmailVerificationRoute,
  isProfileSetupRoute,
  isProtectedRoute,
  isSpecialRoute,
} from '@/constants/routes';

// Configuration de la détection de boucles
const LOOP_DETECTION = {
  THRESHOLD: 5,
  TIME_WINDOW: 1000,
} as const;

interface NavigationState {
  redirectCount: number;
  loopDetected: boolean;
  forceLogout: boolean;
}

/**
 * Hook personnalisé pour gérer la navigation protégée
 * Gère les redirections selon l'état d'authentification et détecte les boucles
 */
export function useProtectedRoute() {
  const { user, userProfile, loading, isEmailVerified, signOut } = useAuth();
  const { t } = useLanguage();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [state, setState] = useState<NavigationState>({
    redirectCount: 0,
    loopDetected: false,
    forceLogout: false,
  });

  const lastRedirectTime = useRef<number>(0);

  // Vérifier si le routeur est prêt
  const isRouterReady = navigationState?.key != null;

  // Détermine l'état actuel de la route
  const getCurrentRouteState = useCallback(() => {
    const currentSegment = segments[0] || '';

    return {
      isPublic: isPublicRoute(currentSegment),
      isEmailVerification: isEmailVerificationRoute(currentSegment),
      isProfileSetup: isProfileSetupRoute(currentSegment),
      isProtected: isProtectedRoute(currentSegment),
      isSpecial: isSpecialRoute(currentSegment),
      segment: currentSegment,
    };
  }, [segments]);

  // Détermine l'état d'authentification de l'utilisateur
  const getAuthState = useCallback(() => {
    return {
      isAuthenticated: !!user,
      hasProfile: !!userProfile,
      isVerified: isEmailVerified,
      hasUsername: !!userProfile?.username,
      userEmail: user?.email || '',
      userId: user?.id || '',
    };
  }, [user, userProfile, isEmailVerified]);

  // Effectue une redirection sécurisée
  const safeRedirect = useCallback((path: string, params?: Record<string, string>) => {
    const now = Date.now();
    lastRedirectTime.current = now;

    if (params) {
      router.replace({ pathname: path as any, params });
    } else {
      router.replace(path as any);
    }
  }, [router]);

  // Réinitialise l'état de détection de boucles
  const resetLoopDetection = useCallback(() => {
    setState(prev => ({
      ...prev,
      redirectCount: 0,
      loopDetected: false,
    }));
  }, []);

  // Gère la déconnexion d'urgence
  const handleEmergencyLogout = useCallback(async () => {
    try {
      console.log('[Navigation] Emergency logout initiated');
      await signOut();
      setState(prev => ({ ...prev, forceLogout: true }));
    } catch (error) {
      console.error('[Navigation] Error during emergency logout:', error);
      setState(prev => ({ ...prev, forceLogout: true }));
    }
  }, [signOut]);

  // Affiche l'alerte de boucle détectée
  const showLoopAlert = useCallback(() => {
    Alert.alert(
      t('navigation.loop_error_title'),
      t('navigation.loop_error_msg'),
      [
        {
          text: t('navigation.logout_btn'),
          style: 'destructive',
          onPress: handleEmergencyLogout,
        },
        {
          text: t('settings.cancel'),
          style: 'cancel',
          onPress: resetLoopDetection,
        },
      ]
    );
  }, [handleEmergencyLogout, resetLoopDetection]);

  // Logique principale de navigation
  useEffect(() => {
    // Attendre que le routeur soit prêt
    if (!isRouterReady) return;

    // Gestion du logout forcé
    if (state.forceLogout) {
      setState({
        redirectCount: 0,
        loopDetected: false,
        forceLogout: false,
      });
      router.replace('/login');
      return;
    }

    // Attendre le chargement de l'authentification
    if (loading) return;

    const routeState = getCurrentRouteState();
    const authState = getAuthState();
    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;

    // Ignorer les routes spéciales pour éviter les boucles
    if ((routeState.segment as string) === '+not-found' || (routeState.segment as string) === 'index' || (routeState.segment as string) === '') {
      return;
    }

    // Détection des boucles de redirection
    if (timeSinceLastRedirect < LOOP_DETECTION.TIME_WINDOW) {
      if (!routeState.isProtected && !routeState.isPublic) {
        setState(prev => ({ ...prev, redirectCount: prev.redirectCount + 1 }));
      }
    } else if (routeState.isProtected || routeState.isPublic) {
      if (state.redirectCount > 0) {
        resetLoopDetection();
      }
    }

    // Alerte si boucle détectée
    if (state.redirectCount >= LOOP_DETECTION.THRESHOLD && !state.loopDetected) {
      console.error('[Navigation] LOOP DETECTED - Too many redirects!');
      setState(prev => ({ ...prev, loopDetected: true }));
      showLoopAlert();
      return;
    }

    // STOP si boucle déjà détectée
    if (state.loopDetected) return;

    // === LOGIQUE DE REDIRECTION ===

    // 1. Utilisateur non authentifié sur route protégée → Login
    if (!authState.isAuthenticated) {
      if (!routeState.isPublic && !routeState.isEmailVerification) {
        safeRedirect('/login');
      }
      return;
    }

    // 2. Utilisateur authentifié mais email non vérifié → Vérification
    if (authState.hasProfile && !authState.isVerified) {
      if (!routeState.isEmailVerification && !routeState.isPublic) {
        safeRedirect('/email-verification', {
          email: authState.userEmail,
          userId: authState.userId,
          type: 'signup',
        });
      }
      return;
    }

    // 3. Email vérifié mais pas de username → Configuration du profil
    if (authState.isVerified && !authState.hasUsername) {
      if (!routeState.isProfileSetup && !routeState.isEmailVerification) {
        safeRedirect('/username-setup');
      }
      return;
    }

    // 4. Utilisateur complètement authentifié sur une route publique → Home
    if (authState.isVerified && authState.hasUsername) {
      if (routeState.isPublic) {
        safeRedirect('/(tabs)');
      }
    }
  }, [
    user,
    userProfile,
    loading,
    isEmailVerified,
    segments,
    state.redirectCount,
    state.forceLogout,
    state.loopDetected,
    getCurrentRouteState,
    getAuthState,
    safeRedirect,
    resetLoopDetection,
    showLoopAlert,
    router,
    isRouterReady,
  ]);

  return {
    isLoading: loading,
    isLoopDetected: state.loopDetected,
  };
}
