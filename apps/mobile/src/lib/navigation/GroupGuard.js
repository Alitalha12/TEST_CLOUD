// @ts-check
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSessionStore } from '../../stores/session.js';
import { getGroupGuardResult } from './guards.js';

/**
 * Thin binding between the pure `getGroupGuardResult` logic and Expo
 * Router, used by each route group's `_layout.js`
 * ((auth)/(onboarding)/(app)). Kept separate from the guard logic itself
 * so that logic can be unit-tested without rendering this component.
 *
 * @param {{ group: import('./guards.js').RouteGroup, children: import('react').ReactNode }} props
 */
export function GroupGuard({ group, children }) {
  const status = useSessionStore((state) => state.status);
  const result = getGroupGuardResult(status, group);

  if (result.type === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (result.type === 'redirect') {
    return <Redirect href={result.href} />;
  }

  return children;
}
