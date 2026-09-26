// @ts-check
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/testApp.js';

describe('unmatched routes', () => {
  it('returns 404 in the shared error envelope, not an HTML error page', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/v1/this-route-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });

  it('includes X-Request-Id on every response, matching the error envelope', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/nope');

    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
  });
});
