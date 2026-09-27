// @ts-check
import { ERROR_CODES, toErrorEnvelope } from '@campus/shared';
import { getEnv } from '../config/env.js';

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
 * `sendSuccess`, but the payload is first checked against its own Zod
 * response schema — §11.5 "four locks" lock 3: "Response schema
 * enforcement: `.strip()` in production, and in test/dev it **throws**
 * on unexpected keys." A presenter is still what decides *which* fields
 * exist; this is the safety net that catches a presenter bug (an extra
 * field slipping through) before it ever reaches a client.
 *
 * In production, parsing with the schema as-is silently drops unknown
 * keys (Zod's default `.strip()` behavior) — a bug still gets shipped
 * without a private field attached, rather than a 500. In dev/test, the
 * same schema is parsed via its own `.strict()` variant so an unknown
 * key throws instead of disappearing quietly, which fails the test/
 * request loudly right where the bug was introduced.
 *
 * @param {import('express').Response} res
 * @param {import('zod').ZodTypeAny} schema the DTO's own response schema
 *   (e.g. `PublicProfileResponseSchema`), not the full envelope
 * @param {unknown} data the presenter's output
 * @param {{ status?: number; meta?: Record<string, unknown> }} [options]
 */
export function sendPresented(res, schema, data, options = {}) {
  const env = getEnv();
  const strictOrNot =
    env.isProduction || typeof (/** @type {any} */ (schema).strict) !== 'function'
      ? schema
      : /** @type {any} */ (schema).strict();
  const parsed = strictOrNot.parse(data);
  sendSuccess(res, parsed, options);
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
