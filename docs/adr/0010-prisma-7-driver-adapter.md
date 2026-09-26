# ADR 0010: Prisma 7's driver-adapter pattern (mechanical change, not architectural)

**Status:** Accepted — implementation detail of how Prisma is used, not a
change to `docs/architecture.md`'s decision to use Prisma + PostgreSQL.

## Context
`docs/architecture.md` §7.1/§8 assumes the classic Prisma pattern:
`datasource { url = env("DATABASE_URL") }` in `schema.prisma`, and
`new PrismaClient()` reading that automatically. While building Phase 1,
installing current-stable Prisma (7.10.0 — the `prisma` package's
`latest` dist-tag actually points to an 8.0.0 release candidate, so 7.10.0
was chosen deliberately as the last version where `prisma` and
`@prisma/client` are both stable and version-matched) showed this schema
syntax is **no longer accepted**: Prisma 7 requires connection
configuration to move to a `prisma.config.js` file, and the runtime
`PrismaClient` now requires an explicit driver adapter.

This was verified empirically (not assumed): a scratch schema with the
old `url` field failed `prisma validate` with an explicit error pointing
at the new pattern; the new pattern was built up field-by-field against a
real Postgres instance until `migrate dev`, `db seed`, `generate`, and a
real insert all worked, including confirming `@default(uuid(7))`
genuinely produces a version-7 UUID.

## Decision
- `apps/server/prisma.config.js` (plain `.js`, not `.ts` — Prisma's config
  loader accepts either) declares `datasource.url` from
  `process.env.DATABASE_URL`, for the CLI's migrate/seed commands.
- `apps/server/src/lib/prisma.js` constructs `PrismaClient` with a
  `@prisma/adapter-pg` driver adapter wrapping a `pg` connection string,
  for the actual runtime client.
- Every `package.json` script that shells out to the Prisma CLI wraps it
  via `apps/server/scripts/run-with-env.mjs`, which loads `.env` with
  Node's own `process.loadEnvFile()` and then execs the real command
  (`pnpm exec prisma ...`). This exists for two independent reasons, both
  verified directly rather than assumed:
  1. Prisma's built-in dotenv auto-loading has inconsistent timing across
     subcommands in this version (works for `prisma validate`, silently
     fails for `prisma migrate dev` with "datasource.url property is
     required"). Loading env before Prisma's own code even starts
     sidesteps that inconsistency entirely.
  2. `node --env-file-if-exists=.env node_modules/.bin/prisma ...` (the
     originally-planned, simpler form) breaks under this repo's
     `node-linker=hoisted` setting — `apps/server` has no local
     `node_modules/.bin` under full hoisting, only the monorepo root
     does. `pnpm exec` resolves the binary correctly regardless of
     linker mode, so the wrapper delegates to that instead of a
     hardcoded relative path to the root.

## Why this doesn't change the architecture
PostgreSQL is still the source of truth (§8.1), Prisma is still the ORM
(§7.1), migrations still work the same way from a developer's point of
view (`prisma migrate dev`), and the schema/model definitions are
unchanged. This ADR exists so a future contributor who reads §7/§8 and
then opens `apps/server/prisma.config.js` isn't confused by the
discrepancy, and so nobody "fixes" the driver-adapter setup back to the
classic pattern assuming it was a mistake.

## Consequences
- Runtime dependencies now include `pg` and `@prisma/adapter-pg` (matched
  to the exact same version as `prisma`/`@prisma/client`), not just
  `@prisma/client` alone.
- `prisma` and `@prisma/client` are pinned to an **exact** matching
  version (`7.10.0`, no `^`) rather than a caret range, since Prisma
  expects the CLI and generated client to stay in lockstep and the
  `latest` dist-tag is currently unreliable for this pairing. Revisit the
  exact pin (and re-check dist-tags) when bumping Prisma in a later phase.
- If Prisma's official docs/migration guide for this version differ from
  what's described here, trust a fresh empirical check over this ADR —
  update this file rather than silently drifting from it.
