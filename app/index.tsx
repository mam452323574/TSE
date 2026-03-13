import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Point d'entrée de l'application
 * Redirige vers login ou tabs selon l'état d'authentification
 */
export default function Index() {
  const { user, loading, userProfile, isEmailVerified } = useAuth();
  const { colors } = useTheme();

  // Attendre le chargement de l'auth
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Utilisateur non connecté → Login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Utilisateur connecté mais email non vérifié
  if (userProfile && !isEmailVerified) {
    return <Redirect href="/email-verification" />;
  }

  // Utilisateur connecté mais pas de username
  if (isEmailVerified && !userProfile?.username) {
    return <Redirect href="/username-setup" />;
  }

  // Utilisateur complètement connecté → Tabs
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
