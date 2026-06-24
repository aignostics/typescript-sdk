import { RunReadResponse } from '../../generated/index.js';
import { RunStatus } from './types.js';

/**
 * Compute the overall progress of a run as a percentage (0–100).
 * Progress is based on the ratio of terminal items (succeeded + errored + skipped)
 * to the total item count.
 *
 * @param run - Raw run response from the API
 * @returns Integer percentage rounded to the nearest whole number
 */
export function getRunProgress(run: RunReadResponse): number {
  const {
    item_count,
    item_succeeded_count,
    item_user_error_count,
    item_system_error_count,
    item_skipped_count,
  } = run.statistics;

  // No items means no progress
  if (item_count === 0) return 0;

  // Sum all items that have reached a terminal state
  const processed =
    item_succeeded_count + item_user_error_count + item_system_error_count + item_skipped_count;
  return Math.round((processed / item_count) * 100);
}

/**
 * Derive a human-readable {@link RunStatus} from the raw API `state`,
 * `termination_reason`, and `output`.
 *
 * Mapping rules:
 * - PENDING / PROCESSING → passed through as-is
 * - TERMINATED + CANCELED_BY_USER → CANCELED
 * - TERMINATED + CANCELED_BY_SYSTEM or ALL_ITEMS_PROCESSED → derived from `output`:
 *     - NONE → FAILED (no items succeeded)
 *     - PARTIAL → COMPLETED_WITH_ERRORS (some items succeeded)
 *     - FULL → COMPLETED (all items succeeded)
 *     - otherwise → UNKNOWN
 * - any other termination reason, or non-terminal state, → UNKNOWN
 *
 * @param run - Raw run response from the API
 */
export function getRunStatus(run: RunReadResponse): RunStatus {
  const { state, termination_reason, output } = run;
  switch (state) {
    case 'PENDING':
      return 'PENDING';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'TERMINATED':
      switch (termination_reason) {
        case 'CANCELED_BY_USER':
          return 'CANCELED';
        case 'CANCELED_BY_SYSTEM':
        case 'ALL_ITEMS_PROCESSED':
          switch (output) {
            case 'NONE':
              return 'FAILED';
            case 'PARTIAL':
              return 'COMPLETED_WITH_ERRORS';
            case 'FULL':
              return 'COMPLETED';
            default:
              return 'UNKNOWN';
          }
        default:
          return 'UNKNOWN';
      }
    default:
      return 'UNKNOWN';
  }
}

/**
 * Determine whether a run's result items are available for download.
 * Items can only be downloaded once the run has reached a completed state.
 *
 * @param run - Raw run response from the API
 * @returns `true` if items are available for download (run is COMPLETED or COMPLETED_WITH_ERRORS)
 */
export const canDownloadRunItems = (run: RunReadResponse): boolean => {
  const status = getRunStatus(run);
  return !['FAILED', 'CANCELED', 'PENDING', 'PROCESSING'].includes(status);
};
