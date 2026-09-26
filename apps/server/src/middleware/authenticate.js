// @ts-check
import { AppError } from '@campus/shared';
import { getEnv } from '../config/env.js';
import { JwtVerificationError, verifyAccessToken } from '../lib/jwt.js';

/**
 * Verifies the `Authorization: Bearer <accessToken>` header and attaches
 * the result to `res.locals.auth`. Stored on `res.locals` (not a custom
 * `req.auth` property) for the same reason as `requestId.js`: it's
 * already typed as an open record by `@types/express`, so no hand-
 * written `.d.ts` type augmentation is needed (docs/adr/0002).
 *
 * An expired token maps to `TOKEN_EXPIRED` (401) — the one case a client
 * should respond to by calling `/auth/refresh` and retrying. Anything
 * else wrong with the token (missing header, malformed, tampered
 * signature, wrong `typ`) maps to the generic `UNAUTHENTICATED` (401),
 * which should send the client to the login flow instead.
 *
 * @type {import('express').RequestHandler}
 */
export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    next(new AppError('UNAUTHENTICATED'));
    return;
  }

  const token = header.slice('Bearer '.length);
  const env = getEnv();

  try {
    const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
    res.locals.auth = payload;
    next();
  } catch (err) {
    if (err instanceof JwtVerificationError && err.reason === 'expired') {
      next(new AppError('TOKEN_EXPIRED'));
      return;
    }
    next(new AppError('UNAUTHENTICATED'));
  }
};

/**
 * @param {import('express').Response} res
 * @returns {import('../lib/jwt.js').AccessTokenPayload}
 */
export function requireAuth(res) {
  const auth = /** @type {import('../lib/jwt.js').AccessTokenPayload | undefined} */ (
    res.locals.auth
  );
  if (!auth) {
    // Only reachable if a route uses requireAuth()/controller reads
    // res.locals.auth without first running the `authenticate`
    // middleware — a wiring bug, not a real unauthenticated request.
    throw new Error('requireAuth() called without the authenticate middleware running first');
  }
  return auth;
}
