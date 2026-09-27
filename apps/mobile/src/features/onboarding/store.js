// @ts-check
import { create } from 'zustand';

/**
 * Ephemeral, in-memory state carried across the three onboarding screens
 * (guidelines -> identity -> interests, §6.2) before a single
 * `POST /me/profile` call at the end. Not persisted to disk on purpose:
 * these are draft answers to a form that hasn't been submitted yet, not
 * data worth surviving an app restart — a restart mid-onboarding simply
 * restarts the wizard from `guidelines`, which is an acceptable MVP
 * trade-off (docs/architecture.md §6.3 "store.js: Only if the feature
 * needs local ephemeral state").
 *
 * @typedef {import('../profile/api.js').ProfileOption} ProfileOption
 * @typedef {Object} OnboardingDraftState
 * @property {boolean} acceptedGuidelines
 * @property {ProfileOption | null} selectedOption
 * @property {string | null} departmentId
 * @property {number | null} semester
 * @property {string[]} interestIds
 * @property {() => void} acceptGuidelines
 * @property {(option: ProfileOption) => void} selectOption
 * @property {(departmentId: string | null) => void} setDepartmentId
 * @property {(semester: number | null) => void} setSemester
 * @property {(interestIds: string[]) => void} setInterestIds
 * @property {() => void} reset
 */

const initialState = {
  acceptedGuidelines: false,
  selectedOption: /** @type {ProfileOption | null} */ (null),
  departmentId: /** @type {string | null} */ (null),
  semester: /** @type {number | null} */ (null),
  interestIds: /** @type {string[]} */ ([]),
};

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<OnboardingDraftState>>} */
export const useOnboardingDraftStore = create((set) => ({
  ...initialState,
  acceptGuidelines: () => set({ acceptedGuidelines: true }),
  selectOption: (option) => set({ selectedOption: option }),
  setDepartmentId: (departmentId) => set({ departmentId }),
  setSemester: (semester) => set({ semester }),
  setInterestIds: (interestIds) => set({ interestIds }),
  reset: () => set(initialState),
}));
