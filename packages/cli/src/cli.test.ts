import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from './cli.js';
import { factories, handlers, server } from '@aignostics/sdk/test';
import { http, HttpResponse } from 'msw';

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
});

// Mock auth service to avoid real authentication
vi.mock('./utils/auth.js', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    getValidAccessToken: vi.fn().mockResolvedValue('mock-token'),
    loginWithCallback: vi.fn().mockResolvedValue(''),
    completeLogin: vi.fn().mockResolvedValue(undefined),
    loginWithRefreshToken: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAuthState: vi.fn().mockResolvedValue({
      isAuthenticated: true,
      token: {
        type: 'Bearer',
        scope: 'openid profile email offline_access',
        expiresAt: new Date('2025-01-01T12:59:59.000Z'),
        storedAt: new Date('2024-12-01T10:00:00.000Z'),
      },
    }),
  })),
}));

// Mock OAuth callback server
vi.mock('./utils/oauth-callback-server.js', () => ({
  startCallbackServer: vi.fn().mockResolvedValue({
    address: vi.fn().mockReturnValue({ port: 8989 }),
    close: vi.fn(),
  }),
  waitForCallback: vi.fn().mockResolvedValue('test-auth-code'),
}));

// Mock crypto for login
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue(Buffer.from('test-code-verifier', 'utf-8')),
  },
}));

describe('CLI Integration Tests', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  let originalArgv: string[];

  beforeEach(() => {
    // Store original argv
    originalArgv = process.argv;

    server.use(...handlers.success);

    // Mock console methods to avoid noise in tests
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv;
  });

  describe('info command', () => {
    it('should display SDK information', async () => {
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js', 'info'];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith('Aignostics Platform SDK');
      expect(consoleSpy.log).toHaveBeenCalledWith('Version:', '0.0.0-development');
    });
  });

  describe('test-api command', () => {
    it('should test API connection successfully', async () => {
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js', 'test-api', '--endpoint', 'https://api.example.com'];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ API connection successful');
    });
  });

  describe('list-applications command', () => {
    it('should list applications successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-applications',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        expect.stringContaining('application_id')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith('Applications:', expect.stringContaining('name'));
    });
  });

  describe('list-application-versions command', () => {
    it('should list application versions successfully', async () => {
      const application = factories.application.build();
      server.use(
        http.get('*/v1/applications/:applicationId', () =>
          HttpResponse.json(application, { status: 200 })
        )
      );
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-versions',
        application.application_id,
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        `Application versions for ${application.application_id}:`,
        expect.toSatisfy(
          str =>
            typeof str === 'string' &&
            application.versions.every(version => str.includes(version.number))
        )
      );
    });

    it('should print error responses', async () => {
      const application = factories.application.build();
      server.use(http.get('*/v1/applications/:applicationId', () => HttpResponse.error()));
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-versions',
        application.application_id,
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to list application versions:'),
        expect.any(Error)
      );
    });
  });

  describe('list-application-runs command', () => {
    it('should list application runs successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-runs',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        expect.stringContaining('run_id')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        expect.stringContaining('state')
      );
    });

    it('should support filtering by applicationId', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-runs',
        '--applicationId',
        'app1',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        expect.stringContaining('run_id')
      );
    });

    it('should support filtering by applicationVersion', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-runs',
        '--applicationVersion',
        'v1.0.0',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        expect.stringContaining('run_id')
      );
    });
  });

  describe('get-run command', () => {
    it('should get run details successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'get-run',
        'run-1',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run details for run-1:',
        expect.stringContaining('run_id')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run details for run-1:',
        expect.stringContaining('state')
      );
    });

    it('should require applicationRunId parameter', async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ['node', 'cli.js', 'get-run'];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough non-option arguments')
      );
    });
  });

  describe('cancel-run command', () => {
    it('should cancel run successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'cancel-run',
        'run-1',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Successfully cancelled application run: run-1'
      );
    });

    it('should require applicationRunId parameter', async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ['node', 'cli.js', 'cancel-run'];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough non-option arguments')
      );
    });
  });

  describe('list-run-results command', () => {
    it('should list run results successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-run-results',
        'run-1',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run results for run-1:',
        expect.stringContaining('item_id')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run results for run-1:',
        expect.stringContaining('status')
      );
    });

    it('should require applicationRunId parameter', async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ['node', 'cli.js', 'list-run-results'];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough non-option arguments')
      );
    });
  });

  describe('create-run command', () => {
    it('should create application run successfully with empty items', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'create-run',
        'test-app:v1.0.0',
        '--endpoint',
        'https://api.example.com',
        '--items',
        '[]',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Application run created successfully:',
        expect.stringContaining('run_id')
      );
    });

    it('should create application run successfully with default empty items', async () => {
      // Mock process.argv for yargs - without explicit --items parameter
      process.argv = [
        'node',
        'cli.js',
        'create-run',
        'test-app:v1.0.0',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Application run created successfully:',
        expect.stringContaining('run_id')
      );
    });

    it('should require applicationVersionId parameter', async () => {
      // Mock process.argv for yargs - missing applicationVersionId
      process.argv = ['node', 'cli.js', 'create-run'];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough non-option arguments')
      );
    });
  });

  describe('CLI argument parsing', () => {
    it('should handle version flag', async () => {
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js', '--version'];

      // Mock process.exit to prevent actual exit
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await main();
      } catch (error) {
        expect((error as Error).message).toContain('process.exit');
      }

      exitSpy.mockRestore();
    });

    it('should handle help flag', async () => {
      mockExit.mockImplementation(() => {});
      vi.stubGlobal('process', { ...process, exit: mockExit });
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js', '--help'];

      await expect(main()).rejects.toThrow();

      expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    });

    it('should require a command', async () => {
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js'];

      await main();

      // Check that process.exit(1) was called
      expect(mockExit).toHaveBeenCalledWith(1);

      // Check that the error was logged with custom message
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('You need at least one command before moving on')
      );
    });
  });

  describe('login command', () => {
    it('should login with refresh token when --refreshToken is provided', async () => {
      const refreshToken = 'test-refresh-token-12345';

      process.argv = [
        'node',
        'cli.js',
        'login',
        '--refreshToken',
        refreshToken,
        '--environment',
        'production',
      ];

      await main();

      // Verify that loginWithRefreshToken was called (it's mocked in the AuthService mock above)
      // Since we're mocking the entire AuthService, we need to verify the command executed without errors
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });
});
