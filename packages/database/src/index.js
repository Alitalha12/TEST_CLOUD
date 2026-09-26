// @ts-check
export { prisma, disconnectPrisma, pingDatabase } from './client.js';

/**
 * Re-exports Prisma's own generated namespace (model types, `Prisma.raw`,
 * enums, etc.) so consumers never need `@prisma/client` as a direct
 * dependency — only `@campus/database`. Source: apps/server/tests/helpers/db.js
 * uses `Prisma.raw` for a safe (non-`$queryRawUnsafe`) truncate list.
 */
export { Prisma } from '@prisma/client';
