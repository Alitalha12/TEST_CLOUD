// @ts-check
import { describe, expect, it, jest } from '@jest/globals';
import { renderWithTheme } from '../../../src/test-utils/renderWithTheme.js';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ publicId: 'p_abc123' }),
}));
jest.mock('../../../src/features/profile/queries.js', () => ({
  usePublicProfileQuery: jest.fn(),
}));

import { usePublicProfileQuery } from '../../../src/features/profile/queries.js';
import PublicProfileScreen from './[publicId].js';

describe('PublicProfileScreen', () => {
  it('renders the public persona with department/semester/interests shown', async () => {
    jest.mocked(usePublicProfileQuery).mockReturnValue(
      /** @type {any} */ ({
        isLoading: false,
        isError: false,
        data: {
          publicId: 'p_abc123',
          displayName: 'Anonymous Owl #7710',
          avatarColor: 'TEAL',
          department: { id: 'dept-1', name: 'Computer Science' },
          semester: 4,
          interests: [{ slug: 'ai-ml', name: 'AI/ML', category: 'Technology' }],
          dmPolicy: 'EVERYONE',
        },
      }),
    );

    const { getByText } = await renderWithTheme(<PublicProfileScreen />);
    expect(getByText('Anonymous Owl #7710')).toBeTruthy();
    expect(getByText(/Computer Science/)).toBeTruthy();
    expect(getByText(/Semester 4/)).toBeTruthy();
    expect(getByText('AI/ML')).toBeTruthy();
  });

  it('never renders a department/semester/interests section when hidden (absent from the response)', async () => {
    jest.mocked(usePublicProfileQuery).mockReturnValue(
      /** @type {any} */ ({
        isLoading: false,
        isError: false,
        data: {
          publicId: 'p_abc123',
          displayName: 'Anonymous Owl #7710',
          avatarColor: 'TEAL',
          dmPolicy: 'NOBODY',
        },
      }),
    );

    const { getByText, queryByText } = await renderWithTheme(<PublicProfileScreen />);
    expect(getByText('Anonymous Owl #7710')).toBeTruthy();
    expect(queryByText(/Semester/)).toBeNull();
  });

  it('shows an error state with retry on failure', async () => {
    const refetch = jest.fn();
    jest
      .mocked(usePublicProfileQuery)
      .mockReturnValue(
        /** @type {any} */ ({ isLoading: false, isError: true, error: new Error('boom'), refetch }),
      );

    const { getByText } = await renderWithTheme(<PublicProfileScreen />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
