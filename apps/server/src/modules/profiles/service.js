// @ts-check
import { AppError, PROFILE_LIMITS } from '@campus/shared';
import { redis } from '../../lib/redis.js';
import { generatePublicId } from '../../lib/publicId.js';
import { randomIdentityCandidate, sampleAvatarColors } from './nameGenerator.js';
import { checkRenameCooldown } from './policies.js';
import * as repository from './repository.js';
import {
  toMyProfileDTO,
  toProfileOptionsDTO,
  toPublicProfileDTO,
  toSettingsDTO,
} from './presenter.js';

const OPTIONS_TTL_SECONDS = PROFILE_LIMITS.IDENTITY_OPTIONS_TTL_SECONDS;

/** @param {string} userId */
function optionsCacheKey(userId) {
  return `profile:options:${userId}`;
}

/**
 * @typedef {Object} IssuedOption
 * @property {string} animal
 * @property {number} number
 * @property {string} displayName
 * @property {string} avatarColor
 */

/**
 * @param {string} userId
 * @param {IssuedOption[]} options
 */
async function cacheIssuedOptions(userId, options) {
  await redis.set(optionsCacheKey(userId), JSON.stringify(options), 'EX', OPTIONS_TTL_SECONDS);
}

/** @param {string} userId */
async function getIssuedOptions(userId) {
  const raw = await redis.get(optionsCacheKey(userId));
  if (!raw) {
    return null;
  }
  return /** @type {IssuedOption[]} */ (JSON.parse(raw));
}

/** @param {string} userId */
async function deleteIssuedOptions(userId) {
  await redis.del(optionsCacheKey(userId));
}

/**
 * Generates `count` candidates whose `displayName` is unique both within
 * this batch and against the university's existing profiles (§11.6
 * "unique per university (retry on unique violation)"). `generateCandidate`
 * is injectable so a test can force a collision deterministically instead
 * of relying on random luck — see docs/phases/phase-4-identity.md.
 * @param {{
 *   universityId: string,
 *   count?: number,
 *   maxAttempts?: number,
 *   generateCandidate?: () => import('./nameGenerator.js').IdentityCandidate,
 * }} params
 * @returns {Promise<IssuedOption[]>}
 */
export async function generateUniqueOptions({
  universityId,
  count = PROFILE_LIMITS.IDENTITY_OPTIONS_COUNT,
  maxAttempts = PROFILE_LIMITS.IDENTITY_GENERATION_MAX_ATTEMPTS,
  generateCandidate = randomIdentityCandidate,
}) {
  const seenNames = new Set();
  /** @type {Array<import('./nameGenerator.js').IdentityCandidate>} */
  const candidates = [];
  let attempts = 0;

  while (candidates.length < count) {
    attempts += 1;
    if (attempts > maxAttempts) {
      // With ~60 animals x 9000 numbers, exhausting this many attempts
      // means something is actually wrong (a near-empty animal list in
      // a misconfigured test, most likely) — surfacing as a 500 is
      // correct rather than silently returning fewer than `count`.
      throw new Error(
        `Could not generate ${count} unique profile name options after ${maxAttempts} attempts.`,
      );
    }
    const candidate = generateCandidate();
    if (seenNames.has(candidate.displayName)) {
      continue;
    }
    const taken = await repository.isDisplayNameTaken(universityId, candidate.displayName);
    if (taken) {
      continue;
    }
    seenNames.add(candidate.displayName);
    candidates.push(candidate);
  }

  const colors = sampleAvatarColors(candidates.length);
  return candidates.map((candidate, index) => ({ ...candidate, avatarColor: colors[index] }));
}

/**
 * `GET /me/profile/options`. Re-callable any time (the mobile "regenerate"
 * button) — each call overwrites the previous cached batch, invalidating it.
 * @param {{ userId: string, universityId: string }} params
 */
export async function getProfileOptions({ userId, universityId }) {
  const options = await generateUniqueOptions({ universityId });
  await cacheIssuedOptions(userId, options);
  const expiresAt = new Date(Date.now() + OPTIONS_TTL_SECONDS * 1000);
  return toProfileOptionsDTO(
    options.map((o) => ({ name: o.displayName, avatarColor: o.avatarColor })),
    expiresAt,
  );
}

