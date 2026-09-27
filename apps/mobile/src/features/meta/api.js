// @ts-check
import { apiClient } from '../../lib/api/client.js';

/**
 * Matches `InterestSchema` in packages/shared/src/schemas/meta.js.
 * @typedef {Object} Interest
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string | null} category
 */

/**
 * `GET /api/v1/meta/interests` — public, no auth required (see
 * packages/shared/src/schemas/meta.js). Used in P2 as the end-to-end smoke
 * test proving the mobile app can reach the local server. Source:
 * docs/architecture.md §28 P2 "a Meta screen calling `GET /meta/interests`
 * as an end-to-end smoke test."
 * @returns {Promise<Interest[]>}
 */
export function fetchInterests() {
  return apiClient.get('/meta/interests');
}

/**
 * Matches `DepartmentSchema` in packages/shared/src/schemas/meta.js.
 * @typedef {Object} Department
 * @property {string} id
 * @property {string} name
 */

/**
 * `GET /api/v1/meta/departments` — public, no auth required. Used by the
 * onboarding interests screen (§28 P4) for the optional department picker.
 * @returns {Promise<Department[]>}
 */
export function fetchDepartments() {
  return apiClient.get('/meta/departments');
}
