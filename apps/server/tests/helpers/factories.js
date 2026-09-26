// @ts-check
import { prisma } from '@campus/database';

/** @param {string} prefix */
function uniqueSlug(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{ slug?: string; name?: string; status?: 'ACTIVE' | 'PILOT' | 'DISABLED' }} [overrides]
 */
export function createUniversity(overrides = {}) {
  return prisma.university.create({
    data: {
      slug: overrides.slug ?? uniqueSlug('test-uni'),
      name: overrides.name ?? 'Test University',
      status: overrides.status ?? 'PILOT',
    },
  });
}

/**
 * @param {string} universityId
 * @param {{ name?: string; sortOrder?: number }} [overrides]
 */
export function createDepartment(universityId, overrides = {}) {
  return prisma.department.create({
    data: {
      universityId,
      name: overrides.name ?? `Test Department ${uniqueSlug('')}`,
      sortOrder: overrides.sortOrder ?? 0,
    },
  });
}

/**
 * @param {{ slug?: string; name?: string; category?: string | null; isActive?: boolean }} [overrides]
 */
export function createInterest(overrides = {}) {
  return prisma.interest.create({
    data: {
      slug: overrides.slug ?? uniqueSlug('test-interest'),
      name: overrides.name ?? 'Test Interest',
      category: overrides.category ?? null,
      isActive: overrides.isActive ?? true,
    },
  });
}
