import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AuthService } from './utils/auth.js';
import { FileSystemTokenStorage } from './utils/token-storage.js';

import {
  handleInfo,
  testApi,
  listApplications,
  listApplicationVersions,
  listApplicationRuns,
  getRun,
  cancelApplicationRun,
  listRunResults,
  createApplicationRun,
  handleLogin,
  handleLogout,
  handleStatus,
} from './cli-functions.js';
import { EnvironmentKey, environmentConfig } from './utils/environment.js';
import { AuthenticationError } from '@aignostics/sdk';

// Create a shared auth service instance for the CLI
const authService = new AuthService(new FileSystemTokenStorage());

/**
 * CLI for the Aignostics Platform SDK
 */
export async function main() {
  await yargs(hideBin(process.argv))
    .strict()
    .scriptName('aignostics-platform')
    .usage('Usage: $0 <command> [options]')
    .option('environment', {
      describe: 'Environment to use (e.g., production, staging)',
      type: 'string',
      default: 'production',
      choices: Object.keys(environmentConfig),
    })
    .command('info', 'Display SDK information', {}, handleInfo)
    .command(
      'test-api',
      'Test API connection',
      yargs => yargs,
      argv => testApi(argv.environment as EnvironmentKey, authService)
    )
    .command(
      'list-applications',
      'List applications',
      yargs => yargs,
      argv => listApplications(argv.environment as EnvironmentKey, authService)
    )
    .command(
      'list-application-versions <applicationId>',
      'List versions for a specific application',
      yargs =>
        yargs.positional('applicationId', {
          describe: 'Application ID to get versions for',
          type: 'string',
          demandOption: true,
        }),
      argv =>
        listApplicationVersions(argv.environment as EnvironmentKey, authService, argv.applicationId)
    )
    .command(
      'list-application-runs',
      'List application runs',
      yargs =>
        yargs
          .option('applicationId', {
            describe: 'Filter by application ID',
            type: 'string',
          })
          .option('applicationVersion', {
            describe: 'Filter by application version',
            type: 'string',
          }),
      argv =>
        listApplicationRuns(argv.environment as EnvironmentKey, authService, {
          applicationId: argv.applicationId,
          applicationVersion: argv.applicationVersion,
        })
    )
    .command(
      'get-run <applicationRunId>',
      'Get details of a specific application run',
      yargs =>
        yargs.positional('applicationRunId', {
          describe: 'Application run ID to get details for',
          type: 'string',
          demandOption: true,
        }),
      argv => getRun(argv.environment as EnvironmentKey, authService, argv.applicationRunId)
    )
    .command(
      'cancel-run <applicationRunId>',
      'Cancel a specific application run',
      yargs =>
        yargs.positional('applicationRunId', {
          describe: 'Application run ID to cancel',
          type: 'string',
          demandOption: true,
        }),
      argv =>
        cancelApplicationRun(argv.environment as EnvironmentKey, authService, argv.applicationRunId)
    )
    .command(
      'list-run-results <applicationRunId>',
      'List results for a specific application run',
      yargs =>
        yargs.positional('applicationRunId', {
          describe: 'Application run ID to get results for',
          type: 'string',
          demandOption: true,
        }),
      argv => listRunResults(argv.environment as EnvironmentKey, authService, argv.applicationRunId)
    )
    .command(
      'create-run <applicationVersionId>',
      'Create a new application run',
      yargs =>
        yargs
          .positional('applicationVersionId', {
            describe: 'Application version ID to run',
            type: 'string',
            demandOption: true,
          })
          .option('items', {
            describe: 'JSON string of items to process (array of objects)',
            type: 'string',
            default: '[]',
          }),
      argv =>
        createApplicationRun(
          argv.environment as EnvironmentKey,
          authService,
          argv.applicationVersionId,
          argv.items
        )
    )
    .command('login', 'Login to the Aignostics Platform', {}, async argv => {
      await handleLogin(argv.environment as EnvironmentKey, authService);
    })
    .command('logout', 'Logout and remove stored token', {}, async argv => {
      await handleLogout(argv.environment as EnvironmentKey, authService);
    })
    .command('status', 'Check authentication status', {}, async argv => {
      await handleStatus(argv.environment as EnvironmentKey, authService);
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .demandCommand(1, 'You need at least one command before moving on')
    .fail((msg, err) => {
      if (err === undefined) {
        console.error(`❌ ${msg}`);
      } else if (err instanceof AuthenticationError) {
        console.error('❌ Authentication error, please use the login command to reauthenticate');
      } else {
        console.error(`❌ An unexpected error occurred: ${err}`);
      }
      process.exit(1);
    })
    .parse();
}
