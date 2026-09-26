// @ts-check
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider.js';
import { useConnectivityStore } from '../../stores/connectivity.js';
import { Text } from '../ui/Text.js';

/**
 * Persistent banner shown while the device is offline. Source:
 * docs/architecture.md §6.4 "Offline": "OfflineBanner. Queries pause.
 * Mutations fail fast with a retry CTA." Mounted once in `app/_layout.js`
 * so it appears above every screen.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  if (isOnline) {
    return null;
  }

  return (
    <View
      testID="offline-banner"
      style={{
        backgroundColor: theme.colors.warning,
        paddingVertical: theme.spacing.xs,
        alignItems: 'center',
      }}
    >
      <Text size="sm" weight="medium" color="text">
        You're offline. Some things may be out of date.
      </Text>
    </View>
  );
}
