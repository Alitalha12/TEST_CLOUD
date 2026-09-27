// @ts-check
import { Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from './Text.js';

/**
 * A small selectable pill — interests multi-select, category filters.
 * Source: docs/architecture.md §6.3 folder structure "Design system:
 * ... Chip, Skeleton" (planned in P2, first built here in P4).
 *
 * @param {{
 *   label: string,
 *   selected?: boolean,
 *   onPress?: () => void,
 *   testID?: string,
 * }} props
 */
export function Chip({ label, selected = false, onPress, testID }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text size="sm" weight="medium" color={selected ? 'primaryText' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}
