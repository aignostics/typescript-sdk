import { ItemResultReadResponse } from '../../generated/index.js';
import { ItemStatus } from './types.js';

/**
 * Determine whether a single run item's output artifact is available for download.
 * Only items in the COMPLETED state have downloadable artifacts.
 *
 * @param item - Raw item response from the API
 * @returns `true` if the item is in a COMPLETED state
 */
export const canDownloadItem = (item: ItemResultReadResponse): boolean => {
  return getItemStatus(item) === 'COMPLETED';
};

/** Termination reasons that mark a terminated item as FAILED. */
const ERROR_TERMINATION_REASONS = new Set([
  'CANCELED_BY_SYSTEM',
  'CANCELED_BY_USER',
  'SYSTEM_ERROR',
  'USER_ERROR',
]);

/**
 * Derive a human-readable {@link ItemStatus} from the raw API `state` and `termination_reason`.
 *
 * Mapping rules:
 * - PENDING / PROCESSING → passed through as-is
 * - TERMINATED + no termination_reason → UNKNOWN
 * - TERMINATED + an error reason (SYSTEM_ERROR, USER_ERROR, CANCELED_BY_SYSTEM, CANCELED_BY_USER) → FAILED
 * - TERMINATED + SKIPPED → SKIPPED
 * - TERMINATED + SUCCEEDED → COMPLETED
 * - TERMINATED + any unrecognized reason → UNKNOWN
 *
 * @param item - Raw item response from the API
 */
export function getItemStatus(item: ItemResultReadResponse): ItemStatus {
  const { state, termination_reason } = item;
  switch (state) {
    case 'PENDING':
      return 'PENDING';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'TERMINATED':
      if (!termination_reason) {
        // tip: report to the sentry in the consumer
        return 'UNKNOWN';
      }
      if (ERROR_TERMINATION_REASONS.has(termination_reason)) {
        return 'FAILED';
      }

      if (termination_reason === 'SKIPPED') {
        return 'SKIPPED';
      }

      if (termination_reason === 'SUCCEEDED') {
        return 'COMPLETED';
      }

      // tip: report to the sentry in the consumer
      return 'UNKNOWN';
  }
}
