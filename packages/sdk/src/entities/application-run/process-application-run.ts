import { ApplicationRun } from './types.js';
import { RunReadResponse } from '../../generated/index.js';
import { getRunProgress, getRunStatus, canDownloadRunItems } from './utils.js';

/**
 * Transform a raw {@link RunReadResponse} from the API into an enriched
 * {@link ApplicationRun} by computing derived properties (progress, status, can_download).
 *
 * This is the single entry-point used by `PlatformSDKHttp` methods to map API
 * responses before returning them to consumers.
 *
 * @param run - Raw run response from the API
 * @returns Enriched run entity with computed properties spread onto the original response
 */
export const processApplicationRun = (run: RunReadResponse): ApplicationRun => {
  return {
    ...run,
    progress: getRunProgress(run),
    status: getRunStatus(run),
    can_download: canDownloadRunItems(run),
  };
};
