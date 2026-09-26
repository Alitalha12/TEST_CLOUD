// @ts-check
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { useSessionStore } from '../../src/stores/session.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only. The real 18+ confirmation, community guidelines copy and
 * "stable pseudonym" disclosure (docs/architecture.md §28 P4) land in P4.
 * The logout link is temporary — it's the only way to back out of
 * `needs_onboarding` for manual testing until profile creation (P4)
 * gives this state a real exit.
 */
export default function GuidelinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Community guidelines
        </Text>
        <Text size="sm" color="textMuted">
          Guidelines, the 18+ confirmation and privacy explainer go here (P4).
        </Text>
        <Button title="I agree, continue" onPress={() => router.push('/(onboarding)/identity')} />
        <Button title="Log out" variant="secondary" onPress={() => logout()} />
      </View>
    </Screen>
  );
}
