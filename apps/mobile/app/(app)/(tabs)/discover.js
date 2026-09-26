// @ts-check
import { Screen } from '../../../src/components/common/Screen.js';
import { EmptyState } from '../../../src/components/common/EmptyState.js';

/**
 * Stub only. MVP ships "coming soon" sections + trending; Find Someone and
 * communities are V1+ (docs/architecture.md §6.2 route tree comment).
 */
export default function DiscoverScreen() {
  return (
    <Screen>
      <EmptyState title="Discover" description="Trending and more are coming soon." />
    </Screen>
  );
}
