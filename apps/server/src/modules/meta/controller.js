// @ts-check
import { sendSuccess } from '../../http/respond.js';
import * as service from './service.js';
import { toAppConfigDTO, toDepartmentListDTO, toInterestListDTO } from './presenter.js';

/**
 * HTTP ⇄ service translation only — no Prisma, no business rules, per
 * docs/conventions.md "Layering". Express 5 forwards a rejected async
 * handler's error to the error-handling middleware automatically, so no
 * try/catch or wrapper is needed here.
 *
 * `const` arrow expressions (not `function` declarations) because
 * TS/JSDoc's `@type` cast reliably retypes the whole signature — return
 * type included — only in that form.
 */

/** @type {import('express').RequestHandler} */
export const listInterests = async (req, res) => {
  const interests = await service.getInterests();
  sendSuccess(res, toInterestListDTO(interests));
};

/** @type {import('express').RequestHandler} */
export const listDepartments = async (req, res) => {
  const { universitySlug } = /** @type {{ universitySlug?: string }} */ (req.query);
  const departments = await service.getDepartments(universitySlug);
  sendSuccess(res, toDepartmentListDTO(departments));
};

/** @type {import('express').RequestHandler} */
export const getAppConfig = async (req, res) => {
  sendSuccess(res, toAppConfigDTO(service.getAppConfig()));
};
