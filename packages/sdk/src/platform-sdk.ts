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
import { APIError, AuthenticationError, UnexpectedError } from './errors.js';
import { isAxiosError } from 'axios';
import z from 'zod';

const validationErrorSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
    })
  ),
});

const errorResponseSchema = z.union([validationErrorSchema, z.any()]);

function handleRequestError(error: unknown): never {
  if (isAxiosError(error)) {
    switch (error.status) {
      case 422: {
        throw new APIError(`Validation error: ${error.message}`, {
          context: {
            responseBody: validationErrorSchema.parse(error.response?.data),
          },
          originalError: error,
          statusCode: 422,
        });
      }
      case 404: {
        throw new APIError(`Resource not found: ${error.message}`, {
          context: {
            responseBody: errorResponseSchema.parse(error.response?.data),
          },
          originalError: error,
          statusCode: 404,
        });
      }
      default: {
        throw new APIError(`API request failed: ${error.message}`, {
          context: {
            responseBody: errorResponseSchema.parse(error.response?.data),
          },
          originalError: error,
        });
      }
    }
  }
  throw new UnexpectedError(`Unexpected error: ${String(error)}`, { originalError: error });
}

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
  readonly #config: Readonly<PlatformSDKConfig>;

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

  async #getClient(): Promise<PublicApi> {
    const accessToken = await this.#config.tokenProvider();

    // Throw error if no token is available
    if (!accessToken) {
      throw new AuthenticationError(
        'No access token available. Please provide a tokenProvider in the SDK configuration that returns a valid token.'
      );
    }

    return new PublicApi({
      basePath: this.#config.baseURL,
      accessToken,
      isJsonMime(mime) {
        return mime === 'application/json';
      },
    });
  }

  /**
   * Test the connection to the Aignostics Platform API
   *
   * This method performs a simple API call to verify that the SDK can successfully
   * connect to the platform using the provided configuration and authentication.
   * It's useful for validating setup and troubleshooting connectivity issues.
   *
   * @returns A promise that resolves to `true` if the connection is successful
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {Error} If the connection test fails due to network issues or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const isConnected = await sdk.testConnection();
   *   console.log('Connection successful:', isConnected);
   * } catch (error) {
   *   console.error('Connection failed:', error.message);
   * }
   * ```
   */
  async testConnection(): Promise<boolean> {
    const client = await this.#getClient();
    try {
      const response = await client.listApplicationsV1ApplicationsGet();
      return response.status === 200;
    } catch (error) {
      throw new Error(`Connection test failed: ${String(error)}`);
    }
  }

  /**
   * Retrieve a list of all available applications on the platform
   *
   * This method fetches all applications that are accessible with the current
   * authentication credentials. Applications represent different AI models or
   * processing pipelines available on the Aignostics Platform.
   *
   * @returns A promise that resolves to an array of application objects
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {Error} If the request fails due to network issues or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const applications = await sdk.listApplications();
   *   console.log(`Found ${applications.length} applications`);
   *   applications.forEach(app => {
   *     console.log(`- ${app.name} (ID: ${app.id})`);
   *   });
   * } catch (error) {
   *   console.error('Failed to list applications:', error.message);
   * }
   * ```
   */
  async listApplications(): Promise<ApplicationReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listApplicationsV1ApplicationsGet();
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve all versions of a specific application
   *
   * This method fetches all available versions for a given application ID.
   * Application versions represent different iterations or configurations of
   * an AI model, allowing you to choose specific versions for processing.
   *
   * @param applicationId - The unique identifier of the application
   * @returns A promise that resolves to an array of application version objects
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {Error} If the request fails due to network issues, invalid application ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const versions = await sdk.listApplicationVersions('app-123');
   *   console.log(`Found ${versions.length} versions for application`);
   *   versions.forEach(version => {
   *     console.log(`- Version ${version.version} (ID: ${version.id})`);
   *   });
   * } catch (error) {
   *   console.error('Failed to list application versions:', error.message);
   * }
   * ```
   */
  async listApplicationVersions(applicationId: string): Promise<ApplicationVersionReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response =
        await client.listVersionsByApplicationIdV1ApplicationsApplicationIdVersionsGet({
          applicationId,
        });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve a list of application runs with optional filtering
   *
   * This method fetches application runs (processing jobs) that have been
   * submitted to the platform. You can optionally filter by application ID
   * and/or application version to narrow down the results.
   *
   * @param options - Optional filtering parameters
   * @param options.applicationId - Filter runs by specific application ID
   * @param options.applicationVersion - Filter runs by specific application version
   * @returns A promise that resolves to an array of application run objects
   * @throws {Error} If the request fails due to network issues, authentication problems, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   // Get all runs
   *   const allRuns = await sdk.listApplicationRuns();
   *
   *   // Get runs for a specific application
   *   const appRuns = await sdk.listApplicationRuns({
   *     applicationId: 'app-123'
   *   });
   *
   *   // Get runs for a specific application version
   *   const versionRuns = await sdk.listApplicationRuns({
   *     applicationId: 'app-123',
   *     applicationVersion: 'v1.2.0'
   *   });
   *
   *   console.log(`Found ${allRuns.length} total runs`);
   * } catch (error) {
   *   console.error('Failed to list application runs:', error.message);
   * }
   * ```
   */
  async listApplicationRuns(options?: {
    applicationId?: string;
    applicationVersion?: string;
    sort?: string[];
  }): Promise<RunReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listApplicationRunsV1RunsGet({
        applicationId: options?.applicationId,
        applicationVersion: options?.applicationVersion,
        sort: options?.sort,
      });

      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Create and submit a new application run for processing
   *
   * This method creates a new processing job by submitting data items to a
   * specific application version. The run will be queued and processed
   * asynchronously on the Aignostics Platform.
   *
   * @param request - The run creation request containing application version ID and items to process
   * @returns A promise that resolves to the created run response with run ID and status
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid request data, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const runRequest = {
   *     application_version_id: 'app-version-123',
   *     items: [
   *       {
   *         id: 'item-1',
   *         data: { }
   *       },
   *       {
   *         id: 'item-2',
   *         data: { }
   *       }
   *     ]
   *   };
   *
   *   const run = await sdk.createApplicationRun(runRequest);
   *   console.log(`Created run with ID: ${run.id}`);
   *   console.log(`Status: ${run.status}`);
   * } catch (error) {
   *   console.error('Failed to create application run:', error.message);
   * }
   * ```
   */
  async createApplicationRun(request: RunCreationRequest): Promise<RunCreationResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.createApplicationRunV1RunsPost({
        runCreationRequest: request,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve detailed information about a specific application run
   *
   * This method fetches complete details about a processing job, including
   * its current status, progress, metadata, and execution information.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @returns A promise that resolves to the run details object
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid run ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const run = await sdk.getRun('run-123');
   *   console.log(`Run ID: ${run.id}`);
   *   console.log(`Status: ${run.status}`);
   *   console.log(`Progress: ${run.progress}%`);
   *   console.log(`Created: ${run.created_at}`);
   * } catch (error) {
   *   console.error('Failed to get run details:', error.message);
   * }
   * ```
   */
  async getRun(applicationRunId: string): Promise<RunReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.getRunV1RunsApplicationRunIdGet({
        applicationRunId,
      });

      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Cancel a running or queued application run
   *
   * This method attempts to cancel an application run that is currently
   * in progress or waiting in the queue. Once cancelled, the run cannot
   * be resumed and will transition to a cancelled state.
   *
   * @param applicationRunId - The unique identifier of the application run to cancel
   * @returns A promise that resolves when the cancellation request is successful
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid run ID, or if the run cannot be cancelled
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   await sdk.cancelApplicationRun('run-123');
   *   console.log('Run cancellation requested successfully');
   *
   *   // Check the status to confirm cancellation
   *   const run = await sdk.getRun('run-123');
   *   console.log(`Updated status: ${run.status}`);
   * } catch (error) {
   *   console.error('Failed to cancel run:', error.message);
   * }
   * ```
   */
  async cancelApplicationRun(applicationRunId: string): Promise<void> {
    const client = await this.#getClient();
    try {
      await client.cancelApplicationRunV1RunsApplicationRunIdCancelPost({
        applicationRunId,
      });
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve the processing results for a completed application run
   *
   * This method fetches all result items produced by a completed application run.
   * Results include the processed data, analysis outcomes, and any generated
   * artifacts from the AI model execution.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @returns A promise that resolves to an array of result items
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid run ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const results = await sdk.listRunResults('run-123');
   *   console.log(`Found ${results.length} result items`);
   *
   *   results.forEach((result, index) => {
   *     console.log(`Result ${index + 1}:`);
   *     console.log(`- Item ID: ${result.item_id}`);
   *     console.log(`- Status: ${result.status}`);
   *     console.log(`- Data: ${JSON.stringify(result.data)}`);
   *   });
   * } catch (error) {
   *   console.error('Failed to list run results:', error.message);
   * }
   * ```
   */
  async listRunResults(applicationRunId: string): Promise<ItemResultReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listRunResultsV1RunsApplicationRunIdResultsGet({
        applicationRunId,
      });

      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Get the current version of the SDK
   *
   * This method returns the version string of the Platform SDK, which can be
   * useful for debugging, logging, or ensuring compatibility with API versions.
   *
   * @returns The SDK version string (e.g., "1.2.3")
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   * console.log(`Using SDK version: ${sdk.getVersion()}`);
   * ```
   */
  getVersion(): string {
    return packageJson.version;
  }

  /**
   * Get the current SDK configuration
   *
   * This method returns a copy of the current configuration used by the SDK,
   * including the base URL, timeout settings, and other options. The returned
   * object is a copy to prevent accidental modification of the internal config.
   *
   * @returns A copy of the current SDK configuration object
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({
   *   baseURL: 'https://api.aignostics.com',
   *   tokenProvider: () => 'your-token',
   *   timeout: 30000
   * });
   *
   * const config = sdk.getConfig();
   * console.log(`Base URL: ${config.baseURL}`);
   * console.log(`Timeout: ${config.timeout}ms`);
   * ```
   */
  getConfig(): PlatformSDKConfig {
    return { ...this.#config };
  }
}
