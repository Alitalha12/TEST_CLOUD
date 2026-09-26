// @ts-check
import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store wrapper — tokens only, per docs/architecture.md §6.3
 * "lib/storage/secure.js: SecureStore wrapper (tokens only)" and §11.3
 * "Mobile keeps both tokens in SecureStore." Theme and other non-sensitive
 * preferences go in AsyncStorage (`lib/storage/prefs.js`, not built yet),
 * never here.
 */

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

/** @returns {Promise<string | null>} */
export function getStoredAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/** @returns {Promise<string | null>} */
export function getStoredRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * @param {{ accessToken: string, refreshToken: string }} tokens
 */
export async function storeTokens({ accessToken, refreshToken }) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearStoredTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
