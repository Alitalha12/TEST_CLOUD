// @ts-check
import { Router } from 'express';
import * as controller from './controller.js';

export const healthRouter = Router();

healthRouter.get('/health', controller.health);
healthRouter.get('/ready', controller.ready);
