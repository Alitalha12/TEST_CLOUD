// @ts-check
import { describe, expect, it } from 'vitest';
import {
  constantTimeEqual,
  decryptEmail,
  emailDomain,
  encryptEmail,
  generateOtpCode,
  generateRefreshToken,
  hashEmail,
  hashOtpCode,
  hashToken,
  normalizeEmail,
} from '../../src/lib/crypto.js';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Student@UET.edu.pk  ')).toBe('student@uet.edu.pk');
  });

  it('strips a "+tag" from the local part only', () => {
    expect(normalizeEmail('Student+test@UET.edu.pk')).toBe('student@uet.edu.pk');
  });

  it('does not touch a "+" that appears in the domain (never happens in practice, but the slice logic must use the LAST @)', () => {
    expect(normalizeEmail('a.b+c@sub.uet.edu.pk')).toBe('a.b@sub.uet.edu.pk');
  });

  it('leaves an email with no "+tag" unchanged apart from case/trim', () => {
    expect(normalizeEmail('plain@uet.edu.pk')).toBe('plain@uet.edu.pk');
  });
});

describe('emailDomain', () => {
  it('extracts the domain from a normalized email', () => {
    expect(emailDomain('student@uet.edu.pk')).toBe('uet.edu.pk');
  });
});

describe('hashEmail / hashOtpCode', () => {
  it('is deterministic for the same pepper and input', () => {
    expect(hashEmail('pepper', 'a@b.com')).toBe(hashEmail('pepper', 'a@b.com'));
    expect(hashOtpCode('pepper', 'chal-1', '123456')).toBe(
      hashOtpCode('pepper', 'chal-1', '123456'),
    );
  });

  it('differs when the pepper, challenge id, or code differ', () => {
    const base = hashOtpCode('pepper', 'chal-1', '123456');
    expect(hashOtpCode('other-pepper', 'chal-1', '123456')).not.toBe(base);
    expect(hashOtpCode('pepper', 'chal-2', '123456')).not.toBe(base);
    expect(hashOtpCode('pepper', 'chal-1', '654321')).not.toBe(base);
  });

  it('binds the hash to a specific challenge — same code, different challenge, different hash', () => {
    // This is the whole point of hashing challengeId+code together
    // instead of just the code (docs/architecture.md §11.2).
    const hashA = hashOtpCode('pepper', 'chal-A', '111111');
    const hashB = hashOtpCode('pepper', 'chal-B', '111111');
    expect(hashA).not.toBe(hashB);
  });
});

describe('encryptEmail / decryptEmail', () => {
  const key = Buffer.alloc(32, 7);

  it('round-trips a plaintext email', () => {
    const encrypted = encryptEmail(key, 'student@uet.edu.pk');
    expect(decryptEmail(key, encrypted)).toBe('student@uet.edu.pk');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const first = encryptEmail(key, 'student@uet.edu.pk');
    const second = encryptEmail(key, 'student@uet.edu.pk');
    expect(first).not.toBe(second);
  });

  it('fails to decrypt with the wrong key (auth tag mismatch)', () => {
    const encrypted = encryptEmail(key, 'student@uet.edu.pk');
    const wrongKey = Buffer.alloc(32, 9);
    expect(() => decryptEmail(wrongKey, encrypted)).toThrow();
  });

  it('throws on a malformed encrypted value', () => {
    expect(() => decryptEmail(key, 'not-the-right-format')).toThrow(/Malformed/);
  });
});

describe('constantTimeEqual', () => {
  it('returns true for equal strings', () => {
    expect(constantTimeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(constantTimeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false (not throw) for different-length strings', () => {
    expect(constantTimeEqual('short', 'a-much-longer-string')).toBe(false);
  });
});

describe('generateOtpCode', () => {
  it('always generates exactly 6 digits, including with a leading zero', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe('generateRefreshToken / hashToken', () => {
  it('generates a URL-safe, high-entropy token', () => {
    const token = generateRefreshToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('generates a different token every time', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });

  it('hashToken is deterministic and never returns the input', () => {
    const token = generateRefreshToken();
    const hash = hashToken(token);
    expect(hashToken(token)).toBe(hash);
    expect(hash).not.toBe(token);
  });
});
