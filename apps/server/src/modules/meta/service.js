// @ts-check
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
