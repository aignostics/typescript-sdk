import { PlatformSDKHttp } from './platform-sdk.js';

// Export generated API types and client when available
export * from './generated/index.js';

// Export main SDK and types
export {
  PlatformSDKHttp,
  type PlatformSDKConfig,
  type PlatformSDK,
  type TokenProvider,
} from './platform-sdk.js';

// Export main SDK as default
export default PlatformSDKHttp;
