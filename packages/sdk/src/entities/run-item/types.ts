import { ItemResultReadResponse } from '../../generated/index.js';

/**
 * Enriched run-item entity that extends the raw API response
 * with computed properties derived from item state and termination reason.
 *
 * Returned by `PlatformSDKHttp.listRunResults()` instead of the raw
 * `ItemResultReadResponse`.
 */
export interface ApplicationRunItem extends ItemResultReadResponse {
  /** Whether the item's output artifact is available for download. */
  can_download: boolean;
  /** Human-readable status derived from `state` and `termination_reason`. */
  status: string;
}

/** Derived item status that simplifies the raw `state` + `termination_reason` combination. */
export type ItemStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
