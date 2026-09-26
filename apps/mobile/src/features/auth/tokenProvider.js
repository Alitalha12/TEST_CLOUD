// @ts-check
import { clearStoredTokens, getStoredRefreshToken, storeTokens } from '../../lib/storage/secure.js';
import { refreshSession } from './api.js';

/**
 * Real, SecureStore-backed token provider — replaces
 * `stubAuthTokenProvider` (docs/architecture.md §28 P3). Installed once
 * via `setApiClientTokenProvider` at app bootstrap (see
 * `src/stores/session.js`'s `bootstrap()`).
 *
 * `getAccessToken` must be synchronous (the request interceptor calls it
 * on every request without awaiting), so the current access token is
 * mirrored in this in-memory variable — SecureStore itself is only
 * consulted at bootstrap and on refresh, never per-request.
 * @type {string | null}
 */
let cachedAccessToken = null;

/**
 * Sets the in-memory access token cache without touching SecureStore —
 * used right after `otp/verify` succeeds, where the caller (the verify
 * screen's mutation) already owns writing both tokens to SecureStore via
 * `storeTokens` itself, alongside other post-login setup.
 * @param {string | null} token
 */
export function setCachedAccessToken(token) {
  cachedAccessToken = token;
}

async function refreshAccessToken() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }

  const result = await refreshSession(refreshToken);

  await storeTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
  cachedAccessToken = result.accessToken;
}

/**
 * Called when a refresh fails, so the session store can react (set
 * status to 'unauthenticated'). Wired from `stores/session.js` at module
 * load, rather than importing that store directly here — this module is
 * imported BY `stores/session.js` (for `bootstrap()`), so importing it
 * back would be a circular import.
 * @type {() => void}
 */
let onSessionExpired = () => {};

/** @param {() => void} callback */
export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

function onRefreshFailure() {
  cachedAccessToken = null;
  // Fire-and-forget: nothing meaningful to do if clearing fails, and the
  // session status change below must not wait on it.
  clearStoredTokens().catch(() => {});
  onSessionExpired();
}

/** @type {import('../../lib/api/client.js').AuthTokenProvider} */
export const authTokenProvider = {
  getAccessToken: () => cachedAccessToken,
  refreshAccessToken,
  onRefreshFailure,
};
