// @ts-check
import { randomUUID } from 'node:crypto';
import { AppError } from '@campus/shared';
import { getEnv } from '../../config/env.js';
import {
  constantTimeEqual,
  emailDomain,
  encryptEmail,
  decryptEmail,
  generateOtpCode,
  generateRefreshToken,
  hashEmail,
  hashOtpCode,
  hashToken,
  normalizeEmail,
} from '../../lib/crypto.js';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from '../../lib/jwt.js';
import { checkRateLimit } from '../../middleware/rateLimit.js';
import { redis } from '../../lib/redis.js';
import { enqueueOtpEmail } from '../../queues/email.queue.js';
import * as repository from './repository.js';

/** §11.2 "expires 10 min". */
const CHALLENGE_TTL_SECONDS = 10 * 60;
/** §11.3 "Refresh token 30 days". */
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * The plaintext email + university a challenge belongs to. `sessions
 * and refresh tokens (PG)` per §9, but `verification_challenges` (§8.3)
 * has no email/university column — only `email_hash` — so there's no
 * durable place to keep the plaintext between `otp/request` and
 * `otp/verify`. This is exactly the kind of short-lived, TTL'd,
 * non-source-of-truth state §9 already puts in Redis (e.g. the OTP
 * resend cooldown), so it lives there too, under its own key, expiring
 * with the challenge. Deliberately not put in the DB row: Redis's TTL
 * means it's actually GONE after 10 minutes, not just logically stale —
 * a stronger guarantee for something this sensitive.
 * @param {string} challengeId
 * @param {{ email: string, universityId: string }} value
 */
async function cachePendingChallenge(challengeId, value) {
  await redis.set(`otp:pending:${challengeId}`, JSON.stringify(value), 'EX', CHALLENGE_TTL_SECONDS);
}

/** @param {string} challengeId */
async function getPendingChallenge(challengeId) {
  const raw = await redis.get(`otp:pending:${challengeId}`);
  if (!raw) {
    return null;
  }
  return /** @type {{ email: string, universityId: string }} */ (JSON.parse(raw));
}

/** @param {string} challengeId */
async function deletePendingChallenge(challengeId) {
  await redis.del(`otp:pending:${challengeId}`);
}

/**
 * `POST /auth/otp/request` (docs/architecture.md §11.2). Signup and login
 * are the same flow — this never reveals whether the email already has
 * an account.
 * @param {{ email: string, ipHash: string }} params
 */
export async function requestOtp({ email: rawEmail, ipHash }) {
  const env = getEnv();
  const email = normalizeEmail(rawEmail);
  const domain = emailDomain(email);

  const universityId = await repository.findActiveUniversityIdForDomain(domain);
  if (!universityId) {
    // Deliberately NOT the generic-response path: an unsupported domain
    // is public information (the university's domain list isn't secret)
    // and reveals nothing about whether a specific account exists.
    throw new AppError('DOMAIN_NOT_SUPPORTED');
  }

  const emailHash = hashEmail(env.EMAIL_HASH_PEPPER, email);
  const resendAvailableAt = new Date(Date.now() + 60_000);

  const banned = await repository.isEmailBanned(emailHash);
  if (banned) {
    // Same generic success, but no challenge is created and no email is
    // sent — a banned email gets a plausible-looking response with
    // nothing behind it (§11.2 "no ban oracle").
    return { challengeId: randomUUID(), resendAvailableAt: resendAvailableAt.toISOString() };
  }

  const challengeId = randomUUID();
  const code = generateOtpCode();
  const codeHash = hashOtpCode(env.EMAIL_HASH_PEPPER, challengeId, code);
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000);

  await repository.createVerificationChallenge({
    id: challengeId,
    emailHash,
    codeHash,
    expiresAt,
    ipHash,
  });
  await cachePendingChallenge(challengeId, { email, universityId });
  await enqueueOtpEmail({ to: email, code });

  return { challengeId, resendAvailableAt: resendAvailableAt.toISOString() };
}

/**
 * `POST /auth/otp/verify` (docs/architecture.md §11.2). Every failure
 * mode (expired, consumed, over attempts, wrong code, unknown
 * challengeId) throws the SAME `INVALID_CODE` error with no distinguishing
 * detail, so a client can't use the response to enumerate valid
 * challengeIds or narrow down the code.
 * @param {{ challengeId: string, code: string, device: { platform: 'ANDROID' | 'IOS', label: string, appVersion: string }, ipHash: string }} params
 */
