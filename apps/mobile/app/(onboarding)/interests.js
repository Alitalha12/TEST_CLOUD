// @ts-check
import { View } from 'react-native';
import { Screen } from '../../src/components/common/Screen.js';
import { Button } from '../../src/components/ui/Button.js';
import { Text } from '../../src/components/ui/Text.js';
import { useTheme } from '../../src/theme/ThemeProvider.js';

/**
 * Stub only. The real department/semester (optional) and interests
 * multi-select, backed by `GET /meta/interests` and `GET /meta/departments`
 * (docs/architecture.md §28 P4), land in P4.
 */
export default function InterestsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing.md }}>
        <Text size="xl" weight="bold">
          Your interests
        </Text>
        <Text size="sm" color="textMuted">
          Department, semester and interest picker go here (P4).
        </Text>
        <Button title="Finish" onPress={() => {}} />
      </View>
    </Screen>
  );
}
