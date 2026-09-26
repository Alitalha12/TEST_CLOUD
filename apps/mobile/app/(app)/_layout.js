// @ts-check
import { Stack } from 'expo-router';
import { GroupGuard } from '../../src/lib/navigation/GroupGuard.js';

/** Only reachable while `session.status === 'ready'`. */
export default function AppLayout() {
  return (
    <GroupGuard group="app">
      <Stack screenOptions={{ headerShown: false }} />
    </GroupGuard>
  );
}
