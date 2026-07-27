import { PlatformSDKHttp } from './platform-sdk.js';

// Export generated API types and client when available
export * from './generated/index.js';

// Export error classes
export { BaseError, AuthenticationError, APIError, ConfigurationError } from './errors.js';

export {
  getRunProgress,
  getRunStatus,
  canDownloadRunItems,
  type RunStatus,
} from './entities/application-run/index.js';
export {
  canDownloadItem,
  getItemStatus,
  ERROR_TERMINATION_REASONS,
  type ItemStatus,
} from './entities/run-item/index.js';
// Export main SDK and types
export {
  PlatformSDKHttp,
  type PlatformSDKConfig,
  type PlatformSDK,
  type TokenProvider,
} from './platform-sdk.js';

// Export main SDK as default
export default PlatformSDKHttp;
