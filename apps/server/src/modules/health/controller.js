// @ts-check
import { pingDatabase } from '../../lib/prisma.js';
import { pingRedis } from '../../lib/redis.js';
import { sendSuccess } from '../../http/respond.js';

/**
 * `health`/`ready` are infrastructure endpoints, not a business module —
 * there's no DB row to present, so this module skips the
 * repository/presenter layers used by real modules (docs/conventions.md
 * "Layering" describes the pattern for feature modules like `meta`).
 */

/**
 * Liveness: the process is up and can respond. Deliberately checks
 * nothing else — a dependency outage should not make the process look
 * dead to an orchestrator that would otherwise restart it.
 *
 * `const` arrow expressions (not `function` declarations) because
 * TS/JSDoc's `@type` cast reliably retypes the whole signature — return
 * type included — only in that form.
 * @type {import('express').RequestHandler}
 */
export const health = (req, res) => {
  sendSuccess(res, { status: 'ok' });
};

/**
 * Readiness: can this instance actually serve traffic right now? Checks
 * both dependencies in parallel; 503 (not 200) if either is down, per
 * docs/architecture.md §28 P1 "GET /ready (DB + Redis ping)".
 * @type {import('express').RequestHandler}
 */
export const ready = async (req, res) => {
  const [databaseUp, redisUp] = await Promise.all([pingDatabase(), pingRedis()]);
  const isReady = databaseUp && redisUp;

  // `success: true` here means "the check itself ran", not "we're ready" —
  // readiness is carried by the HTTP status (200 vs 503) and the `status`
  // field, which is what orchestrators/uptime checks actually key off.
  sendSuccess(
    res,
    { status: isReady ? 'ok' : 'degraded', database: databaseUp, redis: redisUp },
    { status: isReady ? 200 : 503 },
  );
};
