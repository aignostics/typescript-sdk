import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformSDKHttp } from './platform-sdk.js';
import { setMockScenario } from './test-utils/http-mocks.js';

describe('PlatformSDK', () => {
  let sdk: PlatformSDKHttp;
  let mockTokenProvider: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTokenProvider = vi.fn();
    sdk = new PlatformSDKHttp({
      tokenProvider: mockTokenProvider,
    });
  });

  it('should create an instance with default configuration', () => {
    expect(sdk).toBeInstanceOf(PlatformSDKHttp);
    const config = sdk.getConfig();
    expect(config.baseURL).toBe('https://api.aignostics.com');
    expect(config.timeout).toBe(10000);
  });

  it('should create an instance with custom configuration', () => {
    const customConfig = {
      baseURL: 'https://custom.api.com',
      timeout: 5000,
      tokenProvider: () => 'custom-token',
    };

    const customSDK = new PlatformSDKHttp(customConfig);
    const config = customSDK.getConfig();

    expect(config.baseURL).toBe('https://custom.api.com');
    expect(config.timeout).toBe(5000);
  });

  it('should return a version string', () => {
    const version = sdk.getVersion();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should test connection successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.testConnection();
    expect(result).toBe(true);
  });

  it('should handle connection failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.testConnection()).rejects.toThrow('Connection test failed');
  });

  it('should handle no token correctly', async () => {
    // Mock token provider to return null (indicating no token available)
    mockTokenProvider.mockResolvedValue(null);

    await expect(sdk.testConnection()).rejects.toThrow(
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.'
    );
  });

  it('should handle undefined token correctly', async () => {
    // Mock token provider to return undefined (indicating no token available)
    mockTokenProvider.mockResolvedValue(undefined);

    await expect(sdk.testConnection()).rejects.toThrow(
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.'
    );
  });

  it('should list applications successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.listApplications();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle list applications failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.listApplications()).rejects.toThrow('list applications failed');
  });
});
