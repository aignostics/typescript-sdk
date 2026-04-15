import { AxiosResponse, isAxiosError } from 'axios';
import pRetry from 'p-retry';

/**
 * Executes an HTTP request with automatic retries for transient failures.
 *
 * Retries are aborted immediately for responses with status codes listed in
 * `abortStatuses`, preserving the original AxiosError so that upstream error
 * handling (e.g. `handleRequestError`) can inspect it directly.
 *
 * @param callbackFn - A function that returns a promise resolving to an AxiosResponse
 * @param abortStatuses - HTTP status codes that should not be retried (default: `[404]`)
 * @returns The successful AxiosResponse
 */
export const downloadWithRetry = async (
  callbackFn: () => Promise<AxiosResponse>,
  abortStatuses: number[] = [404]
) => {
  return await pRetry(callbackFn, {
    retries: 3,
    shouldRetry: ({ error }) => {
      if (isAxiosError(error) && abortStatuses.includes(error.response?.status ?? 0)) {
        return false;
      }
      return true;
    },
  });
};
