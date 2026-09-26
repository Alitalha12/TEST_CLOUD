// @ts-check
import { AppError } from '@campus/shared';

/**
 * Validates a request's body/query/params against Zod schemas from
 * `@campus/shared`. Unknown keys are rejected on input — pass schemas
 * built with `.strict()` (object schemas) to get that behavior; this
 * middleware does not silently add it, so a schema author must opt in
 * deliberately. See docs/architecture.md §7.4 "Validation" and §20
 * "Privilege escalation" (mass-assignment prevention).
 *
 * On success, the parsed (and possibly coerced/defaulted) values replace
 * `req.body`/`req.query`/`req.params` in place, so controllers always see
 * validated, typed data.
 *
 * @param {{ body?: import('zod').ZodTypeAny; query?: import('zod').ZodTypeAny; params?: import('zod').ZodTypeAny }} schemas
 * @returns {import('express').RequestHandler}
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = parseOrThrow(schemas.body, req.body, 'body');
      }
      if (schemas.query) {
        const parsed = parseOrThrow(schemas.query, req.query, 'query');
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.params) {
        const parsed = parseOrThrow(schemas.params, req.params, 'params');
        Object.defineProperty(req, 'params', { value: parsed, writable: true, configurable: true });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {unknown} value
 * @param {'body' | 'query' | 'params'} location
 */
function parseOrThrow(schema, value, location) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = {
      location,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
    throw new AppError('VALIDATION_ERROR', 'The request could not be validated.', details);
  }
  return result.data;
}
