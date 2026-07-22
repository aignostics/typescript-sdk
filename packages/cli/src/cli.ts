import yargs from 'yargs';
import type { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import { AuthService } from './utils/auth.js';
import { FileSystemTokenStorage } from './utils/token-storage.js';

import {
  handleInfo,
  testApi,
  listApplications,
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
  getApplicationVersionDetails,
  createGrant,
  listGrants,
  getGrant,
  revokeGrant,
  createShareToken,
  listShareTokens,
  getShareToken,
  revokeShareToken,
} from './cli-functions.js';
import { EnvironmentKey, environmentConfig } from './utils/environment.js';
import {
  AuthenticationError,
  type ResourceType,
  type SubjectType,
  type GrantRelation,
} from '@aignostics/sdk';

// Create a shared auth service instance for the CLI
const authService = new AuthService(new FileSystemTokenStorage());

// Zod schema for environment validation
const environmentSchema = z.enum(
  Object.keys(environmentConfig) as [EnvironmentKey, ...EnvironmentKey[]]
);

function buildRunItemMetadataCommands(itemMetadataYargs: Argv) {
  return itemMetadataYargs
    .command(
      'set <applicationRunId> <externalId> <customMetadata>',
      'Set (replace) the custom metadata for an item',
      yargs =>
        yargs
          .positional('applicationRunId', {
            describe: 'Application run ID containing the item',
            type: 'string',
            demandOption: true,
          })
          .positional('externalId', {
            describe: 'External ID of the item to set custom metadata for',
            type: 'string',
            demandOption: true,
          })
          .positional('customMetadata', {
            describe: 'Custom metadata as a JSON object string (or "null" to clear it)',
            type: 'string',
            demandOption: true,
          }),
      argv => {
        const env = environmentSchema.parse(argv.environment);
        return updateRunItemMetadata(
          env,
          authService,
          argv.applicationRunId,
          argv.externalId,
          argv.customMetadata
        );
      }
    )
    .demandCommand(1, 'You need at least one metadata subcommand');
}

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
      'applications',
      'Manage applications',
      appYargs =>
        appYargs
          .command(
            'list',
            'List applications',
            yargs => yargs,
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return listApplications(env, authService);
            }
          )
          .command(
            'get <applicationId>',
            'Get application details',
            yargs =>
              yargs.positional('applicationId', {
                describe: 'Application ID to get details for',
                type: 'string',
                demandOption: true,
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return getApplicationDetails(env, authService, argv.applicationId);
            }
          )
          .command(
            'versions',
            'Manage application versions',
            versionsYargs =>
              versionsYargs
                .command(
                  'list <applicationId>',
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
                  'get <applicationId> <versionNumber>',
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
                .demandCommand(1, 'You need at least one versions subcommand'),
            () => undefined
          )
          .demandCommand(1, 'You need at least one applications subcommand'),
      () => undefined
    )
    .command(
      'runs',
      'Manage application runs',
      runsYargs =>
        runsYargs
          .command(
            'create <applicationId> <versionNumber>',
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
                })
                .option('itemsFile', {
                  describe: 'Path to a JSON file containing the items to process',
                  type: 'string',
                })
                .conflicts('items', 'itemsFile'),
            async argv => {
              const env = environmentSchema.parse(argv.environment);
              const itemsJson = await resolveItemsInput({
                items: argv.items,
                itemsFile: argv.itemsFile,
              });
              return createApplicationRun(
                env,
                authService,
                argv.applicationId,
                argv.versionNumber,
                itemsJson
              );
            }
          )
          .command(
            'list',
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
            'get <applicationRunId>',
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
            'cancel <applicationRunId>',
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
            'metadata',
            'Manage application run custom metadata',
            metadataYargs =>
              metadataYargs
                .command(
                  'set <applicationRunId> <customMetadata>',
                  'Set (replace) the custom metadata for a run',
                  yargs =>
                    yargs
                      .positional('applicationRunId', {
                        describe: 'Application run ID to set custom metadata for',
                        type: 'string',
                        demandOption: true,
                      })
                      .positional('customMetadata', {
                        describe: 'Custom metadata as a JSON object string (or "null" to clear it)',
                        type: 'string',
                        demandOption: true,
                      }),
                  argv => {
                    const env = environmentSchema.parse(argv.environment);
                    return updateRunMetadata(
                      env,
                      authService,
                      argv.applicationRunId,
                      argv.customMetadata
                    );
                  }
                )
                .demandCommand(1, 'You need at least one metadata subcommand'),
            () => undefined
          )
          .command(
            'results',
            'Manage application run results',
            resultsYargs =>
              resultsYargs
                .command(
                  'list <applicationRunId>',
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
                  'delete <applicationRunId>',
                  'Delete results for a specific application run',
                  yargs =>
                    yargs.positional('applicationRunId', {
                      describe: 'Application run ID to delete results for',
                      type: 'string',
                      demandOption: true,
                    }),
                  argv => {
                    const env = environmentSchema.parse(argv.environment);
                    return deleteRunResults(env, authService, argv.applicationRunId);
                  }
                )
                .demandCommand(1, 'You need at least one results subcommand'),
            () => undefined
          )
          .command(
            'items',
            'Manage individual items within an application run',
            itemsYargs =>
              itemsYargs
                .command(
                  'get <applicationRunId> <externalId>',
                  'Get details of a specific item within an application run',
                  yargs =>
                    yargs
                      .positional('applicationRunId', {
                        describe: 'Application run ID containing the item',
                        type: 'string',
                        demandOption: true,
                      })
                      .positional('externalId', {
                        describe: 'External ID of the item to get',
                        type: 'string',
                        demandOption: true,
                      }),
                  argv => {
                    const env = environmentSchema.parse(argv.environment);
                    return getRunItem(env, authService, argv.applicationRunId, argv.externalId);
                  }
                )
                .command(
                  'metadata',
                  'Manage custom metadata for an item within an application run',
                  buildRunItemMetadataCommands,
                  () => undefined
                )
                .demandCommand(1, 'You need at least one items subcommand'),
            () => undefined
          )
          .demandCommand(1, 'You need at least one runs subcommand'),
      () => undefined
    )
    .command(
      'grants',
      'Manage access grants',
      grantsYargs =>
        grantsYargs
          .command(
            'create',
            'Create a grant to share access to a resource',
            yargs =>
              yargs
                .option('resourceType', {
                  describe: 'Type of resource to grant access to',
                  type: 'string',
                  choices: ['run', 'item', 'output_artifact', 'share_token'],
                  demandOption: true,
                })
                .option('resourceId', {
                  describe: 'ID of the resource to grant access to',
                  type: 'string',
                  demandOption: true,
                })
                .option('subjectType', {
                  describe: 'Type of subject to grant access to',
                  type: 'string',
                  choices: ['user', 'organization_admin', 'organization_user', 'share_token'],
                  demandOption: true,
                })
                .option('subjectId', {
                  describe: 'ID of the subject to grant access to',
                  type: 'string',
                })
                .option('subjectEmail', {
                  describe: 'Email of the user subject to grant access to',
                  type: 'string',
                })
                .option('relation', {
                  describe: 'Relation to grant',
                  type: 'string',
                  choices: ['owner', 'editor', 'viewer'],
                  demandOption: true,
                }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return createGrant(env, authService, {
                resourceType: argv.resourceType as ResourceType,
                resourceId: argv.resourceId,
                subjectType: argv.subjectType as SubjectType,
                subjectId: argv.subjectId,
                subjectEmail: argv.subjectEmail,
                relation: argv.relation as GrantRelation,
              });
            }
          )
          .command(
            'list',
            'List grants',
            yargs =>
              yargs
                .option('resourceType', {
                  describe: 'Filter by resource type',
                  type: 'string',
                  choices: ['run', 'item', 'output_artifact', 'share_token'],
                })
                .option('resourceId', {
                  describe: 'Filter by resource ID',
                  type: 'string',
                })
                .option('subjectType', {
                  describe: 'Filter by subject type',
                  type: 'string',
                  choices: ['user', 'organization_admin', 'organization_user', 'share_token'],
                })
                .option('subjectId', {
                  describe: 'Filter by subject ID',
                  type: 'string',
                })
                .option('revoked', {
                  describe: 'Filter by revocation status',
                  type: 'boolean',
                })
                .option('sort', {
                  describe: 'Sort by field (e.g., "-created_at")',
                  type: 'string',
                }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return listGrants(env, authService, {
                resourceType: argv.resourceType as ResourceType | undefined,
                resourceId: argv.resourceId,
                subjectType: argv.subjectType as SubjectType | undefined,
                subjectId: argv.subjectId,
                revoked: argv.revoked,
                sort: argv.sort,
              });
            }
          )
          .command(
            'get <grantId>',
            'Get details of a specific grant',
            yargs =>
              yargs.positional('grantId', {
                describe: 'Grant ID to get details for',
                type: 'string',
                demandOption: true,
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return getGrant(env, authService, argv.grantId);
            }
          )
          .command(
            'revoke <grantId>',
            'Revoke a specific grant',
            yargs =>
              yargs.positional('grantId', {
                describe: 'Grant ID to revoke',
                type: 'string',
                demandOption: true,
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return revokeGrant(env, authService, argv.grantId);
            }
          )
          .demandCommand(1, 'You need at least one grants subcommand'),
      () => undefined
    )
    .command(
      'share-tokens',
      'Manage share tokens',
      shareTokensYargs =>
        shareTokensYargs
          .command(
            'create',
            'Create a share token',
            yargs =>
              yargs.option('expiresAt', {
                describe: 'ISO 8601 expiration date/time for the share token',
                type: 'string',
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return createShareToken(env, authService, {
                expiresAt: argv.expiresAt,
              });
            }
          )
          .command(
            'list',
            'List share tokens',
            yargs =>
              yargs
                .option('runId', {
                  describe: 'Filter by run ID',
                  type: 'string',
                })
                .option('createdBy', {
                  describe: 'Filter by share token creator',
                  type: 'string',
                })
                .option('revoked', {
                  describe: 'Filter by revocation status',
                  type: 'boolean',
                })
                .option('sort', {
                  describe: 'Sort by field (e.g., "-created_at")',
                  type: 'string',
                }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return listShareTokens(env, authService, {
                runId: argv.runId,
                createdBy: argv.createdBy,
                revoked: argv.revoked,
                sort: argv.sort,
              });
            }
          )
          .command(
            'get <shareTokenId>',
            'Get details of a specific share token',
            yargs =>
              yargs.positional('shareTokenId', {
                describe: 'Share token ID to get details for',
                type: 'string',
                demandOption: true,
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return getShareToken(env, authService, argv.shareTokenId);
            }
          )
          .command(
            'revoke <shareTokenId>',
            'Revoke a specific share token',
            yargs =>
              yargs.positional('shareTokenId', {
                describe: 'Share token ID to revoke',
                type: 'string',
                demandOption: true,
              }),
            argv => {
              const env = environmentSchema.parse(argv.environment);
              return revokeShareToken(env, authService, argv.shareTokenId);
            }
          )
          .demandCommand(1, 'You need at least one share-tokens subcommand'),
      () => undefined
    )
    .command(
      'auth',
      'Manage authentication',
      authYargs =>
        authYargs
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
          .demandCommand(1, 'You need at least one auth subcommand'),
      () => undefined
    )
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
