// @ts-check
import { z } from 'zod';
import { Platform } from '../enums.js';

/**
 * DTOs for the `auth` module. Source: docs/architecture.md §11.2–11.3
 * (verification/login flow, sessions) and §28 P3.
 *
 * Signup and login are the same flow (§11.2): a client always calls
 * `otp/request` then `otp/verify`, whether or not the email has been
 * seen before.
 */

export const OtpRequestBodySchema = z
  .object({
    email: z.string().trim().min(3).max(254).email(),
  })
  .strict();

export const OtpRequestResponseSchema = z.object({
  challengeId: z.string().min(1),
  // ISO 8601 timestamp — the client shows a resend countdown until this
  // instant (§11.2 "1/60s cooldown").
  resendAvailableAt: z.string().min(1),
});

export const DeviceSchema = z
  .object({
    platform: z.enum(Platform),
    label: z.string().trim().min(1).max(100),
    appVersion: z.string().trim().min(1).max(50),
  })
  .strict();

export const OtpVerifyBodySchema = z
  .object({
    challengeId: z.string().min(1),
    // Exactly 6 digits — never coerced from a number, so a leading zero
    // survives (§11.2 "code = 6 random digits").
    code: z.string().regex(/^\d{6}$/, 'code must be exactly 6 digits'),
    device: DeviceSchema,
  })
  .strict();

/** `onboarding` tells the client which route group to land in after auth. */
export const OnboardingStateSchema = z.enum(['NEEDS_PROFILE', 'COMPLETE']);

export const OtpVerifyResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  onboarding: OnboardingStateSchema,
});

export const RefreshBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const RefreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

/**
 * `GET /api/v1/me`. Never the real email (§11.4 "Visible to self: Masked
 * ... in settings") — `maskedEmail` is the server-computed `a***@uni.edu`
 * form. `status` is restricted to the values a caller who passed
 * `requireAccountState` can actually have (SUSPENDED/BANNED are rejected
 * before a response is ever built).
 */
export const MeResponseSchema = z.object({
  maskedEmail: z.string().min(1),
  // Only ACTIVE/RESTRICTED are reachable here — requireAccountState
  // rejects SUSPENDED/BANNED before a response is ever built (§11.4).
  status: z.enum(['ACTIVE', 'RESTRICTED']),
  onboarding: OnboardingStateSchema,
  university: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
  }),
});

export const AppConfigResponseSchema = z.object({
  minAppVersion: z.string().min(1),
  latestAppVersion: z.string().min(1),
});
