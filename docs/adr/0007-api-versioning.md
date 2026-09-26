# ADR 0007: `/api/v1` from day one, plus a minimum app version check (D15)

**Status:** Accepted

## Context
`plan.md` uses unversioned `/api/...` routes. Mobile app builds stay
installed on real phones for months after a new version ships — an old
build must not silently break against a newer API.

## Decision
All routes are under `/api/v1/...`. Every request carries `X-App-Version`;
the server returns `426 UPGRADE_REQUIRED` below a configured minimum
(`GET /meta/app-config` publishes the current minimum).

## Why
Versioning cannot be retrofitted for free once real users are on old
builds. It costs nothing to add now.

## Consequences
- A breaking API change needs a new version segment or an additive-only
  change plus a version bump, never an in-place breaking change to `v1`.
