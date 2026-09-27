// @ts-check
import { AppError } from '@campus/shared';
import { requireAuth } from './authenticate.js';
import * as authRepository from '../modules/auth/repository.js';

/**
 * Rejects a caller who hasn't finished profile creation yet (§28 P4
 * "`requireOnboarded` middleware ... for routes that need a persona").
 * Reads `users.onboardedAt` through the **auth module's own repository**
 * rather than querying `users` directly here — the same reasoning as
 * `requireAccountState.js` importing `authRepository`: the `users` table
 * is auth's to touch, everything else goes through it (§11.5 lock 1),
 * and `onboardedAt` is set in the same transaction that creates the
 * profile row, so it's an equally reliable signal without a second join.
 *
 * Must run after `authenticate` (and typically `requireAccountState`).
 * @type {import('express').RequestHandler}
 */
export const requireOnboarded = async (req, res, next) => {
  try {
    const auth = requireAuth(res);
    const user = await authRepository.findUserById(auth.userId);
    if (!user) {
      next(new AppError('UNAUTHENTICATED'));
      return;
    }
    if (!user.onboardedAt) {
      next(new AppError('PROFILE_REQUIRED'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
};
