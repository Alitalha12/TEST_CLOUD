// @ts-check
import axios from 'axios';
import Constants from 'expo-constants';
import { getPublicEnv } from '../../config/env.js';

/**
 * The app's own release version, from `app.config.js`'s `version` field
 * (surfaced at runtime via `expo-constants`) — sent as `X-App-Version` on
 * every request so the server's `minAppVersion` middleware can enforce
 * docs/architecture.md §7.4 "Min app version". Falls back to `0.0.0`
 * (always "too old") rather than omitting the header if Constants
 * somehow has no version at all — failing toward "please update" is
 * safer than failing toward "assume current".
 */
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Normalized error thrown by every call through the API client, in place
 * of axios's own error shape. Source: docs/architecture.md §6.3
 * "lib/api/client.js ... error normalization".
 */
export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {{ status?: number, details?: Record<string, unknown>, requestId?: string }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

/**
 * Auth is not built until P3 — this interface exists so the interceptor
 * logic (attach token, 401 -> refresh -> retry) is written once, correctly,
 * now, per docs/architecture.md §28 P2 "refresh logic stubbed behind an
 * interface". P3 replaces this object with one backed by
 * `expo-secure-store` and `POST /auth/refresh`; nothing else in this file
 * changes.
 * @typedef {Object} AuthTokenProvider
 * @property {() => string | null} getAccessToken
 * @property {() => Promise<void>} refreshAccessToken
 * @property {() => void} onRefreshFailure
 */

/** @type {AuthTokenProvider} */
export const stubAuthTokenProvider = {
  getAccessToken: () => null,
  refreshAccessToken: () =>
    Promise.reject(
      new ApiError('NOT_IMPLEMENTED', 'Token refresh is not implemented yet — see P3.'),
    ),
  onRefreshFailure: () => {},
};

/**
 * @param {unknown} envelope
 * @param {number} [status]
 */
function normalizeErrorEnvelope(envelope, status) {
  const error =
    /** @type {{ error?: { code: string, message: string, details?: Record<string, unknown>, requestId?: string } }} */ (
      envelope
    )?.error;
  if (error) {
    return new ApiError(error.code, error.message, {
      status,
      details: error.details,
      requestId: error.requestId,
    });
  }
  return new ApiError('INTERNAL', 'Something went wrong. Please try again.', { status });
}

/**
 * Builds an axios instance that speaks the `{success, data}` /
 * `{success:false, error}` envelope (docs/architecture.md §26) instead of
 * raw HTTP responses: callers get back `data` directly on success, and a
 * thrown `ApiError` on failure — never a raw AxiosError.
 * `axiosConfig` is spread into `axios.create` as-is (e.g. tests pass a
 * custom `adapter` to fake responses without a real network call).
 * @param {{ tokenProvider?: AuthTokenProvider } & import('axios').CreateAxiosDefaults} [options]
 */
export function createApiClient({ tokenProvider = stubAuthTokenProvider, ...axiosConfig } = {}) {
  const instance = axios.create({
    baseURL: getPublicEnv().EXPO_PUBLIC_API_URL,
    timeout: 15000,
    ...axiosConfig,
  });

  instance.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    config.headers['X-App-Version'] = APP_VERSION;
    const token = tokenProvider.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  /** @type {Promise<void> | null} */
  let refreshPromise = null;

  instance.interceptors.response.use(
    (response) => {
      const envelope = response.data;
      if (envelope && envelope.success === true) {
        return envelope.data;
      }
      throw normalizeErrorEnvelope(envelope, response.status);
    },
    async (error) => {
      if (!error.response) {
        throw new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection.');
      }

      const { status, data: envelope } = error.response;
      const code = envelope?.error?.code;
      const config = error.config ?? {};

      // Single-flight refresh: every 401 while a refresh is already in
      // flight awaits the same promise instead of firing its own refresh.
      if (status === 401 && code === 'TOKEN_EXPIRED' && !config.__isRetry) {
        try {
          refreshPromise = refreshPromise ?? tokenProvider.refreshAccessToken();
          await refreshPromise;
          refreshPromise = null;
          return instance({ ...config, __isRetry: true });
        } catch {
          refreshPromise = null;
          tokenProvider.onRefreshFailure();
          throw normalizeErrorEnvelope(envelope, status);
        }
      }

      throw normalizeErrorEnvelope(envelope, status);
    },
  );

  return instance;
}

/**
 * `apiClient`'s provider starts as the stub and is swapped for the real
 * SecureStore-backed one (features/auth/tokenProvider.js) once at app
 * bootstrap, via `setApiClientTokenProvider`. This file never imports
 * that module directly: `tokenProvider.js` needs `features/auth/api.js`,
 * which needs `apiClient` from HERE — importing it back would be a
 * circular import. Delegating through a mutable holder instead lets the
 * real provider be installed from outside without one.
 * @type {AuthTokenProvider}
 */
let activeTokenProvider = stubAuthTokenProvider;

/** @type {AuthTokenProvider} */
const delegatingTokenProvider = {
  getAccessToken: () => activeTokenProvider.getAccessToken(),
  refreshAccessToken: () => activeTokenProvider.refreshAccessToken(),
  onRefreshFailure: () => activeTokenProvider.onRefreshFailure(),
};

export const apiClient = createApiClient({ tokenProvider: delegatingTokenProvider });

/**
 * Installs the real token provider. Call once, as early as possible at
 * app startup (before `useSessionStore`'s `bootstrap()` runs).
 * @param {AuthTokenProvider} provider
 */
export function setApiClientTokenProvider(provider) {
  activeTokenProvider = provider;
}
