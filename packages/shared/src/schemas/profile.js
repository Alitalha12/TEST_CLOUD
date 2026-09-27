// @ts-check
import { z } from 'zod';
import { AvatarColorToken, DmPolicy } from '../enums.js';
import { PROFILE_LIMITS } from '../limits.js';
import { InterestSchema } from './meta.js';

/**
 * DTOs for the `profiles` module. Source: docs/architecture.md §3.2
 * (identity model), §8.3 "Persona" tables, §11.4-11.6 (public/private
 * fields, four locks, name generation) and §28 P4.
 *
 * No free-text display names anywhere in here (§11.6 "No free-text
 * names") — every name a client can submit is one the server itself
 * generated and offered back (`selectedName`).
 */

export const AvatarColorSchema = z.enum(AvatarColorToken);
export const DmPolicySchema = z.enum(DmPolicy);

/** One server-generated identity choice: a name + a color to pair with it. */
export const ProfileOptionSchema = z.object({
  name: z.string().min(1),
  avatarColor: AvatarColorSchema,
});

/** `GET /me/profile/options`. */
export const ProfileOptionsResponseSchema = z.object({
  options: z.array(ProfileOptionSchema).length(PROFILE_LIMITS.IDENTITY_OPTIONS_COUNT),
  // ISO 8601 — the client can show "these expire in Ns" the same way
  // `otp/request`'s `resendAvailableAt` does.
  expiresAt: z.string().min(1),
});

const SemesterSchema = z
  .number()
  .int()
  .min(PROFILE_LIMITS.SEMESTER_MIN)
  .max(PROFILE_LIMITS.SEMESTER_MAX);

const InterestIdsSchema = z.array(z.string().min(1)).max(PROFILE_LIMITS.MAX_INTERESTS_PER_PROFILE);

/**
 * `POST /me/profile` — creates the persona and completes onboarding.
 * `selectedName`/`avatarColor` must be one of the pair the server issued
 * via `GET /me/profile/options` (enforced server-side, not by this
 * schema — see docs/phases/phase-4-identity.md).
 */
export const ProfileCreateBodySchema = z
  .object({
    selectedName: z.string().min(1),
    avatarColor: AvatarColorSchema,
    // Must be `true` — there is no way to create a profile without
    // accepting (§28 P4 onboarding "must accept to continue").
    acceptedGuidelines: z.literal(true),
    departmentId: z.string().min(1).optional(),
    semester: SemesterSchema.optional(),
    interestIds: InterestIdsSchema.optional(),
  })
  .strict();

/** `PATCH /me/profile` — every field optional, but at least one required. */
export const ProfileUpdateBodySchema = z
  .object({
    departmentId: z.string().min(1).nullable().optional(),
    semester: SemesterSchema.nullable().optional(),
    showDepartment: z.boolean().optional(),
    showSemester: z.boolean().optional(),
    showInterests: z.boolean().optional(),
    dmPolicy: DmPolicySchema.optional(),
    avatarColor: AvatarColorSchema.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided.',
  });

/** `POST /me/profile/rename` — same anti-forgery rule as create. */
export const ProfileRenameBodySchema = z
  .object({
    selectedName: z.string().min(1),
    avatarColor: AvatarColorSchema,
  })
  .strict();

/** `PUT /me/interests` — replaces the full set. */
export const ProfileInterestsBodySchema = z
  .object({
    interestIds: InterestIdsSchema,
  })
  .strict();

const DepartmentRefSchema = z.object({ id: z.string(), name: z.string() }).nullable();

/**
 * `GET /profiles/:publicId` — the public persona only. `department`,
 * `semester` and `interests` are omitted entirely (not just null) when
 * the owner's corresponding `show_*` flag is off, per §11.5 "presenters
 * ... map to shared DTO schemas" — an absent key leaks nothing, where a
 * literal `null` would still confirm "has no department" vs. "hidden".
 */
export const PublicProfileResponseSchema = z.object({
  publicId: z.string().min(1),
  displayName: z.string().min(1),
  avatarColor: AvatarColorSchema,
  department: DepartmentRefSchema.optional(),
  semester: z.number().int().optional(),
  interests: z.array(InterestSchema).optional(),
  dmPolicy: DmPolicySchema,
});

/**
 * `GET /me/profile` (own persona — not in the §26 endpoint list itself,
 * added in P4; see docs/phases/phase-4-identity.md "decisions not
 * spelled out"). Unlike the public DTO, `department`/`semester` are
 * always present here (as `null` when unset) since the owner is always
 * allowed to see their own hidden fields.
 */
export const MyProfileResponseSchema = z.object({
  publicId: z.string().min(1),
  displayName: z.string().min(1),
  avatarColor: AvatarColorSchema,
  department: DepartmentRefSchema,
  semester: z.number().int().nullable(),
  showDepartment: z.boolean(),
  showSemester: z.boolean(),
  showInterests: z.boolean(),
  dmPolicy: DmPolicySchema,
  interests: z.array(InterestSchema),
  // ISO 8601 — when `POST /me/profile/rename` next becomes available.
  canRenameAt: z.string().min(1),
  createdAt: z.string().min(1),
});

/** `GET /me/settings` / `PATCH /me/settings` response. */
export const SettingsResponseSchema = z.object({
  notificationPrefs: z.record(z.string(), z.unknown()),
  pushPreview: z.enum(['NONE', 'SENDER_ONLY']),
  theme: z.string().nullable(),
});

export const SettingsUpdateBodySchema = z
  .object({
    notificationPrefs: z.record(z.string(), z.unknown()).optional(),
    pushPreview: z.enum(['NONE', 'SENDER_ONLY']).optional(),
    theme: z.string().nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided.',
  });
