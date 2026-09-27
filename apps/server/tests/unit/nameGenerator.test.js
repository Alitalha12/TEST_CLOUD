// @ts-check
import { describe, expect, it } from 'vitest';
import { AvatarColorToken } from '@campus/shared';
import { ANIMALS } from '../../src/modules/profiles/animals.js';
import {
  composeDisplayName,
  randomAnimal,
  randomIdentityCandidate,
  randomNumber,
  sampleAvatarColors,
} from '../../src/modules/profiles/nameGenerator.js';

describe('randomAnimal', () => {
  it('always returns one of the curated animals', () => {
    for (let i = 0; i < 100; i += 1) {
      expect(ANIMALS).toContain(randomAnimal());
    }
  });
});

describe('randomNumber', () => {
  it('always returns an integer in [1000, 9999]', () => {
    for (let i = 0; i < 200; i += 1) {
      const n = randomNumber();
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });
});

describe('composeDisplayName', () => {
  it('formats "Anonymous {Animal} #{Number}"', () => {
    expect(composeDisplayName('Fox', 2841)).toBe('Anonymous Fox #2841');
  });
});

describe('randomIdentityCandidate', () => {
  it('returns an animal/number/displayName that agree with each other', () => {
    const candidate = randomIdentityCandidate();
    expect(candidate.displayName).toBe(composeDisplayName(candidate.animal, candidate.number));
    expect(ANIMALS).toContain(candidate.animal);
  });
});

describe('sampleAvatarColors', () => {
  it('returns the requested count with no duplicates', () => {
    const colors = sampleAvatarColors(3);
    expect(colors).toHaveLength(3);
    expect(new Set(colors).size).toBe(3);
    for (const color of colors) {
      expect(AvatarColorToken).toContain(color);
    }
  });

  it('never returns more than the full palette size', () => {
    const colors = sampleAvatarColors(AvatarColorToken.length + 5);
    expect(colors).toHaveLength(AvatarColorToken.length);
  });
});
