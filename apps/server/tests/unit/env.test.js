// @ts-check
import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  // Phase 3 auth secrets — dummy-but-valid-shape values for this test file only.
  EMAIL_HASH_PEPPER: 'a-test-pepper-at-least-16-chars',
  EMAIL_ENC_KEY: Buffer.alloc(32, 1).toString('base64'),
  JWT_ACCESS_SECRET: 'a-test-jwt-secret-at-least-32-characters-long',
  JWT_KID: 'test-key-1',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_FROM: 'Test <no-reply@localhost>',
};

describe('loadEnv', () => {
  it('parses a minimal valid env, applying defaults', () => {
    const env = loadEnv(VALID_ENV);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.isProduction).toBe(false);
    expect(env.isTest).toBe(false);
    expect(env.corsAllowedOrigins).toEqual([]);
  });

  it('throws when DATABASE_URL is missing — the process must refuse to start', () => {
    expect(() => loadEnv({ REDIS_URL: 'redis://localhost:6379' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('throws when REDIS_URL is missing', () => {
    expect(() => loadEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('throws on an invalid NODE_ENV value', () => {
    expect(() => loadEnv({ ...VALID_ENV, NODE_ENV: 'not-a-real-env' })).toThrow();
  });

  it('coerces PORT from a string', () => {
    const env = loadEnv({ ...VALID_ENV, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('parses a comma-separated CORS_ALLOWED_ORIGINS list, trimming whitespace', () => {
    const env = loadEnv({
      ...VALID_ENV,
      CORS_ALLOWED_ORIGINS: 'http://localhost:3001, http://localhost:3002 ,',
    });
    expect(env.corsAllowedOrigins).toEqual(['http://localhost:3001', 'http://localhost:3002']);
  });

  it('sets isProduction/isTest based on NODE_ENV', () => {
    expect(loadEnv({ ...VALID_ENV, NODE_ENV: 'production' }).isProduction).toBe(true);
    expect(loadEnv({ ...VALID_ENV, NODE_ENV: 'test' }).isTest).toBe(true);
  });

  it('never logs the actual DATABASE_URL/REDIS_URL values on failure', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => loadEnv({ DATABASE_URL: 'not-a-valid-url', REDIS_URL: '' })).toThrow();
      const loggedText = consoleSpy.mock.calls.flat().map(String).join('\n');
      expect(loggedText).not.toMatch(/not-a-valid-url/);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
