// @ts-check
import { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { palettes, radius, spacing, typography } from './tokens.js';
import { usePreferencesStore } from '../stores/preferences.js';

/**
 * @typedef {import('./tokens.js').ColorScheme} ColorScheme
 * @typedef {Object} Theme
 * @property {ColorScheme} scheme
 * @property {typeof palettes.light} colors
 * @property {typeof spacing} spacing
 * @property {typeof radius} radius
 * @property {typeof typography} typography
 */

const ThemeContext = createContext(/** @type {Theme | null} */ (null));

/**
 * Resolves the effective light/dark scheme from the user's preference
 * ('system' | 'light' | 'dark') and the OS setting, per
 * docs/architecture.md §6.3 "theme/ ... light/dark/system". `systemScheme`
 * is RN's `ColorSchemeName`, which on Android can also report
 * `'unspecified'` — anything other than exactly `'dark'` falls back to light.
 * @param {import('../stores/preferences.js').ThemePreference} preference
 * @param {import('react-native').ColorSchemeName} systemScheme
 * @returns {ColorScheme}
 */
export function resolveColorScheme(preference, systemScheme) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const systemScheme = useSystemColorScheme();
  const themePreference = usePreferencesStore((state) => state.themePreference);

  const scheme = resolveColorScheme(themePreference, systemScheme);

  const theme = useMemo(
    () =>
      /** @type {Theme} */ ({
        scheme,
        colors: palettes[scheme],
        spacing,
        radius,
        typography,
      }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** @returns {Theme} */
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
