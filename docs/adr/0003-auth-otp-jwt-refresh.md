# ADR 0003: Email OTP + short JWT + rotating refresh token

**Status:** Accepted (implementation lands in Phase 3)

## Context
Students must prove university membership without a password (no extra
attack surface, nothing to forget) and without a third-party identity
provider holding data about a supposedly-anonymous platform.

## Decision
University email → 6-digit OTP (hashed, 10 min expiry, rate-limited) →
15-minute JWT access token + a rotating opaque refresh token stored
hashed in Postgres, with reuse detection revoking the whole session
family (`docs/architecture.md` §11.2–11.3).

## Why
- No password store, no password reset flow, no credential stuffing surface.
- A third-party auth provider (Firebase Auth/Auth0/Clerk) would hold the
  identity link the whole product is designed to keep tightly scoped.
- Magic links cause deep-link friction on mobile; OTP is simpler on native apps.

## Consequences
- The server must run a mailer + queue from Phase 3 onward.
- Real university inboxes must be tested for deliverability before beta
  (see the Phase 3 "Critical check" in §28).
