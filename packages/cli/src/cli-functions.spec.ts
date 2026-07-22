/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  handleInfo,
  testApi,
  listApplications,
  getApplicationVersionDetails,
  getApplicationDetails,
  listApplicationVersions,
  listApplicationRuns,
  getRun,
  cancelApplicationRun,
  listRunResults,
  getRunItem,
  updateRunMetadata,
  updateRunItemMetadata,
  deleteRunResults,
  createApplicationRun,
  resolveItemsInput,
  handleLogin,
  handleLogout,
  handleStatus,
  handleLoginWithRefreshToken,
  createGrant,
  listGrants,
  getGrant,
  revokeGrant,
  createShareToken,
  listShareTokens,
  getShareToken,
  revokeShareToken,
} from './cli-functions.js';
import { PlatformSDK, PlatformSDKHttp } from '@aignostics/sdk';
import { AuthService, AuthState } from './utils/auth.js';
import { startCallbackServer, waitForCallback } from './utils/oauth-callback-server.js';
import crypto from 'crypto';
import * as fs from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';
import { EnvironmentKey } from './utils/environment.js';

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
  getApplicationVersionDetails: vi.fn(),
  listApplicationRuns: vi.fn(),
  getRun: vi.fn(),
  cancelApplicationRun: vi.fn(),
  listRunResults: vi.fn(),
  getRunItem: vi.fn(),
  updateRunMetadata: vi.fn(),
  updateRunItemMetadata: vi.fn(),
  deleteRunResults: vi.fn(),
  createApplicationRun: vi.fn(),
  getConfig: vi.fn(),
  getVersion: vi.fn(),
  getApplication: vi.fn(),
  createGrant: vi.fn(),
  listGrants: vi.fn(),
  getGrant: vi.fn(),
  revokeGrant: vi.fn(),
  createShareToken: vi.fn(),
  listShareTokens: vi.fn(),
  getShareToken: vi.fn(),
  revokeShareToken: vi.fn(),
  downloadArtifact: vi.fn(),
  downloadArtifactStream: vi.fn(),
} satisfies PlatformSDK;

