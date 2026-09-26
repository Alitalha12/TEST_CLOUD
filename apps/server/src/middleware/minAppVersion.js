// @ts-check
import { AppError } from '@campus/shared';

/**
 * Rejects a request from a mobile build older than `MIN_APP_VERSION`
 * with 426, per docs/architecture.md §7.4 "Min app version: Header
 * `X-App-Version`. The server returns `426 UPGRADE_REQUIRED` below the
 * minimum and the app shows a blocking update screen." A missing header
 * is treated as "too old to know better" and rejected the same way,
 * rather than assumed current — an app old enough to predate this
 * header entirely is exactly the case this exists to catch.
 *
 * @param {string} minVersion e.g. "1.2.0"
 * @returns {import('express').RequestHandler}
 */
export function minAppVersion(minVersion) {
  return (req, res, next) => {
    const header = req.headers['x-app-version'];
    const version = typeof header === 'string' ? header : undefined;

    if (!version || compareVersions(version, minVersion) < 0) {
      next(new AppError('UPGRADE_REQUIRED'));
      return;
    }
    next();
  };
}

/**
 * Compares two `x.y.z` version strings numerically (never lexically —
 * "1.9.0" must sort above "1.10.0" — er, below it). Missing/non-numeric
 * segments count as 0. Not a full semver implementation (no pre-release
 * or build-metadata handling): the app only ever sends plain release
 * version numbers.
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a<b, 0 if equal, positive if a>b
 */
export function compareVersions(a, b) {
  const partsA = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const partsB = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
