// @ts-check

/**
 * Vitest `setupFiles` entry — runs before each test file's own module
 * graph is evaluated, so `config/env.js` (and everything that reads it)
 * sees test-appropriate values from the very first import. See
 * docs/conventions.md "Testing rules".
 */

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file — fine in CI, where real env vars come from the
  // workflow/service containers instead.
}

process.env.NODE_ENV = 'test';

// Route every test at the disposable test database, never campus_dev —
// scripts/prepare-test-db.mjs already migrated it before Vitest started.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Same reasoning for Redis (Phase 3 onward): rate limits, the account
// status cache, and the OTP pending-challenge cache all live in Redis
// now, so tests need their own logical database — never the same one a
// running `pnpm dev` server/worker is using — or test runs would leak
// rate-limit counters into each other and into a developer's live
// session. A different numbered Redis DB on the same server (not a
// second container) is the lightest way to get that isolation.
if (process.env.TEST_REDIS_URL) {
  process.env.REDIS_URL = process.env.TEST_REDIS_URL;
}
