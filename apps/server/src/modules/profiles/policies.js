// @ts-check
import { CONTENT_LIMITS } from '@campus/shared';

/**
 * Pure authorization/business-rule functions, called from the service and
 * never duplicated inline (docs/conventions.md "Layering" — `policies.js`).
 */

const RENAME_COOLDOWN_MS = CONTENT_LIMITS.DISPLAY_NAME_RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * §11.6 "Name changes: pick a new generated option once per 30 days."
 * @param {Date} nameChangedAt
 * @param {Date} now
 * @returns {{ allowed: true } | { allowed: false, nextRenameAt: Date, retryAfterSeconds: number }}
 */
export function checkRenameCooldown(nameChangedAt, now) {
  const nextRenameAt = new Date(nameChangedAt.getTime() + RENAME_COOLDOWN_MS);
  if (now.getTime() >= nextRenameAt.getTime()) {
    return { allowed: true };
  }
  return {
    allowed: false,
    nextRenameAt,
    retryAfterSeconds: Math.ceil((nextRenameAt.getTime() - now.getTime()) / 1000),
  };
}
