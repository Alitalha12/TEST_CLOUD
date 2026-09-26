# Phase 1 — Backend foundation

> Contract for the next phase. Full detail: `docs/architecture.md` §28 "P1"
> and §7 "Backend Architecture". This file is the concrete checklist to
> start from; if it and §28/§7 disagree, `docs/architecture.md` wins —
> update this file rather than trusting a stale copy.

**Can run in parallel with:** Phase 2 (Mobile foundation).

## Objective
A production-shaped Express app with all cross-cutting infrastructure in
place and **no product features**.

## Build
- `apps/server/src/app.js` — builds the Express app: security headers
  (helmet), CORS allow-list, body-size limit, requestId middleware, routes,
  error handling.
- `apps/server/src/server.js` — HTTP server bootstrap + graceful shutdown.
  (Socket.IO bootstrap arrives in Phase 8; leave a clear extension point.)
- `apps/server/src/config/env.js` — Zod-validated env; the app refuses to
  start on invalid config.
- `apps/server/src/lib/`: `prisma.js`, `redis.js`, `logger.js` (pino +
  redaction per §7.4), `crypto.js` (HMAC/AES-GCM helpers — used from Phase 3).
- `apps/server/src/middleware/`: `requestId.js`, `validate.js` (Zod for
  body/query/params), `errorHandler.js`, `notFound.js`, rate-limit
  scaffolding (real limits wired per-route from Phase 3 onward).
- Response envelope helpers built on `@campus/shared`'s
  `successEnvelopeSchema` / `toErrorEnvelope`.
- `GET /health` (process is up) and `GET /ready` (DB + Redis ping).
- Prisma initialized with the first models: `universities`,
  `university_domains`, `departments`, `interests` (§8.3 "Tenancy & identity"
  — only the parts that don't depend on `users` yet).
- Seed script: one target university + its domain + departments + interests.
- Test harness: `tests/helpers/testApp.js`, DB reset helper, factories.
- `apps/server/Dockerfile` (multi-stage, non-root, node:lts-slim).

## Database
- First Prisma migration: tenancy + meta tables only.
- Confirm the UUIDv7 approach works with the installed Prisma version
  (`docs/architecture.md` §8.2) — fall back to app-level generation in
  `lib/ids.js` if not.

## Endpoints
- `GET /health`
- `GET /ready`
- `GET /api/v1/meta/interests` (public for now; auth-gated once Phase 3 lands)
- `GET /api/v1/meta/departments`

## Tests
- Integration tests for `/health`, `/ready`, both meta endpoints.
- `errorHandler` produces no stack trace outside dev mode.
- Validation error shape matches the shared `ErrorEnvelopeSchema`.
- App refuses to start with invalid env (a deliberately broken `.env` in a test).

## Security / performance
- helmet enabled, CORS allow-list configured (not `*`).
- 100KB JSON body limit.
- A log-redaction unit test asserts secrets/PII never appear in log output.

## Definition of done
- `pnpm --filter @campus/server dev` runs.
- CI runs these integration tests against Postgres/Redis service containers.
- The server Docker image builds.

## Not yet
Auth, users, Socket.IO, BullMQ worker, object storage — all later phases.
