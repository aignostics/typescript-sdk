import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from './cli';

// Mock the CLI functions to avoid side effects
vi.mock('./cli-functions', () => ({
  handleInfo: vi.fn(async () => {
    console.log('Aignostics Platform SDK');
    console.log('Version:', '0.0.0-development');
  }),
  testApi: vi.fn(async () => {
    console.log('✅ API connection successful');
  }),
  listApplications: vi.fn(async () => {
    console.log(
      'Applications:',
      JSON.stringify(
        [
          { id: '1', name: 'Test App 1' },
          { id: '2', name: 'Test App 2' },
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
