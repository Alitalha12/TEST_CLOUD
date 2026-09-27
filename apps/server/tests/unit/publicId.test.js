// @ts-check
import { describe, expect, it } from 'vitest';
import { generatePublicId } from '../../src/lib/publicId.js';

describe('generatePublicId', () => {
  it('starts with "p_" followed by exactly 12 URL-safe characters', () => {
    const id = generatePublicId();
    expect(id).toMatch(/^p_[A-Za-z0-9_-]{12}$/);
  });

  it('is not predictable/repeating across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generatePublicId()));
    expect(ids.size).toBe(50);
  });
});
