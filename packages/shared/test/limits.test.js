import { describe, expect, it } from 'vitest';
import { CONTENT_LIMITS, MEDIA_LIMITS, PAGINATION_LIMITS, RATE_LIMITS } from '../src/limits.js';

describe('RATE_LIMITS', () => {
  it('every rule has positive points and duration', () => {
    for (const [name, rule] of Object.entries(RATE_LIMITS)) {
      expect(rule.points, `${name}.points`).toBeGreaterThan(0);
      expect(rule.durationSeconds, `${name}.durationSeconds`).toBeGreaterThan(0);
      expect(rule.description, `${name}.description`).toBeTruthy();
    }
  });

  it('new-account limits are stricter than established-account limits', () => {
    expect(RATE_LIMITS.POST_CREATE_NEW_ACCOUNT.points).toBeLessThan(
      // New accounts get 3/day; established get 10/hour (240/day) — much looser.
      RATE_LIMITS.POST_CREATE.points * 24,
    );
    expect(RATE_LIMITS.MESSAGE_SEND_NEW_ACCOUNT.points).toBeLessThan(
      RATE_LIMITS.MESSAGE_SEND.points,
    );
  });
});

describe('CONTENT_LIMITS', () => {
  it('matches the column sizes from the architecture doc §8.3', () => {
    expect(CONTENT_LIMITS.POST_BODY_MAX_CHARS).toBe(2000);
    expect(CONTENT_LIMITS.COMMENT_BODY_MAX_CHARS).toBe(1000);
    expect(CONTENT_LIMITS.MESSAGE_BODY_MAX_CHARS).toBe(4000);
    expect(CONTENT_LIMITS.POST_MAX_IMAGES).toBe(4);
  });
});

describe('MEDIA_LIMITS', () => {
  it('does not allow SVG or GIF (§10.2 explicitly excludes them)', () => {
    expect(MEDIA_LIMITS.IMAGE_ALLOWED_MIME_TYPES).not.toContain('image/svg+xml');
    expect(MEDIA_LIMITS.IMAGE_ALLOWED_MIME_TYPES).not.toContain('image/gif');
  });
});

describe('PAGINATION_LIMITS', () => {
  it('default page size does not exceed the max', () => {
    expect(PAGINATION_LIMITS.DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(
      PAGINATION_LIMITS.MAX_PAGE_SIZE,
    );
  });
});
