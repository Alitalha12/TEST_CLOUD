// @ts-check
import { Router } from 'express';
import { healthRouter } from './modules/health/routes.js';
import { metaRouter } from './modules/meta/routes.js';
import { authRouter } from './modules/auth/routes.js';
import * as authController from './modules/auth/controller.js';
import { authenticate } from './middleware/authenticate.js';
import { requireAccountState } from './middleware/requireAccountState.js';
import { minAppVersion } from './middleware/minAppVersion.js';

/**
 * Health/ready are unversioned infrastructure endpoints (orchestrators
 * and uptime checks hit these directly, not through the API version
 * scheme). Everything else lives under /api/v1 per ADR 0007.
 *
 * `/api/v1/meta` (including `/meta/app-config` itself) is deliberately
 * exempt from `minAppVersion` — a client stuck below the minimum still
 * needs to be able to fetch that config to learn so, and to show
 * interests/departments on its blocking update screen. Every other
 * versioned route is gated.
 *
 * A factory (not a module-level singleton), same reasoning as
 * `app.js`'s `createApp`: `minAppVersion` needs `env.MIN_APP_VERSION`,
 * and tests build an app against a specific env via `buildTestApp({env})`
 * — a static `router` built from the process-wide `getEnv()` would
 * silently ignore that override.
 * @param {import('./config/env.js').Env} env
 */
export function createRouter(env) {
  const router = Router();
  const requireCurrentApp = minAppVersion(env.MIN_APP_VERSION);

  router.use(healthRouter);
  router.use('/api/v1/meta', metaRouter);
  router.use('/api/v1/auth', requireCurrentApp, authRouter);
  router.get('/api/v1/me', requireCurrentApp, authenticate, requireAccountState, authController.me);

  return router;
}
