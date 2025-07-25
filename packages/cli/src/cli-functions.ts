import { PlatformSDKHttp, type ItemCreationRequest } from '@aignostics/platform-typescript-sdk';
import { AuthService } from './utils/auth.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json synchronously for CommonJS compatibility
const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };

export function handleInfo(): void {
  console.log('Aignostics Platform SDK');
  console.log('Version:', packageJson.version);
}

export async function testApi(endpoint: string, authService: AuthService): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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

export async function listApplications(endpoint: string, authService: AuthService): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
  });
  const response = await sdk.listApplications();
  console.log('Applications:', JSON.stringify(response, null, 2));
}

export async function listApplicationVersions(
  endpoint: string,
  authService: AuthService,
  applicationId: string
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
  endpoint: string,
  authService: AuthService,
  options?: { applicationId?: string; applicationVersion?: string }
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
  endpoint: string,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
  endpoint: string,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
  endpoint: string,
  authService: AuthService,
  applicationRunId: string
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
  endpoint: string,
  authService: AuthService,
  applicationVersionId: string,
  itemsJson: string
): Promise<void> {
  const sdk = new PlatformSDKHttp({
    baseURL: endpoint,
    tokenProvider: () => authService.getValidAccessToken(),
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
