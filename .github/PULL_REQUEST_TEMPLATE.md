## What & why

<!-- What does this PR do, and why? Link the phase doc / issue it belongs to. -->

## Phase

<!-- e.g. Phase 3 — Authentication. See docs/architecture.md §28. -->

## Screenshots (UI changes)

<!-- Before/after screenshots or a short screen recording, if applicable. -->

## Checklists

- [ ] API contract changed? (If yes: `packages/shared` schemas updated in this PR, and reviewed by both a backend and a mobile owner — see `docs/architecture.md` §24.)
- [ ] Database migration included? (If yes: only one migration-carrying PR should be open at a time — announce it to the team.)
- [ ] Tests added/updated for this change (unit / integration / security as applicable — see `docs/architecture.md` §22).
- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` all pass locally.

## Security impact

<!-- Any new endpoint, permission check, data exposure, or auth change? "None" is fine if genuinely none. -->

## Not implemented (deliberately out of scope for this PR)

<!-- What did you leave out on purpose, and why? -->
