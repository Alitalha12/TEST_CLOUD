// @ts-check
import Redis from 'ioredis';
import { getEnv } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Shared ioredis client. docs/architecture.md §9 — Redis is used narrowly
 * for rate limits, presence, queues and small TTL caches; nothing here is
 * a source of truth (§9 "Must remain in PostgreSQL").
 */
const env = getEnv();

export const redis = new Redis(env.REDIS_URL, {
  // Retry with backoff rather than crashing the process on a transient
  // connection blip; a real outage still surfaces via /ready (§7.4).
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('error', (/** @type {Error} */ err) => {
  logger.error({ err }, 'Redis client error');
});

export async function disconnectRedis() {
  redis.disconnect();
}

/**
 * Cheap liveness check used by GET /ready.
 * @returns {Promise<boolean>}
 */
export async function pingRedis() {
  try {
    const reply = await redis.ping();
    return reply === 'PONG';
  } catch {
    return false;
  }
}
