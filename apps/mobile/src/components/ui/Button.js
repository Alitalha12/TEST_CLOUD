// @ts-check
import { ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from './Text.js';

/**
 * @typedef {'primary' | 'secondary' | 'danger'} ButtonVariant
 */

const VARIANT_COLORS = /** @type {const} */ ({
  primary: { background: 'primary', text: 'primaryText' },
  secondary: { background: 'surfaceAlt', text: 'text' },
  danger: { background: 'danger', text: 'primaryText' },
});

/**
 * @param {{
 *   title: string,
 *   onPress: () => void,
 *   variant?: ButtonVariant,
 *   disabled?: boolean,
 *   loading?: boolean,
 *   testID?: string,
 * }} props
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}) {
  const theme = useTheme();
  const { background, text } = VARIANT_COLORS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: theme.colors[background],
        opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
        paddingVertical: theme.spacing.sm + 4,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: theme.spacing.xs,
      })}
    >
      {loading ? <ActivityIndicator color={theme.colors[text]} /> : null}
      <Text size="md" weight="medium" color={text}>
        {title}
      </Text>
    </Pressable>
  );
}
