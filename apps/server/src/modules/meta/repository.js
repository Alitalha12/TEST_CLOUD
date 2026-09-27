// @ts-check
import { prisma } from '@campus/database';

/**
 * Prisma queries only — always an explicit `select`, per
 * docs/conventions.md "Layering". Interests are not university-scoped
 * (§8.3 `interests` has no `university_id` column); departments are.
 */

export function findActiveInterests() {
  return prisma.interest.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true, category: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
}

/**
 * The MVP targets a single university at launch (docs/architecture.md
 * §4), so "the default university" is the earliest-created ACTIVE/PILOT
 * one. This resolves multi-university ambiguity without requiring an
 * unauthenticated caller to already know a university id.
 */
export function findDefaultUniversity() {
  return prisma.university.findFirst({
    where: { status: { in: ['ACTIVE', 'PILOT'] } },
    select: { id: true, slug: true },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * @param {string} slug
 */
export function findUniversityBySlug(slug) {
  return prisma.university.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });
}

/**
 * @param {string} universityId
 */
export function findDepartmentsByUniversityId(universityId) {
  return prisma.department.findMany({
    where: { universityId },
    select: { id: true, name: true },
    orderBy: { sortOrder: 'asc' },
  });
}
