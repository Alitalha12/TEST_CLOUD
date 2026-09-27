// @ts-check
import { Router } from 'express';
import {
  ProfileCreateBodySchema,
  ProfileInterestsBodySchema,
  ProfileRenameBodySchema,
  ProfileUpdateBodySchema,
  SettingsUpdateBodySchema,
} from '@campus/shared';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAccountState } from '../../middleware/requireAccountState.js';
import { requireOnboarded } from '../../middleware/requireOnboarded.js';
import { minAppVersion } from '../../middleware/minAppVersion.js';
import * as controller from './controller.js';

/**
 * A factory (not a module-level singleton) for the same reason as
 * `routes.js`'s own `createRouter(env)`: `minAppVersion` needs
 * `env.MIN_APP_VERSION`.
 *
 * `requireCurrentApp` is listed **per-route**, not via a shared
 * `router.use(...)` at the top — these routes don't share one exclusive
 * path prefix the way `/api/v1/auth/*` does (they span `/me/profile*`,
 * `/me/interests`, `/me/settings`, `/profiles/:publicId`, all mounted at
 * bare `/api/v1`), and Express runs a router-level `.use()` for every
 * request that reaches the router — including ones that don't match any
 * of its routes. That would gate `/api/v1/anything-unmatched` too,
 * turning what should fall through to the app's 404 handler into a 426
 * instead. Listing it inside each route's own handler chain (exactly
 * like `routes.js`'s single `/api/v1/me` route already does) means it
 * only ever runs for a request that actually matched that route.
 *
 * @param {import('../../config/env.js').Env} env
 */
export function createProfilesRouter(env) {
  const profilesRouter = Router();
  const requireCurrentApp = minAppVersion(env.MIN_APP_VERSION);

  const authed = [requireCurrentApp, authenticate, requireAccountState];
  const onboarded = [...authed, requireOnboarded];

  profilesRouter.get('/me/profile/options', ...authed, controller.getProfileOptions);

  profilesRouter.post(
    '/me/profile',
    ...authed,
    validate({ body: ProfileCreateBodySchema }),
    controller.createProfile,
  );

  profilesRouter.get('/me/profile', ...onboarded, controller.getMyProfile);

  profilesRouter.patch(
    '/me/profile',
    ...onboarded,
    validate({ body: ProfileUpdateBodySchema }),
    controller.updateProfile,
  );

  profilesRouter.post(
    '/me/profile/rename',
    ...onboarded,
    validate({ body: ProfileRenameBodySchema }),
    controller.renameProfile,
  );

  profilesRouter.put(
    '/me/interests',
    ...onboarded,
    validate({ body: ProfileInterestsBodySchema }),
    controller.replaceInterests,
  );

  // `GET /profiles/:publicId` and `/me/settings` need neither
  // `requireOnboarded` (viewing someone else's persona, or reading/
  // writing settings created at signup in Phase 3, don't require having
  // your own profile yet) — §28 P4 "Profile-creation routes use
  // authenticate + requireAccountState only" applies to these too.
  profilesRouter.get('/profiles/:publicId', ...authed, controller.getPublicProfile);

  profilesRouter.get('/me/settings', ...authed, controller.getSettings);

  profilesRouter.patch(
    '/me/settings',
    ...authed,
    validate({ body: SettingsUpdateBodySchema }),
    controller.updateSettings,
  );

  return profilesRouter;
}
