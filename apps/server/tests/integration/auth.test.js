// @ts-check
import { Writable } from 'node:stream';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { prisma } from '@campus/database';
import { buildTestApp } from '../helpers/testApp.js';
import { resetDb } from '../helpers/db.js';
import { resetRedis } from '../helpers/redis.js';
import {
  createBannedEmailHash,
  createSession,
  createUniversity,
  createUniversityDomain,
  createUser,
} from '../helpers/factories.js';
import { getEnv } from '../../src/config/env.js';
import { hashEmail, hashToken, normalizeEmail } from '../../src/lib/crypto.js';
import { signAccessToken } from '../../src/lib/jwt.js';
import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/lib/logger.js';

vi.mock('../../src/queues/email.queue.js', () => ({
  enqueueOtpEmail: vi.fn(),
}));
import { enqueueOtpEmail } from '../../src/queues/email.queue.js';

const APP_VERSION_HEADERS = { 'X-App-Version': '1.0.0' };

const app = buildTestApp();

/** @type {Awaited<ReturnType<typeof createUniversity>>} */
let university;

beforeEach(async () => {
  await resetDb();
  await resetRedis();
  vi.mocked(enqueueOtpEmail).mockClear();
  university = await createUniversity({ slug: 'test-uni', status: 'ACTIVE' });
  await createUniversityDomain(university.id, { domain: 'test-uni.edu', isActive: true });
});

afterEach(async () => {
  await resetDb();
  await resetRedis();
});

/** Extracts the plaintext OTP code from the mocked queue call. */
function lastEnqueuedCode() {
  const calls = vi.mocked(enqueueOtpEmail).mock.calls;
  const lastCall = calls[calls.length - 1];
  const payload = /** @type {{ to: string, code: string }} */ (lastCall[0]);
  return payload.code;
}

/** @param {string} email */
async function requestOtpFor(email) {
  return request(app).post('/api/v1/auth/otp/request').set(APP_VERSION_HEADERS).send({ email });
}

/**
 * @param {string} challengeId
 * @param {string} code
 * @param {Record<string, unknown>} [overrides]
 */
async function verifyOtp(challengeId, code, overrides = {}) {
  return request(app)
    .post('/api/v1/auth/otp/verify')
    .set(APP_VERSION_HEADERS)
    .send({
      challengeId,
      code,
      device: { platform: 'ANDROID', label: 'Test Device', appVersion: '1.0.0', ...overrides },
    });
}

/**
 * Full happy-path signup: request + verify. Returns the verify response body's data.
 * @param {string} email
 */
async function signUp(email) {
  const requestRes = await requestOtpFor(email);
  const code = lastEnqueuedCode();
  const verifyRes = await verifyOtp(requestRes.body.data.challengeId, code);
  return verifyRes;
}

