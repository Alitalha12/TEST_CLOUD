// @ts-check
import { apiClient } from '../../lib/api/client.js';

/**
 * `packages/shared/src/schemas/profile.js` DTOs, mirrored as JSDoc
 * typedefs (docs/architecture.md §28 P4).
 *
 * @typedef {Object} ProfileOption
 * @property {string} name
 * @property {string} avatarColor
 *
 * @typedef {Object} ProfileOptionsResult
 * @property {ProfileOption[]} options
 * @property {string} expiresAt
 *
 * @typedef {Object} DepartmentRef
 * @property {string} id
 * @property {string} name
 *
 * @typedef {Object} InterestRef
 * @property {string} slug
 * @property {string} name
 * @property {string | null} category
 *
 * @typedef {Object} MyProfile
 * @property {string} publicId
 * @property {string} displayName
 * @property {string} avatarColor
 * @property {DepartmentRef | null} department
 * @property {number | null} semester
 * @property {boolean} showDepartment
 * @property {boolean} showSemester
 * @property {boolean} showInterests
 * @property {'EVERYONE' | 'NOBODY'} dmPolicy
 * @property {InterestRef[]} interests
 * @property {string} canRenameAt
 * @property {string} createdAt
 *
 * @typedef {Object} PublicProfile
 * @property {string} publicId
 * @property {string} displayName
 * @property {string} avatarColor
 * @property {DepartmentRef} [department]
 * @property {number} [semester]
 * @property {InterestRef[]} [interests]
 * @property {'EVERYONE' | 'NOBODY'} dmPolicy
 *
 * @typedef {Object} Settings
 * @property {Record<string, unknown>} notificationPrefs
 * @property {'NONE' | 'SENDER_ONLY'} pushPreview
 * @property {string | null} theme
 */

/**
 * `GET /me/profile/options`. Callable any time (the "regenerate" button)
 * — each call overwrites the server's previously issued batch.
 * @returns {Promise<ProfileOptionsResult>}
 */
export function fetchProfileOptions() {
  return apiClient.get('/me/profile/options');
}

/**
 * `POST /me/profile`. `selectedName`/`avatarColor` must be exactly one of
 * the pairs the server issued via `fetchProfileOptions` — never a
 * free-text name (§11.6).
 * @param {{
 *   selectedName: string,
 *   avatarColor: string,
 *   acceptedGuidelines: true,
 *   departmentId?: string,
 *   semester?: number,
 *   interestIds?: string[],
 * }} body
 * @returns {Promise<MyProfile>}
 */
export function createProfile(body) {
  return apiClient.post('/me/profile', body);
}

/** `GET /me/profile`. @returns {Promise<MyProfile>} */
export function getMyProfile() {
  return apiClient.get('/me/profile');
}

/**
 * `PATCH /me/profile`.
 * @param {Partial<{
 *   departmentId: string | null,
 *   semester: number | null,
 *   showDepartment: boolean,
 *   showSemester: boolean,
 *   showInterests: boolean,
 *   dmPolicy: 'EVERYONE' | 'NOBODY',
 *   avatarColor: string,
 * }>} patch
 * @returns {Promise<MyProfile>}
 */
export function updateProfile(patch) {
  return apiClient.patch('/me/profile', patch);
}

/**
 * `POST /me/profile/rename`.
 * @param {{ selectedName: string, avatarColor: string }} body
 * @returns {Promise<MyProfile>}
 */
export function renameProfile(body) {
  return apiClient.post('/me/profile/rename', body);
}

/**
 * `PUT /me/interests`.
 * @param {string[]} interestIds
 * @returns {Promise<MyProfile>}
 */
export function replaceInterests(interestIds) {
  return apiClient.put('/me/interests', { interestIds });
}

/**
 * `GET /profiles/:publicId` — public fields only.
 * @param {string} publicId
 * @returns {Promise<PublicProfile>}
 */
export function getPublicProfile(publicId) {
  return apiClient.get(`/profiles/${encodeURIComponent(publicId)}`);
}

/** `GET /me/settings`. @returns {Promise<Settings>} */
export function getSettings() {
  return apiClient.get('/me/settings');
}

/**
 * `PATCH /me/settings`.
 * @param {Partial<{
 *   notificationPrefs: Record<string, unknown>,
 *   pushPreview: 'NONE' | 'SENDER_ONLY',
 *   theme: string | null,
 * }>} patch
 * @returns {Promise<Settings>}
 */
export function updateSettings(patch) {
  return apiClient.patch('/me/settings', patch);
}
