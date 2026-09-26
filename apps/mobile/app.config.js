// @ts-check

/**
 * Dynamic Expo config — docs/architecture.md §6.1: "app.config.js reads
 * APP_VARIANT (development/preview/production) -> bundle ID suffix, app
 * name, scheme". A plain .js file (not app.json) specifically so the
 * bundle identifier/scheme can differ per build profile, letting a dev
 * build coexist on a phone alongside the production app later.
 *
 * EXPO_PUBLIC_* env vars are NOT read here — Metro inlines
 * `process.env.EXPO_PUBLIC_*` references directly in app code at bundle
 * time, so src/config/env.js reads them directly (see that file).
 */

/** @typedef {'development' | 'preview' | 'production'} AppVariant */

/** @type {AppVariant} */
const APP_VARIANT = /** @type {AppVariant} */ (process.env.APP_VARIANT) ?? 'development';

/** @type {Record<AppVariant, { name: string, androidPackage: string, iosBundleId: string, scheme: string }>} */
const VARIANT_CONFIG = {
  development: {
    name: 'Anonymous Campus (Dev)',
    androidPackage: 'edu.campus.anonymous.dev',
    iosBundleId: 'edu.campus.anonymous.dev',
    scheme: 'campusapp-dev',
  },
  preview: {
    name: 'Anonymous Campus (Preview)',
    androidPackage: 'edu.campus.anonymous.preview',
    iosBundleId: 'edu.campus.anonymous.preview',
    scheme: 'campusapp-preview',
  },
  production: {
    name: 'Anonymous Campus',
    androidPackage: 'edu.campus.anonymous',
    iosBundleId: 'edu.campus.anonymous',
    scheme: 'campusapp',
  },
};

const variant = VARIANT_CONFIG[APP_VARIANT] ?? VARIANT_CONFIG.development;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: variant.name,
  slug: 'anonymous-campus',
  // Kept aligned with apps/server's MIN_APP_VERSION/LATEST_APP_VERSION
  // defaults ("1.0.0") — a mismatch here means the app gets 426
  // UPGRADE_REQUIRED against a correctly-configured local backend for no
  // real reason (docs/architecture.md §7.4 "Min app version").
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: variant.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: variant.iosBundleId,
  },
  android: {
    package: variant.androidPackage,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-image', 'expo-status-bar'],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    appVariant: APP_VARIANT,
  },
};
