import { PlatformSDKHttp, type ItemCreationRequest } from '@aignostics/sdk';
import { AuthService, type LoginWithCallbackConfig } from './utils/auth.js';
import { startCallbackServer, waitForCallback } from './utils/oauth-callback-server.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { environmentConfig, EnvironmentKey } from './utils/environment.js';

// Read package.json synchronously for CommonJS compatibility
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };

export function handleInfo(): void {
  console.log('Aignostics Platform SDK');
  console.log('Version:', packageJson.version);
}

export async function testApi(
  environment: EnvironmentKey,
  authService: AuthService
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    const success = await sdk.testConnection();
    if (success) {
      console.log('✅ API connection successful');
    } else {
      console.error('❌ API connection failed, bad response status code');
    }
  } catch (error) {
    console.error('❌ API connection failed:', error);
    process.exit(1);
  }
}

export async function listApplications(
  environment: EnvironmentKey,
  authService: AuthService
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  const response = await sdk.listApplications();
  console.log('Applications:', JSON.stringify(response, null, 2));
}

export async function listApplicationVersions(
  environment: EnvironmentKey,
  authService: AuthService,
  applicationId: string
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    const response = await sdk.listApplicationVersions(applicationId);
    console.log(`Application versions for ${applicationId}:`, JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to list application versions:', error);
    process.exit(1);
  }
}

export async function listApplicationRuns(
  environment: EnvironmentKey,
  authService: AuthService,
  options?: { applicationId?: string; applicationVersion?: string }
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    const response = await sdk.listApplicationRuns(options);
    console.log('Application runs:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to list application runs:', error);
    process.exit(1);
  }
}

export async function getRun(
  environment: EnvironmentKey,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    const response = await sdk.getRun(applicationRunId);
    console.log(`Run details for ${applicationRunId}:`, JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to get run:', error);
    process.exit(1);
  }
}

export async function cancelApplicationRun(
  environment: EnvironmentKey,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    await sdk.cancelApplicationRun(applicationRunId);
    console.log(`✅ Successfully cancelled application run: ${applicationRunId}`);
  } catch (error) {
    console.error('❌ Failed to cancel application run:', error);
    process.exit(1);
  }
}

export async function listRunResults(
  environment: EnvironmentKey,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    const response = await sdk.listRunResults(applicationRunId);
    console.log(`Run results for ${applicationRunId}:`, JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to list run results:', error);
    process.exit(1);
  }
}

export async function createApplicationRun(
  environment: EnvironmentKey,
  authService: AuthService,
  applicationVersionId: string,
  itemsJson: string
): Promise<void> {
  const { endpoint } = environmentConfig[environment];
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(environment),
  });
  try {
    // Parse the items JSON
    let items: ItemCreationRequest[];
    try {
      const parsed = JSON.parse(itemsJson) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('Items must be an array');
      }
      items = parsed as ItemCreationRequest[];
    } catch (parseError) {
      console.error('❌ Invalid items JSON:', parseError);
      process.exit(1);
      return; // Ensure we don't continue execution in tests
    }

    const response = await sdk.createApplicationRun({
      application_version_id: applicationVersionId,
      items: items,
    });
    console.log('✅ Application run created successfully:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to create application run:', error);
    process.exit(1);
    return; // Ensure we don't continue execution in tests
  }
}

export async function handleLogin(environment: EnvironmentKey, authService: AuthService) {
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  // Start local server to handle OAuth callback
  console.log('🔐 Starting authentication process...');
  const server = await startCallbackServer();

  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : 8989;
  const redirectUri = `http://localhost:${actualPort}`;

  const config: LoginWithCallbackConfig = {
    redirectUri,
    codeVerifier,
  };

  try {
    // Start the OAuth flow (opens browser)
    const authorizationUrl = await authService.loginWithCallback(environment, config);
    console.log('🌐 Opening browser for authentication...');
    console.log("📝 If the browser doesn't open automatically, visit:");
    console.log(`   ${authorizationUrl}`);
    console.log('');

    // Wait for the callback
    console.log('⏳ Waiting for authentication callback...');
    const authCode = await waitForCallback(server);

    console.log('✅ Authentication callback received!');

    // Complete the login (exchange code for tokens)
    await authService.completeLogin(environment, config, authCode);

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

export async function handleLogout(
  environment: EnvironmentKey,
  authService: AuthService
): Promise<void> {
  await authService.logout(environment);
  console.log('✅ Logged out successfully. Token removed.');
}

export async function handleStatus(
  environment: EnvironmentKey,
  authService: AuthService
): Promise<void> {
  try {
    const authState = await authService.getAuthState(environment);

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
