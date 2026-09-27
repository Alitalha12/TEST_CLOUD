// @ts-check
import { beforeEach, describe, expect, it } from '@jest/globals';
import { useOnboardingDraftStore } from './store.js';

const initialState = useOnboardingDraftStore.getState();

beforeEach(() => {
  useOnboardingDraftStore.setState(initialState, true);
});

describe('useOnboardingDraftStore', () => {
  it('starts with nothing accepted or selected', () => {
    const state = useOnboardingDraftStore.getState();
    expect(state.acceptedGuidelines).toBe(false);
    expect(state.selectedOption).toBeNull();
    expect(state.departmentId).toBeNull();
    expect(state.semester).toBeNull();
    expect(state.interestIds).toEqual([]);
  });

  it('acceptGuidelines sets the flag', () => {
    useOnboardingDraftStore.getState().acceptGuidelines();
    expect(useOnboardingDraftStore.getState().acceptedGuidelines).toBe(true);
  });

  it('selectOption stores the chosen name/color pair', () => {
    const option = { name: 'Anonymous Fox #1234', avatarColor: 'CORAL' };
    useOnboardingDraftStore.getState().selectOption(option);
    expect(useOnboardingDraftStore.getState().selectedOption).toEqual(option);
  });

  it('reset clears everything back to the initial state', () => {
    const store = useOnboardingDraftStore.getState();
    store.acceptGuidelines();
    store.selectOption({ name: 'Anonymous Fox #1234', avatarColor: 'CORAL' });
    store.setDepartmentId('dept-1');
    store.setSemester(3);
    store.setInterestIds(['int-1']);

    useOnboardingDraftStore.getState().reset();

    const state = useOnboardingDraftStore.getState();
    expect(state.acceptedGuidelines).toBe(false);
    expect(state.selectedOption).toBeNull();
    expect(state.departmentId).toBeNull();
    expect(state.semester).toBeNull();
    expect(state.interestIds).toEqual([]);
  });
});
