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

/**
 * Derive a human-readable {@link ItemStatus} from the raw API `state` and `termination_reason`.
 *
 * Mapping rules:
 * - PENDING / PROCESSING → passed through as-is
 * - TERMINATED + SYSTEM_ERROR or USER_ERROR → FAILED
 * - TERMINATED + SKIPPED → SKIPPED
 * - TERMINATED (otherwise) → COMPLETED
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
      // Items terminated due to errors are marked as FAILED
      if (termination_reason === 'SYSTEM_ERROR' || termination_reason === 'USER_ERROR') {
        return 'FAILED';
      }
      // Explicitly skipped items get their own status
      if (termination_reason === 'SKIPPED') {
        return 'SKIPPED';
      }
      return 'COMPLETED';
  }
}
