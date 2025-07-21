import readline from 'node:readline';
import crypto from 'node:crypto';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Issuer, generators } from 'openid-client';

import { handleInfo, testApi, listApplications } from './cli-functions.js';
import { saveToken, loadToken, removeToken, hasValidToken } from '../utils/token-storage.js';

const codeVerifier = crypto.randomBytes(32).toString('hex');
const REDIRECT_URI = 'http://localhost:8989';
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
  const open = (await import('open')).default;
  const issuer = await Issuer.discover(issuerURL);
  const client = new issuer.Client({
    client_id: clientID,
    redirect_uris: [REDIRECT_URI],
    response_types: ['code'],
    scope: 'openid profile email offline_access',
    audience: 'https://aignostics-platform-samia',
    token_endpoint_auth_method: 'none',
  });

  const codeChallenge = generators.codeChallenge(codeVerifier);

  const authorizationUrl = client.authorizationUrl({
    scope: 'openid profile email offline_access',
    audience: 'https://aignostics-platform-samia',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  console.log('Opening browser for authentication...');
  open(authorizationUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Paste the full redirect URL after login: ', async (redirectedUrl: string) => {
    rl.close();
    const params = client.callbackParams(redirectedUrl);
    try {
      const tokenSet = await client.callback(REDIRECT_URI, params, { code_verifier: codeVerifier });

      // Save the token securely
      await saveToken({
        access_token: tokenSet.access_token!,
        refresh_token: tokenSet.refresh_token,
        expires_in: tokenSet.expires_in,
        token_type: tokenSet.token_type,
        scope: tokenSet.scope,
      });

      console.log('✅ Login successful! Token saved securely.');
      console.log('Access token:', tokenSet.access_token);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  });
}

export async function handleLogout(): Promise<void> {
  try {
    await removeToken();
    console.log('✅ Logged out successfully. Token removed.');
  } catch (error) {
    console.error('❌ Error during logout:', error);
    process.exit(1);
  }
}

export async function handleStatus(): Promise<void> {
  try {
    const isValid = await hasValidToken();

    if (isValid) {
      const tokenData = await loadToken();
      console.log('✅ Authenticated');

      if (tokenData) {
        console.log('Token details:');
        console.log(`  - Type: ${tokenData.token_type || 'Bearer'}`);
        console.log(`  - Scope: ${tokenData.scope || 'N/A'}`);

        if (tokenData.expires_in) {
          const expirationTime = new Date(tokenData.stored_at + tokenData.expires_in * 1000);
          console.log(`  - Expires: ${expirationTime.toLocaleString()}`);
        } else {
          console.log('  - Expires: Never');
        }

        console.log(`  - Stored: ${new Date(tokenData.stored_at).toLocaleString()}`);
      }
    } else {
      console.log('❌ Not authenticated. Run "aignostics-platform login" to authenticate.');
    }
  } catch (error) {
    console.error('❌ Error checking status:', error);
    process.exit(1);
  }
}
