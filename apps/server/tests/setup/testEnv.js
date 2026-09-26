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
