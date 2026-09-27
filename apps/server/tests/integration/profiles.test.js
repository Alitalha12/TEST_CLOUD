// @ts-check
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '@campus/database';
import { buildTestApp } from '../helpers/testApp.js';
import { resetDb } from '../helpers/db.js';
import { resetRedis } from '../helpers/redis.js';
import {
  createAnonymousProfile,
  createDepartment,
  createInterest,
  createUniversity,
  createUser,
} from '../helpers/factories.js';
import { getEnv } from '../../src/config/env.js';
import { signAccessToken } from '../../src/lib/jwt.js';
import { generateUniqueOptions } from '../../src/modules/profiles/service.js';

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

/** @param {{ id: string }} user  @param {string} universityId */
function authHeaders(user, universityId) {
  return { ...APP_VERSION_HEADERS, Authorization: `Bearer ${tokenFor(user, universityId)}` };
}

/** @type {Awaited<ReturnType<typeof createUniversity>>} */
let university;

beforeEach(async () => {
  await resetDb();
  await resetRedis();
  university = await createUniversity({ status: 'ACTIVE' });
});

/**
 * Requests 3 generated options for `user` and returns the first one.
 * @param {{ id: string }} user
 */
async function getFirstOption(user) {
  const res = await request(app)
    .get('/api/v1/me/profile/options')
    .set(authHeaders(user, university.id));
  expect(res.status).toBe(200);
  expect(res.body.data.options).toHaveLength(3);
  return res.body.data.options[0];
}

describe('GET /api/v1/me/profile/options', () => {
  it('returns 3 unique options and rejects unauthenticated callers', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .get('/api/v1/me/profile/options')
      .set(authHeaders(user, university.id));
    expect(res.status).toBe(200);
    const names = res.body.data.options.map((/** @type {{ name: string }} */ o) => o.name);
    expect(new Set(names).size).toBe(3);
    expect(res.body.data.expiresAt).toEqual(expect.any(String));

    const anon = await request(app).get('/api/v1/me/profile/options').set(APP_VERSION_HEADERS);
    expect(anon.status).toBe(401);
  });

  it('regenerating overwrites the previous batch (old options no longer redeemable)', async () => {
    const user = await createUser({ universityId: university.id });
    const first = await getFirstOption(user);
    await getFirstOption(user); // regenerate

    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: first.name,
        avatarColor: first.avatarColor,
        acceptedGuidelines: true,
      });
    // Vanishingly unlikely the regenerated batch coincidentally repeats
    // the exact same name+color pair, so this should be rejected either
    // as expired-and-replaced or simply not present in the new batch.
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PROFILE_OPTION');
  });
});

describe('generateUniqueOptions (collision retry)', () => {
  it('skips a candidate whose display_name is already taken in this university', async () => {
    const takenUser = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: takenUser.id,
      universityId: university.id,
      displayName: 'Anonymous Fox #1000',
    });

    const scripted = [
      { animal: 'Fox', number: 1000, displayName: 'Anonymous Fox #1000' }, // taken
      { animal: 'Owl', number: 2000, displayName: 'Anonymous Owl #2000' },
      { animal: 'Wolf', number: 3000, displayName: 'Anonymous Wolf #3000' },
      { animal: 'Bear', number: 4000, displayName: 'Anonymous Bear #4000' },
    ];
    let i = 0;
    const generateCandidate = () => scripted[Math.min(i++, scripted.length - 1)];

    const options = await generateUniqueOptions({
      universityId: university.id,
      count: 3,
      generateCandidate,
    });

    expect(options).toHaveLength(3);
    expect(options.map((o) => o.displayName)).not.toContain('Anonymous Fox #1000');
    expect(new Set(options.map((o) => o.displayName)).size).toBe(3);
  });

  it('throws after exhausting maxAttempts when every candidate collides', async () => {
    const takenUser = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: takenUser.id,
      universityId: university.id,
      displayName: 'Anonymous Fox #1000',
    });

    await expect(
      generateUniqueOptions({
        universityId: university.id,
        count: 3,
        maxAttempts: 2,
        generateCandidate: () => ({
          animal: 'Fox',
          number: 1000,
          displayName: 'Anonymous Fox #1000',
        }),
      }),
    ).rejects.toThrow(/Could not generate/);
  });
});

