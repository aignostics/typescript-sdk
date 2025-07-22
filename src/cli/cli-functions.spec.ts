import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInfo, testApi, listApplications } from './cli-functions';
import { PlatformSDK, PlatformSDKHttp } from '../platform-sdk';

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
});

vi.mock('../platform-sdk');

const platformSDKMock = {
  testConnection: vi.fn(),
  listApplications: vi.fn(),
  getConfig: vi.fn(),
  getVersion: vi.fn(),
} satisfies PlatformSDK;

// Mock package.json
vi.mock('../../package.json', () => ({
  default: { version: '0.0.0-development' },
  version: '0.0.0-development',
}));

describe('CLI Functions Unit Tests', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    vi.mocked(PlatformSDKHttp).mockImplementation(
      () => platformSDKMock as unknown as PlatformSDKHttp
    );
  });

  describe('handleInfo', () => {
    it('should display SDK information', async () => {
      await handleInfo();

      expect(consoleSpy.log).toHaveBeenCalledWith('Aignostics Platform SDK');
      expect(consoleSpy.log).toHaveBeenCalledWith('Version:', '0.0.0-development');
    });
  });

  describe('testApi', () => {
    it('should test API connection successfully', async () => {
      // Set up mock server for successful response
      platformSDKMock.testConnection.mockResolvedValue(true);

      await testApi('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ API connection successful');
    });

    it('should handle API connection failure', async () => {
      // Set up mock server for error response
      platformSDKMock.testConnection.mockRejectedValue(new Error('Connection failed'));

      await testApi('https://api.example.com');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle network errors', async () => {
      // Set up mock server for network error
      platformSDKMock.testConnection.mockRejectedValue(new Error('Network error'));

      await testApi('https://api.example.com');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listApplications', () => {
    it('should list applications successfully', async () => {
      const listApplicationsResponse = {
        applications: [
          { id: 'app1', name: 'Application 1' },
          { id: 'app2', name: 'Application 2' },
        ],
      };
      // Set up mock server for successful response
      platformSDKMock.listApplications.mockResolvedValue(listApplicationsResponse);

      await listApplications('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should handle empty applications list', async () => {
      const listApplicationsResponse = { applications: [] };
      // Set up mock server for empty response
      platformSDKMock.listApplications.mockResolvedValue(listApplicationsResponse);

      await listApplications('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should throw error when API fails', async () => {
      // Set up mock server for error response
      platformSDKMock.listApplications.mockRejectedValue(new Error('API error'));

      await expect(listApplications('https://api.example.com')).rejects.toThrow();
    });
  });
});
