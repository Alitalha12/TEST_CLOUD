// @ts-check
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from '../ui/Text.js';
import { Button } from '../ui/Button.js';

/**
 * Source: docs/architecture.md §6.4 "Loading/empty/error ... ErrorState
 * (with retry)". `message` should already be a user-facing string — map
 * error codes to copy with `lib/api/errors.js` before rendering this.
 *
 * @param {{ message: string, onRetry?: () => void }} props
 */
export function ErrorState({ message, onRetry }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg }}>
      <Text size="lg" weight="bold" color="danger">
        Something went wrong
      </Text>
      <Text size="sm" color="textMuted" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
