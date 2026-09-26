// @ts-check
import { create } from 'zustand';
import { setApiClientTokenProvider } from '../lib/api/client.js';
import { clearStoredTokens, getStoredRefreshToken } from '../lib/storage/secure.js';
import { getMe, logout as logoutRequest } from '../features/auth/api.js';
import {
  authTokenProvider,
  setCachedAccessToken,
  setOnSessionExpired,
} from '../features/auth/tokenProvider.js';

/**
 * Session status state machine. Source: docs/architecture.md §6.4 "Auth
 * state": `booting -> unauthenticated | needs_onboarding | ready`.
 *
 * @typedef {'booting' | 'unauthenticated' | 'needs_onboarding' | 'ready'} SessionStatus
 * @typedef {Object} SessionState
 * @property {SessionStatus} status
 * @property {(status: SessionStatus) => void} setStatus
 * @property {() => Promise<void>} bootstrap
 * @property {() => Promise<void>} logout
 */

/** @type {import('zustand').UseBoundStore<import('zustand').StoreApi<SessionState>>} */
export const useSessionStore = create((set, get) => ({
  status: 'booting',
  setStatus: (status) => set({ status }),

  /**
   * Runs once on app launch (called from `app/_layout.js`): install the
   * real token provider, read the stored refresh token, and — if one
   * exists — try to turn it into a live session. Any failure along the
   * way (no token, a dead/reused refresh token, `/me` erroring) lands on
   * 'unauthenticated', never stuck on 'booting'.
   */
  bootstrap: async () => {
    setApiClientTokenProvider(authTokenProvider);
    setOnSessionExpired(() => get().setStatus('unauthenticated'));

    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      get().setStatus('unauthenticated');
      return;
    }

    try {
      // The token provider's own refreshAccessToken() reads the token
      // from SecureStore itself and persists the rotated pair — calling
      // it here (rather than hitting POST /auth/refresh directly) means
      // there's exactly one place that owns "what a successful refresh
      // does to storage and the in-memory access-token cache".
      await authTokenProvider.refreshAccessToken();
      setCachedAccessToken(authTokenProvider.getAccessToken());

      const me = await getMe();
      get().setStatus(me.onboarding === 'COMPLETE' ? 'ready' : 'needs_onboarding');
    } catch {
      // Called directly here (not through the axios interceptor), so
      // onRefreshFailure never fires on its own — clear storage
      // ourselves. Covers both a dead/reused refresh token and a
      // successful refresh followed by a failing `/me` call; either way
      // there's no usable session.
      setCachedAccessToken(null);
      await clearStoredTokens();
      get().setStatus('unauthenticated');
    }
  },

  /**
   * `POST /auth/logout` (docs/architecture.md §11.3), then forgets the
   * device's tokens regardless of whether the server call succeeded — a
   * user tapping "log out" while offline should still end up logged out
   * locally rather than stuck.
   */
  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Best-effort — see doc comment above.
    }
    setCachedAccessToken(null);
    await clearStoredTokens();
    get().setStatus('unauthenticated');
  },
}));
