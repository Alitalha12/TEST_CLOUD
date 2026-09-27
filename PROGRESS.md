# Progress — resume here

**Last updated:** 2026-09-27
**Branch:** `feat/phase-4-identity` (built on top of `feat/phase-1-backend-foundation`; not yet pushed/merged — see "Housekeeping" below)
**Status:** Phases 0–4 done. Next up: **Phase 5**.

## Done

| Phase | What | Commit(s) |
|---|---|---|
| 0 | Repo & tooling foundation | `7bb673c` |
| 1 | Backend foundation (Express, health/ready, `meta` module) | `525ff80` |
| 2 | Mobile foundation (Expo Router shell, design system, API client) | `e999827` |
| — | Refactor: extracted Prisma into `packages/database` | `5470658` |
| 3 | Auth: shared contracts, DB tables, OTP/JWT/refresh backend, mobile auth screens | `80eca65`, `b3e1633`, `f8192e2`, `8fc0388` |
| 4 | Identity/profile: shared contracts, DB tables, profiles module, mobile onboarding + Profile tab | `4a0015d`, `6a90138`, `21c8bb6`, `0afa851` |

Full write-ups: **`docs/phases/phase-3-auth.md`**, **`docs/phases/phase-4-identity.md`**
(what was built, judgment calls made and why, manual verification transcripts).

## Verified before stopping (Phase 4)

- `pnpm run lint`, `format:check`, `typecheck`, `test` all pass from a
  clean state: **287 tests** (69 shared + 60 mobile + 158 server).
- Manual end-to-end run against real Postgres/Redis/Mailpit: signup →
  fetch 3 pseudonym options → create profile → `/me` shows `COMPLETE` →
  `GET/PATCH /me/profile` → a second user views the public profile and
  sees only the public, `show_*`-respecting fields → unknown `publicId`
  → 404. Transcript in `docs/phases/phase-4-identity.md`.
- Docker build of the server image succeeds.
- `grep`'d server+worker logs for the session's emails/OTP codes — zero
  matches (Phase 3's redaction guarantee still holds).

## Housekeeping to do before/soon after Phase 5

- **Nothing has been merged to `main` yet** — `main` still has only the
  initial commit; every phase so far lives on
  `feat/phase-1-backend-foundation` (Phases 0–3) with Phase 4 one commit
  ahead of it on `feat/phase-4-identity`. This deviates from the
  trunk-based workflow (ADR 0008). Open a PR and merge before starting
  Phase 5, then branch Phase 5 from `main`.
- The Phase 3 Maestro signup E2E test was never added (no `.maestro/`
  folder yet) — still pending.
- Real-inbox OTP delivery (SPF/DKIM/DMARC check from Phase 3's DoD)
  needs a staging environment — still pending.

## To resume

```bash
git status                    # should be clean, on feat/phase-4-identity
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

Sanity check: `pnpm run test` should show 287 passing. If it doesn't,
something changed since this file was written — trust the test run, not
this file.

**Local dev secrets** (`apps/server/.env`, gitignored) already has valid
values for `EMAIL_HASH_PEPPER`, `EMAIL_ENC_KEY`, `JWT_ACCESS_SECRET`,
`JWT_KID`. If that file is ever missing/reset, regenerate per the
comments in `apps/server/.env.example`.

## Next: Phase 5 — Safety primitives (before any user-generated content)

Per `docs/architecture.md` §28 P5: `blocks`, `reports`,
`moderation_cases`, `moderation_decisions`, `user_sanctions`, `rule_lists`
(seeded) tables; the safety module (block/unblock/list; reports with
per-target-type snapshots; case upsert + priority); the
`moderation.preCheck` rules engine (EN/Urdu/Roman Urdu terms,
personal-data patterns, link policy) as a pure, heavily unit-tested
function; a sanctions service (apply/revoke → status update → Redis
`acct:` cache invalidation → socket disconnect hook stub, since sockets
don't exist until P8); a shared `blockFilter` SQL helper for repositories
future feed/chat modules will use; mobile `ReportSheet` component, block
confirmation, Settings → Blocked users. Ask for a fresh, tailored prompt
when starting this — don't reuse a stale one, since it should be built
against the exact state of the repo at that time.

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
  new one — check `pgrep -fa "src/server.js|src/worker.js"` before
  starting new ones).
- `apps/mobile/app.config.js`'s `version` is kept equal to the server's
  `MIN_APP_VERSION`/`LATEST_APP_VERSION` (currently `1.0.0`) — if you
  bump one, bump the other, or the app gets a false `UPGRADE_REQUIRED`.
- `sendPresented()` (apps/server/src/http/respond.js, Phase 4's lock-3
  helper) only strict-checks the **top level** of a response — a stray
  key nested inside an array/object item won't be caught. Fine so far;
  worth tightening if a future phase's DTOs get deeply nested.
- The `noIncludeUserOutsideAuthAdmin` lint rule already covers
  `apps/server/src/modules/**` except `auth`/`admin` — a new `safety`
  module in Phase 5 is automatically covered, no config change needed.
