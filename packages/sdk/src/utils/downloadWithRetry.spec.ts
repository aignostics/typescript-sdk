import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosHeaders } from 'axios';
import { downloadWithRetry } from './downloadWithRetry.js';

describe('downloadWithRetry', () => {
  it('should retry non-axios errors and succeed on second attempt', async () => {
    let callCount = 0;
    const nonAxiosError = new Error('transient non-axios error');
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw nonAxiosError;
      }
      return {
        data: new ArrayBuffer(4),
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      };
    });

    const result = await downloadWithRetry(mockFn);
    expect(result.status).toBe(200);
    expect(callCount).toBe(2);
  }, 10_000);

  it('should retry axios error with no response (network error) and succeed on second attempt', async () => {
    let callCount = 0;
    const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
    // networkError.response is undefined — triggers the `?? 0` fallback
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw networkError;
      }
      return {
        data: new ArrayBuffer(4),
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
      };
    });

    const result = await downloadWithRetry(mockFn);
    expect(result.status).toBe(200);
    expect(callCount).toBe(2);
  }, 10_000);
});
