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
  type GrantReadResponse,
  type ShareTokenReadResponse,
  type ShareTokenCreateResponse,
  type ApplicationReadShortResponse,
  type ApplicationReadResponse,
  type ApplicationVersion,
  type RunReadResponse,
  type ItemResultReadResponse,
  type VersionReadResponse,
  type RunCreationResponse,
  getRunStatus,
  getRunProgress,
  getItemStatus,
} from '@aignostics/sdk';
import { OutputFormat, format, printTable, printKeyValue } from './utils/formatting.js';

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

function printApplicationsTable(applications: ApplicationReadShortResponse[]): void {
  printTable(
    ['ID', 'Name', 'Latest Version'],
    applications.map(app => [app.application_id, app.name, app.latest_version?.number ?? '-'])
  );
}

function printApplicationDetails(application: ApplicationReadResponse): void {
  printKeyValue([
    ['Application ID', application.application_id],
    ['Name', application.name],
    ['Description', application.description],
    ['Regulatory Classes', application.regulatory_classes.join(', ') || '-'],
    ['Versions', application.versions.length],
  ]);
}

function printApplicationVersionsTable(versions: ApplicationVersion[]): void {
  printTable(
    ['Number', 'Released At'],
    versions.map(version => [version.number, version.released_at])
  );
}

function printApplicationVersionDetails(version: VersionReadResponse): void {
  printKeyValue([
    ['Version Number', version.version_number],
    ['Released At', version.released_at],
    ['Changelog', version.changelog],
    ['Input Artifacts', version.input_artifacts.length],
    ['Output Artifacts', version.output_artifacts.length],
  ]);
}

function printRunsTable(runs: RunReadResponse[]): void {
  printTable(
    ['Run ID', 'Application', 'Version', 'Status', 'Progress', 'Submitted At'],
    runs.map(run => [
      run.run_id,
      run.application_id,
      run.version_number,
      getRunStatus(run),
      `${getRunProgress(run)}%`,
      run.submitted_at,
    ])
  );
}

function printRunDetails(run: RunReadResponse): void {
  printKeyValue([
    ['Run ID', run.run_id],
    ['Application', run.application_id],
    ['Version', run.version_number],
    ['Status', getRunStatus(run)],
    ['Progress', `${getRunProgress(run)}%`],
    ['Submitted At', run.submitted_at],
    ['Submitted By', run.submitted_by],
  ]);
}

function printRunResultsTable(items: ItemResultReadResponse[]): void {
  printTable(
    ['External ID', 'Status'],
    items.map(item => [item.external_id, getItemStatus(item)])
  );
}

function printRunCreationResult(run: RunCreationResponse): void {
  printKeyValue([['Run ID', run.run_id]]);
}

function printGrantsTable(grants: GrantReadResponse[]): void {
  printTable(
    [
      'Grant ID',
      'Resource Type',
      'Resource ID',
      'Subject Type',
      'Subject ID',
      'Relation',
      'Revoked',
    ],
    grants.map(grant => [
      grant.grant_id,
      grant.resource_type,
      grant.resource_id,
      grant.subject_type,
      grant.subject_id,
      grant.relation,
      String(grant.revoked),
    ])
  );
}

function printGrantDetails(grant: GrantReadResponse): void {
  printKeyValue([
    ['Grant ID', grant.grant_id],
    ['Resource Type', grant.resource_type],
    ['Resource ID', grant.resource_id],
    ['Subject Type', grant.subject_type],
    ['Subject ID', grant.subject_id],
    ['Relation', grant.relation],
    ['Created By', grant.created_by],
    ['Created At', grant.created_at],
    ['Revoked', String(grant.revoked)],
  ]);
}

function printShareTokensTable(shareTokens: ShareTokenReadResponse[]): void {
  printTable(
    ['Share Token ID', 'Created At', 'Expires At', 'Revoked'],
    shareTokens.map(shareToken => [
      shareToken.share_token_id,
      shareToken.created_at,
      shareToken.expires_at ?? '-',
      String(shareToken.revoked),
    ])
  );
}

