import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  handleInfo,
  testApi,
  listApplications,
  listApplicationVersions,
  listApplicationRuns,
  getRun,
  cancelApplicationRun,
  listRunResults,
} from './cli-functions.js';
import { AuthService, type LoginWithCallbackConfig } from '../utils/auth.js';
import { FileSystemTokenStorage } from '../utils/token-storage.js';
import { startCallbackServer, waitForCallback } from '../utils/oauth-callback-server.js';
import crypto from 'crypto';

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
      'login',
      'Login to the Aignostics Platform',
      {
        issuerURL: {
          describe: 'Issuer URL for OpenID Connect',
          type: 'string',
          default: 'https://aignostics-platform.eu.auth0.com/oauth',
        },
        clientID: {
          describe: 'Client ID for the application',
          type: 'string',
          default: 'YtJ7F9lAtxx16SZGQlYPe6wcjlXB78MM',
        },
      },
      async argv => {
        await handleLogin(argv.issuerURL, argv.clientID);
      }
    )
    .command('logout', 'Logout and remove stored token', {}, async () => {
      await handleLogout();
    })
    .command('status', 'Check authentication status', {}, async () => {
      await handleStatus();
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'v')
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
}

export async function handleLogin(issuerURL: string, clientID: string) {
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  // Start local server to handle OAuth callback
  console.log('🔐 Starting authentication process...');
  const server = await startCallbackServer();
  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : 8989;
  const redirectUri = `http://localhost:${actualPort}`;

  const config: LoginWithCallbackConfig = {
    issuerURL,
    clientID,
    redirectUri,
    codeVerifier,
    audience: 'https://aignostics-platform-samia',
    scope: 'openid profile email offline_access',
  };

  try {
    // Start the OAuth flow (opens browser)
    await authService.loginWithCallback(config);

    // Wait for the callback
    console.log('⏳ Waiting for authentication callback...');
    const authCode = await waitForCallback(server);

    console.log('✅ Authentication callback received!');

    // Complete the login (exchange code for tokens)
    await authService.completeLogin(config, authCode);

    console.log('🎉 Login successful! Token saved securely.');
    console.log('🔑 You are now authenticated and can use the SDK.');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  } finally {
    // Always close the server
    server.close();
  }
}

export async function handleLogout(): Promise<void> {
  await authService.logout();
}

export async function handleStatus(): Promise<void> {
  try {
    const authState = await authService.getAuthState();

    if (authState.isAuthenticated && authState.token) {
      console.log('✅ Authenticated');
      console.log('Token details:');
      console.log(`  - Type: ${authState.token.type}`);
      console.log(`  - Scope: ${authState.token.scope}`);

      if (authState.token.expiresAt) {
        console.log(`  - Expires: ${authState.token.expiresAt.toLocaleString()}`);
      } else {
        console.log('  - Expires: Never');
      }

      console.log(`  - Stored: ${authState.token.storedAt.toLocaleString()}`);
    } else {
      console.log('❌ Not authenticated. Run "aignostics-platform login" to authenticate.');
    }
  } catch (error) {
    console.error('❌ Error checking status:', error);
    process.exit(1);
  }
}
