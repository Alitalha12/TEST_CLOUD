// @ts-check
import { AppError } from '@campus/shared';
import { redis } from '../lib/redis.js';
import { requireAuth } from './authenticate.js';
import * as authRepository from '../modules/auth/repository.js';

/**
 * Rejects a SUSPENDED or BANNED account with 403, per docs/architecture.md
 * §7.4 "AuthZ" and §9's `acct:{userId}` cache ("Account status cache ...
 * 60s ... Avoids a DB hit on every request"). RESTRICTED and
 * PENDING_DELETION are allowed through here — a restricted user can still
 * read/log in (posting limits are enforced where posts are created, a
 * later phase); PENDING_DELETION must stay reachable so the user can
 * cancel deletion by logging in (§11.7).
 *
 * Must run after `authenticate` (reads `res.locals.auth`).
 * @type {import('express').RequestHandler}
 */
export const requireAccountState = async (req, res, next) => {
  try {
    const auth = requireAuth(res);
    const cacheKey = `acct:${auth.userId}`;

    const cached = await redis.get(cacheKey);
    /** @type {{ status: string } | null} */
    let cachedState = null;
    if (cached) {
      try {
        cachedState = JSON.parse(cached);
      } catch {
        cachedState = null;
      }
    }

    let status = cachedState?.status;
    if (!status) {
      const user = await authRepository.findAccountStatusById(auth.userId);
      if (!user) {
        next(new AppError('UNAUTHENTICATED'));
        return;
      }
      status = user.status;
      await redis.set(cacheKey, JSON.stringify({ status }), 'EX', 60);
    }

    if (status === 'SUSPENDED') {
      next(new AppError('ACCOUNT_SUSPENDED'));
      return;
    }
    if (status === 'BANNED') {
      // No dedicated BANNED error code exists yet (no ban ladder until
      // Phase 5) — ACCOUNT_SUSPENDED's copy/semantics ("your account is
      // temporarily restricted") don't fit a permanent ban well, but
      // reusing ACCOUNT_RESTRICTED here is worse (that code doesn't map
      // to a 403-and-done outcome either). Revisit with a dedicated
      // ACCOUNT_BANNED code in Phase 5's moderation work.
      next(new AppError('ACCOUNT_SUSPENDED', 'Your account has been banned.'));
      return;
    }

    res.locals.accountStatus = status;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes the cached account-status entry — call this whenever a
 * sanction or status change happens (none exist until Phase 5, but the
 * cache-invalidation contract is documented here now per §9 "DEL on any
 * sanction/status change").
 * @param {string} userId
 */
export async function invalidateAccountStateCache(userId) {
  await redis.del(`acct:${userId}`);
}
