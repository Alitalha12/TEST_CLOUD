// @ts-check
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { getInitialRouteResult } from '../src/lib/navigation/guards.js';
import { useSessionStore } from '../src/stores/session.js';

/**
 * Redirects to the route group for the current session status, per
 * docs/architecture.md §6.2 "index.js: Redirects by session state". In P2
 * `status` is hard-coded to `unauthenticated` (see src/stores/session.js),
 * so this always lands on `(auth)/welcome` for now.
 */
export default function Index() {
  const status = useSessionStore((state) => state.status);
  const result = getInitialRouteResult(status);

  if (result.type === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={result.href} />;
}
