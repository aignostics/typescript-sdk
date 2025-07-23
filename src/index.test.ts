import { describe, it, expect } from 'vitest';
import PlatformSDKHttp from './index.js';

describe('Index Module', () => {
  it('should export PlatformSDKHttp as default export', () => {
    expect(PlatformSDKHttp).toBeDefined();
    expect(typeof PlatformSDKHttp).toBe('function');
  });

  it('should be able to create an instance of the SDK', () => {
    const sdk = new PlatformSDKHttp({ tokenProvider: () => 'dummy' });
    expect(sdk).toBeInstanceOf(PlatformSDKHttp);
  });

  it('should export SDK with proper interface methods', () => {
    const sdk = new PlatformSDKHttp({ tokenProvider: () => 'dummy' });

    // Check that the SDK has the expected interface methods
    expect(typeof sdk.getVersion).toBe('function');
    expect(typeof sdk.getConfig).toBe('function');
    expect(typeof sdk.testConnection).toBe('function');
    expect(typeof sdk.listApplications).toBe('function');
  });
});
