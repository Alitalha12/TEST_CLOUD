// @ts-check
import { Router } from 'express';
import { healthRouter } from './modules/health/routes.js';
import { metaRouter } from './modules/meta/routes.js';

/**
 * Health/ready are unversioned infrastructure endpoints (orchestrators
 * and uptime checks hit these directly, not through the API version
 * scheme). Everything else lives under /api/v1 per ADR 0007.
 */
export const router = Router();

router.use(healthRouter);
router.use('/api/v1/meta', metaRouter);
