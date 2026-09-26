// @ts-check
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';

/**
 * Stub only. The real feed (category chips, sort toggle, posts) is built
 * in P6 (docs/architecture.md §28 P6).
 */
export default function FeedScreen() {
  return (
    <Screen>
      <EmptyState title="Feed" description="Posts, categories and sort options arrive in P6." />
    </Screen>
  );
}
