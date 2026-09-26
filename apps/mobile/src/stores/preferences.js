// @ts-check
import { create } from 'zustand';

/**
 * Non-sensitive UI preferences. Source: docs/architecture.md §6.3
 * "stores/preferences.js". Session status and connectivity have their own
 * stores (session.js, connectivity.js) — this one is UI-only.
 *
 * @typedef {'system' | 'light' | 'dark'} ThemePreference
 * @typedef {Object} PreferencesState
 * @property {ThemePreference} themePreference
 * @property {(preference: ThemePreference) => void} setThemePreference
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<PreferencesState>>} */
export const usePreferencesStore = create((set) => ({
  themePreference: 'system',
  setThemePreference: (themePreference) => set({ themePreference }),
}));
