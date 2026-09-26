// @ts-check
import { describe, expect, it } from '@jest/globals';
import { ApiError, createApiClient } from './client.js';

/**
 * Builds a client whose axios instance never hits the network: the custom
 * `adapter` resolves/rejects synchronously with a canned envelope, per
 * docs/architecture.md §6.3 "lib/api/client.js ... error normalization".
 * @param {(config: import('axios').InternalAxiosRequestConfig) => Promise<import('axios').AxiosResponse>} adapter
 */
function clientWithAdapter(adapter) {
  return createApiClient({ baseURL: 'http://test.local', adapter });
}

describe('createApiClient', () => {
  it('unwraps a success envelope to just the data', async () => {
    const client = clientWithAdapter(async (config) => ({
      data: { success: true, data: { hello: 'world' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    await expect(client.get('/anything')).resolves.toEqual({ hello: 'world' });
  });

  it('throws an ApiError built from the error envelope on a 4xx/5xx response', async () => {
    const client = clientWithAdapter(async (config) => {
      const error = /** @type {any} */ (new Error('Request failed with status code 422'));
      error.response = {
        status: 422,
        data: {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Bad input', requestId: 'req-1' },
        },
        config,
      };
      error.config = config;
      throw error;
    });

    await expect(client.get('/anything')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      message: 'Bad input',
      status: 422,
      requestId: 'req-1',
    });
  });

  it('normalizes a network failure (no response) to a NETWORK_ERROR ApiError', async () => {
    const client = clientWithAdapter(async () => {
      throw new Error('Network Error');
    });

    await expect(client.get('/anything')).rejects.toBeInstanceOf(ApiError);
    await expect(client.get('/anything')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('normalizes a malformed success response with no data.success flag', async () => {
    const client = clientWithAdapter(async (config) => ({
      data: { unexpected: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));

    await expect(client.get('/anything')).rejects.toMatchObject({ code: 'INTERNAL' });
  });

  it('retries once via the token provider on a 401 TOKEN_EXPIRED, then succeeds', async () => {
    let callCount = 0;
    const client = createApiClient({
      baseURL: 'http://test.local',
      tokenProvider: {
        getAccessToken: () => 'stale-token',
        refreshAccessToken: async () => {},
        onRefreshFailure: () => {},
      },
      adapter: async (config) => {
        callCount += 1;
        if (callCount === 1) {
          const error = /** @type {any} */ (new Error('Unauthorized'));
          error.response = {
            status: 401,
            data: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } },
            config,
          };
          error.config = config;
          throw error;
        }
        return {
          data: { success: true, data: 'ok' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      },
    });

    await expect(client.get('/anything')).resolves.toBe('ok');
    expect(callCount).toBe(2);
  });

  it('surfaces the normalized error when the refresh itself fails', async () => {
    const client = createApiClient({
      baseURL: 'http://test.local',
      tokenProvider: {
        getAccessToken: () => 'stale-token',
        refreshAccessToken: async () => {
          throw new Error('refresh failed');
        },
        onRefreshFailure: () => {},
      },
      adapter: async (config) => {
        const error = /** @type {any} */ (new Error('Unauthorized'));
        error.response = {
          status: 401,
          data: { success: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } },
          config,
        };
        error.config = config;
        throw error;
      },
    });

    await expect(client.get('/anything')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
  });
});
