// @ts-check
import { Link, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only — real copy/design comes with the rest of P3. The identity
 * line must stay exactly "Your identity is hidden from other students"
 * (never "nobody can identify you"): docs/architecture.md §11.1, because
 * the platform itself can always link a pseudonym back to a verified
 * email for bans/legal/safety.
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xxl" weight="bold">
          Anonymous Campus
        </Text>
        <Text size="md" color="textMuted">
          Your identity is hidden from other students.
        </Text>
        <Button
          title="Continue with university email"
          onPress={() => router.push('/(auth)/email')}
        />
        {__DEV__ ? (
          <Link href="/meta-check" style={{ marginTop: theme.spacing.lg }}>
            <Text size="sm" color="textMuted">
              Dev: API smoke test
            </Text>
          </Link>
        ) : null}
      </View>
    </Screen>
  );
}
