import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from './cli.js';

// Mock the CLI functions to avoid side effects
vi.mock('./cli-functions', () => ({
  // eslint-disable-next-line @typescript-eslint/require-await
  handleInfo: vi.fn(async () => {
    console.log('Aignostics Platform SDK');
    console.log('Version:', '0.0.0-development');
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  testApi: vi.fn(async () => {
    console.log('✅ API connection successful');
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  listApplications: vi.fn(async () => {
    console.log(
      'Applications:',
      JSON.stringify(
        [
          { application_id: '1', name: 'Test App 1' },
          { application_id: '2', name: 'Test App 2' },
        ],
        null,
        2
      )
    );
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  listApplicationVersions: vi.fn(async () => {
    console.log(
      'Application versions for app1:',
      JSON.stringify(
        [
          {
            application_version_id: 'v1.0.0',
            version: '1.0.0',
            application_id: 'app1',
            changelog: 'Initial version',
          },
        ],
        null,
        2
      )
    );
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  listApplicationRuns: vi.fn(async () => {
    console.log(
      'Application runs:',
      JSON.stringify(
        [
          {
            application_run_id: 'run-1',
            application_version_id: 'v1.0.0',
            status: 'COMPLETED',
            created_at: '2023-01-01T00:00:00Z',
          },
        ],
        null,
        2
      )
    );
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  getRun: vi.fn(async () => {
    console.log(
      'Run details for run-1:',
      JSON.stringify(
        {
          application_run_id: 'run-1',
          application_version_id: 'v1.0.0',
          status: 'COMPLETED',
          created_at: '2023-01-01T00:00:00Z',
        },
        null,
        2
      )
    );
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  cancelApplicationRun: vi.fn(async () => {
    console.log('✅ Successfully cancelled application run: run-1');
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  listRunResults: vi.fn(async () => {
    console.log(
      'Run results for run-1:',
      JSON.stringify(
        [
          {
            item_id: 'item-1',
            reference: 'test-ref-1',
            status: 'SUCCEEDED',
            created_at: '2023-01-01T00:00:00Z',
          },
        ],
        null,
        2
      )
    );
  }),
  // eslint-disable-next-line @typescript-eslint/require-await
  createApplicationRun: vi.fn(async () => {
    console.log(
      '✅ Application run created successfully:',
      JSON.stringify({ application_run_id: 'run-123' }, null, 2)
    );
  }),
}));

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal('process', {
  ...process,
  exit: mockExit,
});

describe('CLI Integration Tests', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  let originalArgv: string[];

  beforeEach(() => {
    // Store original argv
    originalArgv = process.argv;

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
        expect.stringContaining('Test App 1')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Applications:',
        expect.stringContaining('Test App 2')
      );
    });
  });

  describe('list-application-versions command', () => {
    it('should list application versions successfully', async () => {
      // Mock process.argv for yargs
      process.argv = [
        'node',
        'cli.js',
        'list-application-versions',
        'app1',
        '--endpoint',
        'https://api.example.com',
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application versions for app1:',
        expect.stringContaining('v1.0.0')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application versions for app1:',
        expect.stringContaining('Initial version')
      );
    });

    it('should require applicationId parameter', async () => {
      // Mock process.argv for yargs - missing applicationId
      process.argv = ['node', 'cli.js', 'list-application-versions'];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Not enough non-option arguments')
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
        expect.stringContaining('run-1')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Application runs:',
        expect.stringContaining('COMPLETED')
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
        expect.stringContaining('run-1')
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
        expect.stringContaining('run-1')
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
        expect.stringContaining('run-1')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run details for run-1:',
        expect.stringContaining('COMPLETED')
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
        expect.stringContaining('item-1')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Run results for run-1:',
        expect.stringContaining('SUCCEEDED')
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
        expect.stringContaining('run-123')
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
        expect.stringContaining('run-123')
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
        expect(error.message).toContain('process.exit');
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
});
