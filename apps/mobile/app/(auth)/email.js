// @ts-check
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Input } from '../../src/components/ui/Input.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only. `POST /auth/otp/request` and real validation/rate-limit
 * copy (docs/architecture.md §11.2, §28 P3) land in P3 — this just proves
 * the screen and navigation exist.
 */
export default function EmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Your university email
        </Text>
        <Input
          label="Email"
          placeholder="you@university.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button title="Send code" onPress={() => router.push('/(auth)/verify')} />
      </View>
    </Screen>
  );
}