/**
 * Verifies `selectedName`/`avatarColor` is exactly one of the pairs this
 * server issued to this user — the anti-forgery check behind "no
 * free-text names" (§11.6). Throws `PROFILE_OPTIONS_EXPIRED` if nothing
 * was ever issued (or it expired) and `INVALID_PROFILE_OPTION` if
 * something was issued but this isn't one of it.
 * @param {string} userId
 * @param {string} selectedName
 * @param {string} avatarColor
 */
async function consumeIssuedOption(userId, selectedName, avatarColor) {
  const issued = await getIssuedOptions(userId);
  if (!issued) {
    throw new AppError('PROFILE_OPTIONS_EXPIRED');
  }
  const match = issued.find(
    (option) => option.displayName === selectedName && option.avatarColor === avatarColor,
  );
  if (!match) {
    throw new AppError('INVALID_PROFILE_OPTION');
  }
  await deleteIssuedOptions(userId);
  return match;
}

/**
 * @param {string} universityId
 * @param {string | null | undefined} departmentId
 */
async function assertDepartmentInUniversity(universityId, departmentId) {
  if (!departmentId) {
    return;
  }
  const department = await repository.findDepartmentInUniversity(departmentId, universityId);
  if (!department) {
    throw new AppError('NOT_FOUND', 'That department was not found.');
  }
}

/** @param {string[] | undefined} interestIds */
async function assertActiveInterests(interestIds) {
  if (!interestIds || interestIds.length === 0) {
    return [];
  }
  const found = await repository.findActiveInterestsByIds(interestIds);
  if (found.length !== interestIds.length) {
    const foundIds = new Set(found.map((i) => i.id));
    const invalidIds = interestIds.filter((id) => !foundIds.has(id));
    throw new AppError('VALIDATION_ERROR', 'One or more interests are invalid.', { invalidIds });
  }
  return found;
}

/**
 * `POST /me/profile` (§28 P4 "create/patch profile"). Onboarding
 * completion (`users.onboarded_at`) happens inside the same transaction
 * as the row insert — see repository.createProfile.
 * @param {{
 *   userId: string,
 *   universityId: string,
 *   selectedName: string,
 *   avatarColor: string,
 *   departmentId?: string,
 *   semester?: number,
 *   interestIds?: string[],
 * }} params
 */
export async function createProfile({
  userId,
  universityId,
  selectedName,
  avatarColor,
  departmentId,
  semester,
  interestIds,
}) {
  const existing = await repository.findProfileByUserId(userId);
  if (existing) {
    throw new AppError('CONFLICT', 'You already have a profile.');
  }

  const issuedMatch = await consumeIssuedOption(userId, selectedName, avatarColor);
  await assertDepartmentInUniversity(universityId, departmentId);
  await assertActiveInterests(interestIds);

  const MAX_PUBLIC_ID_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_PUBLIC_ID_ATTEMPTS; attempt += 1) {
    try {
      const profile = await repository.createProfile({
        userId,
        universityId,
        publicId: generatePublicId(),
        animal: issuedMatch.animal,
        number: issuedMatch.number,
        displayName: issuedMatch.displayName,
        avatarColor: issuedMatch.avatarColor,
        departmentId: departmentId ?? null,
        semester: semester ?? null,
        interestIds: interestIds ?? [],
      });
      return toMyProfileDTO(profile);
    } catch (err) {
      if (isUniqueConstraintOn(err, 'public_id') && attempt < MAX_PUBLIC_ID_ATTEMPTS) {
        continue; // vanishingly unlikely; regenerate and retry.
      }
      if (isUniqueConstraintOn(err, 'display_name')) {
        // Lost a race with another request for the exact same generated
        // name in this university — ask the client to fetch a fresh
        // batch rather than retrying silently server-side.
        throw new AppError('CONFLICT', 'That name was just taken. Please pick again.');
      }
      throw err;
    }
  }
  throw new Error('Could not allocate a unique public_id after several attempts.');
}

/**
 * @param {unknown} err
 * @param {string} fieldHint substring expected in the Prisma unique
 *   constraint's target field name
 */
function isUniqueConstraintOn(err, fieldHint) {
  const code = /** @type {{ code?: string, meta?: { target?: unknown } }} */ (err)?.code;
  if (code !== 'P2002') {
    return false;
  }
  const target = /** @type {{ meta?: { target?: unknown } }} */ (err)?.meta?.target;
  const targetString = Array.isArray(target) ? target.join(',') : String(target ?? '');
  return targetString.includes(fieldHint);
}

