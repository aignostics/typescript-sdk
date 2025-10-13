/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  handleInfo,
  testApi,
  listApplications,
  listApplicationRuns,
  getRun,
  cancelApplicationRun,
  listRunResults,
  createApplicationRun,
  handleLogin,
  handleLogout,
  handleStatus,
} from './cli-functions.js';
import { PlatformSDK, PlatformSDKHttp } from '@aignostics/sdk';
import { AuthService, AuthState } from './utils/auth.js';
import { startCallbackServer, waitForCallback } from './utils/oauth-callback-server.js';
import crypto from 'crypto';

// Mock external dependencies
vi.mock('./utils/oauth-callback-server');
vi.mock('crypto');

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
});

vi.mock('@aignostics/sdk', () => ({
  PlatformSDKHttp: vi.fn(),
  PlatformSDK: vi.fn(),
}));

const platformSDKMock = {
  testConnection: vi.fn(),
  listApplications: vi.fn(),
  listApplicationRuns: vi.fn(),
  getRun: vi.fn(),
  cancelApplicationRun: vi.fn(),
  listRunResults: vi.fn(),
  createApplicationRun: vi.fn(),
  getConfig: vi.fn(),
  getVersion: vi.fn(),
  getApplication: vi.fn(),
} satisfies PlatformSDK;

