# Conventions

Practical rules for writing code in this repo. The architecture and the
*why* behind these rules live in `docs/architecture.md`; this file is the
short, enforceable version to check a PR against.

## Language

- JavaScript only, with `// @ts-check` at the top of every file and
  `checkJs: true` in `jsconfig.json` (see `packages/config/jsconfig.base.json`).
  TypeScript is a **dev-only** dependency used for `tsc --noEmit` type
  checking and for generating `.d.ts` declarations from `@campus/shared`.
  No `.ts` source files anywhere (ADR 0002).
- Use JSDoc `@typedef`/`@param`/`@returns` for anything non-trivial. Import
  shared payload types from `@campus/shared` rather than redefining them.

## Layering (backend, from Phase 1 onward)

Each backend module (`apps/server/src/modules/<name>/`) is layered exactly
as described in `docs/architecture.md` §7.2/§7.3:

```
routes.js → controller.js → service.js → repository.js → presenter.js
```

- **`routes.js`** — path + middleware chain + binds to a controller function. No logic.
- **`controller.js`** — HTTP ⇄ service translation only. No Prisma calls, no business rules.
- **`service.js`** — business rules, authorization policy checks, `prisma.$transaction`, enqueues jobs after commit.
- **`repository.js`** — Prisma queries only. **Always** an explicit `select` (never a bare `include` that could pull in `user`/`user_identities`). **Always** scoped by `universityId` from the authenticated session, never from client input.
- **`presenter.js`** — the **only** place a DTO is built from an internal row. This is how private fields are kept from leaking (§11.5's "four locks"). Every response passes through a presenter and its shared-schema response type.
- **`policies.js`** — pure functions like `canDeletePost(actor, post)`; called from the service, never duplicated inline.

**Rule:** if you find yourself importing Prisma into a controller, or
returning a raw Prisma row from a service, stop — that's a layering
violation, not a shortcut.

## The presenter/DTO rule

No internal database row (especially anything from `users` or
`user_identities`) ever crosses a module boundary as-is. It's mapped to a
DTO shape defined by a Zod schema in `@campus/shared`, and in dev/test the
response is validated against that schema and **fails loudly** on
unexpected extra keys. See `docs/architecture.md` §11.5.

## Naming

- Files: `camelCase.js` for modules/utilities, `PascalCase.js` for React
  components only.
- Database: `snake_case` tables/columns (via Prisma `@@map`/`@map`),
  `camelCase` in JS/Prisma client usage.
- Zod schemas: `PascalCase` + `Schema` suffix (e.g. `PostCreateSchema`).
- Enums: `PascalCase` name, `SCREAMING_SNAKE_CASE` values (see
  `packages/shared/src/enums.js`).
- Error codes: `SCREAMING_SNAKE_CASE`, defined once in
  `packages/shared/src/errors.js` — never invent an ad-hoc string code
  inline.

## Testing rules

- A phase isn't done until its tests are in CI and green — see the
  Definition of Done for each phase in `docs/architecture.md` §28.
- Server: Vitest + Supertest against **real** Postgres/Redis (Docker
  locally, GitHub Actions service containers in CI). No mocking the
  database in integration tests.
- Every new endpoint gets an authorization-matrix test: unauthenticated,
  another user, another university, a suspended/restricted account, and
  (if relevant) an admin-only check.
- Every new DTO gets covered by the "leak test" harness (introduced in
  Phase 4): fetch as a different user and assert no private field
  (email, email hash, internal UUID outside the owner's own JWT, etc.)
  appears in the response.
- Mobile: Jest + React Native Testing Library for components/hooks;
  Maestro for the critical end-to-end flows listed per-phase in §22.2.

## Commits & PRs

- Conventional Commits: `feat(chat): add message requests`,
  `fix(auth): handle expired refresh token`, `chore: …`, `docs: …`.
- Trunk-based: branch from `main`, short-lived (`feat/…`, `fix/…`,
  `chore/…`, `docs/…`), squash-merge back into `main`. No `develop` branch
  (ADR 0008).
- One migration-carrying PR open at a time — announce it before opening
  a second one.
- Contract-first: a `packages/shared` schema PR merges before the
  backend/mobile PRs that implement it.

## What never goes in git

Secrets, `.env` files (only `.env.example` is committed), real student
data of any kind, and API keys — even in a comment "for testing".
