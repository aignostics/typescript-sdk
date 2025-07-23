import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleInfo,
  testApi,
  listApplications,
  listApplicationVersions,
  listApplicationRuns,
  getRun,
  cancelApplicationRun,
  listRunResults,
} from './cli-functions.js';
import { PlatformSDK, PlatformSDKHttp } from '../platform-sdk.js';
import { AuthService } from '../utils/auth.js';

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
  listApplicationVersions: vi.fn(),
  listApplicationRuns: vi.fn(),
  getRun: vi.fn(),
  cancelApplicationRun: vi.fn(),
  listRunResults: vi.fn(),
  getConfig: vi.fn(),
  getVersion: vi.fn(),
} satisfies PlatformSDK;

// Mock AuthService
const mockAuthService = {
  getValidAccessToken: vi.fn().mockResolvedValue('mock-token'),
  loginWithCallback: vi.fn(),
  completeLogin: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  getStoredToken: vi.fn(),
  isAuthenticated: vi.fn(),
} as unknown as AuthService;

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
    vi.mocked(PlatformSDKHttp).mockImplementation(config => {
      // Capture and call the tokenProvider to ensure coverage
      if (config?.tokenProvider) {
        void config.tokenProvider();
      }
      return platformSDKMock as unknown as PlatformSDKHttp;
    });
  });

  describe('handleInfo', () => {
    it('should display SDK information', () => {
      handleInfo();

      expect(consoleSpy.log).toHaveBeenCalledWith('Aignostics Platform SDK');
      expect(consoleSpy.log).toHaveBeenCalledWith('Version:', '0.0.0-development');
    });
  });

  describe('testApi', () => {
    it('should test API connection successfully', async () => {
      // Set up mock server for successful response
      platformSDKMock.testConnection.mockResolvedValue(true);

      await testApi('https://api.example.com', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ API connection successful');
    });

    it('should handle API connection failure', async () => {
      // Set up mock server for error response
      platformSDKMock.testConnection.mockRejectedValue(new Error('Connection failed'));

      await testApi('https://api.example.com', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle network errors', async () => {
      // Set up mock server for network error
      platformSDKMock.testConnection.mockRejectedValue(new Error('Network error'));

      await testApi('https://api.example.com', mockAuthService);

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

      await listApplications('https://api.example.com', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should handle empty applications list', async () => {
      const listApplicationsResponse = { applications: [] };
      // Set up mock server for empty response
      platformSDKMock.listApplications.mockResolvedValue(listApplicationsResponse);

      await listApplications('https://api.example.com', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should throw error when API fails', async () => {
      // Set up mock server for error response
      platformSDKMock.listApplications.mockRejectedValue(new Error('API error'));

      await expect(listApplications('https://api.example.com', mockAuthService)).rejects.toThrow();
    });
  });

  describe('listApplicationVersions', () => {
    it('should list application versions successfully', async () => {
      const versionsResponse = [
        {
          application_version_id: 'v1.0.0',
          version: '1.0.0',
          application_id: 'app1',
          changelog: 'Initial version',
          input_artifacts: [],
          output_artifacts: [],
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      platformSDKMock.listApplicationVersions.mockResolvedValue(versionsResponse);

      await listApplicationVersions('https://api.example.com', mockAuthService, 'app1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application versions for app1:',
        JSON.stringify(versionsResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listApplicationVersions.mockRejectedValue(new Error('API error'));

      await listApplicationVersions('https://api.example.com', mockAuthService, 'app1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to list application versions:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listApplicationRuns', () => {
    it('should list application runs successfully', async () => {
      const runsResponse = [
        {
          application_run_id: 'run-1',
          application_version_id: 'v1.0.0',
          organization_id: 'org-1',
          status: 'COMPLETED',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T01:00:00Z',
        },
      ];
      platformSDKMock.listApplicationRuns.mockResolvedValue(runsResponse);

      await listApplicationRuns('https://api.example.com', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should list application runs with filters', async () => {
      const runsResponse = [
        {
          application_run_id: 'run-1',
          application_version_id: 'v1.0.0',
          organization_id: 'org-1',
          status: 'COMPLETED',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T01:00:00Z',
        },
      ];
      platformSDKMock.listApplicationRuns.mockResolvedValue(runsResponse);

      await listApplicationRuns('https://api.example.com', mockAuthService, {
        applicationId: 'app1',
        applicationVersion: 'v1.0.0',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        applicationId: 'app1',
        applicationVersion: 'v1.0.0',
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listApplicationRuns.mockRejectedValue(new Error('API error'));

      await listApplicationRuns('https://api.example.com', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to list application runs:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('getRun', () => {
    it('should get run details successfully', async () => {
      const runResponse = {
        application_run_id: 'run-1',
        application_version_id: 'v1.0.0',
        organization_id: 'org-1',
        status: 'COMPLETED',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
      };
      platformSDKMock.getRun.mockResolvedValue(runResponse);

      await getRun('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run details for run-1:',
        JSON.stringify(runResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getRun.mockRejectedValue(new Error('API error'));

      await getRun('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Failed to get run:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('cancelApplicationRun', () => {
    it('should cancel application run successfully', async () => {
      platformSDKMock.cancelApplicationRun.mockResolvedValue(undefined);

      await cancelApplicationRun('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Successfully cancelled application run: run-1'
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.cancelApplicationRun.mockRejectedValue(new Error('API error'));

      await cancelApplicationRun('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to cancel application run:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listRunResults', () => {
    it('should list run results successfully', async () => {
      const resultsResponse = [
        {
          item_id: 'item-1',
          reference: 'test-ref-1',
          status: 'SUCCEEDED',
          input_artifacts: [],
          output_artifacts: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T01:00:00Z',
        },
      ];
      platformSDKMock.listRunResults.mockResolvedValue(resultsResponse);

      await listRunResults('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run results for run-1:',
        JSON.stringify(resultsResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listRunResults.mockRejectedValue(new Error('API error'));

      await listRunResults('https://api.example.com', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to list run results:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
