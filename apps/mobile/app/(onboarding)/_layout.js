// @ts-check
import { Stack } from 'expo-router';
import { GroupGuard } from '../../src/lib/navigation/GroupGuard.js';

/** Only reachable while `session.status === 'needs_onboarding'`. */
export default function OnboardingLayout() {
  return (
    <GroupGuard group="onboarding">
      <Stack screenOptions={{ headerShown: false }} />
    </GroupGuard>
  );
}
