import { PlatformSDKHttp } from './platform-sdk.js';

// Export generated API types and client when available
export * from './generated/index.js';

// Export error classes
export { BaseError, AuthenticationError, APIError, ConfigurationError } from './errors.js';

export type { ApplicationRun } from './entities/application-run/types.js';
export { processApplicationRun } from './entities/application-run/process-application-run.js';
export {
  getRunProgress,
  getRunStatus,
  canDownloadRunItems,
} from './entities/application-run/utils.js';
export type { ApplicationRunItem, ItemStatus } from './entities/run-item/types.js';
export { processRunItem } from './entities/run-item/process-run-item.js';
export { canDownloadItem, getItemStatus } from './entities/run-item/utils.js';
// Export main SDK and types
export {
  PlatformSDKHttp,
  type PlatformSDKConfig,
  type PlatformSDK,
  type TokenProvider,
} from './platform-sdk.js';

// Export main SDK as default
export default PlatformSDKHttp;
