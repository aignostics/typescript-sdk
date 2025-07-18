import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleInfo, testApi, listApplications } from './cli-functions';
import { setMockScenario, mockResponses } from '../test-utils/http-mocks';

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
});

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
      setMockScenario('success');

      await testApi('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ API connection successful');
    });

    it('should handle API connection failure', async () => {
      // Set up mock server for error response
      setMockScenario('error');

      await testApi('https://api.example.com');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle network errors', async () => {
      // Set up mock server for network error
      setMockScenario('networkError');

      await testApi('https://api.example.com');

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ API connection failed:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('listApplications', () => {
    it('should list applications successfully', async () => {
      // Set up mock server for successful response
      setMockScenario('success');

      await listApplications('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(mockResponses.applicationsSuccess, null, 2)
      );
    });

    it('should handle empty applications list', async () => {
      // Set up mock server for empty response
      setMockScenario('empty');

      await listApplications('https://api.example.com');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        JSON.stringify(mockResponses.applicationsEmpty, null, 2)
      );
    });

    it('should throw error when API fails', async () => {
      // Set up mock server for error response
      setMockScenario('error');

      await expect(listApplications('https://api.example.com')).rejects.toThrow();
    });
  });
});
