// @ts-check
/**
 * Prisma 7 config file. As of Prisma 7, the classic
 * `datasource { url = env("DATABASE_URL") }` schema syntax is no longer
 * supported — the connection URL for Migrate/CLI commands lives here
 * instead, and the runtime PrismaClient takes a driver adapter directly
 * (see src/lib/prisma.js). See docs/adr/0010-prisma-7-driver-adapter.md.
 *
 * Prisma's own dotenv auto-loading has inconsistent timing across
 * subcommands in this version (works for `validate`, not for
 * `migrate dev` — verified directly), so every npm script in
 * package.json that shells out to the Prisma CLI wraps it with Node's
 * own `--env-file-if-exists=.env`, which guarantees `process.env` is
 * populated before this file is even evaluated. Do not remove that
 * wrapper on the assumption Prisma will load `.env` itself.
 */
export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'node --env-file-if-exists=.env prisma/seed.js',
  },
};
