// @ts-check
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Auth-specific crypto primitives. Source: docs/architecture.md §11.2
 * ("normalize: trim, lowercase, strip '+tag'", "HMAC-SHA256", "AES-GCM",
 * "constant-time compare", "6 random digits") and §11.3 ("opaque random
 * 256-bit strings stored hashed").
 *
 * Nothing here reads env vars directly — every function takes its
 * secret/key as a parameter, so it stays trivially unit-testable and
 * never accidentally depends on `getEnv()` having run.
 */

/**
 * Trims, lowercases, and strips a "+tag" from the local part only (never
 * the domain) — `Student+test@UET.edu.pk` → `student@uet.edu.pk`.
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  const trimmedLower = email.trim().toLowerCase();
  const atIndex = trimmedLower.lastIndexOf('@');
  if (atIndex === -1) {
    return trimmedLower;
  }
  const local = trimmedLower.slice(0, atIndex);
  const domain = trimmedLower.slice(atIndex + 1);
  const plusIndex = local.indexOf('+');
  const strippedLocal = plusIndex === -1 ? local : local.slice(0, plusIndex);
  return `${strippedLocal}@${domain}`;
}

/**
 * @param {string} email a value already passed through normalizeEmail
 * @returns {string} the domain part, e.g. "uet.edu.pk"
 */
export function emailDomain(email) {
  return email.slice(email.lastIndexOf('@') + 1);
}

/**
 * @param {string} pepper
 * @param {string} value
 * @returns {string} hex-encoded HMAC-SHA256
 */
export function hmacSha256(pepper, value) {
  return createHmac('sha256', pepper).update(value).digest('hex');
}

/**
 * @param {string} pepper EMAIL_HASH_PEPPER
 * @param {string} normalizedEmail
 */
export function hashEmail(pepper, normalizedEmail) {
  return hmacSha256(pepper, normalizedEmail);
}

/**
 * @param {string} pepper EMAIL_HASH_PEPPER (reused as the OTP-code pepper —
 *   a single secret is enough here since both hashes are one-way and
 *   never compared against each other)
 * @param {string} challengeId
 * @param {string} code
 */
export function hashOtpCode(pepper, challengeId, code) {
  return hmacSha256(pepper, `${challengeId}:${code}`);
}

const AES_ALGORITHM = 'aes-256-gcm';
const AES_IV_BYTES = 12;

/**
 * AES-256-GCM encrypt. Returns `base64(iv):base64(authTag):base64(ciphertext)`
 * so decryption never has to guess field boundaries.
 * @param {Buffer} key 32 bytes
 * @param {string} plaintext
 * @returns {string}
 */
export function encryptEmail(key, plaintext) {
  const iv = randomBytes(AES_IV_BYTES);
  const cipher = createCipheriv(AES_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString('base64')).join(':');
}

/**
 * @param {Buffer} key 32 bytes
 * @param {string} encrypted the `encryptEmail` output
 * @returns {string} plaintext
 */
export function decryptEmail(key, encrypted) {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(':');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted email value');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/**
 * Constant-time string comparison — never `===` on a secret-derived
 * value (§11.2 "constant-time compare"). Returns `false` (rather than
 * throwing) on a length mismatch; comparing the wrong-length buffer
 * itself would leak nothing timing-wise beyond "lengths differ", which
 * is not sensitive here (hash outputs are fixed-length; only user input
 * varies).
 * @param {string} a
 * @param {string} b
 */
export function constantTimeEqual(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * @returns {string} a 6-digit numeric OTP, zero-padded (never coerced to
 *   a number anywhere downstream — a leading zero is a valid code).
 */
export function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * @returns {string} an opaque, URL-safe 256-bit refresh token.
 */
export function generateRefreshToken() {
  return randomBytes(32).toString('base64url');
}

/**
 * Plain SHA-256 hash of an opaque, already-high-entropy token (the
 * refresh token itself, §11.3 "stored hashed") — no HMAC pepper needed
 * here, unlike the email hash, because the token is unguessable on its
 * own (256 bits of CSPRNG output), so there's nothing an offline
 * dictionary attack against a leaked hash could exploit.
 * @param {string} token
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
