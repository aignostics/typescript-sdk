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

  it('should list application versions successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.listApplicationVersions('test-app-id');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('application_version_id');
    expect(result[0]).toHaveProperty('version');
    expect(result[0]).toHaveProperty('application_id');
  });

  it('should handle list application versions failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.listApplicationVersions('test-app-id')).rejects.toThrow(
      'list application versions failed'
    );
  });

  it('should list application runs successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.listApplicationRuns();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('application_run_id');
    expect(result[0]).toHaveProperty('status');
  });

  it('should list application runs with filters successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.listApplicationRuns({
      applicationId: 'test-app-id',
      applicationVersion: 'v1.0.0',
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle list application runs failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.listApplicationRuns()).rejects.toThrow('list application runs failed');
  });

  it('should get run successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.getRun('test-run-id');
    expect(result).toHaveProperty('application_run_id');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('application_version_id');
  });

  it('should handle get run failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.getRun('test-run-id')).rejects.toThrow('get run failed');
  });

  it('should cancel application run successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    // Should not throw an error for successful cancellation
    await expect(sdk.cancelApplicationRun('test-run-id')).resolves.toBeUndefined();
  });

  it('should handle cancel application run failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.cancelApplicationRun('test-run-id')).rejects.toThrow(
      'cancel application run failed'
    );
  });

  it('should list run results successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.listRunResults('test-run-id');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('item_id');
    expect(result[0]).toHaveProperty('status');
    expect(result[0]).toHaveProperty('reference');
  });

  it('should handle list run results failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('error');

    await expect(sdk.listRunResults('test-run-id')).rejects.toThrow('list run results failed');
  });

  it('should handle no token for new methods', async () => {
    // Mock token provider to return null
    mockTokenProvider.mockResolvedValue(null);

    const errorMessage =
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.';

    await expect(sdk.listApplicationVersions('test-app-id')).rejects.toThrow(errorMessage);
    await expect(sdk.listApplicationRuns()).rejects.toThrow(errorMessage);
    await expect(sdk.getRun('test-run-id')).rejects.toThrow(errorMessage);
    await expect(sdk.cancelApplicationRun('test-run-id')).rejects.toThrow(errorMessage);
    await expect(sdk.listRunResults('test-run-id')).rejects.toThrow(errorMessage);
  });
});
