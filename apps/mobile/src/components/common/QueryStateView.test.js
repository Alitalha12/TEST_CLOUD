// @ts-check
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderWithTheme } from '../../test-utils/renderWithTheme.js';
import { ApiError } from '../../lib/api/client.js';
import { QueryStateView } from './QueryStateView.js';

describe('QueryStateView', () => {
  it('shows skeletons while loading', async () => {
    const { getByTestId } = await renderWithTheme(
      <QueryStateView
        isLoading
        error={null}
        data={undefined}
        onRetry={() => {}}
        renderContent={() => <Text>content</Text>}
      />,
    );

    expect(getByTestId('query-state-loading')).toBeTruthy();
  });

  it('shows ErrorState with a mapped message when there is an error', async () => {
    const { getByText } = await renderWithTheme(
      <QueryStateView
        isLoading={false}
        error={new ApiError('NETWORK_ERROR', 'connect ECONNREFUSED')}
        data={undefined}
        onRetry={() => {}}
        renderContent={() => <Text>content</Text>}
      />,
    );

    expect(
      getByText('Could not reach the server. Check your connection and try again.'),
    ).toBeTruthy();
  });

  it('shows EmptyState when data is an empty array', async () => {
    const { getByText } = await renderWithTheme(
      <QueryStateView
        isLoading={false}
        error={null}
        data={[]}
        onRetry={() => {}}
        emptyTitle="Nothing to see"
        renderContent={() => <Text>content</Text>}
      />,
    );

    expect(getByText('Nothing to see')).toBeTruthy();
  });

  it('renders content when data is present', async () => {
    const { getByText } = await renderWithTheme(
      <QueryStateView
        isLoading={false}
        error={null}
        data={['a']}
        onRetry={() => {}}
        renderContent={(data) => <Text>{`items: ${data.join(',')}`}</Text>}
      />,
    );

    expect(getByText('items: a')).toBeTruthy();
  });

  it('calls onRetry from the ErrorState CTA', async () => {
    const onRetry = jest.fn();
    const { getByText } = await renderWithTheme(
      <QueryStateView
        isLoading={false}
        error={new Error('boom')}
        data={undefined}
        onRetry={onRetry}
        renderContent={() => <Text>content</Text>}
      />,
    );

    await fireEvent.press(getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
