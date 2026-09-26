// @ts-check
import { describe, expect, it } from '@jest/globals';
import { ApiError } from './client.js';
import { getErrorMessage } from './errors.js';

describe('getErrorMessage', () => {
  it('returns the mobile-specific copy for a code that overrides the shared default', () => {
    const error = new ApiError('NETWORK_ERROR', 'connect ECONNREFUSED');
    expect(getErrorMessage(error)).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('falls back to the shared ERROR_CODES default message for a known code', () => {
    const error = new ApiError('ACCOUNT_SUSPENDED', 'ignored server message');
    expect(getErrorMessage(error)).toBe('Your account is suspended.');
  });

  it('falls back to the ApiError message for an unknown code', () => {
    const error = new ApiError('SOMETHING_NEW', 'a message the client has no mapping for');
    expect(getErrorMessage(error)).toBe('a message the client has no mapping for');
  });

  it('returns a generic message for a plain Error with no message', () => {
    const error = new Error();
    expect(getErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('returns a generic message for a non-Error value', () => {
    expect(getErrorMessage('a string, not an Error')).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });
});
