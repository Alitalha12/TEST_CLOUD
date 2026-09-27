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

/**
 * @param {string} universityId
 * @param {{ domain?: string; isActive?: boolean }} [overrides]
 */
export function createUniversityDomain(universityId, overrides = {}) {
  return prisma.universityDomain.create({
    data: {
      universityId,
      domain: overrides.domain ?? `${uniqueSlug('domain')}.edu`,
      isActive: overrides.isActive ?? true,
    },
  });
}

/**
 * @param {{ emailHash: string; reason?: string }} params
 */
export function createBannedEmailHash({ emailHash, reason }) {
  return prisma.bannedEmailHash.create({
    data: { emailHash, reason: reason ?? 'test-ban' },
  });
}

/**
 * @param {{
 *   universityId: string;
 *   emailHash?: string;
 *   status?: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'BANNED' | 'PENDING_DELETION' | 'DELETED';
 *   onboardedAt?: Date | null;
 * }} params
 */
export function createUser({ universityId, emailHash, status, onboardedAt }) {
  return prisma.user.create({
    data: {
      universityId,
      emailHash: emailHash ?? uniqueSlug('email-hash'),
      status: status ?? 'ACTIVE',
      onboardedAt: onboardedAt ?? null,
    },
  });
}

/**
 * @param {{
 *   userId: string;
 *   familyId?: string;
 *   refreshTokenHash: string;
 *   expiresAt?: Date;
 *   revokedAt?: Date | null;
 *   replacedById?: string | null;
 * }} params
 */
export function createSession({
  userId,
  familyId,
  refreshTokenHash,
  expiresAt,
  revokedAt,
  replacedById,
}) {
  return prisma.session.create({
    data: {
      userId,
      familyId: familyId ?? uniqueSlug('family'),
      refreshTokenHash,
      platform: 'ANDROID',
      deviceLabel: 'Test Device',
      appVersion: '1.0.0',
      ipHash: 'test-ip-hash',
      expiresAt: expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: revokedAt ?? null,
      replacedById: replacedById ?? null,
    },
  });
}

/**
 * @param {{
 *   userId: string;
 *   universityId: string;
 *   publicId?: string;
 *   animal?: string;
 *   number?: number;
 *   displayName?: string;
 *   avatarColor?: string;
 *   departmentId?: string | null;
 *   semester?: number | null;
 *   showDepartment?: boolean;
 *   showSemester?: boolean;
 *   showInterests?: boolean;
 *   dmPolicy?: 'EVERYONE' | 'NOBODY';
 *   nameChangedAt?: Date;
 * }} params
 */
export function createAnonymousProfile({
  userId,
  universityId,
  publicId,
  animal,
  number,
  displayName,
  avatarColor,
  departmentId,
  semester,
  showDepartment,
  showSemester,
  showInterests,
  dmPolicy,
  nameChangedAt,
}) {
  const suffix = uniqueSlug('');
  return prisma.anonymousProfile.create({
    data: {
      userId,
      universityId,
      publicId: publicId ?? `p_test${suffix}`.slice(0, 20),
      animal: animal ?? 'Fox',
      number: number ?? 1234,
      displayName: displayName ?? `Anonymous Fox #${suffix}`,
      avatarColor: avatarColor ?? 'CORAL',
      departmentId: departmentId ?? null,
      semester: semester ?? null,
      showDepartment: showDepartment ?? true,
      showSemester: showSemester ?? true,
      showInterests: showInterests ?? true,
      dmPolicy: dmPolicy ?? 'EVERYONE',
      nameChangedAt: nameChangedAt ?? new Date(),
    },
  });
}
