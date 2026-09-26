// @ts-check
import { randomUUID } from 'node:crypto';

/**
 * Assigns a request ID (reusing an inbound `X-Request-Id` from a trusted
 * proxy if present, else generating one), exposes it on the
 * `X-Request-Id` response header, and attaches a child logger with the id
 * bound — every subsequent log line for this request carries it, and
 * error responses echo it back (§26 error envelope `requestId` field).
 *
 * Stored on `res.locals` (already typed as an open record by
 * `@types/express`) rather than augmenting `req` with custom properties,
 * so no hand-written `.d.ts` type augmentation is needed — see
 * docs/adr/0002-js-jsdoc-zod.md ("no .ts source files").
 *
 * @param {import('pino').Logger} baseLogger
 * @returns {import('express').RequestHandler}
 */
export function requestId(baseLogger) {
  return (req, res, next) => {
    const inbound = req.headers['x-request-id'];
    const id = typeof inbound === 'string' && inbound.length > 0 ? inbound : randomUUID();

    res.locals.requestId = id;
    res.locals.log = baseLogger.child({ requestId: id });
    res.setHeader('X-Request-Id', id);
    next();
  };
}
