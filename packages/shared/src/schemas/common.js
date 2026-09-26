// @ts-check
import { z } from 'zod';
import { ERROR_CODES } from '../errors.js';
import { PAGINATION_LIMITS } from '../limits.js';

/**
 * The response envelope every API endpoint uses.
 * Source: docs/architecture.md §26 "API / Data Contracts" and plan.md §58.
 *
 * Success: {success: true, data, meta?}
 * Error:   {success: false, error: {code, message, details?, requestId}}
 */

const errorCodeEnum = /** @type {[string, ...string[]]} */ (Object.keys(ERROR_CODES));

export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum(errorCodeEnum),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  }),
});

/**
 * Builds a success envelope schema wrapping the given data schema.
 * @template {z.ZodTypeAny} T
 * @param {T} dataSchema
 */
export function successEnvelopeSchema(dataSchema) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.string(), z.unknown()).optional(),
  });
}

/**
 * Builds a full response schema (success | error) for a given data schema.
 * Used by presenters/tests to assert a response matches the contract, and
 * (in dev/test) to fail loudly on unexpected extra keys — see §11.5.
 * @template {z.ZodTypeAny} T
 * @param {T} dataSchema
 */
export function responseSchema(dataSchema) {
  return z.union([successEnvelopeSchema(dataSchema), ErrorEnvelopeSchema]);
}

/**
 * Opaque pagination cursor. Callers should treat this as a black box
 * (base64-encoded, server-defined) rather than parsing it client-side.
 * §12.1 "Recent" / "Trending" cursor design.
 */
export const CursorSchema = z.string().min(1).max(512);

export const PaginationQuerySchema = z.object({
  cursor: CursorSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_LIMITS.MAX_PAGE_SIZE)
    .default(PAGINATION_LIMITS.DEFAULT_PAGE_SIZE)
    .optional(),
});

/**
 * Builds a paginated data schema: {items, nextCursor, hasMore}.
 * §26 "Pagination `data: {items, nextCursor, hasMore}`".
 * @template {z.ZodTypeAny} T
 * @param {T} itemSchema
 */
export function paginatedSchema(itemSchema) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: CursorSchema.nullable(),
    hasMore: z.boolean(),
  });
}
