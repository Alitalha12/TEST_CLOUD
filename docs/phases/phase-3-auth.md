# Phase 3 — Authentication & university verification

Implements docs/architecture.md §11 (Authentication & Anonymity) and §28
P3. A real student verifies their university email via OTP and gets a
persistent, rotating session — no profile, feed, or push yet (those are
later phases).

## What was built

**packages/shared** — `src/schemas/auth.js`: `OtpRequestBodySchema`,
`OtpVerifyBodySchema`, `RefreshBodySchema`, `MeResponseSchema`,
`AppConfigResponseSchema`, etc. `INVALID_CODE` added to `errors.js`.

**packages/database** — `users`, `user_identities`,
`verification_challenges`, `sessions`, `banned_email_hashes`,
`user_settings` (migration `20260926200141_auth`). No real name, phone,
or student ID column anywhere (D8) — only an encrypted email plus an
HMAC hash of it.

**apps/server**:
- `src/lib/crypto.js` — email normalization, HMAC hashing, AES-256-GCM
  encrypt/decrypt, constant-time compare, OTP/refresh-token generation.
- `src/lib/jwt.js` — HS256 access-JWT sign/verify with `kid`, distinguishing
  an expired token from every other verification failure.
- `src/lib/mailer.js`, `src/queues/email.queue.js`, `src/worker.js` — BullMQ
  `email` queue + a separate worker process (`pnpm --filter @campus/server
  run worker`); the OTP code is enqueued in plaintext (it has to reach the
  mail body) and never logged, and both `removeOnComplete` and
  `removeOnFail` are set so it never lingers in Redis either way.
- `src/middleware/authenticate.js`, `requireAccountState.js`,
  `minAppVersion.js` — JWT auth, a 60s-cached account-status check
  (SUSPENDED/BANNED → 403), and `X-App-Version` gating (426 below the
  configured minimum).
- `src/modules/auth/*` — the `otp/request`, `otp/verify`, `refresh`,
  `logout` endpoints and `GET /api/v1/me`, layered exactly like `meta`
  (routes → controller → service → repository → presenter).
- `src/routes.js` became a factory (`createRouter(env)`) instead of a
  static singleton — `minAppVersion` needs `env.MIN_APP_VERSION`, and a
  static router built from the process-wide `getEnv()` would have
  ignored a test's `buildTestApp({env})` override.

**apps/mobile**:
- `src/lib/storage/secure.js` — expo-secure-store wrapper (tokens only).
- `src/features/auth/{api,tokenProvider}.js` — real endpoint calls and a
  SecureStore-backed token provider with single-flight refresh, replacing
  `stubAuthTokenProvider`. Installed into `apiClient` via a mutable
  delegate (`setApiClientTokenProvider`) rather than an import, to avoid
  a circular import between `lib/api/client.js` and `features/auth/*`.
- `src/stores/session.js` — real `bootstrap()` (booting → read refresh
  token → refresh → `GET /me` → status) and `logout()`, called once from
  `app/_layout.js`.
- `(auth)/email.js` and `(auth)/verify.js` — real screens: domain/rate-limit
  error copy with a live countdown (the server now returns
  `retryAfterSeconds` in `RATE_LIMITED`'s `details`), a resend timer driven
  by `resendAvailableAt`, and `INVALID_CODE` copy.
- Temporary "Log out" buttons on `profile.js` and `guidelines.js`, so
  `needs_onboarding`/`ready` have a manual way back to `unauthenticated`
  until profile creation (P4) gives that a real exit.

## Two decisions not spelled out in the architecture doc

1. **Where does the plaintext email live between `otp/request` and
   `otp/verify`?** `verification_challenges` (§8.3) has only `email_hash`,
   and `otp/verify`'s request body has no email field — so nothing
   durable holds the plaintext by the time a new user needs to be created.
   Chose Redis, under `otp:pending:{challengeId}`, TTL'd to match the
   challenge's own 10-minute expiry: this is exactly the class of
   short-lived, non-source-of-truth state §9 already puts in Redis (e.g.
   the OTP resend cooldown), and a TTL is a *stronger* privacy guarantee
   than a DB column would be (the value is actually gone after 10
   minutes, not just logically stale).
2. **`OTP_VERIFY_ATTEMPTS` is keyed by `emailHash` (§9), which the verify
   request body doesn't carry.** The service loads the challenge (by
   `challengeId`) first regardless, so the rate-limit check runs right
   after that lookup, keyed off the challenge's own `emailHash` — added a
   `checkRateLimit()` escape hatch to `middleware/rateLimit.js` for this
   one case where the key isn't derivable from the request alone.

