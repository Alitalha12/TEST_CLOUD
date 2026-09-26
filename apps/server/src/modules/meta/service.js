// @ts-check
import { getEnv } from '../../config/env.js';
import * as repository from './repository.js';

export async function getInterests() {
  return repository.findActiveInterests();
}

/**
 * @param {string} [universitySlug]
 */
export async function getDepartments(universitySlug) {
  const university = universitySlug
    ? await repository.findUniversityBySlug(universitySlug)
    : await repository.findDefaultUniversity();

  if (!university) {
    // Not an error worth surfacing to the client: university slugs are
    // not secret (no enumeration risk), and "no default university
    // configured yet" is a valid, if unusual, dev-environment state. An
    // empty list is the correct response either way.
    return [];
  }

  return repository.findDepartmentsByUniversityId(university.id);
}

/**
 * `GET /meta/app-config` (docs/architecture.md §7.4 "Min app version").
 * These are process config, not a DB row — no repository call needed.
 */
export function getAppConfig() {
  const env = getEnv();
  return { minAppVersion: env.MIN_APP_VERSION, latestAppVersion: env.LATEST_APP_VERSION };
}
