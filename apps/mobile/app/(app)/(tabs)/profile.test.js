// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../src/test-utils/renderWithTheme.js';

jest.mock('../../../src/features/profile/queries.js', () => ({
  useMyProfileQuery: jest.fn(),
  useUpdateProfileMutation: jest.fn(),
  useRenameProfileMutation: jest.fn(),
  useReplaceInterestsMutation: jest.fn(),
}));
jest.mock('../../../src/features/profile/api.js', () => ({
  fetchProfileOptions: jest.fn(),
}));
jest.mock('../../../src/features/meta/queries.js', () => ({
  useDepartmentsQuery: jest.fn(),
  useInterestsQuery: jest.fn(),
}));
jest.mock('../../../src/stores/session.js', () => ({
  useSessionStore: jest.fn(),
}));

import {
  useMyProfileQuery,
  useRenameProfileMutation,
  useReplaceInterestsMutation,
  useUpdateProfileMutation,
} from '../../../src/features/profile/queries.js';
import { useDepartmentsQuery, useInterestsQuery } from '../../../src/features/meta/queries.js';
import { useSessionStore } from '../../../src/stores/session.js';
import ProfileScreen from './profile.js';

const PROFILE = {
  publicId: 'p_abc123',
  displayName: 'Anonymous Fox #2841',
  avatarColor: 'CORAL',
  department: null,
  semester: null,
  showDepartment: true,
  showSemester: true,
  showInterests: true,
  dmPolicy: 'EVERYONE',
  interests: [],
  canRenameAt: new Date(Date.now() - 1000).toISOString(), // already allowed
  createdAt: new Date().toISOString(),
};

const logout = /** @type {any} */ (jest.fn());
const updateMutate = /** @type {any} */ (jest.fn());

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useMyProfileQuery)
    .mockReturnValue(/** @type {any} */ ({ isLoading: false, isError: false, data: PROFILE }));
  jest
    .mocked(useUpdateProfileMutation)
    .mockReturnValue(/** @type {any} */ ({ mutate: updateMutate, isPending: false }));
  jest
    .mocked(useRenameProfileMutation)
    .mockReturnValue(/** @type {any} */ ({ mutateAsync: jest.fn(), isPending: false }));
  jest
    .mocked(useReplaceInterestsMutation)
    .mockReturnValue(/** @type {any} */ ({ mutate: jest.fn(), isPending: false }));
  jest.mocked(useDepartmentsQuery).mockReturnValue(/** @type {any} */ ({ data: [] }));
  jest.mocked(useInterestsQuery).mockReturnValue(/** @type {any} */ ({ data: [] }));
  /** @type {any} */
  const sessionSelectorImpl = (/** @type {any} */ selector) => selector({ logout });
  jest.mocked(useSessionStore).mockImplementation(sessionSelectorImpl);
});

describe('ProfileScreen', () => {
  it('renders the persona and a working logout button', async () => {
    const { getByText } = await renderWithTheme(<ProfileScreen />);
    expect(getByText('Anonymous Fox #2841')).toBeTruthy();

    await fireEvent.press(getByText('Log out'));
    expect(logout).toHaveBeenCalled();
  });

  it('shows a Rename button when the cooldown has elapsed', async () => {
    const { getByText } = await renderWithTheme(<ProfileScreen />);
    expect(getByText('Rename')).toBeTruthy();
  });

  it('shows the cooldown date instead of Rename when still on cooldown', async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    jest.mocked(useMyProfileQuery).mockReturnValue(
      /** @type {any} */ ({
        isLoading: false,
        isError: false,
        data: { ...PROFILE, canRenameAt: future },
      }),
    );
    const { getByText, queryByText } = await renderWithTheme(<ProfileScreen />);
    expect(queryByText('Rename')).toBeNull();
    expect(getByText(/You can rename again on/)).toBeTruthy();
  });

  it('toggling a privacy switch calls the update mutation with just that field', async () => {
    const { getByLabelText } = await renderWithTheme(<ProfileScreen />);
    fireEvent(getByLabelText('Show department to other students'), 'valueChange', false);
    expect(updateMutate).toHaveBeenCalledWith({ showDepartment: false });
  });

  it('toggling "Allow message requests" off sends dmPolicy: NOBODY', async () => {
    const { getByLabelText } = await renderWithTheme(<ProfileScreen />);
    fireEvent(getByLabelText('Allow message requests'), 'valueChange', false);
    expect(updateMutate).toHaveBeenCalledWith({ dmPolicy: 'NOBODY' });
  });
});
