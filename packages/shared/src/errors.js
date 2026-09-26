// @ts-check
/**
 * Error codes and the AppError shape used across the API.
 * Source: docs/architecture.md §7.4 "Cross-cutting backend concerns" (Errors row)
 * and §26 "API / Data Contracts" (error envelope).
 *
 * The server throws AppError; the errorHandler middleware (built in Phase 1)
 * maps it to the HTTP envelope `{success:false, error:{code, message, details?, requestId}}`.
 * Mobile/admin use ERROR_CODES to map a code to a friendly message
 * (docs/architecture.md §6.4 "Error tracking" / lib/api/errors.js).
 */

/**
 * @typedef {Object} ErrorCodeDef
 * @property {number} httpStatus
 * @property {string} defaultMessage
 */

/** @type {Record<string, ErrorCodeDef>} */
export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: { httpStatus: 422, defaultMessage: 'The request could not be validated.' },
  UNAUTHENTICATED: { httpStatus: 401, defaultMessage: 'You need to be logged in to do that.' },
  TOKEN_EXPIRED: { httpStatus: 401, defaultMessage: 'Your session has expired.' },
  FORBIDDEN: { httpStatus: 403, defaultMessage: "You can't do that." },
  NOT_FOUND: { httpStatus: 404, defaultMessage: 'Not found.' },
  RATE_LIMITED: { httpStatus: 429, defaultMessage: "You're doing that too much. Try again later." },
  ACCOUNT_RESTRICTED: {
    httpStatus: 403,
    defaultMessage: 'Your account is temporarily restricted.',
  },
  ACCOUNT_SUSPENDED: { httpStatus: 403, defaultMessage: 'Your account is suspended.' },
  CONTENT_REJECTED: { httpStatus: 422, defaultMessage: "That content isn't allowed." },
  CONFLICT: { httpStatus: 409, defaultMessage: 'That conflicts with existing data.' },
  UPGRADE_REQUIRED: { httpStatus: 426, defaultMessage: 'Please update the app to continue.' },
  DOMAIN_NOT_SUPPORTED: {
    httpStatus: 422,
    defaultMessage: "That email domain isn't supported yet.",
  },
  PAYLOAD_TOO_LARGE: {
    httpStatus: 413,
    defaultMessage: 'The request body is too large.',
  },
  INTERNAL: { httpStatus: 500, defaultMessage: 'Something went wrong. Please try again.' },
});

/** @typedef {keyof typeof ERROR_CODES} ErrorCode */

export class AppError extends Error {
  /**
   * @param {ErrorCode} code
   * @param {string} [message]
   * @param {Record<string, unknown>} [details]
   */
  constructor(code, message, details) {
    const def = ERROR_CODES[code];
    if (!def) {
      throw new Error(`Unknown error code: ${code}`);
    }
    super(message ?? def.defaultMessage);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = def.httpStatus;
    this.details = details;
    // V8-only (Node.js): trims the constructor frame off the stack trace.
    // Not in the standard Error typings, so it's accessed dynamically.
    const captureStackTrace = /** @type {any} */ (Error).captureStackTrace;
    if (typeof captureStackTrace === 'function') {
      captureStackTrace(this, AppError);
    }
  }
}

/**
 * Builds the standard error envelope. The server attaches `requestId`
 * itself (from the request-scoped logger context) before sending — the
 * return type declares it upfront (as optional) so that assignment
 * type-checks at every call site instead of each one needing a cast.
 * @param {ErrorCode} code
 * @param {string} [message]
 * @param {Record<string, unknown>} [details]
 * @returns {{
 *   success: false;
 *   error: { code: ErrorCode; message: string; details?: Record<string, unknown>; requestId?: string };
 * }}
 */
export function toErrorEnvelope(code, message, details) {
  const def = ERROR_CODES[code];
  return {
    success: /** @type {const} */ (false),
    error: {
      code,
      message: message ?? def?.defaultMessage ?? 'Something went wrong.',
      ...(details ? { details } : {}),
    },
  };
}
