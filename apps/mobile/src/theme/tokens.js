// @ts-check
/**
 * Design tokens shared by every component in src/components/ui and
 * src/components/common. Source: docs/architecture.md §6.3 "theme/".
 *
 * Keep values here, never inline in a component — a color or spacing
 * value hard-coded in a component is how the light/dark themes drift.
 */

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
});

export const radius = Object.freeze({
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
});

export const typography = Object.freeze({
  family: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  /** @type {Record<'regular' | 'medium' | 'bold', import('react-native').TextStyle['fontWeight']>} */
  weight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
});

const lightColors = Object.freeze({
  background: '#FFFFFF',
  surface: '#F5F6F8',
  surfaceAlt: '#E9EBEF',
  border: '#DADEE4',
  text: '#14171A',
  textMuted: '#5B6470',
  primary: '#3B5BFD',
  primaryText: '#FFFFFF',
  danger: '#D9483B',
  success: '#1F9254',
  warning: '#B8830B',
  overlay: 'rgba(20, 23, 26, 0.5)',
  skeleton: '#E4E6EA',
});

const darkColors = Object.freeze({
  background: '#0E1013',
  surface: '#191C20',
  surfaceAlt: '#23262B',
  border: '#2E3238',
  text: '#F2F3F5',
  textMuted: '#9AA2AC',
  primary: '#7C93FF',
  primaryText: '#0E1013',
  danger: '#FF7A6E',
  success: '#4FD489',
  warning: '#E4B24C',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#23262B',
});

export const palettes = Object.freeze({
  light: lightColors,
  dark: darkColors,
});

/** @typedef {keyof typeof lightColors} ColorToken */
/** @typedef {'light' | 'dark'} ColorScheme */
