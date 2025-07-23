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

      try {
        await main();
        expect.fail('Expected main() to throw an error when applicationId is missing');
      } catch (error) {
        expect(error.message).toMatch(/process\.exit.*1/);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Not enough non-option arguments')
        );
      }
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

      try {
        await main();
        expect.fail('Expected main() to throw an error when applicationRunId is missing');
      } catch (error) {
        expect(error.message).toMatch(/process\.exit.*1/);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Not enough non-option arguments')
        );
      }
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

      try {
        await main();
        expect.fail('Expected main() to throw an error when applicationRunId is missing');
      } catch (error) {
        expect(error.message).toMatch(/process\.exit.*1/);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Not enough non-option arguments')
        );
      }
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

      try {
        await main();
        expect.fail('Expected main() to throw an error when applicationRunId is missing');
      } catch (error) {
        expect(error.message).toMatch(/process\.exit.*1/);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Not enough non-option arguments')
        );
      }
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
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js', '--help'];

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

    it('should require a command', async () => {
      // Mock process.argv for yargs
      process.argv = ['node', 'cli.js'];

      try {
        await main();
        // If we reach here, the test should fail because we expected an error
        expect.fail('Expected main() to throw an error when no command is provided');
      } catch (error) {
        // Yargs calls process.exit(1) when validation fails
        // The exact error message format depends on how the mock is set up
        expect(error.message).toMatch(/process\.exit.*1/);
        // The error message is written to console.error, so check that too
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'You need at least one command before moving on'
        );
      }
    });
  });
});
