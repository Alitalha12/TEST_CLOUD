// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../src/test-utils/renderWithTheme.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../../src/features/profile/api.js', () => ({
  fetchProfileOptions: jest.fn(),
}));

import { fetchProfileOptions } from '../../src/features/profile/api.js';
import IdentityScreen from './identity.js';

const OPTIONS = {
  options: [
    { name: 'Anonymous Fox #2841', avatarColor: 'CORAL' },
    { name: 'Anonymous Owl #7710', avatarColor: 'TEAL' },
    { name: 'Anonymous Wolf #1203', avatarColor: 'SLATE' },
  ],
  expiresAt: new Date().toISOString(),
};

const initialDraftState = useOnboardingDraftStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockClear();
  useOnboardingDraftStore.setState(initialDraftState, true);
  jest.mocked(fetchProfileOptions).mockResolvedValue(OPTIONS);
});

describe('IdentityScreen', () => {
  it('loads and shows 3 generated options, disabling Continue until one is picked', async () => {
    const { findByText, getByText } = await renderWithTheme(<IdentityScreen />);

    expect(await findByText('Anonymous Fox #2841')).toBeTruthy();
    expect(getByText('Anonymous Owl #7710')).toBeTruthy();
    expect(getByText('Anonymous Wolf #1203')).toBeTruthy();

    await fireEvent.press(getByText('Continue'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('selecting an option and continuing stores it and navigates to interests', async () => {
    const { findByText, getByText } = await renderWithTheme(<IdentityScreen />);

    await findByText('Anonymous Owl #7710');
    await fireEvent.press(getByText('Anonymous Owl #7710'));
    await fireEvent.press(getByText('Continue'));

    expect(useOnboardingDraftStore.getState().selectedOption).toEqual({
      name: 'Anonymous Owl #7710',
      avatarColor: 'TEAL',
    });
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/interests');
  });

  it('regenerating fetches a fresh batch and clears the current selection', async () => {
    const { findByText, getByText } = await renderWithTheme(<IdentityScreen />);

    await findByText('Anonymous Fox #2841');
    await fireEvent.press(getByText('Anonymous Fox #2841'));

    jest.mocked(fetchProfileOptions).mockResolvedValue({
      options: [
        { name: 'Anonymous Bear #1111', avatarColor: 'MOSS' },
        { name: 'Anonymous Deer #2222', avatarColor: 'ROSE' },
        { name: 'Anonymous Elk #3333', avatarColor: 'AMBER' },
      ],
      expiresAt: new Date().toISOString(),
    });
    await fireEvent.press(getByText('Regenerate options'));

    expect(await findByText('Anonymous Bear #1111')).toBeTruthy();
    expect(fetchProfileOptions).toHaveBeenCalledTimes(2);

    // Continue should be disabled again since the selection was cleared.
    await fireEvent.press(getByText('Continue'));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
