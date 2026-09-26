// @ts-check
import Redis from 'ioredis';
import { getEnv } from '../config/env.js';

/**
 * A separate ioredis connection dedicated to BullMQ. Source:
 * docs/architecture.md §9 ("BullMQ | `bull:{queue}:*` | ... | Durable-
 * enough queue with retries") and §28 P3 ("BullMQ introduced here").
 *
 * This is deliberately NOT the same connection instance as
 * `lib/redis.js`'s `redis` (used for rate limits/caching): BullMQ
 * requires `maxRetriesPerRequest: null` on its connection (it manages
 * retries itself and throws at construction time otherwise), while the
 * rate-limit connection intentionally keeps a bounded
 * `maxRetriesPerRequest` (see lib/redis.js) so a Redis outage fails a
 * request quickly instead of hanging it. Both connections point at the
 * same `REDIS_URL` for now — docs/architecture.md §9 splits queue vs
 * cache Redis only "at 10k users".
 */
const env = getEnv();

export const queueConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export async function disconnectQueueConnection() {
  queueConnection.disconnect();
}
