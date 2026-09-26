// @ts-check
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `packages/database` has no `.env` of its own — the whole local stack
 * (Postgres/Redis/S3/SMTP URLs) is configured once, in `apps/server/.env`
 * (see docs/adr/0011-separate-database-package.md: "do not create a
 * second .env with secrets"). This resolves that file by an absolute
 * path derived from this script's own location, not from `process.cwd()`,
 * so it works the same way whether invoked via `pnpm --filter
 * @campus/database run ...` or directly with `node scripts/x.mjs`.
 *
 * In CI there is no `.env` file at all — `DATABASE_URL`/`TEST_DATABASE_URL`
 * etc. are already real environment variables from the workflow/service
 * containers, so this is a no-op there, matching the pattern
 * apps/server has used since Phase 1.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const serverEnvPath = path.resolve(here, '../../../apps/server/.env');

export function loadServerEnv() {
  if (existsSync(serverEnvPath)) {
    process.loadEnvFile(serverEnvPath);
  }
}
