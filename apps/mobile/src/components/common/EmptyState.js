// @ts-check
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from '../ui/Text.js';
import { Button } from '../ui/Button.js';

/**
 * Source: docs/architecture.md §6.4 "Loading/empty/error ... EmptyState
 * (with a CTA)". Never let a list render nothing (plan §69).
 *
 * @param {{ title: string, description?: string, actionLabel?: string, onAction?: () => void }} props
 */
export function EmptyState({ title, description, actionLabel, onAction }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.lg }}>
      <Text size="lg" weight="bold" color="text">
        {title}
      </Text>
      {description ? (
        <Text size="sm" color="textMuted" style={{ textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}
