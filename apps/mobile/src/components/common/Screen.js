// @ts-check
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider.js';

/**
 * The outer wrapper every `app/**` route renders as its top-level element:
 * safe-area insets + themed background + consistent horizontal padding.
 * Source: docs/architecture.md §6.3 "components/common/ ... Screen".
 *
 * @param {{ children: import('react').ReactNode, padded?: boolean }} props
 */
export function Screen({ children, padded = true }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.flex, padded && { padding: theme.spacing.md }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
