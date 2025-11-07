import { execa, Options } from 'execa';
import path from 'path';

const CLI_BIN = path.resolve(__dirname, '../../dist/bin.cjs');

const testEnvironment: string = process.env.E2E_TEST_ENVIRONMENT || 'staging';
/**
 * Execute the CLI command with default options
 *
 * @param args - CLI command arguments
 * @param options - Additional execa options
 * @returns Promise with the execution result
 */
export function executeCLI(args: string[] = [], options: Options = {}) {
  return execa('node', [CLI_BIN, ...args, '--environment', testEnvironment], options);
}
