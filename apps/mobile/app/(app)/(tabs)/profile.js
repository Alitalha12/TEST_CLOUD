// @ts-check
import { View } from 'react-native';
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';
import { Button } from '../../../src/components/ui/Button.js';
import { useSessionStore } from '../../../src/stores/session.js';
import { useTheme } from '../../../src/theme/ThemeProvider.js';

/**
 * Stub only. The real persona (name, avatar, privacy toggles, edit) is
 * built in P4 (docs/architecture.md §28 P4). The logout button is
 * temporary here too — it belongs on a real settings screen once one
 * exists, but P3 needs *some* way to end a session for manual testing.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const logout = useSessionStore((state) => state.logout);

  return (
    <Screen>
      <EmptyState title="Profile" description="Your anonymous persona arrives in P4." />
      <View style={{ marginTop: theme.spacing.lg }}>
        <Button title="Log out" variant="secondary" onPress={() => logout()} />
      </View>
    </Screen>
  );
}
