// @ts-check
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ready } from '../../src/modules/health/controller.js';
import { pingDatabase } from '../../src/lib/prisma.js';
import { pingRedis } from '../../src/lib/redis.js';

// Mocked so this test covers the 503 "a dependency is down" branch
// without needing to actually take down Postgres/Redis mid-test-run —
// docs/architecture.md §28 P1 tests: "/ready (including 503 when a
// dependency is unavailable)". vi.mock is hoisted above these imports.
vi.mock('../../src/lib/prisma.js', () => ({ pingDatabase: vi.fn() }));
vi.mock('../../src/lib/redis.js', () => ({ pingRedis: vi.fn() }));

function createMockResponse() {
  /** @type {{ statusCode: number; body: any; locals: Record<string, unknown>; status: (code: number) => any; json: (body: unknown) => any }} */
  const res = {
    statusCode: 200,
    body: undefined,
    locals: {},
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

describe('ready controller (unit, dependencies mocked)', () => {
  beforeEach(() => {
    vi.mocked(pingDatabase).mockReset();
    vi.mocked(pingRedis).mockReset();
  });

  it('returns 200 "ok" when both dependencies are up', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(true);
    vi.mocked(pingRedis).mockResolvedValue(true);
    const res = createMockResponse();

    await ready(/** @type {any} */ ({}), /** @type {any} */ (res), /** @type {any} */ (() => {}));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { status: 'ok', database: true, redis: true },
    });
  });

  it('returns 503 "degraded" when the database is down', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(false);
    vi.mocked(pingRedis).mockResolvedValue(true);
    const res = createMockResponse();

    await ready(/** @type {any} */ ({}), /** @type {any} */ (res), /** @type {any} */ (() => {}));

    expect(res.statusCode).toBe(503);
    expect(res.body.data).toEqual({ status: 'degraded', database: false, redis: true });
  });

  it('returns 503 "degraded" when Redis is down', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(true);
    vi.mocked(pingRedis).mockResolvedValue(false);
    const res = createMockResponse();

    await ready(/** @type {any} */ ({}), /** @type {any} */ (res), /** @type {any} */ (() => {}));

    expect(res.statusCode).toBe(503);
    expect(res.body.data).toEqual({ status: 'degraded', database: true, redis: false });
  });

  it('returns 503 "degraded" when both are down', async () => {
    vi.mocked(pingDatabase).mockResolvedValue(false);
    vi.mocked(pingRedis).mockResolvedValue(false);
    const res = createMockResponse();

    await ready(/** @type {any} */ ({}), /** @type {any} */ (res), /** @type {any} */ (() => {}));

    expect(res.statusCode).toBe(503);
  });
});
