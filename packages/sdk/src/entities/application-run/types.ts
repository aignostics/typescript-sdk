import { RunReadResponse } from '../../generated/index.js';

/**
 * Enriched application run entity that extends the raw API response
 * with computed properties derived from run state and statistics.
 *
 * Returned by `PlatformSDKHttp.listApplicationRuns()` and `PlatformSDKHttp.getRun()`
 * instead of the raw `RunReadResponse`.
 */
export interface ApplicationRun extends RunReadResponse {
  /** Percentage of items processed (0–100), computed from run statistics. */
  progress: number;
  /** Human-readable status derived from `state` and `termination_reason`. */
  status: RunStatus;
  /** Whether the run's result items are available for download. */
  can_download: boolean;
}

/** Derived run status that simplifies the raw `state` + `termination_reason` combination. */
export type RunStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'CANCELED'
  | 'FAILED'
  | 'UNKNOWN';
