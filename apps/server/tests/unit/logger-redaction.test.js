// @ts-check
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../../src/lib/logger.js';

/**
 * Collects everything written to it as an array of raw JSON-line strings,
 * so a test can assert on the exact bytes pino wrote — not a reconstructed
 * object, which could hide a leak if a field were merely omitted rather
 * than redacted.
 */
function createCapturingStream() {
  /** @type {string[]} */
  const lines = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  return { stream, lines };
}

describe('logger redaction', () => {
  it('redacts email/otp/token/password fields, however they are nested', async () => {
    const { stream, lines } = createCapturingStream();
    const logger = createLogger({ destination: stream });

    logger.info({
      email: 'student@uet.edu.pk',
      otp: '654321',
      token: 'access-token-value',
      accessToken: 'access-token-value-2',
      refreshToken: 'refresh-token-value',
      password: 'hunter2',
      passwordHash: '$argon2id$hash',
      data: { email: 'nested@uet.edu.pk', token: 'nested-token' },
      requestId: 'req-123', // not sensitive — should survive
    });

    await flush(logger);
    const output = lines.join('\n');

    expect(output).not.toMatch(/student@uet\.edu\.pk/);
    expect(output).not.toMatch(/654321/);
    expect(output).not.toMatch(/access-token-value/);
    expect(output).not.toMatch(/refresh-token-value/);
    expect(output).not.toMatch(/hunter2/);
    expect(output).not.toMatch(/argon2id/);
    expect(output).not.toMatch(/nested@uet\.edu\.pk/);
    expect(output).not.toMatch(/nested-token/);

    // Redaction should censor, not silently drop the request id.
    expect(output).toMatch(/req-123/);
    expect(output).toMatch(/\[REDACTED\]/);
  });

  it('does NOT redact err.code (Node system error codes, e.g. ECONNREFUSED) — regression test', async () => {
    // Found via manual Docker testing in Phase 1: a bare 'code' redaction
    // path silently hid ioredis's ECONNREFUSED/ETIMEDOUT error codes,
    // actively hurting debuggability without protecting anything
    // sensitive. See the comment above SENSITIVE_FIELD_NAMES in
    // src/lib/logger.js.
    const { stream, lines } = createCapturingStream();
    const logger = createLogger({ destination: stream });

    const err = /** @type {any} */ (new Error('connect ECONNREFUSED 127.0.0.1:6379'));
    err.code = 'ECONNREFUSED';
    err.errno = -111;
    err.syscall = 'connect';
    logger.error({ err }, 'Redis client error');

    await flush(logger);
    const output = lines.join('\n');

    expect(output).toMatch(/ECONNREFUSED/);
  });

  it('redacts the Authorization header and cookies on a request-shaped log', async () => {
    const { stream, lines } = createCapturingStream();
    const logger = createLogger({ destination: stream });

    logger.info({
      req: {
        headers: {
          authorization: 'Bearer super-secret-jwt',
          cookie: 'session=super-secret-cookie',
        },
      },
    });

    await flush(logger);
    const output = lines.join('\n');

    expect(output).not.toMatch(/super-secret-jwt/);
    expect(output).not.toMatch(/super-secret-cookie/);
  });

  it('does not redact ordinary, non-sensitive fields', async () => {
    const { stream, lines } = createCapturingStream();
    const logger = createLogger({ destination: stream });

    logger.info({ route: '/api/v1/meta/interests', statusCode: 200, latencyMs: 12 });

    await flush(logger);
    const output = lines.join('\n');

    expect(output).toMatch(/\/api\/v1\/meta\/interests/);
    expect(output).toMatch(/200/);
  });
});

/**
 * pino writes asynchronously; give the event loop a tick so the write
 * lands before we assert on captured output.
 * @param {import('pino').Logger} logger
 */
function flush(logger) {
  return new Promise((resolve) => {
    /** @type {any} */ (logger).flush?.(resolve) ?? setImmediate(resolve);
  });
}
