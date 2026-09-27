# Phase 4 — Anonymous identity, profile & privacy settings

Implements docs/architecture.md §3.2 (identity model), §8.3 "Persona"
tables, §11.4–11.6 (public vs private fields, the "four locks", name
generation) and §28 P4. A verified student picks a generated pseudonym,
optionally adds a department/semester/interests, and gets a real Profile
tab with privacy controls — no posts, feed, or chat yet (those are later
phases).

## What was built

**packages/shared**:
- `src/schemas/profile.js` — `ProfileOptionsResponseSchema`,
  `ProfileCreateBodySchema`, `ProfileUpdateBodySchema`,
  `ProfileRenameBodySchema`, `ProfileInterestsBodySchema`,
  `PublicProfileResponseSchema` (show_\*-gated, fields **absent** when
  hidden, never `null`), `MyProfileResponseSchema`,
  `SettingsResponseSchema`/`SettingsUpdateBodySchema`.
- `enums.js`: `AvatarColorToken` (8 tokens — a contract name, not a hex
  value; mobile owns the hex).
- `errors.js`: `PROFILE_REQUIRED`, `PROFILE_OPTIONS_EXPIRED`,
  `INVALID_PROFILE_OPTION`, `RENAME_TOO_SOON`.
- `limits.js`: `PROFILE_LIMITS` (options count/TTL, generation retry
  budget, max interests, semester range).
- `schemas/meta.js`: `InterestSchema` gained an **optional** `id` field
  (see "decisions" below).

**packages/database** — `anonymous_profiles`, `profile_name_history`,
`profile_interests` (migration `20260927043210_profile_identity`), plus
a `DmPolicy` enum. V1 columns (bio, allow_discovery, looking_for, skills)
deliberately left out.

**apps/server** — `src/modules/profiles/` layered exactly like `auth`
(routes → controller → service → repository → presenter → policies):
- `animals.js`/`nameGenerator.js` — ~60 curated animals + a 1000–9999
  number, composed server-side only; `nameGenerator.js` is pure/unit-
  tested, the DB-uniqueness retry loop lives in `service.js`
  (`generateUniqueOptions`, with an injectable `generateCandidate` so a
  test can force a collision deterministically).
- Issued option batches (3 name+color pairs) are cached in Redis per
  user (`profile:options:{userId}`, TTL 15 min) and consumed exactly
  once — the same short-lived-Redis-state pattern Phase 3 used for the
  OTP pending-challenge cache. A client can only ever submit a
  name/color pair the server itself generated; anything else is
  `INVALID_PROFILE_OPTION`, and nothing-was-ever-issued is
  `PROFILE_OPTIONS_EXPIRED`.
- Endpoints: `GET /me/profile/options`, `POST/GET/PATCH /me/profile`,
  `POST /me/profile/rename`, `PUT /me/interests`,
  `GET /profiles/:publicId`, `GET/PATCH /me/settings`.
