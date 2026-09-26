// @ts-check
import { redis } from '../../src/lib/redis.js';

/**
 * Flushes the whole test Redis logical DB — safe here specifically
 * because `TEST_REDIS_URL` points at a different numbered DB than a
 * running `pnpm dev` server/worker ever touches (see
 * tests/setup/testEnv.js). `RateLimiterRedis` keeps no in-process
 * counter state of its own (it's Redis-backed), so flushing Redis alone
 * is enough to reset rate limits between tests.
 */
export async function resetRedis() {
  await redis.flushdb();
}