describe('POST /api/v1/me/profile', () => {
  it('creates a profile from an issued option and completes onboarding', async () => {
    const user = await createUser({ universityId: university.id });
    const option = await getFirstOption(user);

    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option.name,
        avatarColor: option.avatarColor,
        acceptedGuidelines: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.displayName).toBe(option.name);
    expect(res.body.data.avatarColor).toBe(option.avatarColor);
    expect(res.body.data.publicId).toMatch(/^p_/);
    expect(res.body.data.dmPolicy).toBe('EVERYONE');
    expect(res.body.data.showDepartment).toBe(true);
    expect(res.body.data.interests).toEqual([]);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updatedUser.onboardedAt).not.toBeNull();
  });

  it('accepts optional department/semester/interests', async () => {
    const department = await createDepartment(university.id);
    const interest = await createInterest();
    const user = await createUser({ universityId: university.id });
    const option = await getFirstOption(user);

    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option.name,
        avatarColor: option.avatarColor,
        acceptedGuidelines: true,
        departmentId: department.id,
        semester: 3,
        interestIds: [interest.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.department).toEqual({ id: department.id, name: department.name });
    expect(res.body.data.semester).toBe(3);
    expect(res.body.data.interests).toEqual([
      { slug: interest.slug, name: interest.name, category: interest.category },
    ]);
  });

  it('rejects acceptedGuidelines: false at the schema layer', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({ selectedName: 'x', avatarColor: 'CORAL', acceptedGuidelines: false });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a name that was never issued (forgery)', async () => {
    const user = await createUser({ universityId: university.id });
    await getFirstOption(user); // issues real options, but we ignore them
    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: 'Anonymous Admin #0001',
        avatarColor: 'CORAL',
        acceptedGuidelines: true,
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PROFILE_OPTION');
  });

  it('rejects profile creation when no options were ever requested', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: 'Anonymous Fox #1234',
        avatarColor: 'CORAL',
        acceptedGuidelines: true,
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROFILE_OPTIONS_EXPIRED');
  });

  it('rejects a departmentId from another university', async () => {
    const otherUniversity = await createUniversity({ status: 'ACTIVE' });
    const otherDepartment = await createDepartment(otherUniversity.id);
    const user = await createUser({ universityId: university.id });
    const option = await getFirstOption(user);

    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option.name,
        avatarColor: option.avatarColor,
        acceptedGuidelines: true,
        departmentId: otherDepartment.id,
      });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an unknown interestId', async () => {
    const user = await createUser({ universityId: university.id });
    const option = await getFirstOption(user);
    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option.name,
        avatarColor: option.avatarColor,
        acceptedGuidelines: true,
        interestIds: ['00000000-0000-7000-8000-000000000000'],
      });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a second profile creation (already onboarded)', async () => {
    const user = await createUser({ universityId: university.id });
    const option = await getFirstOption(user);
    const first = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option.name,
        avatarColor: option.avatarColor,
        acceptedGuidelines: true,
      });
    expect(first.status).toBe(201);

    const option2 = await getFirstOption(user);
    const second = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({
        selectedName: option2.name,
        avatarColor: option2.avatarColor,
        acceptedGuidelines: true,
      });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
  });

  it('rejects a suspended account with 403', async () => {
    const user = await createUser({ universityId: university.id, status: 'SUSPENDED' });
    const res = await request(app)
      .post('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({ selectedName: 'x', avatarColor: 'CORAL', acceptedGuidelines: true });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('GET /api/v1/me/profile', () => {
  it("returns the caller's own profile", async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({ userId: user.id, universityId: university.id });

    const res = await request(app).get('/api/v1/me/profile').set(authHeaders(user, university.id));
    expect(res.status).toBe(200);
    expect(res.body.data.publicId).toBe(profile.publicId);
    expect(res.body.data.canRenameAt).toEqual(expect.any(String));
  });

  it('rejects a not-yet-onboarded user with PROFILE_REQUIRED', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app).get('/api/v1/me/profile').set(authHeaders(user, university.id));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PROFILE_REQUIRED');
  });

  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).get('/api/v1/me/profile').set(APP_VERSION_HEADERS);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/me/profile', () => {
  it('updates privacy flags, dmPolicy and avatarColor', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({ userId: user.id, universityId: university.id });

    const res = await request(app)
      .patch('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({ showDepartment: false, dmPolicy: 'NOBODY', avatarColor: 'TEAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.showDepartment).toBe(false);
    expect(res.body.data.dmPolicy).toBe('NOBODY');
    expect(res.body.data.avatarColor).toBe('TEAL');
  });

  it('accepts nulling out department/semester', async () => {
    const department = await createDepartment(university.id);
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: user.id,
      universityId: university.id,
      departmentId: department.id,
      semester: 2,
    });

    const res = await request(app)
      .patch('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({ departmentId: null, semester: null });

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBeNull();
    expect(res.body.data.semester).toBeNull();
  });

  it('rejects an empty body', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({ userId: user.id, universityId: university.id });
    const res = await request(app)
      .patch('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({});
    expect(res.status).toBe(422);
  });

  it('rejects a not-yet-onboarded user with PROFILE_REQUIRED', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .patch('/api/v1/me/profile')
      .set(authHeaders(user, university.id))
      .send({ dmPolicy: 'NOBODY' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PROFILE_REQUIRED');
  });
});

