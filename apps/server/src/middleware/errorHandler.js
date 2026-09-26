// @ts-check
import { AppError, toErrorEnvelope } from '@campus/shared';

/**
 * Express error-handling middleware (4-arg signature — Express only
 * treats a handler as an error handler if it declares exactly 4 params).
 *
 * - Known errors (`AppError`) map to their declared code/status.
 * - Any other thrown/rejected error maps to `INTERNAL` (500) and is
 *   logged with the stack trace server-side, but the stack is **never**
 *   sent to the client — see docs/architecture.md §7.4 "Errors":
 *   "There are no stack traces outside dev."
 * - The response echoes back `requestId` so a client-reported bug can be
 *   correlated with server logs.
 *
 * @param {import('../config/env.js').Env} env
 * @returns {import('express').ErrorRequestHandler}
 */
export function errorHandler(env) {
  return (err, req, res, _next) => {
    const requestId = /** @type {string | undefined} */ (res.locals.requestId);
    const log = /** @type {import('pino').Logger | undefined} */ (res.locals.log);

    if (err instanceof AppError) {
      if (log) {
        log.warn({ err, code: err.code }, 'Request failed with a known error');
      }
      const envelope = toErrorEnvelope(err.code, err.message, err.details);
      if (requestId) {
        envelope.error.requestId = requestId;
      }
      res.status(err.httpStatus).json(envelope);
      return;
    }

    // body-parser (used by express.json()) throws a plain Error with a
    // stable `.type` for a body over the configured limit — map it to a
    // real error code instead of a generic 500, since this is a client
    // mistake, not a server fault. See docs/architecture.md §28 P1
    // "body over 100KB rejected".
    if (isPayloadTooLargeError(err)) {
      if (log) {
        log.warn({ err }, 'Request body exceeded the size limit');
      }
      const envelope = toErrorEnvelope('PAYLOAD_TOO_LARGE');
      if (requestId) {
        envelope.error.requestId = requestId;
      }
      res.status(413).json(envelope);
      return;
    }

    // Unknown error: log the full detail server-side (including stack),
    // but the client only ever sees the generic INTERNAL envelope.
    if (log) {
      log.error({ err }, 'Unhandled error');
    }

    const envelope = toErrorEnvelope('INTERNAL');
    if (requestId) {
      envelope.error.requestId = requestId;
    }
    // In development only, attach the message to help local debugging —
    // never the stack, and never in production/test.
    if (env && !env.isProduction && err instanceof Error) {
      envelope.error.details = { devMessage: err.message };
    }
    res.status(500).json(envelope);
  };
}

/**
 * @param {unknown} err
 * @returns {err is Error & { type: string; status?: number }}
 */
function isPayloadTooLargeError(err) {
  return err instanceof Error && /** @type {any} */ (err).type === 'entity.too.large';
}
