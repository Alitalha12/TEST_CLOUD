// @ts-check

/**
 * The only place a Prisma row becomes a public DTO, per
 * docs/conventions.md "The presenter/DTO rule". Shapes match
 * `@campus/shared`'s InterestSchema/DepartmentSchema exactly.
 */

/**
 * @param {{ id: string; slug: string; name: string; category: string | null }} row
 */
export function toInterestDTO(row) {
  // `id` included from Phase 4 onward (docs/phases/phase-4-identity.md):
  // it's how a client says which interests it wants back in
  // `PUT /me/interests`/`POST /me/profile`'s `interestIds`.
  return { id: row.id, slug: row.slug, name: row.name, category: row.category };
}

/**
 * @param {Array<{ id: string; slug: string; name: string; category: string | null }>} rows
 */
export function toInterestListDTO(rows) {
  return rows.map(toInterestDTO);
}

/**
 * @param {{ id: string; name: string }} row
 */
export function toDepartmentDTO(row) {
  return { id: row.id, name: row.name };
}

/**
 * @param {Array<{ id: string; name: string }>} rows
 */
export function toDepartmentListDTO(rows) {
  return rows.map(toDepartmentDTO);
}

/**
 * @param {{ minAppVersion: string; latestAppVersion: string }} config
 */
export function toAppConfigDTO(config) {
  return { minAppVersion: config.minAppVersion, latestAppVersion: config.latestAppVersion };
}
