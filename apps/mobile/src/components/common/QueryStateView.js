// @ts-check
import { View } from 'react-native';
import { Skeleton } from '../ui/Skeleton.js';
import { EmptyState } from './EmptyState.js';
import { ErrorState } from './ErrorState.js';
import { getErrorMessage } from '../../lib/api/errors.js';

/**
 * The shared list/detail loading pattern every screen that reads server
 * data uses. Source: docs/architecture.md §6.4 "Loading/empty/error: Every
 * list screen uses a shared `QueryStateView` pattern: skeleton -> content
 * / EmptyState (with a CTA) / ErrorState (with retry). Never a blank
 * screen (plan §69)."
 *
 * @template T
 * @param {{
 *   isLoading: boolean,
 *   error: unknown,
 *   data: T[] | undefined,
 *   onRetry: () => void,
 *   renderContent: (data: T[]) => import('react').ReactNode,
 *   emptyTitle?: string,
 *   emptyDescription?: string,
 * }} props
 */
export function QueryStateView({
  isLoading,
  error,
  data,
  onRetry,
  renderContent,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
}) {
  if (isLoading) {
    return (
      <View style={{ gap: 12 }} testID="query-state-loading">
        <Skeleton height={64} />
        <Skeleton height={64} />
        <Skeleton height={64} />
      </View>
    );
  }

  if (error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return renderContent(data);
}
