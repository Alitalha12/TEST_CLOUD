# ADR 0006: Safety primitives before feed and chat (D4)

**Status:** Accepted

## Context
`plan.md` sequences moderation (Phase 6) after feed and chat. Every feed
and chat query needs to filter blocked users, and every content-creating
endpoint needs to call the moderation pre-check — retrofitting that into
already-shipped queries means rewriting them.

## Decision
Build blocks, reports, account states, and the moderation rules engine in
**Phase 5**, before posts (Phase 6) or chat (Phase 8) exist.

## Why
Cheaper to build the filter once and have every later query use it from
day one than to add "and not blocked" to a dozen queries retroactively
(and risk missing one).

## Consequences
- Phase 5 has no user-generated content to moderate yet; its rules engine
  and block/report plumbing are tested in isolation (via Prisma
  Studio/direct DB inspection) before Phase 6 gives them real content to act on.