## Verified

- `pnpm run lint`, `format:check`, `typecheck`, and `test` all pass from a
  clean generated-Prisma-client state: 46 shared + 39 mobile + 109 server
  = 194 tests.
- Manual end-to-end run against real Postgres/Redis/Mailpit (transcript
  below, tokens/codes replaced with placeholders).

## Manual verification transcript

```
$ curl -X POST :3000/api/v1/auth/otp/request -H 'X-App-Version: 1.0.0' \
    -d '{"email":"demo@test.local"}'
{"success":true,"data":{"challengeId":"<challengeId>","resendAvailableAt":"…"}}

# Code read from Mailpit (http://localhost:8025) — never logged by the server/worker.
$ curl -X POST :3000/api/v1/auth/otp/verify -H 'X-App-Version: 1.0.0' \
    -d '{"challengeId":"<challengeId>","code":"<code>","device":{"platform":"ANDROID","label":"Demo","appVersion":"1.0.0"}}'
{"success":true,"data":{"accessToken":"<jwt>","refreshToken":"<token>","expiresIn":900,"onboarding":"NEEDS_PROFILE"}}

$ curl :3000/api/v1/me -H 'Authorization: Bearer <jwt>' -H 'X-App-Version: 1.0.0'
{"success":true,"data":{"maskedEmail":"d***@test.local","status":"ACTIVE","onboarding":"NEEDS_PROFILE","university":{"slug":"uet","name":"University of Engineering and Technology"}}}

$ curl -X POST :3000/api/v1/auth/refresh -d '{"refreshToken":"<token>"}'
{"success":true,"data":{"accessToken":"<jwt2>","refreshToken":"<token2>","expiresIn":900}}

# Reusing the OLD (already-rotated) token:
$ curl -X POST :3000/api/v1/auth/refresh -d '{"refreshToken":"<token>"}'
{"success":false,"error":{"code":"UNAUTHENTICATED", …}}   # HTTP 401

# The legitimately-rotated NEWER token is now also dead — whole family revoked:
$ curl -X POST :3000/api/v1/auth/refresh -d '{"refreshToken":"<token2>"}'
{"success":false,"error":{"code":"UNAUTHENTICATED", …}}   # HTTP 401

# Fresh login, then logout:
$ curl -X POST :3000/api/v1/auth/logout -H 'Authorization: Bearer <jwt3>'
{"success":true,"data":{}}

$ curl -X POST :3000/api/v1/auth/refresh -d '{"refreshToken":"<token3>"}'
{"success":false,"error":{"code":"UNAUTHENTICATED", …}}   # HTTP 401 — logout revoked it too
```

`grep` over both the server and worker logs for every code/email used in
this session found zero matches, confirming the redaction/never-log
guarantee holds in practice, not just in the unit test.

## Not built (deliberately out of scope for P3)

Profiles, onboarding content, feed, chat, push, sockets, `/me/settings`
endpoints (the `user_settings` row is created at signup but nothing reads
or writes it yet). All arrive in later phases.

## Testing on a phone (Expo Go)

```bash
pnpm --filter @campus/server run dev      # terminal 1
pnpm --filter @campus/server run worker   # terminal 2
cd apps/mobile
EXPO_PUBLIC_API_URL=https://<your-public-3000-url>/api/v1 \
EXPO_PUBLIC_SOCKET_URL=https://<your-public-3000-url> \
npx expo start --tunnel --go
```

Scan the QR code, go through the welcome → email → verify flow with a
`@test.local` or `@uet.edu.pk` address, and read the code from Mailpit's
web UI (`http://localhost:8025`, or its own public port if tunneled).
