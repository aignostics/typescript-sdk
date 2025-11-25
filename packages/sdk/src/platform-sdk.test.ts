import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformSDKHttp } from './platform-sdk.js';
import { AuthenticationError } from './errors.js';
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
    setMockScenario('validationError');

    await expect(sdk.testConnection()).rejects.toThrow('Connection test failed');
  });

  it('should handle no token correctly', async () => {
    // Mock token provider to return null (indicating no token available)
    mockTokenProvider.mockResolvedValue(null);

    await expect(sdk.testConnection()).rejects.toThrow(AuthenticationError);
    await expect(sdk.testConnection()).rejects.toThrow(
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.'
    );
  });

  it('should handle undefined token correctly', async () => {
    // Mock token provider to return undefined (indicating no token available)
    mockTokenProvider.mockResolvedValue(undefined);

    await expect(sdk.testConnection()).rejects.toThrow(AuthenticationError);
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
    setMockScenario('internalServerError');

    await expect(sdk.listApplications()).rejects.toThrow(
      'API request failed: Request failed with status code 500'
    );
  });

  it('should get application successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.getApplication('test-app-id');
    expect(result).toHaveProperty('application_id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('regulatory_classes');
    expect(result).toHaveProperty('versions');
    expect(Array.isArray(result.versions)).toBe(true);
  });

  it('should handle get application failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    await expect(sdk.getApplication('test-app-id')).rejects.toThrow('Resource not found: ');
  });

  it('should get application version details successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.getApplicationVersionDetails('test-app-id', 'v1.0.0');
    expect(result).toHaveProperty('version_number');
    expect(result).toHaveProperty('changelog');
    expect(result).toHaveProperty('input_artifacts');
    expect(result).toHaveProperty('output_artifacts');
    expect(result).toHaveProperty('released_at');
    expect(Array.isArray(result.input_artifacts)).toBe(true);
    expect(Array.isArray(result.output_artifacts)).toBe(true);
    expect(result.version_number).toBe('v1.0.0');
  });

  it('should handle get application version details failure for invalid application', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    await expect(sdk.getApplicationVersionDetails('invalid-app-id', 'v1.0.0')).rejects.toThrow(
      'Resource not found: '
    );
  });

  it('should handle get application version details failure for invalid version', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    await expect(
      sdk.getApplicationVersionDetails('test-app-id', 'invalid-version')
    ).rejects.toThrow('Resource not found: ');
  });

  it('should handle no token for get application version details', async () => {
    // Mock token provider to return null
    mockTokenProvider.mockResolvedValue(null);

    const errorMessage =
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.';

    await expect(sdk.getApplicationVersionDetails('test-app-id', 'v1.0.0')).rejects.toThrow(
      AuthenticationError
    );
    await expect(sdk.getApplicationVersionDetails('test-app-id', 'v1.0.0')).rejects.toThrow(
      errorMessage
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
    expect(result[0]).toHaveProperty('run_id');
    expect(result[0]).toHaveProperty('state');
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
    setMockScenario('notFoundError');

    await expect(sdk.listApplicationRuns()).rejects.toThrow('Resource not found: ');
  });

  it('should get run successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const result = await sdk.getRun('test-run-id');
    expect(result).toHaveProperty('run_id');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('version_number');
  });

  it('should handle get run failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    await expect(sdk.getRun('test-run-id')).rejects.toThrow('Resource not found: ');
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
    setMockScenario('notFoundError');

    await expect(sdk.cancelApplicationRun('test-run-id')).rejects.toThrow('Resource not found: ');
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
    expect(result[0]).toHaveProperty('state');
    expect(result[0]).toHaveProperty('external_id');
  });

  it('should list run results failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    await expect(sdk.listRunResults('test-run-id')).rejects.toThrow('Resource not found: ');
  });

  it('should create application run successfully', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with successful response
    setMockScenario('success');

    const runRequest = {
      application_id: 'test-app:v1.0.0',
      version_number: 'v1.0.0',
      items: [
        {
          external_id: 'test-item-1',
          input_artifacts: [
            {
              name: 'input_slide',
              download_url: 'https://example.com/file.tiff',
              metadata: {
                checksum_base64_crc32c: 'abc123==',
                mime_type: 'image/tiff',
                height: 1000,
                width: 1000,
                mpp: 0.25,
              },
            },
          ],
        },
      ],
    };

    const result = await sdk.createApplicationRun(runRequest);
    expect(result).toBeDefined();
    expect(typeof result.run_id).toBe('string');
  });

  it('should handle create application run failure', async () => {
    // Mock token provider to return a valid token
    mockTokenProvider.mockResolvedValue('mocked-token');

    // Use mock server with error response
    setMockScenario('notFoundError');

    const runRequest = {
      application_id: 'test-app',
      version_number: 'v1.0.0',
      items: [
        {
          external_id: 'test-item-1',
          input_artifacts: [
            {
              name: 'input_slide',
              download_url: 'https://example.com/file.tiff',
              metadata: {
                checksum_base64_crc32c: 'abc123==',
                mime_type: 'image/tiff',
              },
            },
          ],
        },
      ],
    };

    await expect(sdk.createApplicationRun(runRequest)).rejects.toThrow('Resource not found: ');
  });

  it('should handle no token for new methods', async () => {
    // Mock token provider to return null
    mockTokenProvider.mockResolvedValue(null);

    const errorMessage =
      'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.';

    await expect(sdk.listApplicationRuns()).rejects.toThrow(AuthenticationError);
    await expect(sdk.listApplicationRuns()).rejects.toThrow(errorMessage);

    await expect(
      sdk.createApplicationRun({
        application_id: 'test-app',
        version_number: 'v1.0.0',
        items: [],
      })
    ).rejects.toThrow(AuthenticationError);
    await expect(
      sdk.createApplicationRun({
        application_id: 'test-app',
        version_number: 'v1.0.0',
        items: [],
      })
    ).rejects.toThrow(errorMessage);

    await expect(sdk.getRun('test-run-id')).rejects.toThrow(AuthenticationError);
    await expect(sdk.getRun('test-run-id')).rejects.toThrow(errorMessage);

    await expect(sdk.cancelApplicationRun('test-run-id')).rejects.toThrow(AuthenticationError);
    await expect(sdk.cancelApplicationRun('test-run-id')).rejects.toThrow(errorMessage);

    await expect(sdk.listRunResults('test-run-id')).rejects.toThrow(AuthenticationError);
    await expect(sdk.listRunResults('test-run-id')).rejects.toThrow(errorMessage);
  });
});