describe('POST /api/v1/me/profile/rename', () => {
  it('rejects a rename before the 30-day cooldown elapses', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: user.id,
      universityId: university.id,
      nameChangedAt: new Date(), // just created
    });
    const option = await getFirstOption(user);

    const res = await request(app)
      .post('/api/v1/me/profile/rename')
      .set(authHeaders(user, university.id))
      .send({ selectedName: option.name, avatarColor: option.avatarColor });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RENAME_TOO_SOON');
    expect(res.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
    expect(res.body.error.details.nextRenameAt).toEqual(expect.any(String));
  });

  it('allows a rename once 30 days have passed, and records history', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({
      userId: user.id,
      universityId: university.id,
      displayName: 'Anonymous Fox #1111',
      nameChangedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });
    const option = await getFirstOption(user);

    const res = await request(app)
      .post('/api/v1/me/profile/rename')
      .set(authHeaders(user, university.id))
      .send({ selectedName: option.name, avatarColor: option.avatarColor });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe(option.name);

    const history = await prisma.profileNameHistory.findMany({ where: { profileId: profile.id } });
    expect(history).toHaveLength(1);
    expect(history[0].displayName).toBe('Anonymous Fox #1111');
  });

  it('rejects a forged (non-issued) rename option', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: user.id,
      universityId: university.id,
      nameChangedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });
    await getFirstOption(user); // issues a real batch, but we ignore it below

    const res = await request(app)
      .post('/api/v1/me/profile/rename')
      .set(authHeaders(user, university.id))
      .send({ selectedName: 'Anonymous Admin #0001', avatarColor: 'CORAL' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_PROFILE_OPTION');
  });

  it('rejects a rename when no options were ever requested', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({
      userId: user.id,
      universityId: university.id,
      nameChangedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/v1/me/profile/rename')
      .set(authHeaders(user, university.id))
      .send({ selectedName: 'Anonymous Admin #0001', avatarColor: 'CORAL' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROFILE_OPTIONS_EXPIRED');
  });
});

describe('PUT /api/v1/me/interests', () => {
  it('replaces the full interest set', async () => {
    const interestA = await createInterest();
    const interestB = await createInterest();
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({ userId: user.id, universityId: university.id });
    await prisma.profileInterest.create({
      data: { profileId: profile.id, interestId: interestA.id },
    });

    const res = await request(app)
      .put('/api/v1/me/interests')
      .set(authHeaders(user, university.id))
      .send({ interestIds: [interestB.id] });

    expect(res.status).toBe(200);
    expect(res.body.data.interests).toEqual([
      { slug: interestB.slug, name: interestB.name, category: interestB.category },
    ]);
  });

  it('rejects an unknown interestId', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({ userId: user.id, universityId: university.id });
    const res = await request(app)
      .put('/api/v1/me/interests')
      .set(authHeaders(user, university.id))
      .send({ interestIds: ['00000000-0000-7000-8000-000000000000'] });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects more interests than the max', async () => {
    const user = await createUser({ universityId: university.id, onboardedAt: new Date() });
    await createAnonymousProfile({ userId: user.id, universityId: university.id });
    const interestIds = Array.from({ length: 9 }, () => '00000000-0000-7000-8000-000000000000');
    const res = await request(app)
      .put('/api/v1/me/interests')
      .set(authHeaders(user, university.id))
      .send({ interestIds });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/profiles/:publicId', () => {
  it("returns another user's public profile, respecting show_* flags", async () => {
    const department = await createDepartment(university.id);
    const interest = await createInterest();
    const owner = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({
      userId: owner.id,
      universityId: university.id,
      departmentId: department.id,
      semester: 4,
    });
    await prisma.profileInterest.create({
      data: { profileId: profile.id, interestId: interest.id },
    });
    const viewer = await createUser({ universityId: university.id, onboardedAt: new Date() });

    const res = await request(app)
      .get(`/api/v1/profiles/${profile.publicId}`)
      .set(authHeaders(viewer, university.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      publicId: profile.publicId,
      displayName: profile.displayName,
      avatarColor: profile.avatarColor,
      dmPolicy: 'EVERYONE',
      department: { id: department.id, name: department.name },
      semester: 4,
      interests: [{ slug: interest.slug, name: interest.name, category: interest.category }],
    });
  });

  it('omits department/semester/interests entirely when hidden', async () => {
    const department = await createDepartment(university.id);
    const owner = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({
      userId: owner.id,
      universityId: university.id,
      departmentId: department.id,
      semester: 4,
      showDepartment: false,
      showSemester: false,
      showInterests: false,
    });
    const viewer = await createUser({ universityId: university.id, onboardedAt: new Date() });

    const res = await request(app)
      .get(`/api/v1/profiles/${profile.publicId}`)
      .set(authHeaders(viewer, university.id));

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(
      ['avatarColor', 'displayName', 'dmPolicy', 'publicId'].sort(),
    );
  });

  it('returns 404 for a profile in another university', async () => {
    const otherUniversity = await createUniversity({ status: 'ACTIVE' });
    const owner = await createUser({ universityId: otherUniversity.id, onboardedAt: new Date() });
    const profile = await createAnonymousProfile({
      userId: owner.id,
      universityId: otherUniversity.id,
    });
    const viewer = await createUser({ universityId: university.id, onboardedAt: new Date() });

    const res = await request(app)
      .get(`/api/v1/profiles/${profile.publicId}`)
      .set(authHeaders(viewer, university.id));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for an unknown publicId', async () => {
    const viewer = await createUser({ universityId: university.id, onboardedAt: new Date() });
    const res = await request(app)
      .get('/api/v1/profiles/p_doesnotexist1')
      .set(authHeaders(viewer, university.id));
    expect(res.status).toBe(404);
  });
});

describe('GET/PATCH /api/v1/me/settings', () => {
  it('reads the default settings created at signup (Phase 3)', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app).get('/api/v1/me/settings').set(authHeaders(user, university.id));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      notificationPrefs: {},
      pushPreview: 'SENDER_ONLY',
      theme: null,
    });
  });

  it('updates settings, including nulling theme', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .patch('/api/v1/me/settings')
      .set(authHeaders(user, university.id))
      .send({ pushPreview: 'NONE', theme: 'dark', notificationPrefs: { newMessage: false } });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      notificationPrefs: { newMessage: false },
      pushPreview: 'NONE',
      theme: 'dark',
    });
  });

  it('does not require onboarding to read/write settings', async () => {
    const user = await createUser({ universityId: university.id }); // no profile
    const res = await request(app)
      .patch('/api/v1/me/settings')
      .set(authHeaders(user, university.id))
      .send({ theme: 'light' });
    expect(res.status).toBe(200);
  });

  it('rejects an empty PATCH body', async () => {
    const user = await createUser({ universityId: university.id });
    const res = await request(app)
      .patch('/api/v1/me/settings')
      .set(authHeaders(user, university.id))
      .send({});
    expect(res.status).toBe(422);
  });
});
