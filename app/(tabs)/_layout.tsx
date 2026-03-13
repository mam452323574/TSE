import { View, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { Home, LineChart, ScanLine } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';



// Create the custom Material Top Tabs navigator
const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

function AnalyticsTabIcon({ size, color }: { size: number; color: string }) {
  const { t } = useLanguage();
  return (
    <View>
      <LineChart size={size} color={color} />
    </View>
  );
}

function ScannerTabIcon({ size, color }: { size: number; color: string }) {
  const { t } = useLanguage();
  return (
    <View>
      <ScanLine size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <MaterialTopTabs
      initialLayout={{ width: Dimensions.get('window').width }}
      tabBarPosition="bottom"
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: isDark ? colors.cardBackground : colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
          paddingBottom: 20, // Adjust for safe area if needed
          height: 80, // Taller bar to accommodate bottom tabs style
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
          top: 0, // Indicator at top of bar like standard tabs? Or bottom?
        },
        tabBarLabelStyle: {
          fontSize: 12,
          textTransform: 'none',
          marginTop: 0,
        },
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        swipeEnabled: true,
        lazy: true, // Load tabs lazily for performance
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="analytics"
        options={{
          title: t('tabs.analytics'),
          tabBarIcon: ({ color }) => (
            <AnalyticsTabIcon size={24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="scanner"
        options={{
          title: t('tabs.scanner'),
          tabBarIcon: ({ color }) => (
            <ScannerTabIcon size={24} color={color} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}
