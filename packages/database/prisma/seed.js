// @ts-check
import { prisma, disconnectPrisma } from '../src/client.js';

/**
 * Seeds the target university, its email domain, a handful of
 * departments, and the interest list — docs/architecture.md §28 P1
 * "Seed script: one target university + its domain + departments +
 * interests" and plan.md §16/§17.
 *
 * Idempotent (upsert-based) so it's safe to run repeatedly in dev and CI.
 */

const UNIVERSITY = { slug: 'uet', name: 'University of Engineering and Technology' };
const DOMAIN = 'uet.edu.pk';

const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Electrical Engineering',
  'Mathematics',
  'Physics',
  'Business',
];

/** @type {Array<{ slug: string; name: string; category: string }>} */
const INTERESTS = [
  { slug: 'ai-ml', name: 'AI/ML', category: 'Technology' },
  { slug: 'web-development', name: 'Web Development', category: 'Technology' },
  { slug: 'mobile-development', name: 'Mobile Development', category: 'Technology' },
  { slug: 'cyber-security', name: 'Cyber Security', category: 'Technology' },
  { slug: 'blockchain', name: 'Blockchain', category: 'Technology' },
  { slug: 'cloud', name: 'Cloud', category: 'Technology' },
  { slug: 'devops', name: 'DevOps', category: 'Technology' },
  { slug: 'ui-ux', name: 'UI/UX', category: 'Technology' },
  { slug: 'programming', name: 'Programming', category: 'Technology' },
  { slug: 'gaming', name: 'Gaming', category: 'Entertainment' },
  { slug: 'photography', name: 'Photography', category: 'Entertainment' },
  { slug: 'sports', name: 'Sports', category: 'Entertainment' },
  { slug: 'movies', name: 'Movies', category: 'Entertainment' },
  { slug: 'startups', name: 'Startups', category: 'Career' },
  { slug: 'research', name: 'Research', category: 'Career' },
  { slug: 'freelancing', name: 'Freelancing', category: 'Career' },
];

async function main() {
  const university = await prisma.university.upsert({
    where: { slug: UNIVERSITY.slug },
    update: { name: UNIVERSITY.name },
    create: { ...UNIVERSITY, status: 'PILOT' },
  });

  await prisma.universityDomain.upsert({
    where: { domain: DOMAIN },
    update: { universityId: university.id, isActive: true },
    create: { domain: DOMAIN, universityId: university.id, isActive: true },
  });

  for (const [index, name] of DEPARTMENTS.entries()) {
    await prisma.department.upsert({
      where: { universityId_name: { universityId: university.id, name } },
      update: { sortOrder: index },
      create: { universityId: university.id, name, sortOrder: index },
    });
  }

  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { slug: interest.slug },
      update: { name: interest.name, category: interest.category, isActive: true },
      create: { ...interest, isActive: true },
    });
  }

  console.log(
    `Seeded university "${university.slug}" with ${DEPARTMENTS.length} departments and ${INTERESTS.length} interests.`,
  );
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
