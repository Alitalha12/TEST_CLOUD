import { describe, expect, it } from 'vitest';
import { AppError, ERROR_CODES, toErrorEnvelope } from '../src/errors.js';

describe('ERROR_CODES', () => {
  it('every code has a valid httpStatus and defaultMessage', () => {
    for (const [code, def] of Object.entries(ERROR_CODES)) {
      expect(def.httpStatus, `${code} httpStatus`).toBeGreaterThanOrEqual(400);
      expect(def.httpStatus, `${code} httpStatus`).toBeLessThan(600);
      expect(typeof def.defaultMessage, `${code} defaultMessage`).toBe('string');
      expect(def.defaultMessage.length, `${code} defaultMessage`).toBeGreaterThan(0);
    }
  });

  it('is frozen so codes cannot drift at runtime', () => {
    expect(Object.isFrozen(ERROR_CODES)).toBe(true);
  });
});

describe('AppError', () => {
  it('carries the code, http status and a default message', () => {
    const err = new AppError('NOT_FOUND');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.httpStatus).toBe(404);
    expect(err.message).toBe(ERROR_CODES.NOT_FOUND.defaultMessage);
    expect(err).toBeInstanceOf(Error);
  });

  it('accepts a custom message and details', () => {
    const err = new AppError('VALIDATION_ERROR', 'Body is missing', { field: 'body' });
    expect(err.message).toBe('Body is missing');
    expect(err.details).toEqual({ field: 'body' });
  });

  it('throws on an unknown code instead of silently succeeding', () => {
    // @ts-expect-error deliberately invalid code for the test
    expect(() => new AppError('NOT_A_REAL_CODE')).toThrow(/Unknown error code/);
  });
});

describe('toErrorEnvelope', () => {
  it('builds the standard error envelope shape', () => {
    const envelope = toErrorEnvelope('FORBIDDEN');
    expect(envelope).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: ERROR_CODES.FORBIDDEN.defaultMessage,
      },
    });
  });

  it('includes details when provided', () => {
    const envelope = toErrorEnvelope('VALIDATION_ERROR', 'Bad input', { field: 'email' });
    expect(envelope.error.details).toEqual({ field: 'email' });
  });
});
