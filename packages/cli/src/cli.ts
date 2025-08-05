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
    .option('endpoint', {
      describe: 'API endpoint to use',
      type: 'string',
      default: 'https://platform.aignostics.com',
    })
    .command('info', 'Display SDK information', {}, handleInfo)
    .command(
      'test-api',
      'Test API connection',
      {
        endpoint: {
          describe: 'API endpoint to test',
          type: 'string',
          default: 'https://platform.aignostics.com',
        },
      },
      yargs => testApi(yargs.endpoint, authService)
    )
    .command(
      'list-applications',
      'List applications',
      {
        endpoint: {
          describe: 'API endpoint to test',
          type: 'string',
          default: 'https://platform.aignostics.com',
        },
      },
      argv => listApplications(argv.endpoint, authService)
    )
    .command(
      'list-application-versions <applicationId>',
      'List versions for a specific application',
      yargs =>
        yargs
          .positional('applicationId', {
            describe: 'Application ID to get versions for',
            type: 'string',
            demandOption: true,
          })
          .option('endpoint', {
            describe: 'API endpoint to use',
            type: 'string',
            default: 'https://platform.aignostics.com',
          }),
      argv => listApplicationVersions(argv.endpoint, authService, argv.applicationId)
    )
    .command(
      'list-application-runs',
      'List application runs',
      {
        endpoint: {
          describe: 'API endpoint to use',
          type: 'string',
          default: 'https://platform.aignostics.com',
        },
        applicationId: {
          describe: 'Filter by application ID',
          type: 'string',
        },
        applicationVersion: {
          describe: 'Filter by application version',
          type: 'string',
        },
      },
      argv =>
        listApplicationRuns(argv.endpoint, authService, {
          applicationId: argv.applicationId,
          applicationVersion: argv.applicationVersion,
        })
    )
    .command(
      'get-run <applicationRunId>',
      'Get details of a specific application run',
      yargs =>
        yargs
          .positional('applicationRunId', {
            describe: 'Application run ID to get details for',
            type: 'string',
            demandOption: true,
          })
          .option('endpoint', {
            describe: 'API endpoint to use',
            type: 'string',
            default: 'https://platform.aignostics.com',
          }),
      argv => getRun(argv.endpoint, authService, argv.applicationRunId)
    )
    .command(
      'cancel-run <applicationRunId>',
      'Cancel a specific application run',
      yargs =>
        yargs
          .positional('applicationRunId', {
            describe: 'Application run ID to cancel',
            type: 'string',
            demandOption: true,
          })
          .option('endpoint', {
            describe: 'API endpoint to use',
            type: 'string',
            default: 'https://platform.aignostics.com',
          }),
      argv => cancelApplicationRun(argv.endpoint, authService, argv.applicationRunId)
    )
    .command(
      'list-run-results <applicationRunId>',
      'List results for a specific application run',
      yargs =>
        yargs
          .positional('applicationRunId', {
            describe: 'Application run ID to get results for',
            type: 'string',
            demandOption: true,
          })
          .option('endpoint', {
            describe: 'API endpoint to use',
            type: 'string',
            default: 'https://platform.aignostics.com',
          }),
      argv => listRunResults(argv.endpoint, authService, argv.applicationRunId)
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
          .option('endpoint', {
            describe: 'API endpoint to use',
            type: 'string',
            default: 'https://platform.aignostics.com',
          })
          .option('items', {
            describe: 'JSON string of items to process (array of objects)',
            type: 'string',
            default: '[]',
          }),
      argv =>
        createApplicationRun(argv.endpoint, authService, argv.applicationVersionId, argv.items)
    )
    .command(
      'login',
      'Login to the Aignostics Platform',
      {
        issuerURL: {
          describe: 'Issuer URL for OpenID Connect',
          type: 'string',
          // defaults to the production issues URL
          default: 'https://aignostics-platform.eu.auth0.com/oauth',
        },
        clientID: {
          describe: 'Client ID for the application',
          type: 'string',
          // defaults to the production client id
          default: 'YtJ7F9lAtxx16SZGQlYPe6wcjlXB78MM',
        },
      },
      async argv => {
        await handleLogin(argv.issuerURL, argv.clientID, authService);
      }
    )
    .command('logout', 'Logout and remove stored token', {}, async () => {
      await handleLogout(authService);
    })
    .command('status', 'Check authentication status', {}, async () => {
      await handleStatus(authService);
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
}
