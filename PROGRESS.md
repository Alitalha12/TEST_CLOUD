# Progress — resume here

**Last updated:** 2026-09-26
**Branch:** `feat/phase-1-backend-foundation` (pushed to `origin`, clean tree)
**Status:** Phases 0–3 done and pushed. Next up: **Phase 4**.

## Done

| Phase | What | Commit(s) |
|---|---|---|
| 0 | Repo & tooling foundation | `7bb673c` |
| 1 | Backend foundation (Express, health/ready, `meta` module) | `525ff80` |
| 2 | Mobile foundation (Expo Router shell, design system, API client) | `e999827` |
| — | Refactor: extracted Prisma into `packages/database` (its own top-level folder, per your "frontend/backend/database each in their own folder" instruction) | `5470658` |
| 3 | Auth: shared contracts, DB tables, OTP/JWT/refresh backend, mobile auth screens | `80eca65`, `b3e1633`, `f8192e2`, `8fc0388` |

Full write-up of Phase 3 (what was built, two judgment calls made and why,
the manual verification transcript): **`docs/phases/phase-3-auth.md`**.

## Verified before stopping

- `pnpm run lint`, `format:check`, `typecheck`, `test` all pass from a
  clean state (194 tests: 46 shared + 39 mobile + 109 server).
- Manual end-to-end run against real Postgres/Redis/Mailpit: signup →
  verify → `/me` → refresh → reuse-detection revokes the whole session
  family → logout → refresh-after-logout fails. Confirmed via `grep`
  that the OTP code/email never appear in server or worker logs.
- Docker build of the server image succeeds.

## To resume tomorrow

```bash
git status                    # should be clean, on feat/phase-1-backend-foundation
pnpm docker:up                # Postgres, Redis, s3mock, Mailpit
docker compose ps             # wait for all healthy
pnpm db:generate               # regenerate the Prisma client (not committed)
pnpm db:migrate                 # only if a schema change is pending — it isn't right now
pnpm db:seed                    # seeds university "uet", domains uet.edu.pk + test.local
```

Then, in separate terminals:

```bash
pnpm --filter @campus/server run dev      # API on :3000
pnpm --filter @campus/server run worker   # BullMQ email worker (needed for OTP mail)
```

Sanity check: `pnpm run test` should show 194 passing. If it doesn't,
something changed since this file was written — trust the test run, not
this file.

**Local dev secrets** (`apps/server/.env`, gitignored) already has valid
values for `EMAIL_HASH_PEPPER`, `EMAIL_ENC_KEY`, `JWT_ACCESS_SECRET`,
`JWT_KID`. If that file is ever missing/reset, regenerate per the
comments in `apps/server/.env.example`.

## Next: Phase 4 — anonymous identity, profile & privacy settings

The prompt for this (already written, ready to paste to a fresh Sonnet
session) covers: `anonymous_profiles`/`profile_name_history`/
`profile_interests` tables, the name generator (3 options, 30-day
rename cooldown), profile CRUD + public-profile endpoint, the "four
locks" leak-prevention pattern (introduces the leak-test harness used in
every phase from here on), and the mobile onboarding flow (guidelines →
identity → interests) plus a real Profile tab. Ask for it again if it's
not still in scope/chat history — it was tailored to the exact state of
this repo as of commit `8fc0388`, so if anything material has changed,
regenerate it rather than reusing a stale copy verbatim.

**Folder rule to keep enforcing:** `packages/shared` gets new Zod schemas
FIRST (contract-first), `packages/database` gets schema/migration only,
`apps/server` is backend only (imports `@campus/database` +
`@campus/shared`), `apps/mobile` is frontend only.

## Known quirks worth remembering

- `packages/database` needs `prisma:generate` before `tsc`/tests can see
  any model — this is already wired via `pretypecheck`/
  `preprepare-test-db` hooks in `packages/database/package.json`, but if
  you ever bypass those scripts directly, regenerate manually first.
- Tests use a **separate Redis logical DB** (`TEST_REDIS_URL`, index 1 on
  the same server) — never the same one `pnpm dev` uses. If you start the
  dev server and worker for manual testing, use **exactly one** of each
  (a stray leftover worker process silently steals BullMQ jobs from the
  new one — this cost real debugging time once already; check
  `pgrep -fa "src/server.js|src/worker.js"` before starting new ones).
- `apps/mobile/app.config.js`'s `version` is kept equal to the server's
  `MIN_APP_VERSION`/`LATEST_APP_VERSION` (currently `1.0.0`) — if you
  bump one, bump the other, or the app gets a false `UPGRADE_REQUIRED`.
