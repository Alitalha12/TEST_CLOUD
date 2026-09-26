// @ts-check
import { ERROR_CODES, toErrorEnvelope } from '@campus/shared';

/**
 * Response envelope helpers built on `@campus/shared`'s error codes, so
 * every route returns the exact `{success, data}` / `{success, error}`
 * shape defined in docs/architecture.md §26.
 */

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {{ status?: number; meta?: Record<string, unknown> }} [options]
 */
export function sendSuccess(res, data, options = {}) {
  const { status = 200, meta } = options;
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

/**
 * @param {import('express').Response} res
 * @param {keyof typeof ERROR_CODES} code
 * @param {{ message?: string; details?: Record<string, unknown>; requestId?: string }} [options]
 */
export function sendError(res, code, options = {}) {
  const def = ERROR_CODES[code];
  const envelope = toErrorEnvelope(code, options.message, options.details);
  if (options.requestId) {
    envelope.error.requestId = options.requestId;
  }
  res.status(def.httpStatus).json(envelope);
}
