# apps/server

Node.js + Express 5 API. Socket.IO and a BullMQ worker arrive in later
phases (Phase 8 and Phase 3, respectively) — see `docs/architecture.md`
§7 and §28.

**Phase 1 (current):** health/ready endpoints, the `meta` module
(interests/departments) as the reference module later phases copy, and
all cross-cutting infrastructure (env validation, logging with
redaction, error handling, CORS, rate-limit scaffolding, Redis). The
database (schema, migrations, seed, Prisma client) lives in
`packages/database`, not here — see that package's README and
`docs/adr/0011-separate-database-package.md`.

## Setup

```bash
cp .env.example .env          # then edit if your local ports differ
pnpm install                  # from the repo root
pnpm db:migrate                # applies migrations to campus_dev (packages/database)
pnpm db:seed                   # seeds the target university/departments/interests
```

## Everyday commands

```bash
pnpm run dev            # start with --watch (or: pnpm dev from repo root)
pnpm run test           # prepares campus_test (via @campus/database), then runs vitest
pnpm run typecheck      # tsc --noEmit (JSDoc)
pnpm db:studio           # browse the database (repo-root shortcut)
```

## Notes for future phases

- This app never constructs its own `PrismaClient` or touches
  `prisma.config.js` — it imports `prisma`/`pingDatabase`/`disconnectPrisma`
  from `@campus/database`. See `docs/adr/0010-prisma-7-driver-adapter.md`
  and `docs/adr/0011-separate-database-package.md` before changing
  anything database-related.
- Follow the module layering in `docs/conventions.md`
  (`routes → controller → service → repository → presenter`) — `meta` is
  the reference implementation.
- The `noIncludeUserOutsideAuthAdmin` ESLint rule (root `eslint.config.js`)
  will start mattering once `users`/`user_identities` exist (Phase 3) —
  it's already wired and tested (`tests/security/noIncludeUserRule.test.js`).
