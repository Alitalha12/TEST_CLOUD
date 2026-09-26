# ADR 0011: extract the database into its own package

**Status:** Accepted — structural refactor, not a change to
`docs/architecture.md`'s decision to use Prisma + PostgreSQL (§7.1, §8.1).

## Context

Through Phase 2, `apps/server` owned the Prisma schema, migrations, seed
script and the runtime client (`prisma/`, `prisma.config.js`,
`src/lib/prisma.js`). That was fine while only the backend touched the
database, but it mixes two different concerns into one folder: "the
database" (schema, migrations, generated client) and "the backend" (HTTP
routes, business logic). It also means any other process that will
eventually need direct database access — the BullMQ worker (Phase 3), a
future admin app (Phase 10) — would have had to either import across
`apps/server`'s boundary or duplicate the Prisma setup.

## Decision

Database ownership moves to `packages/database`, a new workspace package:

- `packages/database/prisma/` — `schema.prisma`, `migrations/`, `seed.js`.
- `packages/database/prisma.config.js` — Prisma 7's CLI config (ADR 0010).
- `packages/database/src/client.js` — the driver-adapter `PrismaClient`
  singleton, `disconnectPrisma`, `pingDatabase`.
- `packages/database/src/index.js` — the package's public surface:
  `prisma`, `disconnectPrisma`, `pingDatabase`, and a re-export of
  Prisma's own `Prisma` namespace (so consumers never need `@prisma/client`
  as a direct dependency, only `@campus/database`).

`apps/server` now depends on `@campus/database` (`workspace:*`) exactly
the way it already depended on `@campus/shared`, and no longer lists
`@prisma/client`, `@prisma/adapter-pg`, `prisma` or `pg` in its own
`package.json` — none of that is a backend concern anymore.

**Dependency direction is one-way.** `packages/database/src/client.js`
reads `DATABASE_URL` straight from `process.env` instead of importing
`apps/server/src/config/env.js`, because `@campus/database` is imported
*by* apps (server today; the worker and admin later), so it must never
import an app back. Whichever process imports it is responsible for
having `DATABASE_URL` already in `process.env` — true for `apps/server`
today because it starts with `node --env-file-if-exists=.env`.

**One `.env`, not two.** There is still only `apps/server/.env` (the
whole local stack's config: Postgres, Redis, S3, SMTP). Prisma CLI
commands run from `packages/database` via
`packages/database/scripts/run-with-env.mjs`, which loads that same file
by an absolute path (derived from the script's own location, not
`process.cwd()`) rather than a second copy. `packages/database/scripts/
prepare-test-db.mjs` (moved from `apps/server/scripts/`) does the same.

**Root shortcuts.** `pnpm db:generate|migrate|deploy|seed|studio` at the
repo root delegate to `@campus/database`'s own `prisma:*` scripts, so the
day-to-day commands don't change shape even though the target package
did.

## Consequences

- `apps/server/tests/helpers/{db,factories}.js` and the modules under
  `apps/server/src/modules/**` import `prisma`/`Prisma`/`pingDatabase`
  from `@campus/database` instead of a relative `../lib/prisma.js`.
- `apps/server`'s `pretest` script now runs
  `pnpm --filter @campus/database run prepare-test-db` instead of a local
  script.
- The server's `Dockerfile` copies `packages/database/package.json` in
  its `deps` stage and runs `pnpm --filter @campus/database exec prisma
  generate` in its `build` stage (previously `--filter @campus/server`).
  The runtime stage's existing `COPY ... /repo/packages ./packages`
  already covers `packages/database` — no change needed there.
- No schema or migration changed. `git mv` was used throughout, so file
  history is preserved.
