// @ts-check
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rateLimit, resetRateLimiters } from '../../src/middleware/rateLimit.js';
import { redis } from '../../src/lib/redis.js';

/**
 * Scaffolding-only in Phase 1 (docs/architecture.md §28 P1: "real limits
 * wired per-route from Phase 3 onward") — this test proves the factory
 * itself correctly blocks after N requests against the real Redis
 * instance, so Phase 3+ can trust it without re-deriving this from
 * scratch. Uses OTP_VERIFY_ATTEMPTS (points: 5) as a stand-in limit.
 */

const TEST_KEY_PREFIX = `test:${Date.now()}`;

function buildReq(userKey = 'user-a') {
  return /** @type {any} */ ({ __testKey: `${TEST_KEY_PREFIX}:${userKey}` });
}

function buildRes() {
  return /** @type {any} */ ({});
}

describe('rateLimit middleware (scaffolding)', () => {
  beforeEach(() => {
    resetRateLimiters();
  });

  afterEach(async () => {
    // Clean up the keys this test created so re-runs start fresh.
    const keys = await redis.keys(`rl:OTP_VERIFY_ATTEMPTS:${TEST_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  it('allows requests under the limit and blocks once it is exceeded', async () => {
    const middleware = rateLimit(
      'OTP_VERIFY_ATTEMPTS',
      (req) => /** @type {any} */ (req).__testKey,
    );
    const req = buildReq('under-limit');

    /** @type {Array<Error | null>} */
    const results = [];
    for (let i = 0; i < 6; i += 1) {
      const next = (/** @type {any} */ err) => results.push(err ?? null);
      await middleware(req, buildRes(), next);
    }

    // OTP_VERIFY_ATTEMPTS allows 5 — the 6th call must be blocked.
    expect(results.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(results[5]).toBeInstanceOf(Error);
    expect(/** @type {any} */ (results[5]).code).toBe('RATE_LIMITED');
  });

  it('tracks separate keys independently', async () => {
    const middleware = rateLimit(
      'OTP_VERIFY_ATTEMPTS',
      (req) => /** @type {any} */ (req).__testKey,
    );

    const reqA = buildReq('key-a');
    const reqB = buildReq('key-b');

    let errA;
    await middleware(reqA, buildRes(), (err) => (errA = err));
    let errB;
    await middleware(reqB, buildRes(), (err) => (errB = err));

    expect(errA).toBeUndefined();
    expect(errB).toBeUndefined();
  });
});
