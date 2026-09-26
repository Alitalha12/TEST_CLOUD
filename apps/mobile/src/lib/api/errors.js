// @ts-check
import { ERROR_CODES } from '@campus/shared';
import { ApiError } from './client.js';

/**
 * Maps a shared error code to mobile-facing copy, per docs/architecture.md
 * §6.3 "lib/api/errors.js: Maps shared error codes -> user messages". Only
 * codes that need copy friendlier than the shared default are listed here;
 * everything else falls back to `@campus/shared`'s `ERROR_CODES[code].defaultMessage`.
 * @type {Partial<Record<keyof typeof ERROR_CODES, string>>}
 */
const FRIENDLY_MESSAGES = {
  NETWORK_ERROR: 'Could not reach the server. Check your connection and try again.',
  RATE_LIMITED: "You're doing that too much — try again in a bit.",
  UPGRADE_REQUIRED: 'Please update the app to continue.',
};

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/**
 * @param {unknown} error
 * @returns {string} a message safe to show the user
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    const friendly = FRIENDLY_MESSAGES[/** @type {keyof typeof ERROR_CODES} */ (error.code)];
    if (friendly) {
      return friendly;
    }
    const known = ERROR_CODES[/** @type {keyof typeof ERROR_CODES} */ (error.code)];
    return known?.defaultMessage ?? error.message ?? GENERIC_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return GENERIC_MESSAGE;
}
