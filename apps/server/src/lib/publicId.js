// @ts-check
import { randomBytes } from 'node:crypto';

/**
 * Generates a `p_` + 12-char opaque id (§8.3 `anonymous_profiles.public_id`
 * "e.g., `p_` + 12-char nanoid"). Built on `node:crypto` rather than
 * adding a `nanoid` dependency: base64url-encoding 9 random bytes gives
 * exactly 12 characters (9 * 8 / 6 = 12) drawn from an already URL-safe
 * alphabet (`A-Za-z0-9-_`), which is all a nanoid would provide here.
 * @returns {string}
 */
export function generatePublicId() {
  return `p_${randomBytes(9).toString('base64url')}`;
}
