import { PlatformSDKHttp } from '../platform-sdk.js';
import packageJson from '../../package.json' with { type: 'json' };
import { AuthService } from '../utils/auth.js';

export async function handleInfo(): Promise<void> {
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
