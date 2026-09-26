// @ts-check
import { Text as RNText } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';

/**
 * @typedef {'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'} TextSize
 * @typedef {'regular' | 'medium' | 'bold'} TextWeight
 * @typedef {import('../../theme/tokens.js').ColorToken} ColorToken
 */

/**
 * Themed text primitive. Every screen renders copy through this instead of
 * RN's `Text` directly, so size/weight/color stay on the token scale.
 * Source: docs/architecture.md §6.3 "components/ui/ ... Text".
 *
 * @param {import('react-native').TextProps & {
 *   size?: TextSize,
 *   weight?: TextWeight,
 *   color?: ColorToken,
 * }} props
 */
export function Text({ size = 'md', weight = 'regular', color = 'text', style, ...rest }) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        {
          fontSize: theme.typography.size[size],
          fontWeight: theme.typography.weight[weight],
          color: theme.colors[color],
        },
        style,
      ]}
      {...rest}
    />
  );
}