// Mock AuthService
const mockAuthService = {
  getValidAccessToken: vi.fn().mockResolvedValue('mock-token'),
  loginWithCallback: vi.fn(),
  completeLogin: vi.fn(),
  logout: vi.fn(),
  getAuthState: vi.fn(),
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
    // Clear all mocks
    vi.clearAllMocks();

    // Mock console methods to avoid noise in tests
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    vi.mocked(PlatformSDKHttp).mockImplementation(config => {
      // Capture and call the tokenProvider to ensure coverage
      if (config?.tokenProvider) {
        // TODO: get rid of this by adding integration tests that actually cover this
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

      await testApi('production', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ API connection successful');
    });

    it('should handle API connection failure', async () => {
      // Set up mock server for error response
      platformSDKMock.testConnection.mockResolvedValue(false);

      await testApi('production', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ API connection failed, bad response status code'
      );
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle API connection failure', async () => {
      // Set up mock server for error response
      platformSDKMock.testConnection.mockRejectedValue(new Error('Connection failed'));

      await testApi('production', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle network errors', async () => {
      // Set up mock server for network error
      platformSDKMock.testConnection.mockRejectedValue(new Error('Network error'));

      await testApi('production', mockAuthService);

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

      await listApplications('production', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should handle empty applications list', async () => {
      const listApplicationsResponse = { applications: [] };
      // Set up mock server for empty response
      platformSDKMock.listApplications.mockResolvedValue(listApplicationsResponse);

      await listApplications('production', mockAuthService);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(listApplicationsResponse, null, 2)
      );
    });

    it('should throw error when API fails', async () => {
      // Set up mock server for error response
      platformSDKMock.listApplications.mockRejectedValue(new Error('API error'));

      await expect(listApplications('production', mockAuthService)).rejects.toThrow();
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

      await listApplicationRuns('production', mockAuthService);

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

      await listApplicationRuns('production', mockAuthService, {
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

      await listApplicationRuns('production', mockAuthService);

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

      await getRun('production', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run details for run-1:',
        JSON.stringify(runResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getRun.mockRejectedValue(new Error('API error'));

      await getRun('production', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Failed to get run:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('cancelApplicationRun', () => {
    it('should cancel application run successfully', async () => {
      platformSDKMock.cancelApplicationRun.mockResolvedValue(undefined);

      await cancelApplicationRun('production', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Successfully cancelled application run: run-1'
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.cancelApplicationRun.mockRejectedValue(new Error('API error'));

      await cancelApplicationRun('production', mockAuthService, 'run-1');

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

      await listRunResults('production', mockAuthService, 'run-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run results for run-1:',
        JSON.stringify(resultsResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listRunResults.mockRejectedValue(new Error('API error'));

      await listRunResults('production', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to list run results:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('createApplicationRun', () => {
    it('should create application run successfully with empty items', async () => {
      const runResponse = {
        application_run_id: 'run-123',
      };
      platformSDKMock.createApplicationRun.mockResolvedValue(runResponse);

      await createApplicationRun('production', mockAuthService, 'test-app', 'v1.0.0', '[]');

      expect(platformSDKMock.createApplicationRun).toHaveBeenCalledWith({
        application_id: 'test-app',
        version_number: 'v1.0.0',
        items: [],
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Application run created successfully:',
        JSON.stringify(runResponse, null, 2)
      );
    });

    it('should create application run successfully with items', async () => {
      const runResponse = {
        application_run_id: 'run-456',
      };
      const items = [
        {
          reference: 'slide_1',
          input_artifacts: [
            {
              name: 'input_slide',
              download_url: 'https://example.com/slide1.tiff',
              metadata: { mime_type: 'image/tiff' },
            },
          ],
        },
      ];
      platformSDKMock.createApplicationRun.mockResolvedValue(runResponse);

      await createApplicationRun(
        'production',
        mockAuthService,
        'test-app',
        'v1.0.0',
        JSON.stringify(items)
      );

      expect(platformSDKMock.createApplicationRun).toHaveBeenCalledWith({
        application_id: 'test-app',
        version_number: 'v1.0.0',
        items: items,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Application run created successfully:',
        JSON.stringify(runResponse, null, 2)
      );
    });

    it('should handle invalid JSON in items parameter', async () => {
      await createApplicationRun(
        'production',
        mockAuthService,
        'test-app',
        'v1.0.0',
        'invalid-json'
      );

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Invalid items JSON:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.createApplicationRun).not.toHaveBeenCalled();
    });

    it('should handle non-array items parameter', async () => {
      await createApplicationRun(
        'production',
        mockAuthService,
        'test-app',
        'v1.0.0',
        '{"not": "an array"}'
      );

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Invalid items JSON:',
        expect.objectContaining({
          message: 'Items must be an array',
        })
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.createApplicationRun).not.toHaveBeenCalled();
    });

    it('should handle API error during run creation', async () => {
      platformSDKMock.createApplicationRun.mockRejectedValue(new Error('API error'));

      await createApplicationRun('production', mockAuthService, 'test-app', 'v1.0.0', '[]');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to create application run:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('handleLogin', () => {
    const mockAuthCode = 'test-auth-code';
    const mockCodeVerifier = 'test-code-verifier';
    const mockCodeVerifierHex = Buffer.from(mockCodeVerifier, 'utf-8').toString('hex');
    // Mock console methods
    const mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockServer = {
      address: vi.fn().mockReturnValue({ port: 8989 }),
      close: vi.fn(),
    };

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
      vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
      (crypto.randomBytes as Mock).mockReturnValue(Buffer.from(mockCodeVerifier, 'utf-8'));
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
    });

    it('should complete login flow successfully', async () => {
      (waitForCallback as Mock).mockResolvedValue(mockAuthCode);
      vi.mocked(mockAuthService.loginWithCallback).mockResolvedValue('');
      vi.mocked(mockAuthService.completeLogin).mockResolvedValue(undefined);

      await handleLogin('production', mockAuthService);

      // Verify the flow
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(startCallbackServer).toHaveBeenCalled();
      expect(mockAuthService.loginWithCallback).toHaveBeenCalledWith('production', {
        redirectUri: 'http://localhost:8989',
        codeVerifier: mockCodeVerifierHex,
      });
      expect(waitForCallback).toHaveBeenCalledWith(mockServer);
      expect(mockAuthService.completeLogin).toHaveBeenCalledWith(
        'production',
        {
          redirectUri: 'http://localhost:8989',
          codeVerifier: mockCodeVerifierHex,
        },
        mockAuthCode
      );
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle server address as number', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue(8990),
        close: vi.fn(),
      };

      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (waitForCallback as Mock).mockResolvedValue('auth-code');
      vi.mocked(mockAuthService.loginWithCallback).mockResolvedValue('');
      vi.mocked(mockAuthService.completeLogin).mockResolvedValue(undefined);

      await handleLogin('production', mockAuthService);

      expect(mockAuthService.loginWithCallback).toHaveBeenCalledWith(
        'production',
        expect.objectContaining({
          redirectUri: 'http://localhost:8989', // Should fallback to 8989
        })
      );
    });

    it('should handle authentication errors and close server', async () => {
      const mockError = new Error('Authentication failed');

      vi.mocked(mockAuthService.loginWithCallback).mockRejectedValue(mockError);

      await expect(handleLogin('production', mockAuthService)).rejects.toThrow(
        'Authentication failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle callback wait errors and close server', async () => {
      const mockError = new Error('Callback timeout');

      vi.mocked(mockAuthService.loginWithCallback).mockResolvedValue('');
      (waitForCallback as Mock).mockRejectedValue(mockError);

      await expect(handleLogin('production', mockAuthService)).rejects.toThrow('Callback timeout');

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle token exchange errors and close server', async () => {
      const mockError = new Error('Token exchange failed');

      (waitForCallback as Mock).mockResolvedValue('auth-code');
      vi.mocked(mockAuthService.loginWithCallback).mockResolvedValue('');
      vi.mocked(mockAuthService.completeLogin).mockRejectedValue(mockError);

      await expect(handleLogin('production', mockAuthService)).rejects.toThrow(
        'Token exchange failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    // Mock console methods
    const mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
      vi.spyOn(console, 'error').mockImplementation(mockConsole.error);
    });

    it('should call logout function', async () => {
      vi.mocked(mockAuthService.logout).mockResolvedValue(undefined);

      await handleLogout('production', mockAuthService);

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = new Error('Logout failed');
      vi.mocked(mockAuthService.logout).mockRejectedValue(mockError);

      await expect(handleLogout('production', mockAuthService)).rejects.toThrow('Logout failed');
    });
  });

  describe('handleStatus', () => {
    // Mock console methods
    const mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
    };

    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
      vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

      // Mock process.exit
      vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    it('should display authenticated status with expiring token', async () => {
      const mockExpiresAt = new Date('2025-01-01T12:59:59.000Z');
      const mockStoredAt = new Date('2024-12-01T10:00:00.000Z');

      const mockAuthState: AuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email offline_access',
          expiresAt: mockExpiresAt,
          storedAt: mockStoredAt,
        },
      };

      vi.mocked(mockAuthService.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus('production', mockAuthService);

      expect(mockConsole.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(mockConsole.log).toHaveBeenCalledWith('Token details:');
      expect(mockConsole.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '  - Scope: openid profile email offline_access'
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        `  - Expires: ${mockExpiresAt.toLocaleString()}`
      );
      expect(mockConsole.log).toHaveBeenCalledWith(`  - Stored: ${mockStoredAt.toLocaleString()}`);
    });

    it('should display authenticated status with non-expiring token', async () => {
      const mockStoredAt = new Date('2024-12-01T10:00:00.000Z');

      const mockAuthState: AuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email offline_access',
          expiresAt: undefined,
          storedAt: mockStoredAt,
        },
      };

      vi.mocked(mockAuthService.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus('production', mockAuthService);

      expect(mockConsole.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(mockConsole.log).toHaveBeenCalledWith('Token details:');
      expect(mockConsole.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '  - Scope: openid profile email offline_access'
      );
      expect(mockConsole.log).toHaveBeenCalledWith('  - Expires: Never');
      expect(mockConsole.log).toHaveBeenCalledWith(`  - Stored: ${mockStoredAt.toLocaleString()}`);
    });

    it('should display not authenticated status', async () => {
      const mockAuthState: AuthState = {
        isAuthenticated: false,
      };

      vi.mocked(mockAuthService.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus('production', mockAuthService);

      expect(mockConsole.log).toHaveBeenCalledWith(
        '❌ Not authenticated. Run "aignostics-platform login" to authenticate.'
      );
    });

    it('should handle auth state check errors', async () => {
      const mockError = new Error('Failed to check auth state');
      vi.mocked(mockAuthService.getAuthState).mockRejectedValue(mockError);

      await expect(handleStatus('production', mockAuthService)).rejects.toThrow(
        'process.exit called'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Error checking status:', mockError);
    });
  });
});
