// @ts-check
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../../lib/api/client.js';

/**
 * @typedef {Object} OtpRequestResult
 * @property {string} challengeId
 * @property {string} resendAvailableAt
 *
 * @typedef {Object} OtpVerifyResult
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn
 * @property {'NEEDS_PROFILE' | 'COMPLETE'} onboarding
 *
 * @typedef {Object} RefreshResult
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn
 *
 * @typedef {Object} MeResult
 * @property {string} maskedEmail
 * @property {'ACTIVE' | 'RESTRICTED'} status
 * @property {'NEEDS_PROFILE' | 'COMPLETE'} onboarding
 * @property {{ slug: string, name: string }} university
 */

/**
 * `POST /auth/otp/request` (packages/shared/src/schemas/auth.js).
 * @param {string} email
 * @returns {Promise<OtpRequestResult>}
 */
export function requestOtp(email) {
  return apiClient.post('/auth/otp/request', { email });
}

/**
 * Device info sent with every OTP verify (docs/architecture.md §11.2),
 * computed fresh each call rather than cached — cheap, and avoids any
 * import-order assumption about when `expo-constants` is ready.
 */
function getDeviceInfo() {
  return {
    platform: /** @type {'ANDROID' | 'IOS'} */ (Platform.OS === 'ios' ? 'IOS' : 'ANDROID'),
    label: Constants.deviceName ?? `${Platform.OS} device`,
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
  };
}

/**
 * `POST /auth/otp/verify`.
 * @param {{ challengeId: string, code: string }} params
 * @returns {Promise<OtpVerifyResult>}
 */
export function verifyOtp({ challengeId, code }) {
  return apiClient.post('/auth/otp/verify', { challengeId, code, device: getDeviceInfo() });
}

/**
 * `POST /auth/refresh`.
 * @param {string} refreshToken
 * @returns {Promise<RefreshResult>}
 */
export function refreshSession(refreshToken) {
  return apiClient.post('/auth/refresh', { refreshToken });
}

/**
 * `POST /auth/logout`. Revokes the current session.
 * @returns {Promise<Record<string, never>>}
 */
export function logout() {
  return apiClient.post('/auth/logout');
}

/**
 * `GET /api/v1/me`.
 * @returns {Promise<MeResult>}
 */
export function getMe() {
  return apiClient.get('/me');
}
