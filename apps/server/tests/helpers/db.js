// @ts-check
import { Prisma } from '@prisma/client';
import { prisma } from '../../src/lib/prisma.js';

/**
 * Every Phase-1 table, in no particular order — TRUNCATE ... CASCADE
 * handles FK ordering. Extend this list as new tables are added in later
 * phases (docs/conventions.md "Testing rules": "The DB is reset per file
 * via transactions/truncate").
 */
const TABLES = ['departments', 'university_domains', 'universities', 'interests'];

/**
 * Truncates all known tables and restarts identity sequences. Table
 * names are a hardcoded, developer-controlled constant (never derived
 * from external input), so building the identifier list with
 * `Prisma.raw` and running it through the safe tagged-template
 * `$executeRaw` (not `$executeRawUnsafe`) is the correct, lint-clean
 * pattern for this — see docs/architecture.md §20 (SQL injection).
 */
export async function resetDb() {
  const identifierList = Prisma.raw(TABLES.map((table) => `"${table}"`).join(', '));
  await prisma.$executeRaw`TRUNCATE TABLE ${identifierList} RESTART IDENTITY CASCADE`;
}
