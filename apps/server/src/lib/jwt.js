// @ts-check
import jwt from 'jsonwebtoken';

/**
 * Access JWT signing/verification. Source: docs/architecture.md §7.4
 * "AuthN": "JWT access (15 min, HS256 with `kid` for key rotation),
 * claims `{sub, sid, uni, typ:'access'}`."
 */

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** Thrown by `verifyAccessToken`. `reason` lets callers map to the right error code. */
export class JwtVerificationError extends Error {
  /** @param {'expired' | 'invalid'} reason */
  constructor(reason) {
    super(`Access token verification failed: ${reason}`);
    this.name = 'JwtVerificationError';
    this.reason = reason;
  }
}

/**
 * @param {{ secret: string, kid: string, userId: string, sessionId: string, universityId: string }} params
 * @returns {string}
 */
export function signAccessToken({ secret, kid, userId, sessionId, universityId }) {
  return jwt.sign({ sub: userId, sid: sessionId, uni: universityId, typ: 'access' }, secret, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    keyid: kid,
  });
}

/**
 * @typedef {Object} AccessTokenPayload
 * @property {string} userId
 * @property {string} sessionId
 * @property {string} universityId
 */

/**
 * Verifies signature, expiry and algorithm, then checks `typ === 'access'`
 * (rejecting a token of any other type, once one exists, from being
 * accepted here). A tampered signature, a wrong/missing `typ`, and an
 * expired-but-otherwise-valid token are deliberately distinguished via
 * `reason` — only the latter should prompt the client to try a refresh.
 * @param {string} token
 * @param {string} secret
 * @returns {AccessTokenPayload}
 */
export function verifyAccessToken(token, secret) {
  /** @type {import('jsonwebtoken').JwtPayload | string} */
  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new JwtVerificationError('expired');
    }
    throw new JwtVerificationError('invalid');
  }

  if (
    typeof payload !== 'object' ||
    payload.typ !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string' ||
    typeof payload.uni !== 'string'
  ) {
    throw new JwtVerificationError('invalid');
  }

  return { userId: payload.sub, sessionId: payload.sid, universityId: payload.uni };
}
