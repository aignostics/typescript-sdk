import { PlatformSDKHttp } from '../platform-sdk';
import packageJson from '../../package.json';

export async function handleInfo(): Promise<void> {
  console.log('Aignostics Platform SDK');
  console.log('Version:', packageJson.version);
}

export async function testApi(endpoint: string): Promise<void> {
  const sdk = new PlatformSDKHttp({ baseURL: endpoint });
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

export async function listApplications(endpoint: string): Promise<void> {
  const sdk = new PlatformSDKHttp({ baseURL: endpoint });
  const response = await sdk.listApplications();
  console.log('Applications:', JSON.stringify(response, null, 2));
}
