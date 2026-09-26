// @ts-check
/**
 * Prisma 7 config file. As of Prisma 7, the classic
 * `datasource { url = env("DATABASE_URL") }` schema syntax is no longer
 * supported — the connection URL for Migrate/CLI commands lives here
 * instead, and the runtime PrismaClient takes a driver adapter directly
 * (see src/client.js). See docs/adr/0010-prisma-7-driver-adapter.md.
 *
 * Prisma's own dotenv auto-loading has inconsistent timing across
 * subcommands in this version (works for `validate`, not for
 * `migrate dev` — verified directly), so every npm script in
 * package.json that shells out to the Prisma CLI wraps it with
 * `scripts/run-with-env.mjs`, which loads `apps/server/.env` (this
 * package has no `.env` of its own — see
 * docs/adr/0011-separate-database-package.md) and guarantees
 * `process.env` is populated before this file is even evaluated. The
 * seed command below inherits that same already-populated `process.env`
 * from its parent (`prisma db seed` → this config → the command below),
 * so it does not need its own env-loading flag.
 */
export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
};