function printShareTokenDetails(shareToken: ShareTokenReadResponse): void {
  printKeyValue([
    ['Share Token ID', shareToken.share_token_id],
    ['Created At', shareToken.created_at],
    ['Expires At', shareToken.expires_at ?? '-'],
    ['Revoked', String(shareToken.revoked)],
  ]);
}

function printShareTokenCreationResult(shareToken: ShareTokenCreateResponse): void {
  printKeyValue([
    ['Share Token ID', shareToken.share_token_id],
    ['Share Token', shareToken.share_token],
    ['Created At', shareToken.created_at],
    ['Expires At', shareToken.expires_at ?? '-'],
  ]);
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
    .option('format', {
      describe: 'Output format for command results',
      type: 'string',
      default: 'text',
      choices: ['text', 'json'],
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
              return format(
                argv.format as OutputFormat,
                listApplications(env, authService),
                printApplicationsTable
              );
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
              return format(
                argv.format as OutputFormat,
                getApplicationDetails(env, authService, argv.applicationId),
                printApplicationDetails
              );
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
                    return format(
                      argv.format as OutputFormat,
                      listApplicationVersions(env, authService, argv.applicationId),
                      printApplicationVersionsTable
                    );
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
                    return format(
                      argv.format as OutputFormat,
                      getApplicationVersionDetails(
                        env,
                        authService,
                        argv.applicationId,
                        argv.versionNumber
                      ),
                      printApplicationVersionDetails
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
              return format(
                argv.format as OutputFormat,
                createApplicationRun(
                  env,
                  authService,
                  argv.applicationId,
                  argv.versionNumber,
                  itemsJson
                ),
                printRunCreationResult
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
              return format(
                argv.format as OutputFormat,
                listApplicationRuns(env, authService, {
                  applicationId: argv.applicationId,
                  applicationVersion: argv.applicationVersion,
                  customMetadata: argv.customMetadata,
                  sort: argv.sort,
                }),
                printRunsTable
              );
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
              return format(
                argv.format as OutputFormat,
                getRun(env, authService, argv.applicationRunId),
                printRunDetails
              );
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
                    return format(
                      argv.format as OutputFormat,
                      listRunResults(env, authService, argv.applicationRunId),
                      printRunResultsTable
                    );
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
              return format(
                argv.format as OutputFormat,
                createGrant(env, authService, {
                  resourceType: argv.resourceType as ResourceType,
                  resourceId: argv.resourceId,
                  subjectType: argv.subjectType as SubjectType,
                  subjectId: argv.subjectId,
                  subjectEmail: argv.subjectEmail,
                  relation: argv.relation as GrantRelation,
                }),
                printGrantDetails
              );
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
              return format(
                argv.format as OutputFormat,
                listGrants(env, authService, {
                  resourceType: argv.resourceType as ResourceType | undefined,
                  resourceId: argv.resourceId,
                  subjectType: argv.subjectType as SubjectType | undefined,
                  subjectId: argv.subjectId,
                  revoked: argv.revoked,
                  sort: argv.sort,
                }),
                printGrantsTable
              );
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
              return format(
                argv.format as OutputFormat,
                getGrant(env, authService, argv.grantId),
                printGrantDetails
              );
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
              return format(
                argv.format as OutputFormat,
                revokeGrant(env, authService, argv.grantId),
                printGrantDetails
              );
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
              return format(
                argv.format as OutputFormat,
                createShareToken(env, authService, {
                  expiresAt: argv.expiresAt,
                }),
                printShareTokenCreationResult
              );
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
              return format(
                argv.format as OutputFormat,
                listShareTokens(env, authService, {
                  runId: argv.runId,
                  createdBy: argv.createdBy,
                  revoked: argv.revoked,
                  sort: argv.sort,
                }),
                printShareTokensTable
              );
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
              return format(
                argv.format as OutputFormat,
                getShareToken(env, authService, argv.shareTokenId),
                printShareTokenDetails
              );
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
              return format(
                argv.format as OutputFormat,
                revokeShareToken(env, authService, argv.shareTokenId),
                printShareTokenDetails
              );
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
