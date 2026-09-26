// @ts-check
import { prisma } from '@campus/database';

/**
 * Prisma queries only, per docs/conventions.md "Layering". This module is
 * exempt from the `noIncludeUserOutsideAuthAdmin` lint rule (it's
 * auth itself) but still never uses a bare `include` — always an
 * explicit `select`.
 */

/**
 * @param {string} domain
 * @returns {Promise<string | null>} the university id, or null if the
 *   domain isn't registered, inactive, or its university is DISABLED.
 */
export async function findActiveUniversityIdForDomain(domain) {
  const record = await prisma.universityDomain.findFirst({
    where: { domain, isActive: true, university: { status: { in: ['ACTIVE', 'PILOT'] } } },
    select: { universityId: true },
  });
  return record?.universityId ?? null;
}

/** @param {string} emailHash */
export async function isEmailBanned(emailHash) {
  const record = await prisma.bannedEmailHash.findUnique({
    where: { emailHash },
    select: { emailHash: true },
  });
  return record !== null;
}

/**
 * @param {{ id: string, emailHash: string, codeHash: string, expiresAt: Date, ipHash: string }} data
 */
export async function createVerificationChallenge(data) {
  return prisma.verificationChallenge.create({
    data: {
      id: data.id,
      emailHash: data.emailHash,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
      ipHash: data.ipHash,
    },
    select: { id: true, expiresAt: true },
  });
}

/** @param {string} id */
export async function findVerificationChallengeById(id) {
  return prisma.verificationChallenge.findUnique({
    where: { id },
    select: {
      id: true,
      emailHash: true,
      codeHash: true,
      attempts: true,
      maxAttempts: true,
      expiresAt: true,
      consumedAt: true,
    },
  });
}

/** @param {string} id */
export async function incrementChallengeAttempts(id) {
  await prisma.verificationChallenge.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

/** @param {string} id */
export async function consumeChallenge(id) {
  await prisma.verificationChallenge.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

/** @param {string} emailHash */
export async function findUserByEmailHash(emailHash) {
  return prisma.user.findUnique({
    where: { emailHash },
    select: { id: true, status: true, onboardedAt: true, universityId: true },
  });
}

/** @param {string} id */
export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, status: true, onboardedAt: true, universityId: true },
  });
}

/** @param {string} id */
export async function findAccountStatusById(id) {
  return prisma.user.findUnique({ where: { id }, select: { status: true } });
}

/** @param {string} id */
export async function findUniversityById(id) {
  return prisma.university.findUnique({ where: { id }, select: { slug: true, name: true } });
}

/** @param {string} userId */
export async function findUserIdentity(userId) {
  return prisma.userIdentity.findUnique({
    where: { userId },
    select: { emailEncrypted: true, emailKeyVersion: true },
  });
}

/**
 * Creates the user, its identity and a default settings row in one
 * transaction (docs/architecture.md §11.2 "create users + user_identities
 * ... in one transaction" — user_settings is included too since it's a
 * required 1:1 row with no meaningful default state to backfill later).
 * @param {{ universityId: string, emailHash: string, emailEncrypted: string, emailKeyVersion: number, emailDomain: string }} data
 */
export async function createUserWithIdentityAndSettings(data) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { universityId: data.universityId, emailHash: data.emailHash, status: 'ACTIVE' },
      select: { id: true, status: true, onboardedAt: true, universityId: true },
    });
    await tx.userIdentity.create({
      data: {
        userId: user.id,
        emailEncrypted: data.emailEncrypted,
        emailKeyVersion: data.emailKeyVersion,
        emailDomain: data.emailDomain,
        verifiedAt: new Date(),
      },
    });
    await tx.userSetting.create({ data: { userId: user.id } });
    return user;
  });
}

/**
 * @param {{ userId: string, familyId: string, refreshTokenHash: string, platform: 'ANDROID' | 'IOS', deviceLabel: string, appVersion: string, ipHash: string, expiresAt: Date }} data
 */
export async function createSession(data) {
  return prisma.session.create({
    data: {
      userId: data.userId,
      familyId: data.familyId,
      refreshTokenHash: data.refreshTokenHash,
      platform: data.platform,
      deviceLabel: data.deviceLabel,
      appVersion: data.appVersion,
      ipHash: data.ipHash,
      expiresAt: data.expiresAt,
    },
    select: { id: true, familyId: true },
  });
}

/** @param {string} refreshTokenHash */
export async function findSessionByRefreshTokenHash(refreshTokenHash) {
  return prisma.session.findUnique({
    where: { refreshTokenHash },
    select: {
      id: true,
      userId: true,
      familyId: true,
      revokedAt: true,
      expiresAt: true,
      platform: true,
      deviceLabel: true,
      appVersion: true,
      ipHash: true,
    },
  });
}

/**
 * Atomically revokes `oldSessionId` (marking it replaced) and creates the
 * rotated session in the same family — see docs/architecture.md §11.3
 * "rotated on every refresh". Doing both in one transaction closes the
 * window where a concurrent read could see neither/only-one change.
 * @param {{ oldSessionId: string, newSession: { userId: string, familyId: string, refreshTokenHash: string, platform: 'ANDROID' | 'IOS', deviceLabel: string, appVersion: string, ipHash: string, expiresAt: Date } }} params
 */
export async function rotateSession({ oldSessionId, newSession }) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.session.create({ data: newSession, select: { id: true } });
    await tx.session.update({
      where: { id: oldSessionId },
      data: { revokedAt: new Date(), revokeReason: 'rotated', replacedById: created.id },
    });
    return created;
  });
}

/**
 * @param {{ id: string, reason: string }} params
 */
export async function revokeSession({ id, reason }) {
  await prisma.session.update({
    where: { id },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

/**
 * Revokes every still-active session in a family — used both for a
 * normal logout (a family usually has exactly one active session) and
 * for reuse detection (§11.3 "revoke the whole family_id").
 * @param {string} familyId
 * @param {string} reason
 */
export async function revokeSessionFamily(familyId, reason) {
  await prisma.session.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}
