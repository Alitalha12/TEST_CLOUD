# Anonymous Campus

An anonymous university social & chat platform. Students verify their
university email but stay pseudonymous to other students.

- Product spec: [`plan.md`](./plan.md)
- **Approved architecture & roadmap:** [`docs/architecture.md`](./docs/architecture.md) — read this first.
- Feature scope by release: [`docs/feature-scope.md`](./docs/feature-scope.md)
- Conventions: [`docs/conventions.md`](./docs/conventions.md)
- Architecture decisions: [`docs/adr/`](./docs/adr/)

This repo is being built **phase by phase** (see `docs/architecture.md`
§28). Completed: **Phase 0** (repository & tooling foundation), **Phase 1**
(backend foundation — see `apps/server/README.md`). Phase 2 (mobile
foundation) can start independently at any time; phases 3+ build on
Phase 1.

## Prerequisites

- Node.js 24 (see `.nvmrc`) — `nvm use`
- [pnpm](https://pnpm.io/) 9.x (enabled via Corepack: `corepack enable`)
- [Docker](https://www.docker.com/) + Docker Compose

## Setup

```bash
git clone <this-repo>
cd TEST_CLOUD
corepack enable
pnpm install
pnpm docker:up          # Postgres, Redis, S3-compatible storage, Mailpit
```

Wait for all services to report healthy:

```bash
docker compose ps
```

Then set up the backend (migrations + seed data) — see
[`apps/server/README.md`](./apps/server/README.md).

## Everyday commands

```bash
pnpm lint               # ESLint across the whole workspace
pnpm format             # Prettier — write
pnpm format:check       # Prettier — check only (what CI runs)
pnpm typecheck          # tsc --noEmit (JSDoc type checking) in every package
pnpm test               # Vitest in every package that has tests
pnpm docker:down        # stop local infra
pnpm docker:logs        # tail local infra logs
```

## Local infrastructure

| Service  | Purpose                          | URL / Port                          |
| -------- | --------------------------------- | ------------------------------------ |
| Postgres | Source of truth                   | `localhost:5432` (`campus`/`campus`) |
| Redis    | Rate limits, presence, queues     | `localhost:6379`                     |
| s3mock   | S3-compatible storage (stands in for Cloudflare R2; see [ADR 0009](./docs/adr/0009-s3mock-instead-of-minio-locally.md)) | API `localhost:9000`, bucket `campus-media-dev` (no auth needed locally) |
| Mailpit  | Fake SMTP + inbox UI for OTP email | SMTP `localhost:1025`, UI `localhost:8025` |

## Repository layout

```
apps/
  mobile/     # Expo app — scaffolded in Phase 2
  server/     # Express API — Phase 1 done; Socket.IO (Phase 8) and the
              # BullMQ worker (Phase 3) land later. See apps/server/README.md.
  admin/      # Next.js admin dashboard — scaffolded in Phase 10
packages/
  shared/     # @campus/shared — Zod schemas, enums, error codes, limits
  config/     # @campus/config — shared ESLint/Prettier/jsconfig base
docs/
  architecture.md   # the approved blueprint — binding
  feature-scope.md
  conventions.md
  adr/              # architecture decision records
  phases/           # per-phase implementation contracts
```

## Working rules

- One phase at a time (`docs/architecture.md` §28). Don't jump ahead.
- JavaScript only, with JSDoc + `checkJs` type checking — no `.ts` source
  files (see ADR 0002).
- Read `docs/conventions.md` before writing backend module code.
