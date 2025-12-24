import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
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
  handleLoginWithRefreshToken,
  getApplicationVersionDetails,
} from './cli-functions.js';
import { EnvironmentKey, environmentConfig } from './utils/environment.js';
import { AuthenticationError } from '@aignostics/sdk';

// Create a shared auth service instance for the CLI
const authService = new AuthService(new FileSystemTokenStorage());

// Zod schema for environment validation
const environmentSchema = z.enum(
  Object.keys(environmentConfig) as [EnvironmentKey, ...EnvironmentKey[]]
);

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
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return testApi(env, authService);
      }
    )
    .command(
      'list-applications',
      'List applications',
      yargs => yargs,
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return listApplications(env, authService);
      }
    )
    .command(
      'list-application-versions <applicationId>',
      'List application versions',
      yargs =>
        yargs.positional('applicationId', {
          describe: 'Application ID',
          type: 'string',
          demandOption: true,
        }),
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return listApplicationVersions(env, authService, argv.applicationId);
      }
    )
    .command(
      'get-application-version-details <applicationId> <versionNumber>',
      'Get application version details',
      yargs =>
        yargs
          .positional('applicationId', {
            describe: 'Application ID to get version details for',
            type: 'string',
            demandOption: true,
          })
          .positional('versionNumber', {
            describe: 'Version number of the application to get details for',
            type: 'string',
            demandOption: true,
          }),
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return getApplicationVersionDetails(
          env,
          authService,
          argv.applicationId,
          argv.versionNumber
        );
      }
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
          })
          .option('customMetadata', {
            describe: 'Filter by metadata key-value pairs (JSONPath string)',
            type: 'string',
          })
          .option('sort', {
            describe:
              'Sort by field (e.g., "run_id", "-status", "submitted_at"). Fields: run_id, application_version_id, organization_id, status, submitted_at, submitted_by.',
            type: 'string',
          }),
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return listApplicationRuns(env, authService, {
          applicationId: argv.applicationId,
          applicationVersion: argv.applicationVersion,
          customMetadata: argv.customMetadata,
          sort: argv.sort,
        });
      }
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
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return getRun(env, authService, argv.applicationRunId);
      }
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
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return cancelApplicationRun(env, authService, argv.applicationRunId);
      }
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
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return listRunResults(env, authService, argv.applicationRunId);
      }
    )
    .command(
      'create-run <applicationId> <versionNumber>',
      'Create a new application run',
      yargs =>
        yargs
          .positional('applicationId', {
            describe: 'Application ID to run',
            type: 'string',
            demandOption: true,
          })
          .positional('versionNumber', {
            describe: 'Version number of the application to run',
            type: 'string',
            demandOption: true,
          })
          .option('items', {
            describe: 'JSON string of items to process (array of objects)',
            type: 'string',
            default: '[]',
          }),
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return createApplicationRun(
          env,
          authService,
          argv.applicationId,
          argv.versionNumber,
          argv.items
        );
      }
    )
    .command(
      'login',
      'Login to the Aignostics Platform',
      yargs =>
        yargs.option('refreshToken', {
          describe: 'Refresh token to use for login',
          type: 'string',
          demandOption: false,
        }),
      async argv => {
        const env = environmentSchema.parse(argv.environment);
        if (argv.refreshToken) {
          await handleLoginWithRefreshToken(env, argv.refreshToken, authService);
          return;
        }
        await handleLogin(env, authService);
      }
    )
    .command('logout', 'Logout and remove stored token', {}, async argv => {
      const env = environmentSchema.parse(argv.environment);
      await handleLogout(env, authService);
    })
    .command('status', 'Check authentication status', {}, async argv => {
      const env = environmentSchema.parse(argv.environment);
      await handleStatus(env, authService);
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
