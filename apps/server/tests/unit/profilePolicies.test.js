// @ts-check
import { describe, expect, it } from 'vitest';
import { checkRenameCooldown } from '../../src/modules/profiles/policies.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('checkRenameCooldown', () => {
  it('allows a rename exactly 30 days after the last change', () => {
    const nameChangedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date(nameChangedAt.getTime() + 30 * DAY_MS);
    expect(checkRenameCooldown(nameChangedAt, now)).toEqual({ allowed: true });
  });

  it('allows a rename well after 30 days', () => {
    const nameChangedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date(nameChangedAt.getTime() + 45 * DAY_MS);
    expect(checkRenameCooldown(nameChangedAt, now)).toEqual({ allowed: true });
  });

  it('blocks a rename 1 day after the last change, with retryAfterSeconds/nextRenameAt', () => {
    const nameChangedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date(nameChangedAt.getTime() + 1 * DAY_MS);
    const result = checkRenameCooldown(nameChangedAt, now);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.nextRenameAt.toISOString()).toBe(
        new Date(nameChangedAt.getTime() + 30 * DAY_MS).toISOString(),
      );
      expect(result.retryAfterSeconds).toBe(29 * 24 * 60 * 60);
    }
  });

  it('blocks a rename the instant after the last change', () => {
    const nameChangedAt = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date(nameChangedAt.getTime() + 1000);
    const result = checkRenameCooldown(nameChangedAt, now);
    expect(result.allowed).toBe(false);
  });
});
