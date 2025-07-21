import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { handleInfo, testApi, listApplications } from './cli-functions.js';
import { login, logout, getAuthState, type LoginConfig } from '../utils/auth.js';

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
      yargs => testApi(yargs.endpoint)
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
      argv => listApplications(argv.endpoint)
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
  const config: LoginConfig = {
    issuerURL,
    clientID,
    audience: 'https://aignostics-platform-samia',
    scope: 'openid profile email offline_access',
  };

  await login(config);
}

export async function handleLogout(): Promise<void> {
  await logout();
}

export async function handleStatus(): Promise<void> {
  try {
    const authState = await getAuthState();

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
