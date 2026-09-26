// @ts-check
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 removed the classic `datasource { url = env("DATABASE_URL") }`
 * schema pattern — the client now requires an explicit driver adapter.
 * See docs/adr/0010-prisma-7-driver-adapter.md for why this is a
 * mechanical change, not an architecture change (PostgreSQL is still the
 * source of truth per docs/architecture.md §8.1), and
 * docs/adr/0011-separate-database-package.md for why this package reads
 * `DATABASE_URL` straight from `process.env` instead of importing an
 * app's own `env.js`: `@campus/database` is imported BY apps (server,
 * and later the worker and admin), so it must never import an app back —
 * that would be a circular dependency. Whichever process imports this
 * module is responsible for having `DATABASE_URL` in `process.env`
 * already (apps/server's `--env-file-if-exists=.env` on the node command
 * does this before any application code runs).
 *
 * Constructing PrismaClient does not open a connection — the underlying
 * `pg` pool connects lazily on first query — so creating this singleton
 * at module load time is safe and is the conventional pattern.
 */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    '@campus/database: DATABASE_URL is not set in process.env. The importing app must load its env (e.g. a .env file) before importing @campus/database.',
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({ adapter });

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Cheap liveness check used by GET /ready.
 * @returns {Promise<boolean>}
 */
export async function pingDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
