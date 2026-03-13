import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { SCREEN_OPTIONS } from '@/constants/routes';

import { ThemeProvider } from '@/contexts/ThemeContext';

// Configuration du QueryClient avec options par défaut
// Exporté pour permettre l'invalidation du cache lors du signOut
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - les données restent "fraîches"
      retry: 2, // Réessayer 2 fois en cas d'échec
      refetchOnWindowFocus: false, // Pas de refetch auto sur focus (mobile)
    },
  },
});

/**
 * Composant de navigation principale
 * Utilise le hook useProtectedRoute pour gérer les redirections
 */
function RootLayoutNav() {
  // Gère automatiquement les redirections selon l'état d'authentification
  useProtectedRoute();

  // Stack minimal - expo-router découvre automatiquement les routes
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recipes" options={{ presentation: 'modal' }} />
      <Stack.Screen name="exercises" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scan-result" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/**
 * Layout racine de l'application
 * Configure les providers et le boundary d'erreur
 */
export default function RootLayout() {
  useFrameworkReady();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              <NotificationProvider>
                <BadgeProvider>
                  <RootLayoutNav />
                  <StatusBar style="auto" />
                </BadgeProvider>

              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider >
  );
}
