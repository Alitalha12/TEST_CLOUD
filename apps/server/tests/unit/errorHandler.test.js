// @ts-check
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppError } from '@campus/shared';
import { errorHandler } from '../../src/middleware/errorHandler.js';

/**
 * Isolated unit test: a minimal Express app with only the middleware
 * under test, so this doesn't need a real DB/Redis connection.
 * @param {{ isProduction: boolean }} envOverrides
 */
function buildIsolatedApp(envOverrides) {
  const app = express();
  app.get('/known-error', () => {
    throw new AppError('CONTENT_REJECTED', 'nope', { field: 'body' });
  });
  app.get('/unknown-error', () => {
    throw new Error('something exploded');
  });
  app.use(errorHandler(/** @type {any} */ ({ isProduction: envOverrides.isProduction })));
  return app;
}

describe('errorHandler', () => {
  it('maps a known AppError to its declared code and status', async () => {
    const app = buildIsolatedApp({ isProduction: true });
    const res = await request(app).get('/known-error');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'CONTENT_REJECTED', message: 'nope', details: { field: 'body' } },
    });
  });

  it('maps an unknown error to a generic INTERNAL 500 with no stack trace, in production', async () => {
    const app = buildIsolatedApp({ isProduction: true });
    const res = await request(app).get('/unknown-error');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNAL');
    expect(JSON.stringify(res.body)).not.toMatch(/something exploded/);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js:\d+/); // no stack frames
  });

  it('attaches a dev-only message (never a stack) for an unknown error outside production', async () => {
    const app = buildIsolatedApp({ isProduction: false });
    const res = await request(app).get('/unknown-error');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL');
    expect(res.body.error.details.devMessage).toBe('something exploded');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js:\d+/);
  });
});
