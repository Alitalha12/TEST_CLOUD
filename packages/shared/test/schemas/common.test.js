import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ErrorEnvelopeSchema,
  PaginationQuerySchema,
  paginatedSchema,
  responseSchema,
  successEnvelopeSchema,
} from '../../src/schemas/common.js';

describe('successEnvelopeSchema', () => {
  const schema = successEnvelopeSchema(z.object({ id: z.string() }));

  it('accepts a valid success envelope', () => {
    const result = schema.safeParse({ success: true, data: { id: 'abc' } });
    expect(result.success).toBe(true);
  });

  it('rejects success:false', () => {
    const result = schema.safeParse({ success: false, data: { id: 'abc' } });
    expect(result.success).toBe(false);
  });
});

describe('ErrorEnvelopeSchema', () => {
  it('accepts a valid error envelope with a known code', () => {
    const result = ErrorEnvelopeSchema.safeParse({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Not found.' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown error code', () => {
    const result = ErrorEnvelopeSchema.safeParse({
      success: false,
      error: { code: 'TOTALLY_MADE_UP', message: 'x' },
    });
    expect(result.success).toBe(false);
  });
});

describe('responseSchema', () => {
  const schema = responseSchema(z.object({ id: z.string() }));

  it('accepts either a success or an error envelope', () => {
    expect(schema.safeParse({ success: true, data: { id: 'a' } }).success).toBe(true);
    expect(
      schema.safeParse({ success: false, error: { code: 'INTERNAL', message: 'x' } }).success,
    ).toBe(true);
  });
});

describe('PaginationQuerySchema', () => {
  it('applies the default limit when omitted', () => {
    const result = PaginationQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('coerces a string query-param limit to a number', () => {
    const result = PaginationQuerySchema.parse({ limit: '10' });
    expect(result.limit).toBe(10);
  });

  it('rejects a limit above the max page size', () => {
    const result = PaginationQuerySchema.safeParse({ limit: 1000 });
    expect(result.success).toBe(false);
  });
});

describe('paginatedSchema', () => {
  const schema = paginatedSchema(z.object({ id: z.string() }));

  it('accepts items with a nextCursor', () => {
    const result = schema.safeParse({
      items: [{ id: '1' }],
      nextCursor: 'abc123',
      hasMore: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a null nextCursor on the last page', () => {
    const result = schema.safeParse({ items: [], nextCursor: null, hasMore: false });
    expect(result.success).toBe(true);
  });

  it('rejects a missing hasMore field', () => {
    const result = schema.safeParse({ items: [], nextCursor: null });
    expect(result.success).toBe(false);
  });
});
