// @ts-check
import { TextInput, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from './Text.js';

/**
 * @param {import('react-native').TextInputProps & {
 *   label?: string,
 *   errorMessage?: string,
 * }} props
 */
export function Input({ label, errorMessage, style, ...rest }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      {label ? (
        <Text size="sm" weight="medium" color="textMuted">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: errorMessage ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            fontSize: theme.typography.size.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {errorMessage ? (
        <Text size="xs" color="danger">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