// Mock AuthService
const mockAuthService = {
  getValidAccessToken: vi.fn().mockResolvedValue('mock-token'),
  loginWithCallback: vi.fn(),
  completeLogin: vi.fn(),
  logout: vi.fn(),
  getAuthState: vi.fn(),
  loginWithRefreshToken: vi.fn(),
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

  describe('getApplicationVersionDetails', () => {
    it('should get application version details successfully', async () => {
      const versionDetails = {
        application_id: 'app1',
        version_number: 'v1.0.0',
        name: 'Test Application',
        description: 'Test description',
        created_at: '2023-01-01T00:00:00Z',
      };
      platformSDKMock.getApplicationVersionDetails.mockResolvedValue(versionDetails);

      await getApplicationVersionDetails('production', mockAuthService, 'app1', 'v1.0.0');

      expect(platformSDKMock.getApplicationVersionDetails).toHaveBeenCalledWith('app1', 'v1.0.0');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application version details for app1 vv1.0.0:',
        JSON.stringify(versionDetails, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getApplicationVersionDetails.mockRejectedValue(new Error('API error'));

      await getApplicationVersionDetails('production', mockAuthService, 'app1', 'v1.0.0');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to get application version details:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('getApplicationDetails', () => {
    it('should get application details successfully', async () => {
      const applicationResponse = {
        application_id: 'app1',
        name: 'Test Application',
        versions: [{ version_number: 'v1.0.0', created_at: '2023-01-01T00:00:00Z' }],
      };
      platformSDKMock.getApplication.mockResolvedValue(applicationResponse);

      await getApplicationDetails('production', mockAuthService, 'app1');

      expect(platformSDKMock.getApplication).toHaveBeenCalledWith('app1');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application details for app1:',
        JSON.stringify(applicationResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getApplication.mockRejectedValue(new Error('API error'));

      await getApplicationDetails('production', mockAuthService, 'app1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to get application details:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listApplicationVersions', () => {
    it('should list application versions successfully', async () => {
      const applicationResponse = {
        application_id: 'app1',
        name: 'Test Application',
        versions: [
          { version_number: 'v1.0.0', created_at: '2023-01-01T00:00:00Z' },
          { version_number: 'v1.1.0', created_at: '2023-02-01T00:00:00Z' },
        ],
      };
      platformSDKMock.getApplication.mockResolvedValue(applicationResponse);

      await listApplicationVersions('production', mockAuthService, 'app1');

      expect(platformSDKMock.getApplication).toHaveBeenCalledWith('app1');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application versions for app1:',
        JSON.stringify(applicationResponse.versions, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getApplication.mockRejectedValue(new Error('API error'));

      await listApplicationVersions('production', mockAuthService, 'app1');

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

    it('should list application runs with custom metadata filter', async () => {
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
        customMetadata: '{"key": "value"}',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        applicationId: 'app1',
        customMetadata: '{"key": "value"}',
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should list application runs with sort parameter', async () => {
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
        sort: '["created_at", "-updated_at"]',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        sort: ['created_at', '-updated_at'],
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should list application runs with all filters and sort', async () => {
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
        customMetadata: '{"environment": "test"}',
        sort: '["-created_at"]',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        applicationId: 'app1',
        applicationVersion: 'v1.0.0',
        customMetadata: '{"environment": "test"}',
        sort: ['-created_at'],
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should handle invalid sort JSON', async () => {
      await listApplicationRuns('production', mockAuthService, {
        sort: 'invalid-json',
      });

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Invalid sort array:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.listApplicationRuns).not.toHaveBeenCalled();
    });

    it('should handle empty customMetadata', async () => {
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
        customMetadata: '{}',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        customMetadata: '{}',
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        JSON.stringify(runsResponse, null, 2)
      );
    });

    it('should handle empty sort array', async () => {
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
        sort: '[]',
      });

      expect(platformSDKMock.listApplicationRuns).toHaveBeenCalledWith({
        sort: [],
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

    it('should handle API error with filters', async () => {
      platformSDKMock.listApplicationRuns.mockRejectedValue(new Error('Network error'));

      await listApplicationRuns('production', mockAuthService, {
        applicationId: 'app1',
        customMetadata: '{"key": "value"}',
        sort: '["-created_at"]',
      });

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

  describe('getRunItem', () => {
    it('should get a single run item successfully', async () => {
      const itemResponse = {
        item_id: 'item-1',
        external_id: 'ext-1',
        status: 'SUCCEEDED',
        input_artifacts: [],
        output_artifacts: [],
      };
      platformSDKMock.getRunItem.mockResolvedValue(itemResponse);

      await getRunItem('production', mockAuthService, 'run-1', 'ext-1');

      expect(platformSDKMock.getRunItem).toHaveBeenCalledWith('run-1', 'ext-1');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run item details for run-1/ext-1:',
        JSON.stringify(itemResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getRunItem.mockRejectedValue(new Error('API error'));

      await getRunItem('production', mockAuthService, 'run-1', 'ext-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to get run item:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('updateRunMetadata', () => {
    it('should update run custom metadata successfully', async () => {
      const updateResponse = { custom_metadata_checksum: 'abc123' };
      platformSDKMock.updateRunMetadata.mockResolvedValue(updateResponse);

      await updateRunMetadata('production', mockAuthService, 'run-1', '{"note":"reviewed"}');

      expect(platformSDKMock.updateRunMetadata).toHaveBeenCalledWith('run-1', { note: 'reviewed' });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Updated custom metadata for run run-1:',
        JSON.stringify(updateResponse, null, 2)
      );
    });

    it('should support clearing metadata with null', async () => {
      const updateResponse = { custom_metadata_checksum: null };
      platformSDKMock.updateRunMetadata.mockResolvedValue(updateResponse);

      await updateRunMetadata('production', mockAuthService, 'run-1', 'null');

      expect(platformSDKMock.updateRunMetadata).toHaveBeenCalledWith('run-1', null);
    });

    it('should handle invalid custom metadata JSON', async () => {
      await updateRunMetadata('production', mockAuthService, 'run-1', 'not-json');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Invalid custom metadata JSON:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.updateRunMetadata).not.toHaveBeenCalled();
    });

    it('should handle non-object custom metadata JSON', async () => {
      await updateRunMetadata('production', mockAuthService, 'run-1', '"just a string"');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Invalid custom metadata JSON:',
        expect.any(TypeError)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.updateRunMetadata).not.toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      platformSDKMock.updateRunMetadata.mockRejectedValue(new Error('API error'));

      await updateRunMetadata('production', mockAuthService, 'run-1', '{}');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to update run metadata:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('updateRunItemMetadata', () => {
    it('should update run item custom metadata successfully', async () => {
      const updateResponse = { custom_metadata_checksum: 'abc123' };
      platformSDKMock.updateRunItemMetadata.mockResolvedValue(updateResponse);

      await updateRunItemMetadata(
        'production',
        mockAuthService,
        'run-1',
        'ext-1',
        '{"reviewed":true}'
      );

      expect(platformSDKMock.updateRunItemMetadata).toHaveBeenCalledWith('run-1', 'ext-1', {
        reviewed: true,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Updated custom metadata for item run-1/ext-1:',
        JSON.stringify(updateResponse, null, 2)
      );
    });

    it('should handle invalid custom metadata JSON', async () => {
      await updateRunItemMetadata('production', mockAuthService, 'run-1', 'ext-1', 'not-json');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Invalid custom metadata JSON:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(platformSDKMock.updateRunItemMetadata).not.toHaveBeenCalled();
    });

    it('should handle API error', async () => {
      platformSDKMock.updateRunItemMetadata.mockRejectedValue(new Error('API error'));

      await updateRunItemMetadata('production', mockAuthService, 'run-1', 'ext-1', '{}');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to update run item metadata:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  describe('createGrant', () => {
    it('should create a grant successfully', async () => {
      const grantResponse = {
        grant_id: 'grant-1',
        resource_type: 'run',
        resource_id: 'run-1',
        subject_type: 'user',
        subject_id: 'user-1',
        relation: 'viewer',
        created_by: 'user-2',
        created_at: '2023-01-01T00:00:00Z',
        revoked: false,
      };
      platformSDKMock.createGrant.mockResolvedValue(grantResponse);

      await createGrant('production', mockAuthService, {
        resourceType: 'run',
        resourceId: 'run-1',
        subjectType: 'user',
        subjectEmail: 'colleague@example.com',
        relation: 'viewer',
      });

      expect(platformSDKMock.createGrant).toHaveBeenCalledWith({
        resource_type: 'run',
        resource_id: 'run-1',
        subject_type: 'user',
        subject_id: undefined,
        subject_email: 'colleague@example.com',
        relation: 'viewer',
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Grant created successfully:',
        JSON.stringify(grantResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.createGrant.mockRejectedValue(new Error('API error'));

      await createGrant('production', mockAuthService, {
        resourceType: 'run',
        resourceId: 'run-1',
        subjectType: 'user',
        relation: 'viewer',
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to create grant:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteRunResults', () => {
    it('should delete run results successfully', async () => {
      platformSDKMock.deleteRunResults.mockResolvedValue(undefined);

      await deleteRunResults('production', mockAuthService, 'run-1');

      expect(platformSDKMock.deleteRunResults).toHaveBeenCalledWith('run-1');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Successfully deleted results for run: run-1');
    });

    it('should handle API error', async () => {
      platformSDKMock.deleteRunResults.mockRejectedValue(new Error('API error'));

      await deleteRunResults('production', mockAuthService, 'run-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to delete run results:',
        expect.any(Error)
      );
    });
  });

  describe('listGrants', () => {
    it('should list grants successfully', async () => {
      const grantsResponse = [
        {
          grant_id: 'grant-1',
          resource_type: 'run',
          resource_id: 'run-1',
          subject_type: 'user',
          subject_id: 'user-1',
          relation: 'viewer',
          created_by: 'user-2',
          created_at: '2023-01-01T00:00:00Z',
          revoked: false,
        },
      ];
      platformSDKMock.listGrants.mockResolvedValue(grantsResponse);

      await listGrants('production', mockAuthService, { resourceId: 'run-1' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Grants:',
        JSON.stringify(grantsResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listGrants.mockRejectedValue(new Error('API error'));

      await listGrants('production', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Failed to list grants:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('getGrant', () => {
    it('should get grant details successfully', async () => {
      const grantResponse = {
        grant_id: 'grant-1',
        resource_type: 'run',
        resource_id: 'run-1',
        subject_type: 'user',
        subject_id: 'user-1',
        relation: 'viewer',
        created_by: 'user-2',
        created_at: '2023-01-01T00:00:00Z',
        revoked: false,
      };
      platformSDKMock.getGrant.mockResolvedValue(grantResponse);

      await getGrant('production', mockAuthService, 'grant-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Grant details for grant-1:',
        JSON.stringify(grantResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getGrant.mockRejectedValue(new Error('API error'));

      await getGrant('production', mockAuthService, 'grant-1');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Failed to get grant:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('revokeGrant', () => {
    it('should revoke a grant successfully', async () => {
      const grantResponse = {
        grant_id: 'grant-1',
        resource_type: 'run',
        resource_id: 'run-1',
        subject_type: 'user',
        subject_id: 'user-1',
        relation: 'viewer',
        created_by: 'user-2',
        created_at: '2023-01-01T00:00:00Z',
        revoked: true,
      };
      platformSDKMock.revokeGrant.mockResolvedValue(grantResponse);

      await revokeGrant('production', mockAuthService, 'grant-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Grant revoked successfully:',
        JSON.stringify(grantResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.revokeGrant.mockRejectedValue(new Error('API error'));

      await revokeGrant('production', mockAuthService, 'grant-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to revoke grant:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('createShareToken', () => {
    it('should create a share token successfully', async () => {
      const shareTokenResponse = {
        share_token_id: 'share-token-1',
        share_token: 'secret-value',
        created_at: '2023-01-01T00:00:00Z',
        expires_at: null,
        revoked: false,
      };
      platformSDKMock.createShareToken.mockResolvedValue(shareTokenResponse);

      await createShareToken('production', mockAuthService, { expiresAt: '2026-01-01T00:00:00Z' });

      expect(platformSDKMock.createShareToken).toHaveBeenCalledWith({
        expires_at: '2026-01-01T00:00:00Z',
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Share token created successfully:',
        JSON.stringify(shareTokenResponse, null, 2)
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '⚠️  Save the share_token value now — it will not be shown again.'
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.createShareToken.mockRejectedValue(new Error('API error'));

      await createShareToken('production', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to create share token:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listShareTokens', () => {
    it('should list share tokens successfully', async () => {
      const shareTokensResponse = [
        {
          share_token_id: 'share-token-1',
          created_at: '2023-01-01T00:00:00Z',
          expires_at: null,
          revoked: false,
        },
      ];
      platformSDKMock.listShareTokens.mockResolvedValue(shareTokensResponse);

      await listShareTokens('production', mockAuthService, { runId: 'run-1' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Share tokens:',
        JSON.stringify(shareTokensResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.listShareTokens.mockRejectedValue(new Error('API error'));

      await listShareTokens('production', mockAuthService);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to list share tokens:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('getShareToken', () => {
    it('should get share token details successfully', async () => {
      const shareTokenResponse = {
        share_token_id: 'share-token-1',
        created_at: '2023-01-01T00:00:00Z',
        expires_at: null,
        revoked: false,
      };
      platformSDKMock.getShareToken.mockResolvedValue(shareTokenResponse);

      await getShareToken('production', mockAuthService, 'share-token-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Share token details for share-token-1:',
        JSON.stringify(shareTokenResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.getShareToken.mockRejectedValue(new Error('API error'));

      await getShareToken('production', mockAuthService, 'share-token-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to get share token:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('revokeShareToken', () => {
    it('should revoke a share token successfully', async () => {
      const shareTokenResponse = {
        share_token_id: 'share-token-1',
        created_at: '2023-01-01T00:00:00Z',
        expires_at: null,
        revoked: true,
      };
      platformSDKMock.revokeShareToken.mockResolvedValue(shareTokenResponse);

      await revokeShareToken('production', mockAuthService, 'share-token-1');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Share token revoked successfully:',
        JSON.stringify(shareTokenResponse, null, 2)
      );
    });

    it('should handle API error', async () => {
      platformSDKMock.revokeShareToken.mockRejectedValue(new Error('API error'));

      await revokeShareToken('production', mockAuthService, 'share-token-1');

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Failed to revoke share token:',
        expect.any(Error)
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('resolveItemsInput', () => {
    let originalIsTTY: boolean | undefined;

    beforeEach(() => {
      originalIsTTY = process.stdin.isTTY;
      process.stdin.isTTY = true;
    });

    afterEach(() => {
      process.stdin.isTTY = originalIsTTY;
    });

    it('should prefer the inline items option', async () => {
      const result = await resolveItemsInput({ items: '[{"a":1}]', itemsFile: '/tmp/items.json' });

      expect(result).toBe('[{"a":1}]');
    });

    it('should read from the items file when no inline items are given', async () => {
      const itemsFile = join(tmpdir(), `resolve-items-input-${Date.now()}.json`);
      fs.writeFileSync(itemsFile, '[{"b":2}]');

      try {
        const result = await resolveItemsInput({ itemsFile });

        expect(result).toBe('[{"b":2}]');
      } finally {
        fs.unlinkSync(itemsFile);
      }
    });

    it('should default to an empty array when running interactively with no options', async () => {
      const result = await resolveItemsInput({});

      expect(result).toBe('[]');
    });

    it('should read items piped via stdin when no options are given', async () => {
      const stdinStream = Readable.from([
        Buffer.from('[{"c":3}]'),
      ]) as unknown as typeof process.stdin;
      stdinStream.isTTY = false;
      const originalStdin = process.stdin;
      process.stdin = stdinStream;

      const result = await resolveItemsInput({});

      expect(result).toBe('[{"c":3}]');

      process.stdin = originalStdin;
    });

    it('should default to an empty array when stdin is piped but empty', async () => {
      const stdinStream = Readable.from([]) as unknown as typeof process.stdin;
      stdinStream.isTTY = false;
      const originalStdin = process.stdin;
      process.stdin = stdinStream;

      const result = await resolveItemsInput({});

      expect(result).toBe('[]');

      process.stdin = originalStdin;
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

  describe('handleLoginWithRefreshToken', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should successfully login with refresh token', async () => {
      const environment: EnvironmentKey = 'production';
      const refreshToken = 'test-refresh-token';

      vi.spyOn(mockAuthService, 'loginWithRefreshToken').mockResolvedValue(undefined);

      await handleLoginWithRefreshToken(environment, refreshToken, mockAuthService);

      expect(mockAuthService.loginWithRefreshToken).toHaveBeenCalledWith(environment, refreshToken);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle login failure and exit process', async () => {
      const environment: EnvironmentKey = 'production';
      const refreshToken = 'invalid-refresh-token';
      const error = new Error('Invalid refresh token');

      vi.spyOn(mockAuthService, 'loginWithRefreshToken').mockRejectedValue(error);

      await expect(
        handleLoginWithRefreshToken(environment, refreshToken, mockAuthService)
      ).rejects.toThrow('process.exit called');

      expect(mockAuthService.loginWithRefreshToken).toHaveBeenCalledWith(environment, refreshToken);
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Login with refresh token failed:', error);
    });

    it('should handle network errors during login', async () => {
      const environment: EnvironmentKey = 'staging';
      const refreshToken = 'test-refresh-token';
      const networkError = new Error('Network request failed');

      vi.spyOn(mockAuthService, 'loginWithRefreshToken').mockRejectedValue(networkError);

      await expect(
        handleLoginWithRefreshToken(environment, refreshToken, mockAuthService)
      ).rejects.toThrow('process.exit called');

      expect(mockAuthService.loginWithRefreshToken).toHaveBeenCalledWith(environment, refreshToken);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Login with refresh token failed:',
        networkError
      );
    });
  });
});
