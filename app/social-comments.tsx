import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import SocialCommentsScreen from '@/screens/SocialCommentsScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeatureFlags } from '@/hooks/queries';

export default function SocialCommentsRoute() {
  const { colors } = useTheme();
  const { data: featureFlags, isFetching } = useFeatureFlags();

  if (isFetching && !featureFlags.social_comments_enabled) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!featureFlags.social_comments_enabled) {
    return <Redirect href={'/(tabs)/social' as any} />;
  }

  return <SocialCommentsScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
