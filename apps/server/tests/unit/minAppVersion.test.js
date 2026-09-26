// @ts-check
import { describe, expect, it, vi } from 'vitest';
import { compareVersions, minAppVersion } from '../../src/middleware/minAppVersion.js';

describe('compareVersions', () => {
  it('compares numerically, not lexically (1.9.0 < 1.10.0)', () => {
    expect(compareVersions('1.9.0', '1.10.0')).toBeLessThan(0);
  });

  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('returns positive when a > b', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });

  it('treats a missing segment as 0', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.3', '1.2.9')).toBeGreaterThan(0);
  });
});

describe('minAppVersion middleware', () => {
  /** @param {string | undefined} headerValue */
  function createMocks(headerValue) {
    const req = /** @type {any} */ ({
      headers: headerValue ? { 'x-app-version': headerValue } : {},
    });
    const res = /** @type {any} */ ({});
    const next = vi.fn();
    return { req, res, next };
  }

  it('calls next() with no error when the version meets the minimum', () => {
    const { req, res, next } = createMocks('1.2.0');
    minAppVersion('1.2.0')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() with no error when the version exceeds the minimum', () => {
    const { req, res, next } = createMocks('2.0.0');
    minAppVersion('1.2.0')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(UPGRADE_REQUIRED) when the version is below the minimum', () => {
    const { req, res, next } = createMocks('1.1.9');
    minAppVersion('1.2.0')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'UPGRADE_REQUIRED' });
  });

  it('calls next(UPGRADE_REQUIRED) when the header is missing entirely', () => {
    const { req, res, next } = createMocks(undefined);
    minAppVersion('1.0.0')(req, res, next);
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'UPGRADE_REQUIRED' });
  });
});
