// @ts-check
import { randomInt } from 'node:crypto';
import { AvatarColorToken } from '@campus/shared';
import { ANIMALS } from './animals.js';

/**
 * Pure identity-generation helpers (§11.6 "Server-side only: `animal`
 * from a curated list ... + `number` 1000-9999 -> 'Anonymous Fox #2841'").
 * Kept free of any DB/Redis call so they're trivially unit-testable —
 * the DB-uniqueness retry loop (§11.6 "unique per university, retry on
 * unique violation") lives in service.js instead, since it needs a
 * repository round-trip per attempt.
 */

const NUMBER_MIN = 1000;
const NUMBER_MAX = 9999;

/** @returns {string} */
export function randomAnimal() {
  return ANIMALS[randomInt(ANIMALS.length)];
}

/** @returns {number} an integer in [1000, 9999] */
export function randomNumber() {
  return randomInt(NUMBER_MIN, NUMBER_MAX + 1);
}

/**
 * @param {string} animal
 * @param {number} number
 */
export function composeDisplayName(animal, number) {
  return `Anonymous ${animal} #${number}`;
}

/**
 * @typedef {Object} IdentityCandidate
 * @property {string} animal
 * @property {number} number
 * @property {string} displayName
 */

/** @returns {IdentityCandidate} */
export function randomIdentityCandidate() {
  const animal = randomAnimal();
  const number = randomNumber();
  return { animal, number, displayName: composeDisplayName(animal, number) };
}

/**
 * Samples `count` distinct avatar color tokens without replacement — a
 * batch of options should look visually distinct from each other, even
 * though a repeat wouldn't be incorrect (color carries no identity
 * meaning, §8.3 `avatar_color` is purely cosmetic).
 * @param {number} count
 * @returns {string[]}
 */
export function sampleAvatarColors(count) {
  const pool = [...AvatarColorToken];
  const result = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = randomInt(pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}
