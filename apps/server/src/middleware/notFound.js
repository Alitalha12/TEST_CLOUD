// @ts-check
import { toErrorEnvelope } from '@campus/shared';

/**
 * Mounted after all routes — anything that reaches this point matched no
 * route, so it's a 404 in the standard error envelope (§26), not
 * Express's default HTML error page.
 *
 * A `const` arrow expression (not a `function` declaration) because
 * TS/JSDoc's `@type` cast reliably retypes the whole signature — return
 * type included — only in that form.
 * @type {import('express').RequestHandler}
 */
export const notFound = (req, res) => {
  const requestId = /** @type {string | undefined} */ (res.locals.requestId);
  const envelope = toErrorEnvelope('NOT_FOUND', `No route matches ${req.method} ${req.path}`);
  if (requestId) {
    envelope.error.requestId = requestId;
  }
  res.status(404).json(envelope);
};
