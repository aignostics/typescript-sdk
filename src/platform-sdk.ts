import packageJson from '../package.json' with { type: 'json' };
import { ApplicationReadResponse, PublicApi } from './generated/index.js';

/**
 * Token provider function that returns a valid access token
 */
export type TokenProvider = () => Promise<string | null> | string | null;

/**
 * Configuration options for the Platform SDK
 */
export interface PlatformSDKConfig {
  /**
   * Base URL for the API
   */
  baseURL?: string;

  /**
   * Token provider function for dynamic token retrieval
   * This function will be called when a token is needed
   */
  tokenProvider: TokenProvider;

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
  constructor(config: PlatformSDKConfig) {
    this.#config = {
      baseURL: config.baseURL || 'https://api.aignostics.com',
      timeout: config.timeout || 10000,
      ...config,
    };
  }

  async #ensureClient(): Promise<PublicApi> {
    if (!this.#client) {
      let accessToken: string | null = null;

      // Get token from provider
      if (this.#config.tokenProvider) {
        accessToken = await this.#config.tokenProvider();
      }

      // Throw error if no token is available
      if (!accessToken) {
        throw new Error(
          'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.'
        );
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
      throw new Error(`Connection test failed: ${String(error)}`);
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
      throw new Error(`list applications failed: ${String(error)}`);
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
