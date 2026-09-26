// @ts-check
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { loadServerEnv } from './load-env.mjs';

/**
 * Runs once before apps/server's test suite (its `pretest` script calls
 * `pnpm --filter @campus/database run prepare-test-db` — see
 * apps/server/package.json). Ensures `campus_test` exists and is
 * migrated, so integration tests run against a real, disposable Postgres
 * database — docs/conventions.md "Testing rules": "No mocking the
 * database in integration tests."
 *
 * Deliberately a plain Node script (not a Vitest globalSetup) so it can
 * run once per `pnpm test` invocation regardless of how many test files
 * or workers Vitest spawns, and so its output is visible even if a test
 * file never gets that far.
 */

loadServerEnv();

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  console.error(
    'TEST_DATABASE_URL is not set. Copy apps/server/.env.example to apps/server/.env and try again.',
  );
  process.exit(1);
}

const parsed = new URL(testDatabaseUrl);
const databaseName = parsed.pathname.replace(/^\//, '');
if (!databaseName) {
  console.error(`TEST_DATABASE_URL has no database name: ${testDatabaseUrl}`);
  process.exit(1);
}

// Connect to the `postgres` maintenance database to create the test
// database if it doesn't exist yet — you can't CREATE DATABASE while
// connected to the database you're creating.
const adminUrl = new URL(testDatabaseUrl);
adminUrl.pathname = '/postgres';

async function ensureDatabaseExists() {
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`Created test database "${databaseName}".`);
  } catch (/** @type {any} */ err) {
    if (err.code === '42P04') {
      // duplicate_database — already exists, nothing to do.
    } else {
      throw err;
    }
  } finally {
    await client.end();
  }
}

function migrateTestDatabase() {
  // `pnpm exec` resolves the prisma binary correctly regardless of the
  // repo's node-linker setting (this package has no local
  // node_modules/.bin under hoisted linking — see
  // scripts/run-with-env.mjs for the same reasoning).
  const result = spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error('prisma migrate deploy failed against the test database.');
    process.exit(result.status ?? 1);
  }
}

await ensureDatabaseExists();
migrateTestDatabase();