export async function verifyOtp({ challengeId, code, device, ipHash }) {
  const env = getEnv();
  const challenge = await repository.findVerificationChallengeById(challengeId);
  if (!challenge) {
    throw new AppError('INVALID_CODE');
  }

  // Keyed by emailHash (not challengeId): caps total verify attempts
  // across every challenge for this email, closing the loophole of
  // requesting a fresh challenge to reset the per-challenge attempt
  // counter (§9 `rl:otp-verify:{emailHash}`).
  const withinRateLimit = await checkRateLimit('OTP_VERIFY_ATTEMPTS', challenge.emailHash);
  if (!withinRateLimit) {
    throw new AppError('RATE_LIMITED');
  }

  const now = Date.now();
  if (
    challenge.consumedAt !== null ||
    challenge.expiresAt.getTime() < now ||
    challenge.attempts >= challenge.maxAttempts
  ) {
    throw new AppError('INVALID_CODE');
  }

  const expectedHash = hashOtpCode(env.EMAIL_HASH_PEPPER, challengeId, code);
  if (!constantTimeEqual(expectedHash, challenge.codeHash)) {
    await repository.incrementChallengeAttempts(challengeId);
    throw new AppError('INVALID_CODE');
  }

  await repository.consumeChallenge(challengeId);

  const pending = await getPendingChallenge(challengeId);
  if (!pending) {
    // Redis lost the key (eviction/restart) inside the same 10-minute
    // window the Postgres row is still valid for — vanishingly rare, and
    // handled exactly like an expired challenge: request a new code.
    throw new AppError('INVALID_CODE');
  }

  let user = await repository.findUserByEmailHash(challenge.emailHash);
  if (!user) {
    // Defensive re-check: the email could have been banned in the
    // window between `otp/request` and this call. An existing user's
    // ban is caught below via `user.status` instead.
    if (await repository.isEmailBanned(challenge.emailHash)) {
      await deletePendingChallenge(challengeId);
      throw new AppError('INVALID_CODE');
    }

    const emailKey = Buffer.from(env.EMAIL_ENC_KEY, 'base64');
    user = await repository.createUserWithIdentityAndSettings({
      universityId: pending.universityId,
      emailHash: challenge.emailHash,
      emailEncrypted: encryptEmail(emailKey, pending.email),
      emailKeyVersion: 1,
      emailDomain: emailDomain(pending.email),
    });
  }
  await deletePendingChallenge(challengeId);

  if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new AppError('ACCOUNT_SUSPENDED');
  }

  const familyId = randomUUID();
  const refreshToken = generateRefreshToken();
  const session = await repository.createSession({
    userId: user.id,
    familyId,
    refreshTokenHash: hashToken(refreshToken),
    platform: device.platform,
    deviceLabel: device.label,
    appVersion: device.appVersion,
    ipHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  const accessToken = signAccessToken({
    secret: env.JWT_ACCESS_SECRET,
    kid: env.JWT_KID,
    userId: user.id,
    sessionId: session.id,
    universityId: user.universityId,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    onboarding: /** @type {'NEEDS_PROFILE' | 'COMPLETE'} */ (
      user.onboardedAt ? 'COMPLETE' : 'NEEDS_PROFILE'
    ),
  };
}

/**
 * `POST /auth/refresh` (docs/architecture.md §11.3). Rotates on every
 * call; reuse of an already-rotated (or already-logged-out) token revokes
 * the whole family and forces re-login.
 * @param {{ refreshToken: string }} params
 */
export async function refreshSession({ refreshToken }) {
  const refreshTokenHash = hashToken(refreshToken);
  const session = await repository.findSessionByRefreshTokenHash(refreshTokenHash);
  if (!session) {
    throw new AppError('UNAUTHENTICATED');
  }

  if (session.revokedAt !== null) {
    // Reuse of a token that was already rotated or already logged out —
    // revoke whatever's left of the family defensively either way
    // (§11.3 "revoke the whole family_id (stolen token)").
    await repository.revokeSessionFamily(session.familyId, 'reuse_detected');
    throw new AppError('UNAUTHENTICATED');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    throw new AppError('UNAUTHENTICATED');
  }

  const newRefreshToken = generateRefreshToken();
  const rotated = await repository.rotateSession({
    oldSessionId: session.id,
    newSession: {
      userId: session.userId,
      familyId: session.familyId,
      refreshTokenHash: hashToken(newRefreshToken),
      platform: session.platform,
      deviceLabel: session.deviceLabel,
      appVersion: session.appVersion,
      ipHash: session.ipHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });

  const user = await repository.findUserById(session.userId);
  if (!user || user.status === 'SUSPENDED' || user.status === 'BANNED') {
    throw new AppError('ACCOUNT_SUSPENDED');
  }

  const env = getEnv();
  const accessToken = signAccessToken({
    secret: env.JWT_ACCESS_SECRET,
    kid: env.JWT_KID,
    userId: user.id,
    sessionId: rotated.id,
    universityId: user.universityId,
  });

  return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

/**
 * `POST /auth/logout` — revokes only the calling session/device, per
 * docs/architecture.md §11.3 ("Log out all devices" is a later,
 * separate V1 feature).
 * @param {{ sessionId: string }} params
 */
export async function logout({ sessionId }) {
  await repository.revokeSession({ id: sessionId, reason: 'logout' });
}

/**
 * `GET /api/v1/me`. Returns plain fields for the presenter to shape —
 * decryption happens here (a security operation, not presentation), and
 * `toMeDTO` does the masking/renaming.
 * @param {{ userId: string }} params
 */
export async function getMe({ userId }) {
  const user = await repository.findUserById(userId);
  if (!user) {
    throw new AppError('UNAUTHENTICATED');
  }

  const [identity, university] = await Promise.all([
    repository.findUserIdentity(userId),
    repository.findUniversityById(user.universityId),
  ]);
  if (!identity || !university) {
    // Both are 1:1/FK-guaranteed rows created alongside the user — their
    // absence means data corruption, not a normal "not found" the client
    // should see a friendly message for.
    throw new Error(`Missing identity or university for user ${userId}`);
  }

  const env = getEnv();
  const emailKey = Buffer.from(env.EMAIL_ENC_KEY, 'base64');
  const email = decryptEmail(emailKey, identity.emailEncrypted);

  return {
    email,
    status: /** @type {'ACTIVE' | 'RESTRICTED'} */ (user.status),
    onboarding: /** @type {'NEEDS_PROFILE' | 'COMPLETE'} */ (
      user.onboardedAt ? 'COMPLETE' : 'NEEDS_PROFILE'
    ),
    university,
  };
}
