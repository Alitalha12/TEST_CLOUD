// @ts-check

/**
 * The only place a Prisma row becomes a public DTO, per
 * docs/conventions.md "The presenter/DTO rule". Shapes match
 * `@campus/shared`'s InterestSchema/DepartmentSchema exactly.
 */

/**
 * @param {{ slug: string; name: string; category: string | null }} row
 */
export function toInterestDTO(row) {
  return { slug: row.slug, name: row.name, category: row.category };
}

/**
 * @param {Array<{ slug: string; name: string; category: string | null }>} rows
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
