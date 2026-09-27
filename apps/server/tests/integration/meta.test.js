// @ts-check
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildTestApp } from '../helpers/testApp.js';
import { resetDb } from '../helpers/db.js';
import { createDepartment, createInterest, createUniversity } from '../helpers/factories.js';

const app = buildTestApp();

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

describe('GET /api/v1/meta/interests', () => {
  it('returns active interests in the shared success envelope', async () => {
    await createInterest({ slug: 'ai-ml', name: 'AI/ML', category: 'Technology' });
    await createInterest({ slug: 'gaming', name: 'Gaming', category: 'Entertainment' });
    await createInterest({ slug: 'retired', name: 'Retired', isActive: false });

    const res = await request(app).get('/api/v1/meta/interests');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        { id: expect.any(String), slug: 'ai-ml', name: 'AI/ML', category: 'Technology' },
        { id: expect.any(String), slug: 'gaming', name: 'Gaming', category: 'Entertainment' },
      ]),
    );
    // The inactive interest must never appear.
    expect(res.body.data.find((/** @type {any} */ i) => i.slug === 'retired')).toBeUndefined();
  });

  it('returns an empty array (not an error) when there are no interests', async () => {
    const res = await request(app).get('/api/v1/meta/interests');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/v1/meta/departments', () => {
  it("returns the default university's departments ordered by sortOrder, with only public fields", async () => {
    const university = await createUniversity({ slug: 'uet', status: 'PILOT' });
    await createDepartment(university.id, { name: 'Physics', sortOrder: 1 });
    await createDepartment(university.id, { name: 'Computer Science', sortOrder: 0 });

    const res = await request(app).get('/api/v1/meta/departments');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((/** @type {any} */ d) => d.name)).toEqual([
      'Computer Science',
      'Physics',
    ]);
    // Only {id, name} — never university_id or any internal field.
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['id', 'name']);
  });

  it('scopes departments by an explicit universitySlug', async () => {
    const uniA = await createUniversity({ slug: 'uni-a' });
    const uniB = await createUniversity({ slug: 'uni-b' });
    await createDepartment(uniA.id, { name: 'From A' });
    await createDepartment(uniB.id, { name: 'From B' });

    const res = await request(app).get('/api/v1/meta/departments?universitySlug=uni-b');

    expect(res.status).toBe(200);
    expect(res.body.data.map((/** @type {any} */ d) => d.name)).toEqual(['From B']);
  });

  it('returns an empty array for an unknown universitySlug (no enumeration error)', async () => {
    const res = await request(app).get('/api/v1/meta/departments?universitySlug=does-not-exist');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('rejects an unexpected query param with the shared validation error envelope', async () => {
    const res = await request(app).get('/api/v1/meta/departments?unexpectedParam=x');

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toEqual(expect.any(String));
  });
});
