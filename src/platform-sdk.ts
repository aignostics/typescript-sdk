import packageJson from '../package.json' with { type: 'json' };
import { z } from 'zod';
import { ApplicationReadResponse, PublicApi } from './generated/index.js';
import { loadData } from './utils/token-storage.js';

/**
 * Token data schema for validation
 */
const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  stored_at: z.number(),
});

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

export interface PlatformSDK {
  getVersion(): string;
  getConfig(): PlatformSDKConfig;
  testConnection(): Promise<boolean>;
  listApplications(): Promise<ApplicationReadResponse[]>;
}
/**
 * Main SDK class for interacting with the Aignostics Platform
 */
export class PlatformSDKHttp implements PlatformSDK {
  #client: PublicApi | undefined;
  #config: PlatformSDKConfig;

  /**
   * Creates a new instance of the Platform SDK
   * @param config Configuration options
   */
  constructor(config: PlatformSDKConfig = {}) {
    this.#config = {
      baseURL: config.baseURL || 'https://api.aignostics.com',
      timeout: config.timeout || 10000,
      ...config,
    };
  }

  /**
   * Get a valid access token from storage
   * @returns Valid access token or null if not found/expired
   */
  async #getValidToken(): Promise<string | null> {
    try {
      const data = await loadData();
      const result = TokenSchema.safeParse(data);

      if (!result.success) {
        return null;
      }

      const token = result.data;

      // Check if token is expired
      if (token.expires_in) {
        const expirationTime = token.stored_at + token.expires_in * 1000;
        const now = Date.now();

        if (now >= expirationTime) {
          console.log('Token has expired');
          return null;
        }
      }

      return token.access_token;
    } catch (error) {
      console.warn(`Warning: Could not retrieve token: ${error}`);
      return null;
    }
  }

  async #ensureClient(): Promise<PublicApi> {
    if (!this.#client) {
      // Try to get stored token first, fallback to provided apiKey
      let accessToken = this.#config.apiKey;

      if (!accessToken) {
        const storedToken = await this.#getValidToken();
        if (storedToken) {
          accessToken = storedToken;
        }
      }

      // Throw error if no token is available
      if (!accessToken) {
        throw new Error('No API key or access token provided. Please login first.');
      }

      this.#client = new PublicApi({
        basePath: this.#config.baseURL,
        isJsonMime: mime => mime === 'application/json',
        accessToken,
      });
    }
    return this.#client;
  }

  /**
   * Test the connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.#ensureClient();
      const response = await client.listApplicationsV1ApplicationsGet();
      return response.status === 200;
    } catch (error) {
      throw new Error(`Connection test failed: ${error}`);
    }
  }

  async listApplications(): Promise<ApplicationReadResponse[]> {
    try {
      const client = await this.#ensureClient();
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
    return { ...this.#config };
  }
}
