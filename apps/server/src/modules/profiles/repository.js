// @ts-check
import { prisma } from '@campus/database';

/**
 * Prisma queries only, per docs/conventions.md "Layering". Always an
 * explicit `select`; `department`/`interest` relations are fine to
 * include here (they're public lookup tables, not `users`/
 * `user_identities` — the four-locks lint rule only forbids those two).
 */

/** The shape every "own profile" read returns — shared by create/read/update. */
const SELF_SELECT = /** @type {const} */ ({
  id: true,
  publicId: true,
  displayName: true,
  avatarColor: true,
  departmentId: true,
  semester: true,
  showDepartment: true,
  showSemester: true,
  showInterests: true,
  dmPolicy: true,
  nameChangedAt: true,
  createdAt: true,
  department: { select: { id: true, name: true } },
  interests: { select: { interest: { select: { slug: true, name: true, category: true } } } },
});

/**
 * @param {string} universityId
 * @param {string} displayName
 */
export async function isDisplayNameTaken(universityId, displayName) {
  const existing = await prisma.anonymousProfile.findUnique({
    where: { universityId_displayName: { universityId, displayName } },
    select: { id: true },
  });
  return existing !== null;
}

/** @param {string} userId */
export async function findProfileByUserId(userId) {
  return prisma.anonymousProfile.findUnique({ where: { userId }, select: SELF_SELECT });
}

/**
 * Scoped by the VIEWER's own universityId, never the caller's input
 * (docs/conventions.md "Layering": repositories "Always scoped by
 * universityId from the authenticated session"). A profile in another
 * university simply doesn't match and returns null — the caller maps
 * that to a generic 404, never revealing whether the publicId exists
 * elsewhere.
 * @param {string} publicId
 * @param {string} viewerUniversityId
 */
export async function findProfileByPublicId(publicId, viewerUniversityId) {
  return prisma.anonymousProfile.findFirst({
    where: { publicId, universityId: viewerUniversityId },
    select: SELF_SELECT,
  });
}

/**
 * @param {string} id department id
 * @param {string} universityId
 */
export async function findDepartmentInUniversity(id, universityId) {
  return prisma.department.findFirst({
    where: { id, universityId },
    select: { id: true, name: true },
  });
}

/** @param {string[]} ids */
export async function findActiveInterestsByIds(ids) {
  if (ids.length === 0) {
    return [];
  }
  return prisma.interest.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, slug: true, name: true, category: true },
  });
}

/**
 * Creates the profile, its initial interests, and marks the user
 * onboarded — all in one transaction (mirrors auth's
 * `createUserWithIdentityAndSettings`): a profile should never exist
 * without `users.onboarded_at` also being set, or vice versa.
 * @param {{
 *   userId: string;
 *   universityId: string;
 *   publicId: string;
 *   animal: string;
 *   number: number;
 *   displayName: string;
 *   avatarColor: string;
 *   departmentId?: string | null;
 *   semester?: number | null;
 *   interestIds: string[];
 * }} data
 */
export async function createProfile(data) {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.anonymousProfile.create({
      data: {
        userId: data.userId,
        universityId: data.universityId,
        publicId: data.publicId,
        animal: data.animal,
        number: data.number,
        displayName: data.displayName,
        avatarColor: data.avatarColor,
        departmentId: data.departmentId ?? null,
        semester: data.semester ?? null,
      },
      select: { id: true },
    });
    if (data.interestIds.length > 0) {
      await tx.profileInterest.createMany({
        data: data.interestIds.map((interestId) => ({ profileId: profile.id, interestId })),
      });
    }
    await tx.user.update({ where: { id: data.userId }, data: { onboardedAt: new Date() } });
    // `tx`, not `prisma` — this read must see the just-created row inside
    // the same still-open transaction (a separate connection wouldn't,
    // and could even deadlock waiting on the row lock).
    return tx.anonymousProfile.findUniqueOrThrow({
      where: { id: profile.id },
      select: SELF_SELECT,
    });
  });
}

/**
 * @param {string} userId
 * @param {{
 *   departmentId?: string | null;
 *   semester?: number | null;
 *   showDepartment?: boolean;
 *   showSemester?: boolean;
 *   showInterests?: boolean;
 *   dmPolicy?: 'EVERYONE' | 'NOBODY';
 *   avatarColor?: string;
 * }} data
 */
export async function updateProfile(userId, data) {
  return prisma.anonymousProfile.update({
    where: { userId },
    data,
    select: SELF_SELECT,
  });
}

/**
 * Renames in one transaction: snapshot the outgoing name into
 * `profile_name_history` (§11.6 "History is kept in
 * `profile_name_history`") before overwriting it.
 * @param {{
 *   profileId: string;
 *   userId: string;
 *   previousDisplayName: string;
 *   animal: string;
 *   number: number;
 *   displayName: string;
 *   avatarColor: string;
 * }} data
 */
export async function renameProfile(data) {
  return prisma.$transaction(async (tx) => {
    await tx.profileNameHistory.create({
      data: { profileId: data.profileId, displayName: data.previousDisplayName },
    });
    return tx.anonymousProfile.update({
      where: { userId: data.userId },
      data: {
        animal: data.animal,
        number: data.number,
        displayName: data.displayName,
        avatarColor: data.avatarColor,
        nameChangedAt: new Date(),
      },
      select: SELF_SELECT,
    });
  });
}

/**
 * Replaces the full interest set (§26 "PUT /me/interests ... replace
 * set").
 * @param {string} profileId
 * @param {string[]} interestIds
 */
export async function replaceInterests(profileId, interestIds) {
  return prisma.$transaction(async (tx) => {
    await tx.profileInterest.deleteMany({ where: { profileId } });
    if (interestIds.length > 0) {
      await tx.profileInterest.createMany({
        data: interestIds.map((interestId) => ({ profileId, interestId })),
      });
    }
    return tx.anonymousProfile.findUniqueOrThrow({ where: { id: profileId }, select: SELF_SELECT });
  });
}

/** @param {string} userId */
export async function findSettings(userId) {
  return prisma.userSetting.findUnique({
    where: { userId },
    select: { notificationPrefs: true, pushPreview: true, theme: true },
  });
}

/**
 * @param {string} userId
 * @param {{
 *   notificationPrefs?: Record<string, unknown>;
 *   pushPreview?: 'NONE' | 'SENDER_ONLY';
 *   theme?: string | null;
 * }} data
 */
export async function updateSettings(userId, data) {
  return prisma.userSetting.update({
    where: { userId },
    data: {
      ...data,
      // Prisma's Json input type isn't a plain `Record<string, unknown>`
      // (it also accepts arrays/scalars/`JsonNull`) — a plain object
      // literal is a valid `InputJsonValue` at runtime, this cast just
      // tells tsc so.
      notificationPrefs:
        /** @type {import('@campus/database').Prisma.InputJsonValue | undefined} */ (
          data.notificationPrefs
        ),
    },
    select: { notificationPrefs: true, pushPreview: true, theme: true },
  });
}
