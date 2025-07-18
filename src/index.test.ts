import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformSDK } from './index';
import { setMockScenario } from './test-utils/http-mocks';

describe('PlatformSDK', () => {
  let sdk: PlatformSDK;

  beforeEach(() => {
    sdk = new PlatformSDK();
  });

  it('should create an instance with default configuration', () => {
    expect(sdk).toBeInstanceOf(PlatformSDK);
    const config = sdk.getConfig();
    expect(config.baseURL).toBe('https://api.aignostics.com');
    expect(config.timeout).toBe(10000);
  });

  it('should create an instance with custom configuration', () => {
    const customConfig = {
      baseURL: 'https://custom.api.com',
      apiKey: 'test-key',
      timeout: 5000,
    };

    const customSDK = new PlatformSDK(customConfig);
    const config = customSDK.getConfig();

    expect(config.baseURL).toBe('https://custom.api.com');
    expect(config.apiKey).toBe('test-key');
    expect(config.timeout).toBe(5000);
  });

  it('should return a version string', () => {
    const version = sdk.getVersion();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should test connection successfully', async () => {
    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.testConnection();
    expect(result).toBe(true);
  });

  it('should handle connection failure', async () => {
    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.testConnection()).rejects.toThrow('Connection test failed');
  });
});
