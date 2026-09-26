// @ts-check
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/testApp.js';

/**
 * docs/architecture.md §28 P1 tests: "CORS rejects a disallowed origin;
 * body over 100KB rejected."
 */

describe('CORS allow-list', () => {
  it('does not grant CORS access to a browser origin outside the allow-list', async () => {
    const app = buildTestApp({ env: { corsAllowedOrigins: ['http://localhost:3001'] } });

    const res = await request(app).get('/health').set('Origin', 'http://evil.example');

    // The browser enforces CORS by the presence/absence of this header —
    // it must not be set to (or reflect) the disallowed origin.
    expect(res.headers['access-control-allow-origin']).not.toBe('http://evil.example');
  });

  it('grants CORS access to an origin on the allow-list', async () => {
    const app = buildTestApp({ env: { corsAllowedOrigins: ['http://localhost:3001'] } });

    const res = await request(app).get('/health').set('Origin', 'http://localhost:3001');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
  });

  it('never reflects "*" — the allow-list is real even when configured empty', async () => {
    const app = buildTestApp({ env: { corsAllowedOrigins: [] } });

    const res = await request(app).get('/health').set('Origin', 'http://anything.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests with no Origin header regardless of the allow-list (native/server-to-server)', async () => {
    const app = buildTestApp({ env: { corsAllowedOrigins: [] } });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
  });
});

describe('request body size limit', () => {
  it('rejects a JSON body over 100KB with PAYLOAD_TOO_LARGE', async () => {
    const app = buildTestApp();
    const oversizedBody = { padding: 'x'.repeat(150 * 1024) };

    const res = await request(app).get('/api/v1/meta/departments').send(oversizedBody);

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE' },
    });
  });

  it('accepts a small JSON body without issue', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/v1/meta/departments').send({ tiny: true });

    // The route doesn't read a body, but the body-parser layer must not
    // reject anything reasonably small.
    expect(res.status).not.toBe(413);
  });
});
