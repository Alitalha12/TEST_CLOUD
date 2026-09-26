#!/usr/bin/env node
// @ts-check
import { spawnSync } from 'node:child_process';

/**
 * Loads `.env` (if present) into process.env, then execs the given
 * command with it. Exists because:
 *
 * 1. Prisma's own dotenv auto-loading has inconsistent timing across
 *    subcommands in Prisma 7 (works for `validate`, not `migrate dev` —
 *    see docs/adr/0010-prisma-7-driver-adapter.md).
 * 2. `node --env-file-if-exists=.env node_modules/.bin/<bin>` breaks
 *    under this repo's `node-linker=hoisted` setting, because
 *    `apps/server` has no local `node_modules/.bin` — everything hoists
 *    to the monorepo root. `pnpm exec` is the linker-agnostic way to
 *    resolve a workspace binary, so this delegates to that instead of
 *    hardcoding a relative path to the root.
 *
 * Usage: node scripts/run-with-env.mjs <command> [...args]
 *   e.g. node scripts/run-with-env.mjs pnpm exec prisma migrate deploy
 */

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file — fine in CI, where real env vars come from the
  // workflow/service containers instead.
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [...args]');
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
