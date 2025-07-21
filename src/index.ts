import { ApplicationReadResponse, PublicApi } from './generated/api';
import { getCurrentToken } from './utils/token-storage';
import packageJson from '../package.json';

/**
 * Configuration options for the Platform SDK
 */
export interface PlatformSDKConfig {
  /**
   * Base URL for the API
   */
  baseURL?: string;

  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Main SDK class for interacting with the Aignostics Platform
 */
export class PlatformSDK {
  private client: PublicApi | undefined;
  private config: PlatformSDKConfig;

  /**
   * Creates a new instance of the Platform SDK
   * @param config Configuration options
   */
  constructor(config: PlatformSDKConfig = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://api.aignostics.com',
      timeout: config.timeout || 10000,
      ...config,
    };
  }

  async ensureClient(): Promise<PublicApi> {
    if (!this.client) {
      // Try to get stored token first, fallback to provided apiKey, then fallback to hardcoded token
      let accessToken = this.config.apiKey;

      if (!accessToken) {
        const storedToken = await getCurrentToken();
        if (storedToken) {
          accessToken = storedToken;
        }
      }

      // Fallback to hardcoded token for backward compatibility (should be removed in production)
      if (!accessToken) {
        throw new Error('No API key or access token provided. Please login first.');
      }

      this.client = new PublicApi({
        basePath: this.config.baseURL,
        isJsonMime: mime => mime === 'application/json',
        accessToken,
      });
    }
    return this.client;
  }

  /**
   * Test the connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.ensureClient();
      const response = await client.listApplicationsV1ApplicationsGet();
      return response.status === 200;
    } catch (error) {
      throw new Error(`Connection test failed: ${error}`);
    }
  }

  async listApplications(): Promise<ApplicationReadResponse[]> {
    try {
      const client = await this.ensureClient();
      const response = await client.listApplicationsV1ApplicationsGet();
      if (response.status !== 200) {
        throw new Error(`Failed to list applications: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`list applications failed: ${error}`);
    }
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return packageJson.version;
  }

  /**
   * Get current configuration
   */
  getConfig(): PlatformSDKConfig {
    return { ...this.config };
  }
}

// Export generated API types and client when available
export * from './generated/index';

// Export main SDK
export default PlatformSDK;
