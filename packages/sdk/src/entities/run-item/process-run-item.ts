import { ItemResultReadResponse } from '../../generated/index.js';
import { ApplicationRunItem } from './types.js';
import { canDownloadItem, getItemStatus } from './utils.js';

/**
 * Transform a raw {@link ItemResultReadResponse} from the API into an enriched
 * {@link ApplicationRunItem} by computing derived properties (status, can_download).
 *
 * This is the single entry-point used by `PlatformSDKHttp.listRunResults()` to
 * map API responses before returning them to consumers.
 *
 * @param item - Raw item response from the API
 * @returns Enriched item entity with computed properties spread onto the original response
 */
export const processRunItem = (item: ItemResultReadResponse): ApplicationRunItem => {
  return {
    ...item,
    status: getItemStatus(item),
    can_download: canDownloadItem(item),
  };
};
