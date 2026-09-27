import { describe, expect, it } from 'vitest';
import {
  MyProfileResponseSchema,
  ProfileCreateBodySchema,
  ProfileInterestsBodySchema,
  ProfileOptionsResponseSchema,
  ProfileRenameBodySchema,
  ProfileUpdateBodySchema,
  PublicProfileResponseSchema,
  SettingsResponseSchema,
  SettingsUpdateBodySchema,
} from '../../src/schemas/profile.js';

describe('ProfileOptionsResponseSchema', () => {
  it('accepts exactly 3 options', () => {
    const result = ProfileOptionsResponseSchema.safeParse({
      options: [
        { name: 'Anonymous Fox #2841', avatarColor: 'CORAL' },
        { name: 'Anonymous Owl #7710', avatarColor: 'TEAL' },
        { name: 'Anonymous Wolf #1203', avatarColor: 'SLATE' },
      ],
      expiresAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a batch that is not exactly 3', () => {
    const result = ProfileOptionsResponseSchema.safeParse({
      options: [{ name: 'Anonymous Fox #2841', avatarColor: 'CORAL' }],
      expiresAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an avatarColor outside the enum', () => {
    const result = ProfileOptionsResponseSchema.safeParse({
      options: [
        { name: 'Anonymous Fox #2841', avatarColor: 'PURPLE' },
        { name: 'Anonymous Owl #7710', avatarColor: 'TEAL' },
        { name: 'Anonymous Wolf #1203', avatarColor: 'SLATE' },
      ],
      expiresAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe('ProfileCreateBodySchema', () => {
  const base = {
    selectedName: 'Anonymous Fox #2841',
    avatarColor: 'CORAL',
    acceptedGuidelines: true,
  };

  it('accepts the minimal valid body', () => {
    expect(ProfileCreateBodySchema.safeParse(base).success).toBe(true);
  });

  it('accepts optional department/semester/interests', () => {
    const result = ProfileCreateBodySchema.safeParse({
      ...base,
      departmentId: 'dept-1',
      semester: 3,
      interestIds: ['int-1', 'int-2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects acceptedGuidelines: false', () => {
    expect(ProfileCreateBodySchema.safeParse({ ...base, acceptedGuidelines: false }).success).toBe(
      false,
    );
  });

  it('rejects a semester outside 1-12', () => {
    expect(ProfileCreateBodySchema.safeParse({ ...base, semester: 13 }).success).toBe(false);
    expect(ProfileCreateBodySchema.safeParse({ ...base, semester: 0 }).success).toBe(false);
  });

  it('rejects more interests than the max', () => {
    const interestIds = Array.from({ length: 9 }, (_, i) => `int-${i}`);
    expect(ProfileCreateBodySchema.safeParse({ ...base, interestIds }).success).toBe(false);
  });

  it('rejects an unexpected extra key (mass-assignment)', () => {
    expect(ProfileCreateBodySchema.safeParse({ ...base, userId: 'not-yours' }).success).toBe(false);
  });
});

describe('ProfileUpdateBodySchema', () => {
  it('accepts a single field', () => {
    expect(ProfileUpdateBodySchema.safeParse({ showDepartment: false }).success).toBe(true);
  });

  it('rejects an empty body', () => {
    expect(ProfileUpdateBodySchema.safeParse({}).success).toBe(false);
  });

  it('accepts nulling department/semester', () => {
    const result = ProfileUpdateBodySchema.safeParse({ departmentId: null, semester: null });
    expect(result.success).toBe(true);
  });

  it('rejects a dmPolicy outside the enum', () => {
    expect(ProfileUpdateBodySchema.safeParse({ dmPolicy: 'MATCHES_ONLY' }).success).toBe(false);
  });
});

describe('ProfileRenameBodySchema', () => {
  it('accepts a selected name and color', () => {
    expect(
      ProfileRenameBodySchema.safeParse({ selectedName: 'Anonymous Owl #1', avatarColor: 'TEAL' })
        .success,
    ).toBe(true);
  });

  it('requires avatarColor', () => {
    expect(ProfileRenameBodySchema.safeParse({ selectedName: 'Anonymous Owl #1' }).success).toBe(
      false,
    );
  });
});

describe('ProfileInterestsBodySchema', () => {
  it('accepts an empty array (clearing interests)', () => {
    expect(ProfileInterestsBodySchema.safeParse({ interestIds: [] }).success).toBe(true);
  });

  it('rejects too many interests', () => {
    const interestIds = Array.from({ length: 9 }, (_, i) => `int-${i}`);
    expect(ProfileInterestsBodySchema.safeParse({ interestIds }).success).toBe(false);
  });
});

describe('PublicProfileResponseSchema', () => {
  it('accepts the minimal public shape (all optional fields hidden)', () => {
    const result = PublicProfileResponseSchema.safeParse({
      publicId: 'p_abc123def456',
      displayName: 'Anonymous Fox #2841',
      avatarColor: 'CORAL',
      dmPolicy: 'EVERYONE',
    });
    expect(result.success).toBe(true);
  });

  it('never accepts a userId-shaped key by schema shape (no such field exists)', () => {
    const parsed = PublicProfileResponseSchema.parse({
      publicId: 'p_abc123def456',
      displayName: 'Anonymous Fox #2841',
      avatarColor: 'CORAL',
      dmPolicy: 'EVERYONE',
      userId: 'should-be-stripped',
    });
    expect(parsed).not.toHaveProperty('userId');
  });
});

describe('MyProfileResponseSchema', () => {
  it('accepts the full self-profile shape', () => {
    const result = MyProfileResponseSchema.safeParse({
      publicId: 'p_abc123def456',
      displayName: 'Anonymous Fox #2841',
      avatarColor: 'CORAL',
      department: { id: 'dept-1', name: 'Computer Science' },
      semester: 3,
      showDepartment: true,
      showSemester: true,
      showInterests: true,
      dmPolicy: 'EVERYONE',
      interests: [{ slug: 'ai-ml', name: 'AI/ML', category: 'Technology' }],
      canRenameAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });
});

describe('SettingsUpdateBodySchema', () => {
  it('rejects an empty body', () => {
    expect(SettingsUpdateBodySchema.safeParse({}).success).toBe(false);
  });

  it('accepts pushPreview alone', () => {
    expect(SettingsUpdateBodySchema.safeParse({ pushPreview: 'NONE' }).success).toBe(true);
  });
});

describe('SettingsResponseSchema', () => {
  it('accepts the settings shape', () => {
    const result = SettingsResponseSchema.safeParse({
      notificationPrefs: {},
      pushPreview: 'SENDER_ONLY',
      theme: null,
    });
    expect(result.success).toBe(true);
  });
});
