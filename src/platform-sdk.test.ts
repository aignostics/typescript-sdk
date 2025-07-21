import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformSDKHttp } from './platform-sdk';
import { setMockScenario } from './test-utils/http-mocks';
import { loadData } from './utils/token-storage';

vi.mock('./utils/token-storage');

describe('PlatformSDK', () => {
  let sdk: PlatformSDKHttp;

  beforeEach(() => {
    sdk = new PlatformSDKHttp();
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
      apiKey: 'test-key',
      timeout: 5000,
    };

    const customSDK = new PlatformSDKHttp(customConfig);
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
    // Mock loadData to return a valid token structure
    vi.mocked(loadData).mockResolvedValue({
      access_token: 'mocked-token',
      stored_at: Date.now(),
      expires_in: 3600, // 1 hour from now
    });

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

  it('should handle expired token correctly', async () => {
    // Mock loadData to return an expired token
    vi.mocked(loadData).mockResolvedValue({
      access_token: 'expired-token',
      stored_at: Date.now() - 7200 * 1000, // 2 hours ago
      expires_in: 3600, // 1 hour expiry (so it's expired)
    });

    await expect(sdk.testConnection()).rejects.toThrow(
      'No API key or access token provided. Please login first.'
    );
  });

  it('should handle invalid token data correctly', async () => {
    // Mock loadData to return invalid token structure
    vi.mocked(loadData).mockResolvedValue({
      not_a_token: 'invalid',
    });

    await expect(sdk.testConnection()).rejects.toThrow(
      'No API key or access token provided. Please login first.'
    );
  });
});
