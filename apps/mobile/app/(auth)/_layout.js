// @ts-check
import { Stack } from 'expo-router';
import { GroupGuard } from '../../src/lib/navigation/GroupGuard.js';

/** Only reachable while `session.status === 'unauthenticated'`. */
export default function AuthLayout() {
  return (
    <GroupGuard group="auth">
      <Stack screenOptions={{ headerShown: false }} />
    </GroupGuard>
  );
}
