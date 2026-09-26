// @ts-check
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';

/**
 * Stub only. The real persona (name, avatar, privacy toggles, edit) is
 * built in P4 (docs/architecture.md §28 P4).
 */
export default function ProfileScreen() {
  return (
    <Screen>
      <EmptyState title="Profile" description="Your anonymous persona arrives in P4." />
    </Screen>
  );
}
