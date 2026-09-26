import { describe, expect, it } from 'vitest';
import {
  AppConfigResponseSchema,
  DeviceSchema,
  MeResponseSchema,
  OtpRequestBodySchema,
  OtpRequestResponseSchema,
  OtpVerifyBodySchema,
  OtpVerifyResponseSchema,
  RefreshBodySchema,
  RefreshResponseSchema,
} from '../../src/schemas/auth.js';

describe('OtpRequestBodySchema', () => {
  it('accepts a valid email', () => {
    expect(OtpRequestBodySchema.safeParse({ email: 'student@uet.edu.pk' }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(OtpRequestBodySchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an unexpected extra key (mass-assignment)', () => {
    const result = OtpRequestBodySchema.safeParse({
      email: 'student@uet.edu.pk',
      isAdmin: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('OtpRequestResponseSchema', () => {
  it('accepts a challengeId and resendAvailableAt', () => {
    const result = OtpRequestResponseSchema.safeParse({
      challengeId: 'chal_123',
      resendAvailableAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe('DeviceSchema', () => {
  it('accepts a valid device', () => {
    const result = DeviceSchema.safeParse({
      platform: 'ANDROID',
      label: 'Pixel 8',
      appVersion: '1.0.0',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a platform outside the enum', () => {
    const result = DeviceSchema.safeParse({
      platform: 'WINDOWS',
      label: 'Surface',
      appVersion: '1.0.0',
    });
    expect(result.success).toBe(false);
  });
});

describe('OtpVerifyBodySchema', () => {
  const validDevice = { platform: 'IOS', label: 'iPhone 15', appVersion: '1.0.0' };

  it('accepts a 6-digit code', () => {
    const result = OtpVerifyBodySchema.safeParse({
      challengeId: 'chal_123',
      code: '048213',
      device: validDevice,
    });
    expect(result.success).toBe(true);
  });

  it('preserves a leading zero (never coerced to a number)', () => {
    const result = OtpVerifyBodySchema.safeParse({
      challengeId: 'chal_123',
      code: '012345',
      device: validDevice,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('012345');
    }
  });

  it('rejects a code that is not exactly 6 digits', () => {
    expect(
      OtpVerifyBodySchema.safeParse({ challengeId: 'c1', code: '12345', device: validDevice })
        .success,
    ).toBe(false);
    expect(
      OtpVerifyBodySchema.safeParse({ challengeId: 'c1', code: '1234567', device: validDevice })
        .success,
    ).toBe(false);
    expect(
      OtpVerifyBodySchema.safeParse({ challengeId: 'c1', code: 'abcdef', device: validDevice })
        .success,
    ).toBe(false);
  });
});

describe('OtpVerifyResponseSchema', () => {
  it('accepts a valid verify response', () => {
    const result = OtpVerifyResponseSchema.safeParse({
      accessToken: 'a.b.c',
      refreshToken: 'opaque-token',
      expiresIn: 900,
      onboarding: 'NEEDS_PROFILE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an onboarding value outside the enum', () => {
    const result = OtpVerifyResponseSchema.safeParse({
      accessToken: 'a.b.c',
      refreshToken: 'opaque-token',
      expiresIn: 900,
      onboarding: 'DONE',
    });
    expect(result.success).toBe(false);
  });
});

describe('RefreshBodySchema / RefreshResponseSchema', () => {
  it('accepts a refresh request and response', () => {
    expect(RefreshBodySchema.safeParse({ refreshToken: 'opaque' }).success).toBe(true);
    expect(
      RefreshResponseSchema.safeParse({
        accessToken: 'a.b.c',
        refreshToken: 'opaque-2',
        expiresIn: 900,
      }).success,
    ).toBe(true);
  });
});

describe('MeResponseSchema', () => {
  it('accepts a masked email and never a raw one by schema shape', () => {
    const result = MeResponseSchema.safeParse({
      maskedEmail: 's***@uet.edu.pk',
      status: 'ACTIVE',
      onboarding: 'COMPLETE',
      university: { slug: 'uet', name: 'University of Engineering and Technology' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects SUSPENDED/BANNED — those statuses never reach a built response', () => {
    const base = {
      maskedEmail: 's***@uet.edu.pk',
      onboarding: 'COMPLETE',
      university: { slug: 'uet', name: 'UET' },
    };
    expect(MeResponseSchema.safeParse({ ...base, status: 'SUSPENDED' }).success).toBe(false);
    expect(MeResponseSchema.safeParse({ ...base, status: 'BANNED' }).success).toBe(false);
  });
});

describe('AppConfigResponseSchema', () => {
  it('accepts min/latest version strings', () => {
    const result = AppConfigResponseSchema.safeParse({
      minAppVersion: '1.0.0',
      latestAppVersion: '1.2.0',
    });
    expect(result.success).toBe(true);
  });
});
