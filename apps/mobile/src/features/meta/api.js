// @ts-check
import { apiClient } from '../../lib/api/client.js';

/**
 * Matches `InterestSchema` in packages/shared/src/schemas/meta.js.
 * @typedef {Object} Interest
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
