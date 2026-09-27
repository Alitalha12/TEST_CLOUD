// @ts-check
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/testApp.js';
import { resetDb } from '../helpers/db.js';
import { resetRedis } from '../helpers/redis.js';
import { createAnonymousProfile, createUniversity, createUser } from '../helpers/factories.js';
import { getEnv } from '../../src/config/env.js';
import { signAccessToken } from '../../src/lib/jwt.js';
import { assertNoLeaks } from '../helpers/leakTest.js';

/**
 * A growing leak-test suite (§11.5 lock 4, docs/conventions.md "Every new
 * DTO gets covered by the 'leak test' harness"). Each phase that lets one
 * user fetch data connected to another appends its own `describe` block
 * below, reusing `assertNoLeaks` from tests/helpers/leakTest.js.
 */

const APP_VERSION_HEADERS = { 'X-App-Version': '1.0.0' };
const app = buildTestApp();

/**
 * @param {{ id: string }} user
 * @param {string} universityId
 */
function tokenFor(user, universityId) {
  const env = getEnv();
  return signAccessToken({
    secret: env.JWT_ACCESS_SECRET,
    kid: env.JWT_KID,
    userId: user.id,
    sessionId: 'fake-session',
    universityId,
  });
}

beforeEach(async () => {
  await resetDb();
  await resetRedis();
});

describe('Phase 4: GET /api/v1/profiles/:publicId', () => {
  it("never leaks user A's email, email hash or internal userId to user B", async () => {
    const university = await createUniversity({ status: 'ACTIVE' });
    const userA = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profileA = await createAnonymousProfile({
      userId: userA.id,
      universityId: university.id,
    });
    const userB = await createUser({ universityId: university.id, onboardedAt: new Date() });

    const res = await request(app)
      .get(`/api/v1/profiles/${profileA.publicId}`)
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${tokenFor(userB, university.id)}`);

    expect(res.status).toBe(200);
    assertNoLeaks(
      res.body,
      { userId: userA.id, emailHash: userA.emailHash },
      'GET /api/v1/profiles/:publicId',
    );
  });

  it('never leaks a hidden department/semester/interests even as null (absent, not null)', async () => {
    const university = await createUniversity({ status: 'ACTIVE' });
    const userA = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profileA = await createAnonymousProfile({
      userId: userA.id,
      universityId: university.id,
      showDepartment: false,
      showSemester: false,
      showInterests: false,
    });
    const userB = await createUser({ universityId: university.id, onboardedAt: new Date() });

    const res = await request(app)
      .get(`/api/v1/profiles/${profileA.publicId}`)
      .set(APP_VERSION_HEADERS)
      .set('Authorization', `Bearer ${tokenFor(userB, university.id)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('department');
    expect(res.body.data).not.toHaveProperty('semester');
    expect(res.body.data).not.toHaveProperty('interests');
  });
});
