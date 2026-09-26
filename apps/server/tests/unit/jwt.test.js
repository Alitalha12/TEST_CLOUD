// @ts-check
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { JwtVerificationError, signAccessToken, verifyAccessToken } from '../../src/lib/jwt.js';

const SECRET = 'test-secret-at-least-32-characters-long';

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips the payload', () => {
    const token = signAccessToken({
      secret: SECRET,
      kid: 'key-1',
      userId: 'user-1',
      sessionId: 'session-1',
      universityId: 'uni-1',
    });

    const payload = verifyAccessToken(token, SECRET);
    expect(payload).toEqual({ userId: 'user-1', sessionId: 'session-1', universityId: 'uni-1' });
  });

  it('embeds the kid in the token header for future key rotation', () => {
    const token = signAccessToken({
      secret: SECRET,
      kid: 'key-42',
      userId: 'u',
      sessionId: 's',
      universityId: 'uni',
    });
    const decoded = /** @type {import('jsonwebtoken').Jwt} */ (
      jwt.decode(token, { complete: true })
    );
    expect(decoded?.header.kid).toBe('key-42');
    expect(decoded?.header.alg).toBe('HS256');
  });

  it('rejects a token signed with a different secret (tampered)', () => {
    const token = signAccessToken({
      secret: 'a-different-secret-entirely-32-chars',
      kid: 'key-1',
      userId: 'u',
      sessionId: 's',
      universityId: 'uni',
    });

    expect(() => verifyAccessToken(token, SECRET)).toThrow(JwtVerificationError);
    try {
      verifyAccessToken(token, SECRET);
    } catch (err) {
      expect(err).toBeInstanceOf(JwtVerificationError);
      expect(/** @type {JwtVerificationError} */ (err).reason).toBe('invalid');
    }
  });

  it('rejects an expired token with reason "expired"', () => {
    const expiredToken = jwt.sign({ sub: 'u', sid: 's', uni: 'uni', typ: 'access' }, SECRET, {
      algorithm: 'HS256',
      expiresIn: -10,
      keyid: 'key-1',
    });

    expect.assertions(2);
    try {
      verifyAccessToken(expiredToken, SECRET);
    } catch (err) {
      expect(err).toBeInstanceOf(JwtVerificationError);
      expect(/** @type {JwtVerificationError} */ (err).reason).toBe('expired');
    }
  });

  it('rejects a token with the wrong `typ` claim', () => {
    const refreshTypedToken = jwt.sign({ sub: 'u', sid: 's', uni: 'uni', typ: 'refresh' }, SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      keyid: 'key-1',
    });

    expect.assertions(2);
    try {
      verifyAccessToken(refreshTypedToken, SECRET);
    } catch (err) {
      expect(err).toBeInstanceOf(JwtVerificationError);
      expect(/** @type {JwtVerificationError} */ (err).reason).toBe('invalid');
    }
  });

  it('rejects a token signed with a different algorithm (alg confusion)', () => {
    // jsonwebtoken's `algorithms: ['HS256']` verify option rejects any
    // other alg outright, including a deliberately malicious "none".
    const noneAlgToken = jwt.sign({ sub: 'u', sid: 's', uni: 'uni', typ: 'access' }, '', {
      algorithm: 'none',
    });

    expect(() => verifyAccessToken(noneAlgToken, SECRET)).toThrow(JwtVerificationError);
  });

  it('rejects a malformed/garbage token', () => {
    expect(() => verifyAccessToken('not-a-jwt-at-all', SECRET)).toThrow(JwtVerificationError);
  });
});
