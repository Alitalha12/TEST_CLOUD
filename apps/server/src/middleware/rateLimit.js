// @ts-check
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { AppError, RATE_LIMITS } from '@campus/shared';
import { redis } from '../lib/redis.js';

/**
 * Rate-limit scaffolding (docs/architecture.md §28 P1: "rate-limit
 * scaffolding, real limits wired per-route from Phase 3 onward").
 *
 * Nothing in this module is applied to a route yet — Phase 1 has no
 * endpoint worth protecting (meta/health are public, read-only, and have
 * no per-user cost). This exists so Phase 3+ can wrap a route in one line:
 *
 *   router.post('/otp/request', rateLimit('OTP_SEND_PER_EMAIL', (req) => req.body.email), controller)
 *
 * Limits themselves are defined once in `@campus/shared`'s RATE_LIMITS
 * (docs/architecture.md §9) so the mobile app and the server never drift
 * on what "too many" means.
 */

/** @type {Map<keyof typeof RATE_LIMITS, RateLimiterRedis>} */
const limiters = new Map();

/**
 * @param {keyof typeof RATE_LIMITS} limitName
 */
function getLimiter(limitName) {
  let limiter = limiters.get(limitName);
  if (!limiter) {
    const rule = RATE_LIMITS[limitName];
    limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: `rl:${limitName}`,
      points: rule.points,
      duration: rule.durationSeconds,
    });
    limiters.set(limitName, limiter);
  }
  return limiter;
}

/**
 * Builds Express middleware enforcing the named rate limit, keyed by
 * whatever `keyFn` derives from the request (a user id, email hash, IP
 * hash, etc. — never a raw email/IP, to match the key patterns in §9).
 *
 * @param {keyof typeof RATE_LIMITS} limitName
 * @param {(req: import('express').Request) => string} keyFn
 * @returns {import('express').RequestHandler}
 */
export function rateLimit(limitName, keyFn) {
  const limiter = getLimiter(limitName);
  return (req, res, next) => {
    const key = keyFn(req);
    // Returning this promise costs nothing in real Express usage (it
    // ignores a middleware's return value) and makes the middleware
    // properly awaitable in tests that call it directly — without this,
    // `await middleware(...)` would resolve before `next()` is actually
    // invoked, since consume() is asynchronous.
    return limiter
      .consume(key)
      .then(() => next())
      .catch(() => {
        // rate-limiter-flexible rejects with a RateLimiterRes (not
        // necessarily an Error) both when the limit is exceeded AND on a
        // Redis-level failure — this fails CLOSED (blocks the request) in
        // both cases. Revisit if a Redis outage should instead fail open
        // for low-stakes routes once real routes use this in Phase 3+.
        next(new AppError('RATE_LIMITED'));
      });
  };
}

/** Test/shutdown helper — clears cached limiter instances. */
export function resetRateLimiters() {
  limiters.clear();
}
