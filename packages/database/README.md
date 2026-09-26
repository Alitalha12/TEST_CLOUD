# @campus/database

Owns everything PostgreSQL/Prisma: `prisma/schema.prisma`, migrations,
the seed script, and the runtime `PrismaClient` singleton. See
`docs/architecture.md` §8 and `docs/adr/0011-separate-database-package.md`
for why this is a separate package rather than living inside
`apps/server`.

Any app that needs the database imports `@campus/database` — never
`@prisma/client` directly, and never a relative path into this package's
internals.

```js
import { prisma, pingDatabase, disconnectPrisma, Prisma } from '@campus/database';
```

## Setup

This package has no `.env` of its own — it reads `DATABASE_URL` (and, for
tests, `TEST_DATABASE_URL`) from `apps/server/.env`, the one `.env` for
the whole local stack. Copy `apps/server/.env.example` to
`apps/server/.env` before running any command below.

## Commands (from the repo root)

```bash
pnpm db:generate   # regenerate the Prisma client after a schema change
pnpm db:migrate    # create + apply a dev migration (prompts for a name)
pnpm db:deploy     # apply existing migrations without creating a new one (CI/prod)
pnpm db:seed       # seed the target university, departments and interests
pnpm db:studio     # browse the database
```

Or scoped directly: `pnpm --filter @campus/database run prisma:migrate`, etc.

## Notes

- Prisma 7 requires a driver adapter at runtime (`src/client.js`) and a
  `prisma.config.js` for the CLI, not the classic
  `datasource { url = env("DATABASE_URL") }` schema syntax — see
  `docs/adr/0010-prisma-7-driver-adapter.md` before touching either file.
- `src/client.js` reads `DATABASE_URL` directly from `process.env`
  instead of importing any app's `env.js` — this package is imported *by*
  apps, so it must never import one back. See
  `docs/adr/0011-separate-database-package.md`.
- `scripts/prepare-test-db.mjs` creates `campus_test` and runs
  `prisma migrate deploy` against it; `apps/server`'s `pretest` script
  calls it via `pnpm --filter @campus/database run prepare-test-db`.
