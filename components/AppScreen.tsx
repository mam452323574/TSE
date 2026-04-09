import { ReactNode, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  topInset?: boolean;
  bottomInset?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function AppScreen({
  children,
  scroll = false,
  keyboard = false,
  topInset = true,
  bottomInset = true,
  contentContainerStyle,
  style,
}: AppScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const insetStyle = useMemo(
    () => ({
      paddingTop: topInset ? insets.top : 0,
      paddingBottom: bottomInset ? insets.bottom : 0,
    }),
    [bottomInset, insets.bottom, insets.top, topInset]
  );

  const scrollContentStyle = useMemo(
    () => [styles.scrollContent, insetStyle, contentContainerStyle],
    [contentContainerStyle, insetStyle]
  );

  const contentStyle = useMemo(
    () => [styles.content, insetStyle, contentContainerStyle],
    [contentContainerStyle, insetStyle]
  );

  let body = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={scrollContentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  if (keyboard) {
    body = (
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.container, { backgroundColor: colors.background }, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
