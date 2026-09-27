// @ts-check
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../src/test-utils/renderWithTheme.js';
import { useOnboardingDraftStore } from '../../src/features/onboarding/store.js';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import GuidelinesScreen from './guidelines.js';

const initialDraftState = useOnboardingDraftStore.getState();

beforeEach(() => {
  mockPush.mockClear();
  useOnboardingDraftStore.setState(initialDraftState, true);
});

describe('GuidelinesScreen', () => {
  it('disables continue until the 18+/guidelines checkbox is checked', async () => {
    const { getByText } = await renderWithTheme(<GuidelinesScreen />);
    const continueButton = getByText('I agree, continue');

    await fireEvent.press(continueButton);
    expect(mockPush).not.toHaveBeenCalled();
    expect(useOnboardingDraftStore.getState().acceptedGuidelines).toBe(false);
  });

  it('checking the box then continuing accepts guidelines and navigates to identity', async () => {
    const { getByText } = await renderWithTheme(<GuidelinesScreen />);

    await fireEvent.press(getByText(/18 or older/));
    await fireEvent.press(getByText('I agree, continue'));

    expect(useOnboardingDraftStore.getState().acceptedGuidelines).toBe(true);
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/identity');
  });
});
