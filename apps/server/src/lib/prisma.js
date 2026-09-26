// @ts-check
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getEnv } from '../config/env.js';

/**
 * Prisma 7 removed the classic `datasource { url = env("DATABASE_URL") }`
 * schema pattern — the client now requires an explicit driver adapter.
 * See docs/adr/0010-prisma-7-driver-adapter.md for why this is a
 * mechanical change, not an architecture change (PostgreSQL is still the
 * source of truth per docs/architecture.md §8.1).
 *
 * Constructing PrismaClient does not open a connection — the underlying
 * `pg` pool connects lazily on first query — so creating this singleton
 * at module load time is safe and is the conventional pattern.
 */

const env = getEnv();
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

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
