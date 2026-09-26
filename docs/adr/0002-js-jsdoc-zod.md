# ADR 0002: JavaScript + JSDoc type-checking + Zod, not TypeScript (D1)

**Status:** Accepted

## Context
`plan.md` §113 mandates JavaScript. A shared API contract across mobile,
server and admin benefits from static types to catch drift (e.g. a field
renamed on the server but not the client).

## Decision
All source is `.js` with `// @ts-check` and `checkJs: true`
(`packages/config/jsconfig.base.json`). TypeScript is a dev-only
dependency used for `tsc --noEmit` type checking and for generating
`.d.ts` declarations from `@campus/shared`'s Zod schemas. Zod schemas are
the actual runtime contract; JSDoc typedefs derived from them give editor
/ CI type checking on top.

## Why
This keeps the `plan.md` JS requirement while still catching most
contract-drift bugs in CI, without the team having to learn/write
TypeScript syntax.

## Consequences
- CI must run `tsc --noEmit` as a required check (see `.github/workflows/ci.yml`).
- `packages/shared` must build its declaration file (`pnpm run build`)
  before mobile/admin editors get full type hints from it.
- No `.ts` source files are permitted anywhere in the repo.
