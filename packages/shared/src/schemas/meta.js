// @ts-check
import { z } from 'zod';

/**
 * Public DTOs for the `meta` module (interests, departments).
 * Source: docs/architecture.md §8.3 "Persona" (`interests`) and
 * "Tenancy & identity" (`departments`) tables — public fields only.
 *
 * These lists are read by mobile before the user is onboarded (interest
 * picker, department picker), so they stay public in the MVP per
 * docs/architecture.md §28 P1 ("public for now; auth-gated once Phase 3
 * lands" refers to gating by *authentication*, not by field visibility —
 * these fields have nothing private to hide).
 */

export const InterestSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string().nullable(),
});

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const InterestListSchema = z.array(InterestSchema);
export const DepartmentListSchema = z.array(DepartmentSchema);

/**
 * `GET /api/v1/meta/departments` query params. `universitySlug` is
 * optional in the MVP because the platform targets a single university
 * at launch (docs/architecture.md §4) — omitting it resolves to that
 * default university server-side. Once multi-university is real (V2),
 * clients should always pass it explicitly.
 */
export const ListDepartmentsQuerySchema = z
  .object({
    universitySlug: z.string().min(1).max(100).optional(),
  })
  .strict();
