// @ts-check
import { CONTENT_LIMITS } from '@campus/shared';

/**
 * The only place a profile row becomes a DTO, per docs/conventions.md
 * "The presenter/DTO rule". Two shapes exist for the same underlying row
 * — `toMyProfileDTO` (self, everything) and `toPublicProfileDTO` (other
 * students, `show_*`-gated) — because the public one must never leak a
 * hidden field even as `null` (§11.5, `PublicProfileResponseSchema`'s
 * doc comment: "an absent key leaks nothing, where a literal `null`
 * would still confirm 'has no department' vs. 'hidden'").
 */

const RENAME_COOLDOWN_MS = CONTENT_LIMITS.DISPLAY_NAME_RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * @typedef {Object} ProfileRow
 * @property {string} publicId
 * @property {string} displayName
 * @property {string} avatarColor
 * @property {{ id: string, name: string } | null} department
 * @property {number | null} semester
 * @property {boolean} showDepartment
 * @property {boolean} showSemester
 * @property {boolean} showInterests
 * @property {string} dmPolicy
 * @property {Date} nameChangedAt
 * @property {Date} createdAt
 * @property {Array<{ interest: { slug: string, name: string, category: string | null } }>} interests
 */

/** @param {ProfileRow} row */
function flattenInterests(row) {
  return row.interests.map(({ interest }) => interest);
}

/** @param {ProfileRow} row */
export function toMyProfileDTO(row) {
  return {
    publicId: row.publicId,
    displayName: row.displayName,
    avatarColor: row.avatarColor,
    department: row.department,
    semester: row.semester,
    showDepartment: row.showDepartment,
    showSemester: row.showSemester,
    showInterests: row.showInterests,
    dmPolicy: row.dmPolicy,
    interests: flattenInterests(row),
    canRenameAt: new Date(row.nameChangedAt.getTime() + RENAME_COOLDOWN_MS).toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** @param {ProfileRow} row */
export function toPublicProfileDTO(row) {
  /** @type {Record<string, unknown>} */
  const dto = {
    publicId: row.publicId,
    displayName: row.displayName,
    avatarColor: row.avatarColor,
    dmPolicy: row.dmPolicy,
  };
  if (row.showDepartment && row.department) {
    dto.department = row.department;
  }
  if (row.showSemester && row.semester !== null) {
    dto.semester = row.semester;
  }
  if (row.showInterests) {
    dto.interests = flattenInterests(row);
  }
  return dto;
}

/**
 * @param {Array<{ name: string, avatarColor: string }>} options
 * @param {Date} expiresAt
 */
export function toProfileOptionsDTO(options, expiresAt) {
  return { options, expiresAt: expiresAt.toISOString() };
}

/**
 * @param {{ notificationPrefs: unknown, pushPreview: string, theme: string | null }} row
 */
export function toSettingsDTO(row) {
  return {
    notificationPrefs: /** @type {Record<string, unknown>} */ (row.notificationPrefs),
    pushPreview: row.pushPreview,
    theme: row.theme,
  };
}
