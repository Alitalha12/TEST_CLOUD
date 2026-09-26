// @ts-check
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { Text } from './Text.js';

/**
 * Placeholder for another user's identity: a colored circle with an
 * initial, never a photo. Source: docs/architecture.md §3.2 "Identity
 * model" — personas have a generated pseudonym and avatar color, never a
 * real photo. The actual color/pseudonym come from the profiles module
 * (P4); this component just renders whatever it's given.
 *
 * @param {{
 *   label: string,
 *   color?: string,
 *   size?: number,
 * }} props
 */
export function AnonymousAvatar({ label, color, size = 40 }) {
  const theme = useTheme();
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={size >= 40 ? 'md' : 'sm'} weight="bold" color="primaryText">
        {initial}
      </Text>
    </View>
  );
}