describe('POST /api/v1/auth/otp/request', () => {
  it('returns a challengeId and resendAvailableAt, and enqueues the OTP email', async () => {
    const res = await requestOtpFor('student@test-uni.edu');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challengeId).toEqual(expect.any(String));
    expect(res.body.data.resendAvailableAt).toEqual(expect.any(String));

    expect(enqueueOtpEmail).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(enqueueOtpEmail).mock.calls[0][0];
    expect(payload.to).toBe('student@test-uni.edu');
    expect(payload.code).toMatch(/^\d{6}$/);
  });

  it('normalizes the email before matching the domain and hashing (trim/lowercase/+tag)', async () => {
    const res = await requestOtpFor('  Student+Tag@Test-Uni.EDU  ');
    expect(res.status).toBe(200);
    expect(vi.mocked(enqueueOtpEmail).mock.calls[0][0].to).toBe('student@test-uni.edu');
  });

  it('rejects an unsupported domain with 422 DOMAIN_NOT_SUPPORTED', async () => {
    const res = await requestOtpFor('student@not-a-registered-domain.example');

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('DOMAIN_NOT_SUPPORTED');
    expect(enqueueOtpEmail).not.toHaveBeenCalled();
  });

  it('rejects a domain belonging to a DISABLED university', async () => {
    const disabled = await createUniversity({ slug: 'disabled-uni', status: 'DISABLED' });
    await createUniversityDomain(disabled.id, { domain: 'disabled-uni.edu', isActive: true });

    const res = await requestOtpFor('student@disabled-uni.edu');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('DOMAIN_NOT_SUPPORTED');
  });

  it('rejects a domain that exists but is inactive', async () => {
    await createUniversityDomain(university.id, {
      domain: 'retired.test-uni.edu',
      isActive: false,
    });
    const res = await requestOtpFor('student@retired.test-uni.edu');
    expect(res.status).toBe(422);
  });

  describe('no account enumeration (§11.2 "no ban oracle")', () => {
    it('returns the identical response shape for a banned email as for a normal one, without sending anything', async () => {
      const env = getEnv();
      const bannedEmail = 'banned@test-uni.edu';
      const emailHash = hashEmail(env.EMAIL_HASH_PEPPER, normalizeEmail(bannedEmail));
      await createBannedEmailHash({ emailHash });

      const bannedRes = await requestOtpFor(bannedEmail);
      const normalRes = await requestOtpFor('normal@test-uni.edu');

      expect(bannedRes.status).toBe(normalRes.status);
      expect(Object.keys(bannedRes.body.data).sort()).toEqual(
        Object.keys(normalRes.body.data).sort(),
      );
      expect(bannedRes.body.success).toBe(true);
      // Only the non-banned request actually enqueues an email.
      expect(enqueueOtpEmail).toHaveBeenCalledTimes(1);
      expect(vi.mocked(enqueueOtpEmail).mock.calls[0][0].to).toBe('normal@test-uni.edu');
    });
  });

  describe('rate limiting', () => {
    it('enforces the resend cooldown: a second immediate request for the same email is RATE_LIMITED', async () => {
      const first = await requestOtpFor('cooldown@test-uni.edu');
      expect(first.status).toBe(200);

      const second = await requestOtpFor('cooldown@test-uni.edu');
      expect(second.status).toBe(429);
      expect(second.body.error.code).toBe('RATE_LIMITED');
    });

    it('enforces the per-IP limit across many different emails from the same IP', async () => {
      // RATE_LIMITS.OTP_SEND_PER_IP = 20/hour (packages/shared/src/limits.js).
      // Each call uses a distinct email so the per-email cooldown/hourly
      // limits (keyed by emailHash) never interfere with this one.
      for (let i = 0; i < 20; i += 1) {
        const res = await requestOtpFor(`ip-test-${i}@test-uni.edu`);
        expect(res.status).toBe(200);
      }
      const res21 = await requestOtpFor('ip-test-20@test-uni.edu');
      expect(res21.status).toBe(429);
      expect(res21.body.error.code).toBe('RATE_LIMITED');
    });
  });

  it('rejects an unexpected body key (mass-assignment)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/request')
      .set(APP_VERSION_HEADERS)
      .send({ email: 'student@test-uni.edu', isAdmin: true });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/otp/verify', () => {
  it('creates a new user on first verify and returns NEEDS_PROFILE onboarding', async () => {
    const res = await signUp('newuser@test-uni.edu');

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.expiresIn).toBe(900);
    expect(res.body.data.onboarding).toBe('NEEDS_PROFILE');

    const emailHash = hashEmail(getEnv().EMAIL_HASH_PEPPER, 'newuser@test-uni.edu');
    const created = await prisma.user.findUnique({ where: { emailHash } });
    expect(created).not.toBeNull();
    expect(created?.status).toBe('ACTIVE');
  });

  it('logs in an existing user (signup and login are the same flow) without creating a duplicate', async () => {
    const first = await signUp('returning@test-uni.edu');
    expect(first.status).toBe(200);

    // Bypass the resend cooldown for this second "login" — this test is
    // about idempotent user creation, not rate limiting (covered separately).
    await resetRedis();
    const second = await signUp('returning@test-uni.edu');
    expect(second.status).toBe(200);

    const emailHash = hashEmail(getEnv().EMAIL_HASH_PEPPER, 'returning@test-uni.edu');
    const count = await prisma.user.count({ where: { emailHash } });
    expect(count).toBe(1);
  });

  it('rejects an unknown challengeId with the generic INVALID_CODE', async () => {
    const res = await verifyOtp('00000000-0000-0000-0000-000000000000', '123456');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CODE');
  });

  it('rejects a wrong code with the generic INVALID_CODE (never revealing the real one)', async () => {
    const requestRes = await requestOtpFor('wrongcode@test-uni.edu');
    const realCode = lastEnqueuedCode();
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    const res = await verifyOtp(requestRes.body.data.challengeId, wrongCode);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CODE');
  });

  it('rejects the correct code once the per-challenge attempt limit is exhausted', async () => {
    const requestRes = await requestOtpFor('exhausted@test-uni.edu');
    const challengeId = requestRes.body.data.challengeId;
    const realCode = lastEnqueuedCode();
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    // maxAttempts is 5 (packages/database schema default) — 5 wrong
    // attempts exhausts it.
    for (let i = 0; i < 5; i += 1) {
      const res = await verifyOtp(challengeId, wrongCode);
      expect(res.status).toBe(400);
    }

    // The 5 wrong attempts above also consumed all 5 of the Redis
    // OTP_VERIFY_ATTEMPTS points (tested in isolation below) — clear
    // that so this assertion is purely about the DB-level attempts
    // column, not a false negative from the unrelated rate limit.
    await resetRedis();

    const finalAttempt = await verifyOtp(challengeId, realCode);
    expect(finalAttempt.status).toBe(400);
    expect(finalAttempt.body.error.code).toBe('INVALID_CODE');
  });

  it('rejects an already-consumed challenge (no replay)', async () => {
    const requestRes = await requestOtpFor('replay@test-uni.edu');
    const code = lastEnqueuedCode();
    const challengeId = requestRes.body.data.challengeId;

    const firstVerify = await verifyOtp(challengeId, code);
    expect(firstVerify.status).toBe(200);

    const secondVerify = await verifyOtp(challengeId, code);
    expect(secondVerify.status).toBe(400);
    expect(secondVerify.body.error.code).toBe('INVALID_CODE');
  });

  it('rejects an expired challenge', async () => {
    const requestRes = await requestOtpFor('expired@test-uni.edu');
    const code = lastEnqueuedCode();
    const challengeId = requestRes.body.data.challengeId;

    await prisma.verificationChallenge.update({
      where: { id: challengeId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await verifyOtp(challengeId, code);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CODE');
  });

  it('enforces OTP_VERIFY_ATTEMPTS: the 6th verify call for the same email is RATE_LIMITED', async () => {
    const requestRes = await requestOtpFor('ratelimited-verify@test-uni.edu');
    const challengeId = requestRes.body.data.challengeId;
    const realCode = lastEnqueuedCode();
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    for (let i = 0; i < 5; i += 1) {
      const res = await verifyOtp(challengeId, wrongCode);
      expect(res.status).toBe(400);
    }

    const sixth = await verifyOtp(challengeId, wrongCode);
    expect(sixth.status).toBe(429);
    expect(sixth.body.error.code).toBe('RATE_LIMITED');
  });

  it('rejects an unexpected body key (mass-assignment)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .set(APP_VERSION_HEADERS)
      .send({
        challengeId: 'x',
        code: '123456',
        device: { platform: 'ANDROID', label: 'd', appVersion: '1.0.0' },
        role: 'ADMIN',
      });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const signUpRes = await signUp('refresh@test-uni.edu');
    const { refreshToken } = signUpRes.body.data;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('detects reuse of an already-rotated token and revokes the whole family', async () => {
    const signUpRes = await signUp('reuse@test-uni.edu');
    const originalRefreshToken = signUpRes.body.data.refreshToken;

    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken: originalRefreshToken });
    expect(firstRefresh.status).toBe(200);
    const rotatedRefreshToken = firstRefresh.body.data.refreshToken;

    // Reusing the OLD token is rejected...
    const reuseAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken: originalRefreshToken });
    expect(reuseAttempt.status).toBe(401);
    expect(reuseAttempt.body.error.code).toBe('UNAUTHENTICATED');

    // ...and so is the legitimately-rotated NEWER token — reuse detection
    // revoked the entire family, not just the reused token.
    const rotatedAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken: rotatedRefreshToken });
    expect(rotatedAttempt.status).toBe(401);
  });

  it('rejects an unknown refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken: 'this-token-does-not-exist' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects an expired session', async () => {
    const user = await createUser({ universityId: university.id });
    const refreshToken = 'expired-session-token';
    await createSession({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the current session, so its refresh token stops working', async () => {
    const signUpRes = await signUp('logout@test-uni.edu');
    const { accessToken, refreshToken } = signUpRes.body.data;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .set(APP_VERSION_HEADERS)
      .send({ refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set(APP_VERSION_HEADERS);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('GET /api/v1/me', () => {
  it('returns the masked email, status, onboarding and university — nothing else', async () => {
    const signUpRes = await signUp('me@test-uni.edu');
    const { accessToken } = signUpRes.body.data;

    const res = await request(app)
      .get('/api/v1/me')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      maskedEmail: 'm***@test-uni.edu',
      status: 'ACTIVE',
      onboarding: 'NEEDS_PROFILE',
      university: { slug: 'test-uni', name: 'Test University' },
    });
    expect(Object.keys(res.body.data).sort()).toEqual([
      'maskedEmail',
      'onboarding',
      'status',
      'university',
    ]);
  });

  it('never leaks the raw email, an email hash, or any internal id', async () => {
    const signUpRes = await signUp('leaktest@test-uni.edu');
    const { accessToken } = signUpRes.body.data;

    const res = await request(app)
      .get('/api/v1/me')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${accessToken}`);

    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/leaktest@test-uni\.edu/);
    expect(raw.toLowerCase()).not.toMatch(/userid|user_id|emailhash|email_hash/);
  });

  it('requires authentication (no header)', async () => {
    const res = await request(app).get('/api/v1/me').set(APP_VERSION_HEADERS);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a tampered access token', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects an expired access token with TOKEN_EXPIRED (not the generic UNAUTHENTICATED)', async () => {
    const user = await createUser({ universityId: university.id });
    const env = getEnv();
    // signAccessToken always issues a 15-minute token — sign one that's
    // already expired directly, mirroring tests/unit/jwt.test.js.
    const expiredToken = jwt.sign(
      { sub: user.id, sid: 'fake-session', uni: university.id, typ: 'access' },
      env.JWT_ACCESS_SECRET,
      { algorithm: 'HS256', expiresIn: -10, keyid: env.JWT_KID },
    );

    const res = await request(app)
      .get('/api/v1/me')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 403 ACCOUNT_SUSPENDED for a suspended user', async () => {
    const user = await createUser({ universityId: university.id, status: 'SUSPENDED' });
    const env = getEnv();
    const accessToken = signAccessToken({
      secret: env.JWT_ACCESS_SECRET,
      kid: env.JWT_KID,
      userId: user.id,
      sessionId: 'fake-session',
      universityId: university.id,
    });

    const res = await request(app)
      .get('/api/v1/me')
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('minAppVersion gate', () => {
  it('rejects a request below MIN_APP_VERSION with 426 on an auth route', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/request')
      .set('X-App-Version', '0.1.0')
      .send({ email: 'old-app@test-uni.edu' });
    expect(res.status).toBe(426);
    expect(res.body.error.code).toBe('UPGRADE_REQUIRED');
  });

  it('never gates /api/v1/meta/app-config itself', async () => {
    const res = await request(app).get('/api/v1/meta/app-config');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ minAppVersion: '1.0.0', latestAppVersion: '1.0.0' });
  });
});

describe('logging never includes the email or the OTP code', () => {
  function createCapturingApp() {
    /** @type {string[]} */
    const lines = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const logger = createLogger({ destination: stream });
    const capturingApp = createApp({ env: getEnv(), logger });
    return { capturingApp, lines };
  }

  it('never logs the plaintext email or OTP code across a full request/verify/wrong-code cycle', async () => {
    const { capturingApp, lines } = createCapturingApp();

    const requestRes = await request(capturingApp)
      .post('/api/v1/auth/otp/request')
      .set(APP_VERSION_HEADERS)
      .send({ email: 'logcheck@test-uni.edu' });
    const code = lastEnqueuedCode();
    const wrongCode = code === '000000' ? '111111' : '000000';

    await request(capturingApp)
      .post('/api/v1/auth/otp/verify')
      .set(APP_VERSION_HEADERS)
      .send({
        challengeId: requestRes.body.data.challengeId,
        code: wrongCode,
        device: { platform: 'ANDROID', label: 'd', appVersion: '1.0.0' },
      });

    await request(capturingApp)
      .post('/api/v1/auth/otp/verify')
      .set(APP_VERSION_HEADERS)
      .send({
        challengeId: requestRes.body.data.challengeId,
        code,
        device: { platform: 'ANDROID', label: 'd', appVersion: '1.0.0' },
      });

    const output = lines.join('\n');
    expect(output).not.toMatch(/logcheck@test-uni\.edu/);
    expect(output).not.toMatch(new RegExp(code));
    expect(output).not.toMatch(new RegExp(wrongCode));
  });
});
