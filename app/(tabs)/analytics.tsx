import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import { useBadges } from '@/contexts/BadgeContext';

export default function AnalyticsTab() {
  const { clearBadge } = useBadges();

  // IMPORTANT: useFocusEffect DOIT utiliser useCallback pour éviter une boucle infinie
  useFocusEffect(
    useCallback(() => {
      clearBadge('analytics');
    }, [clearBadge])
  );

  return <AnalyticsScreen />;
}
