// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../src/test-utils/renderWithTheme.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

jest.mock('../../src/features/meta/queries.js', () => ({
  useDepartmentsQuery: jest.fn(),
  useInterestsQuery: jest.fn(),
}));
jest.mock('../../src/features/profile/queries.js', () => ({
  useCreateProfileMutation: jest.fn(),
}));
jest.mock('../../src/stores/session.js', () => ({
  useSessionStore: jest.fn(),
}));

import { useDepartmentsQuery, useInterestsQuery } from '../../src/features/meta/queries.js';
import { useCreateProfileMutation } from '../../src/features/profile/queries.js';
import { useSessionStore } from '../../src/stores/session.js';
import InterestsScreen from './interests.js';

const DEPARTMENTS = [{ id: 'dept-1', name: 'Computer Science' }];
const INTERESTS = [
  { id: 'int-1', slug: 'ai-ml', name: 'AI/ML', category: 'Technology' },
  { id: 'int-2', slug: 'gaming', name: 'Gaming', category: 'Entertainment' },
];

const initialDraftState = useOnboardingDraftStore.getState();
const mutateAsync = /** @type {any} */ (jest.fn());
const setStatus = /** @type {any} */ (jest.fn());

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingDraftStore.setState(initialDraftState, true);
  useOnboardingDraftStore.getState().acceptGuidelines();
  useOnboardingDraftStore
    .getState()
    .selectOption({ name: 'Anonymous Fox #2841', avatarColor: 'CORAL' });

  jest.mocked(useDepartmentsQuery).mockReturnValue(/** @type {any} */ ({ data: DEPARTMENTS }));
  jest.mocked(useInterestsQuery).mockReturnValue(/** @type {any} */ ({ data: INTERESTS }));
  mutateAsync.mockResolvedValue({});
  jest
    .mocked(useCreateProfileMutation)
    .mockReturnValue(/** @type {any} */ ({ mutateAsync, isPending: false }));
  /** @type {any} */
  const sessionSelectorImpl = (/** @type {any} */ selector) => selector({ setStatus });
  jest.mocked(useSessionStore).mockImplementation(sessionSelectorImpl);
});

describe('InterestsScreen', () => {
  it('submits the profile with the selected identity plus department/semester/interests', async () => {
    const { getByText } = await renderWithTheme(<InterestsScreen />);

    await fireEvent.press(getByText('Computer Science'));
    await fireEvent.press(getByText('3'));
    await fireEvent.press(getByText('AI/ML'));
    await fireEvent.press(getByText('Finish'));

    expect(mutateAsync).toHaveBeenCalledWith({
      selectedName: 'Anonymous Fox #2841',
      avatarColor: 'CORAL',
      acceptedGuidelines: true,
      departmentId: 'dept-1',
      semester: 3,
      interestIds: ['int-1'],
    });
  });

  it('moves the session to ready on success', async () => {
    const { getByText } = await renderWithTheme(<InterestsScreen />);
    await fireEvent.press(getByText('Finish'));
    expect(setStatus).toHaveBeenCalledWith('ready');
  });

  it('shows the server error message and does not advance on failure', async () => {
    mutateAsync.mockRejectedValue(new Error('That name was just taken. Please pick again.'));
    const { getByText, findByText } = await renderWithTheme(<InterestsScreen />);

    await fireEvent.press(getByText('Finish'));

    expect(await findByText('That name was just taken. Please pick again.')).toBeTruthy();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('caps interests at the max and toggles them off again', async () => {
    const { getByText } = await renderWithTheme(<InterestsScreen />);
    await fireEvent.press(getByText('AI/ML'));
    await fireEvent.press(getByText('Gaming'));
    expect(getByText('Interests (2/8)')).toBeTruthy();

    await fireEvent.press(getByText('AI/ML'));
    expect(getByText('Interests (1/8)')).toBeTruthy();
  });
});
