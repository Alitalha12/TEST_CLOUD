// @ts-check
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { AnonymousAvatar } from '../../src/components/ui/AnonymousAvatar.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only. The real name-generator (3 options, uniqueness retry) and
 * avatar color picker (docs/architecture.md §28 P4) land in P4.
 */
export default function IdentityScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Choose your persona
        </Text>
        <AnonymousAvatar label="Fox" size={64} />
        <Button title="Continue" onPress={() => router.push('/(onboarding)/interests')} />
      </View>
    </Screen>
  );
}
