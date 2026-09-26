# ADR 0004: Minimal identity collection, hard separation from persona (D8, D9)

**Status:** Accepted

## Context
`plan.md` implies collecting real name, phone number and student ID for
verification. The product promise is "hidden from other students, not
from the platform" (`plan.md` §3).

## Decision
Collect **only** a university email. Store it encrypted (AES-256-GCM) plus
an HMAC hash for lookups — never the real name, phone number, or student
ID (D8). The public persona (`anonymous_profiles`) is a separate table
with no path back to the email except through the auth module and an
audited break-glass admin flow (§11.5, §19). Identity reveal (V1.5) shows
a **user-authored reveal card**, never the verified email (D9).

## Why
Data that is never collected cannot leak, cannot be subpoenaed beyond what
exists, and removes an entire class of doxxing risk if the database is
ever compromised.

## Consequences
- Account recovery is only possible via the university email — losing
  access to it (e.g. after graduation) means the account can't be recovered.
- Every module's repository layer must never `include` the `users` or
  `user_identities` tables outside `auth`/`admin` (enforced by an ESLint
  rule — see `packages/config/eslint.config.js`).
