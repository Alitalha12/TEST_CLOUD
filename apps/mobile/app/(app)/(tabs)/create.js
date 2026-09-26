// @ts-check
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';

/**
 * Stub only. This tab is meant to open the `post/new` composer modal
 * (docs/architecture.md §6.2), which is built in P6 alongside the feed.
 */
export default function CreateScreen() {
  return (
    <Screen>
      <EmptyState title="Create" description="The post composer arrives in P6." />
    </Screen>
  );
}
