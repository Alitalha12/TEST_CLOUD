// @ts-check
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';

/**
 * Stub only. Conversations + Requests segments and 1-to-1 chat are built
 * in P8 (docs/architecture.md §28 P8).
 */
export default function ChatsScreen() {
  return (
    <Screen>
      <EmptyState title="Chats" description="Anonymous 1-to-1 chat arrives in P8." />
    </Screen>
  );
}
