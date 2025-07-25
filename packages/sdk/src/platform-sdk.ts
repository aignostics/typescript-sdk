import packageJson from '../package.json' with { type: 'json' };
import {
  ApplicationReadResponse,
  ApplicationVersionReadResponse,
  RunReadResponse,
  ItemResultReadResponse,
  RunCreationRequest,
  RunCreationResponse,
  PublicApi,
} from './generated/index.js';

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
  listApplicationVersions(applicationId: string): Promise<ApplicationVersionReadResponse[]>;
  listApplicationRuns(options?: {
    applicationId?: string;
    applicationVersion?: string;
  }): Promise<RunReadResponse[]>;
  createApplicationRun(request: RunCreationRequest): Promise<RunCreationResponse>;
  getRun(applicationRunId: string): Promise<RunReadResponse>;
  cancelApplicationRun(applicationRunId: string): Promise<void>;
  listRunResults(applicationRunId: string): Promise<ItemResultReadResponse[]>;
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

  async listApplicationVersions(applicationId: string): Promise<ApplicationVersionReadResponse[]> {
    try {
      const client = await this.#ensureClient();
      const response =
        await client.listVersionsByApplicationIdV1ApplicationsApplicationIdVersionsGet({
          applicationId,
        });
      if (response.status !== 200) {
        throw new Error(`Failed to list application versions: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`list application versions failed: ${String(error)}`);
    }
  }

  async listApplicationRuns(options?: {
    applicationId?: string;
    applicationVersion?: string;
  }): Promise<RunReadResponse[]> {
    try {
      const client = await this.#ensureClient();
      const response = await client.listApplicationRunsV1RunsGet({
        applicationId: options?.applicationId,
        applicationVersion: options?.applicationVersion,
      });
      if (response.status !== 200) {
        throw new Error(`Failed to list application runs: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`list application runs failed: ${String(error)}`);
    }
  }

  async createApplicationRun(request: RunCreationRequest): Promise<RunCreationResponse> {
    try {
      const client = await this.#ensureClient();
      const response = await client.createApplicationRunV1RunsPost({
        runCreationRequest: request,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to create application run: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`create application run failed: ${String(error)}`);
    }
  }

  async getRun(applicationRunId: string): Promise<RunReadResponse> {
    try {
      const client = await this.#ensureClient();
      const response = await client.getRunV1RunsApplicationRunIdGet({
        applicationRunId,
      });
      if (response.status !== 200) {
        throw new Error(`Failed to get run: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`get run failed: ${String(error)}`);
    }
  }

  async cancelApplicationRun(applicationRunId: string): Promise<void> {
    try {
      const client = await this.#ensureClient();
      const response = await client.cancelApplicationRunV1RunsApplicationRunIdCancelPost({
        applicationRunId,
      });
      if (response.status !== 200) {
        throw new Error(`Failed to cancel application run: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`cancel application run failed: ${String(error)}`);
    }
  }

  async listRunResults(applicationRunId: string): Promise<ItemResultReadResponse[]> {
    try {
      const client = await this.#ensureClient();
      const response = await client.listRunResultsV1RunsApplicationRunIdResultsGet({
        applicationRunId,
      });
      if (response.status !== 200) {
        throw new Error(`Failed to list run results: ${response.statusText}`);
      }
      return response.data;
    } catch (error) {
      throw new Error(`list run results failed: ${String(error)}`);
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
