// @ts-check
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/testApp.js';

describe('GET /health', () => {
  it('returns 200 with a success envelope, independent of DB/Redis', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });
});

describe('GET /ready', () => {
  it('returns 200 when the database and Redis are both reachable', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/ready');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ status: 'ok', database: true, redis: true });
  });
});