/**
 * `PATCH /me/profile`.
 * @param {{
 *   userId: string,
 *   universityId: string,
 *   patch: {
 *     departmentId?: string | null,
 *     semester?: number | null,
 *     showDepartment?: boolean,
 *     showSemester?: boolean,
 *     showInterests?: boolean,
 *     dmPolicy?: 'EVERYONE' | 'NOBODY',
 *     avatarColor?: string,
 *   },
 * }} params
 */
export async function updateProfile({ userId, universityId, patch }) {
  if (patch.departmentId !== undefined) {
    await assertDepartmentInUniversity(universityId, patch.departmentId);
  }
  const updated = await repository.updateProfile(userId, patch);
  return toMyProfileDTO(updated);
}

/**
 * `POST /me/profile/rename` (§11.6 "once per 30 days").
 * @param {{ userId: string, selectedName: string, avatarColor: string }} params
 */
export async function renameProfile({ userId, selectedName, avatarColor }) {
  const profile = await repository.findProfileByUserId(userId);
  if (!profile) {
    // requireOnboarded already guarantees this — a corruption, not a
    // normal "not found" the client should see friendly copy for.
    throw new Error(`Missing profile for onboarded user ${userId}`);
  }

  const cooldown = checkRenameCooldown(profile.nameChangedAt, new Date());
  if (!cooldown.allowed) {
    throw new AppError('RENAME_TOO_SOON', undefined, {
      retryAfterSeconds: cooldown.retryAfterSeconds,
      nextRenameAt: cooldown.nextRenameAt.toISOString(),
    });
  }

  const issuedMatch = await consumeIssuedOption(userId, selectedName, avatarColor);

  try {
    const renamed = await repository.renameProfile({
      profileId: profile.id,
      userId,
      previousDisplayName: profile.displayName,
      animal: issuedMatch.animal,
      number: issuedMatch.number,
      displayName: issuedMatch.displayName,
      avatarColor: issuedMatch.avatarColor,
    });
    return toMyProfileDTO(renamed);
  } catch (err) {
    if (isUniqueConstraintOn(err, 'display_name')) {
      throw new AppError('CONFLICT', 'That name was just taken. Please pick again.');
    }
    throw err;
  }
}

/**
 * `PUT /me/interests`.
 * @param {{ userId: string, interestIds: string[] }} params
 */
export async function replaceInterests({ userId, interestIds }) {
  const profile = await repository.findProfileByUserId(userId);
  if (!profile) {
    throw new Error(`Missing profile for onboarded user ${userId}`);
  }
  await assertActiveInterests(interestIds);
  const updated = await repository.replaceInterests(profile.id, interestIds);
  return toMyProfileDTO(updated);
}

/** `GET /me/profile`. @param {{ userId: string }} params */
export async function getMyProfile({ userId }) {
  const profile = await repository.findProfileByUserId(userId);
  if (!profile) {
    throw new Error(`Missing profile for onboarded user ${userId}`);
  }
  return toMyProfileDTO(profile);
}

/**
 * `GET /profiles/:publicId` (§11.5 lock 1: scoped by the viewer's own
 * universityId, never client input).
 * @param {{ publicId: string, viewerUniversityId: string }} params
 */
export async function getPublicProfile({ publicId, viewerUniversityId }) {
  const profile = await repository.findProfileByPublicId(publicId, viewerUniversityId);
  if (!profile) {
    throw new AppError('NOT_FOUND', 'That profile was not found.');
  }
  return toPublicProfileDTO(profile);
}

/** `GET /me/settings`. @param {{ userId: string }} params */
export async function getSettings({ userId }) {
  const settings = await repository.findSettings(userId);
  if (!settings) {
    // Created alongside the user at signup (Phase 3) — absence is
    // corruption, not a normal "not found".
    throw new Error(`Missing user_settings row for user ${userId}`);
  }
  return toSettingsDTO(settings);
}

/**
 * `PATCH /me/settings`.
 * @param {{
 *   userId: string,
 *   patch: {
 *     notificationPrefs?: Record<string, unknown>,
 *     pushPreview?: 'NONE' | 'SENDER_ONLY',
 *     theme?: string | null,
 *   },
 * }} params
 */
export async function updateSettings({ userId, patch }) {
  const updated = await repository.updateSettings(userId, patch);
  return toSettingsDTO(updated);
}
