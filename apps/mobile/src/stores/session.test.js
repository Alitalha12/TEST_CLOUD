// @ts-check
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../lib/api/client.js', () => ({
  setApiClientTokenProvider: jest.fn(),
}));
jest.mock('../lib/storage/secure.js', () => ({
  getStoredRefreshToken: jest.fn(),
  clearStoredTokens: jest.fn(() => Promise.resolve()),
}));
jest.mock('../features/auth/api.js', () => ({
  getMe: jest.fn(),
  logout: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../features/auth/tokenProvider.js', () => ({
  authTokenProvider: {
    refreshAccessToken: jest.fn(),
    getAccessToken: jest.fn(() => 'cached-token'),
    onRefreshFailure: jest.fn(),
  },
  setCachedAccessToken: jest.fn(),
  setOnSessionExpired: jest.fn(),
}));

import { useSessionStore } from './session.js';
import { clearStoredTokens, getStoredRefreshToken } from '../lib/storage/secure.js';
import { getMe, logout as logoutRequest } from '../features/auth/api.js';
import { authTokenProvider } from '../features/auth/tokenProvider.js';

const initialState = useSessionStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState(initialState, true);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useSessionStore', () => {
  it('starts in "booting"', () => {
    expect(useSessionStore.getState().status).toBe('booting');
  });

  describe('bootstrap()', () => {
    it('sets "unauthenticated" when there is no stored refresh token, without attempting a refresh', async () => {
      jest.mocked(getStoredRefreshToken).mockResolvedValue(null);

      await useSessionStore.getState().bootstrap();

      expect(useSessionStore.getState().status).toBe('unauthenticated');
      expect(authTokenProvider.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('sets "ready" when refresh succeeds and onboarding is COMPLETE', async () => {
      jest.mocked(getStoredRefreshToken).mockResolvedValue('a-refresh-token');
      jest.mocked(authTokenProvider.refreshAccessToken).mockResolvedValue(undefined);
      jest.mocked(getMe).mockResolvedValue(/** @type {any} */ ({ onboarding: 'COMPLETE' }));

      await useSessionStore.getState().bootstrap();

      expect(useSessionStore.getState().status).toBe('ready');
    });

    it('sets "needs_onboarding" when onboarding is NEEDS_PROFILE', async () => {
      jest.mocked(getStoredRefreshToken).mockResolvedValue('a-refresh-token');
      jest.mocked(authTokenProvider.refreshAccessToken).mockResolvedValue(undefined);
      jest.mocked(getMe).mockResolvedValue(/** @type {any} */ ({ onboarding: 'NEEDS_PROFILE' }));

      await useSessionStore.getState().bootstrap();

      expect(useSessionStore.getState().status).toBe('needs_onboarding');
    });

    it('sets "unauthenticated" and clears storage when the refresh call fails', async () => {
      jest.mocked(getStoredRefreshToken).mockResolvedValue('a-dead-refresh-token');
      jest.mocked(authTokenProvider.refreshAccessToken).mockRejectedValue(new Error('dead token'));

      await useSessionStore.getState().bootstrap();

      expect(useSessionStore.getState().status).toBe('unauthenticated');
      expect(clearStoredTokens).toHaveBeenCalledTimes(1);
    });

    it('sets "unauthenticated" when refresh succeeds but GET /me fails', async () => {
      jest.mocked(getStoredRefreshToken).mockResolvedValue('a-refresh-token');
      jest.mocked(authTokenProvider.refreshAccessToken).mockResolvedValue(undefined);
      jest.mocked(getMe).mockRejectedValue(new Error('me failed'));

      await useSessionStore.getState().bootstrap();

      expect(useSessionStore.getState().status).toBe('unauthenticated');
    });
  });

  describe('logout()', () => {
    it('revokes the session server-side, clears storage, and sets "unauthenticated"', async () => {
      useSessionStore.setState({ status: 'ready' });

      await useSessionStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalledTimes(1);
      expect(clearStoredTokens).toHaveBeenCalledTimes(1);
      expect(useSessionStore.getState().status).toBe('unauthenticated');
    });

    it('still logs out locally even when the server call fails (e.g. offline)', async () => {
      useSessionStore.setState({ status: 'ready' });
      jest.mocked(logoutRequest).mockRejectedValue(new Error('network error'));

      await useSessionStore.getState().logout();

      expect(useSessionStore.getState().status).toBe('unauthenticated');
      expect(clearStoredTokens).toHaveBeenCalledTimes(1);
    });
  });
});
