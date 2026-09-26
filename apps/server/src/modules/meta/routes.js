// @ts-check
import { Router } from 'express';
import { ListDepartmentsQuerySchema } from '@campus/shared';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';

export const metaRouter = Router();

metaRouter.get('/interests', controller.listInterests);
metaRouter.get(
  '/departments',
  validate({ query: ListDepartmentsQuerySchema }),
  controller.listDepartments,
);
metaRouter.get('/app-config', controller.getAppConfig);
