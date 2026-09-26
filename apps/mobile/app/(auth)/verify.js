// @ts-check
import { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Input } from '../../src/components/ui/Input.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only. `POST /auth/otp/verify`, the resend timer and real error
 * states (invalid/expired code, rate limited) land in P3
 * (docs/architecture.md §28 P3) — this just proves the screen exists.
 */
export default function VerifyScreen() {
  const theme = useTheme();
  const [code, setCode] = useState('');

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Enter your code
        </Text>
        <Input
          label="6-digit code"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        <Button title="Verify" onPress={() => {}} disabled={code.length !== 6} />
      </View>
    </Screen>
  );
}
