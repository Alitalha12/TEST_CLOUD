import { describe, expect, it } from 'vitest';
import {
  DepartmentListSchema,
  DepartmentSchema,
  InterestListSchema,
  InterestSchema,
} from '../../src/schemas/meta.js';

describe('InterestSchema', () => {
  it('accepts a valid interest', () => {
    const result = InterestSchema.safeParse({
      slug: 'ai-ml',
      name: 'AI/ML',
      category: 'Technology',
    });
    expect(result.success).toBe(true);
  });

  it('allows a null category', () => {
    const result = InterestSchema.safeParse({ slug: 'ai-ml', name: 'AI/ML', category: null });
    expect(result.success).toBe(true);
  });

  it('rejects a missing slug', () => {
    const result = InterestSchema.safeParse({ name: 'AI/ML', category: null });
    expect(result.success).toBe(false);
  });
});

describe('InterestListSchema', () => {
  it('accepts an array of interests', () => {
    const result = InterestListSchema.safeParse([
      { slug: 'ai-ml', name: 'AI/ML', category: null },
      { slug: 'web-dev', name: 'Web Development', category: null },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts an empty array', () => {
    expect(InterestListSchema.safeParse([]).success).toBe(true);
  });
});

describe('DepartmentSchema', () => {
  it('accepts a valid department', () => {
    const result = DepartmentSchema.safeParse({ id: 'dept_123', name: 'Computer Science' });
    expect(result.success).toBe(true);
  });

  it('never includes a university_id or other internal field by design', () => {
    // This schema is .strict()-free intentionally in transport, but the
    // presenter must only ever pass {id, name} — this test documents the
    // expected shape so a future field addition is a deliberate change.
    expect(Object.keys(DepartmentSchema.shape)).toEqual(['id', 'name']);
  });
});

describe('DepartmentListSchema', () => {
  it('accepts an array of departments', () => {
    const result = DepartmentListSchema.safeParse([{ id: 'd1', name: 'Physics' }]);
    expect(result.success).toBe(true);
  });
});
