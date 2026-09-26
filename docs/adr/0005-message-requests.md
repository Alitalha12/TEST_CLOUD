# ADR 0005: First DM is a request, not an open channel (D10)

**Status:** Accepted (implementation lands in Phase 8)

## Context
`plan.md` implies chat starts immediately between any two students. On an
anonymous platform, unrestricted first contact is a major harassment
vector.

## Decision
The first message to someone creates a conversation in `REQUESTED` state.
The recipient must `accept` before the conversation becomes `ACTIVE`.
Until accepted, the initiator is limited (text only, capped message
count, no images).

## Why
This is the single biggest harassment-prevention lever available for
anonymous DMs, at a low implementation cost (one extra state on
`conversations`).

## Consequences
- Mobile needs an "Inbox / Requests" split in the Chats tab (§6.2).
- Rate limits differ for `REQUESTED` vs `ACTIVE` conversations (§9, §13.2).