- New `requireOnboarded` middleware (reads `users.onboarded_at` through
  auth's own repository, same pattern as `requireAccountState`), applied
  only to routes that assume a persona already exists.
- New `sendPresented()` helper in `http/respond.js` (§11.5 lock 3):
  parses a presenter's output against its own shared response schema —
  `.strict()` in dev/test (throws on an unexpected key), plain `.parse()`
  (silently strips) in production. **Scope note:** this only strictens
  the top-level object, not nested arrays/objects inside it (e.g. a
  stray key on an individual interest wouldn't be caught) — fine for a
  first cut of lock 3, worth tightening in a later phase if it matters.
- `tests/helpers/leakTest.js` — reusable leak-scanning helper (lock 4),
  plus its first suite, `tests/security/leakTests.test.js`, covering
  `GET /profiles/:publicId`.

**apps/mobile**:
- `(onboarding)/guidelines.js` — real 18+ checkbox + guidelines copy +
  the "hidden but stable" identity explainer; must check the box to
  continue.
- `(onboarding)/identity.js` — fetches and renders the 3 options,
  regenerate button, no free-text input anywhere.
- `(onboarding)/interests.js` — optional department (chips, from
  `GET /meta/departments`)/semester (1–12)/interests (chips, from
  `GET /meta/interests`, capped at 8), then one `POST /me/profile` call;
  on success sets `session.status = 'ready'` directly (mirrors how
  `verify.js` handles a successful OTP verify).
- `src/features/onboarding/store.js` — ephemeral (in-memory, not
  persisted) Zustand store carrying the draft across the three screens.
- `(tabs)/profile.js` — real Profile tab: persona header + rename (gated
  by `canRenameAt`), department/semester/interests editing, privacy
  switches (`show_*`, `dmPolicy` as "allow message requests"), avatar
  color picker, and the now-**permanent** logout button.
- `(app)/profile/[publicId].js` — new route, public fields only; a
  hidden field is simply not rendered (matches the API's "absent, not
  null" contract).
- New `src/components/ui/Chip.js` (was already planned in the P2 design-
  system inventory, first built here) and `src/theme/avatarColors.js`
  (mobile's own hex-per-token mapping).

## Decisions not spelled out in the architecture doc

1. **`GET /me/profile` isn't in the §26 endpoint list, but was added.**
   The listed endpoints cover creating/editing a profile, but nothing
   reads it back — yet the Profile tab needs to show the current persona
   on every app launch (React Query's cache doesn't survive a restart;
   query persistence is explicitly out of scope for MVP per §6.4). Added
   `GET /me/profile` (self, full detail incl. `canRenameAt`) the same way
   Phase 3 added `checkRateLimit()` for a gap the endpoint list didn't
   anticipate.
2. **Unforgeable name options: Redis cache, not a signed token.** The
   architecture says options must be server-issued but doesn't say how a
   later request proves which batch was issued. Chose the same pattern
   Phase 3 used for the OTP pending-email cache — Redis, keyed by userId,
   TTL'd — over a signed JWT-style token, because it needs no new crypto
   primitive and a single-use-then-delete cache is a slightly stronger
   guarantee (the value is actually gone after use/expiry, not just
   logically stale).
3. **`InterestSchema` (Phase 1) gained an optional `id`.** The public
   `GET /meta/interests` list only ever exposed `{slug, name, category}`
   — harmless for a read-only picker, but `PUT /me/interests`/
   `POST /me/profile`'s `interestIds` need the actual row id, which
   nothing in the client had access to. Interests are a public lookup
   table (no privacy concern, unlike `users`/`user_identities`), so
   exposing `id` is safe; made it optional rather than required so the
   *embedded* interest list inside a profile response (which never had
   it and doesn't need it) isn't forced to start populating it too. An
   additive change to an existing schema, allowed any time per §26.
4. **A routing bug caught by the existing `notFound` test, not a new
   one.** The first cut mounted `minAppVersion` at the shared `/api/v1`
   prefix (`router.use('/api/v1', requireCurrentApp, profilesRouter)`),
   which gated *every* request under `/api/v1` — including a completely
   unmatched path, which should 404, not 426. Fixed by moving
   `requireCurrentApp` inside `createProfilesRouter(env)` and listing it
   per-route (matching how the single `/api/v1/me` route already did it)
   instead of at the mount point. `docs/phases/phase-3-auth.md`'s
   `authRouter` mount has the same latent issue for `/api/v1/auth/*`, but
   no test exercises that path, so it wasn't touched here — worth a look
   whenever that module is next revisited.
5. **Test factories now match the real signup invariant.** The
   `createUser` test factory didn't create a `user_settings` row (unlike
   the real `otp/verify` transaction in Phase 3), so `/me/settings`
   tests using it 500'd with "missing user_settings row". Fixed the
   factory itself (wrapped in a small transaction, same as production)
   rather than special-casing every settings test.

## Verified

- `pnpm run lint`, `format:check`, `typecheck`, and `test` all pass from
  a clean generated-Prisma-client state: **287 tests** (69 shared + 60
  mobile + 158 server), up from 194 at the end of Phase 3.
- Docker build of the server image succeeds.
- Manual end-to-end run against real Postgres/Redis/Mailpit: signup →
  fetch 3 options → create profile (department/semester/interests
  omitted) → `GET /me` now `COMPLETE` → `GET /me/profile` round-trips →
  `PATCH /me/profile` (privacy flag + dmPolicy) persists → a second user
  fetches `GET /profiles/:publicId` and sees only the public fields,
  respecting the just-changed `show_*`/`dmPolicy` values → an unknown
  `publicId` returns 404. Transcript (tokens/codes replaced with
  placeholders):

```
$ curl -X POST :3000/api/v1/auth/otp/request ... -d '{"email":"demo-p4@test.local"}'
{"success":true,"data":{"challengeId":"<id>","resendAvailableAt":"…"}}

$ curl -X POST :3000/api/v1/auth/otp/verify ... -d '{"challengeId":"<id>","code":"<code>",...}'
{"success":true,"data":{"accessToken":"<jwt>","refreshToken":"<t>","expiresIn":900,"onboarding":"NEEDS_PROFILE"}}

$ curl :3000/api/v1/me/profile/options -H 'Authorization: Bearer <jwt>'
{"success":true,"data":{"options":[
  {"name":"Anonymous Rhino #8028","avatarColor":"SLATE"},
  {"name":"Anonymous Antelope #8302","avatarColor":"CORAL"},
  {"name":"Anonymous Owl #9778","avatarColor":"VIOLET"}],"expiresAt":"…"}}

$ curl -X POST :3000/api/v1/me/profile -H 'Authorization: Bearer <jwt>' \
    -d '{"selectedName":"Anonymous Rhino #8028","avatarColor":"SLATE","acceptedGuidelines":true}'
{"success":true,"data":{"publicId":"p_SFUyhQAJsLw9","displayName":"Anonymous Rhino #8028",
  "avatarColor":"SLATE","department":null,"semester":null,"showDepartment":true,
  "showSemester":true,"showInterests":true,"dmPolicy":"EVERYONE","interests":[],
  "canRenameAt":"2026-10-27T…","createdAt":"2026-09-27T…"}}

$ curl :3000/api/v1/me -H 'Authorization: Bearer <jwt>'
{"success":true,"data":{...,"onboarding":"COMPLETE",...}}

$ curl -X PATCH :3000/api/v1/me/profile -H 'Authorization: Bearer <jwt>' \
    -d '{"showDepartment":false,"dmPolicy":"NOBODY"}'
{"success":true,"data":{...,"showDepartment":false,"dmPolicy":"NOBODY",...}}

# A second, independently-verified user:
$ curl :3000/api/v1/profiles/p_SFUyhQAJsLw9 -H 'Authorization: Bearer <jwt2>'
{"success":true,"data":{"publicId":"p_SFUyhQAJsLw9","displayName":"Anonymous Rhino #8028",
  "avatarColor":"SLATE","interests":[],"dmPolicy":"NOBODY"}}
  # note: no "department" key at all — showDepartment is now false

$ curl :3000/api/v1/profiles/p_doesnotexist -H 'Authorization: Bearer <jwt2>'
{"success":false,"error":{"code":"NOT_FOUND",...}}   # HTTP 404
```

`grep` over both the server and worker logs for the emails/codes used in
this session found zero matches, confirming Phase 3's redaction
guarantee still holds with the new module in the request path.

## Not built (deliberately out of scope for P4)

Skills, bio, looking-for, discovery/search (V1+). Blocks, reports,
moderation (P5). Posts, comments, media, chat, sockets, push, account
deletion. A settings UI screen on mobile (the `/me/settings` API exists
and is tested, but no screen calls it yet — nothing in the app needs a
setting other than `theme`/`pushPreview` until push exists).

## Testing on a phone (Expo Go)

Same as Phase 3 — see `docs/phases/phase-3-auth.md`'s "Testing on a
phone" section for the full `expo start --tunnel` steps. Once logged in
with a fresh email, the app should land on `guidelines` → `identity` →
`interests` → the real Profile tab automatically (no manual navigation
needed — the `session` store's status drives the route groups).
