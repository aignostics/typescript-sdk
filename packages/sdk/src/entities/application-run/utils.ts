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
 * Derive a human-readable {@link RunStatus} from the raw API `state` and `termination_reason`.
 *
 * Mapping rules:
 * - PENDING / PROCESSING → passed through as-is
 * - TERMINATED + CANCELED_BY_USER → CANCELED
 * - TERMINATED + CANCELED_BY_SYSTEM → FAILED
 * - TERMINATED + not all items succeeded → COMPLETED_WITH_ERRORS
 * - TERMINATED + all items succeeded → COMPLETED
 *
 * @param run - Raw run response from the API
 */
export function getRunStatus(run: RunReadResponse): RunStatus {
  const { state, statistics, termination_reason } = run;
  switch (state) {
    case 'PENDING':
      return 'PENDING';
    case 'PROCESSING':
      return 'PROCESSING';
    case 'TERMINATED':
      if (termination_reason === 'CANCELED_BY_USER') {
        return 'CANCELED';
      }
      if (termination_reason === 'CANCELED_BY_SYSTEM') {
        return 'FAILED';
      }
      // If any items did not succeed, the run completed with errors
      if (statistics.item_count !== statistics.item_succeeded_count) {
        return 'COMPLETED_WITH_ERRORS';
      }
      return 'COMPLETED';
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
