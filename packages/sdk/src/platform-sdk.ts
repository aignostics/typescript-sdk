import packageJson from '../package.json' with { type: 'json' };
import {
  ApplicationReadResponse,
  ApplicationReadShortResponse,
  CustomMetadataUpdateResponse,
  GrantCreateRequest,
  GrantReadResponse,
  GrantRelation,
  ItemState,
  ItemTerminationReason,
  PublicApi,
  ResourceType,
  RunCreationRequest,
  RunCreationResponse,
  ShareTokenCreateRequest,
  ShareTokenCreateResponse,
  ShareTokenReadResponse,
  SubjectType,
  VersionReadResponse,
} from './generated/index.js';
import {
  APIError,
  AuthenticationError,
  UnexpectedError,
  redactAuthorizationHeader,
} from './errors.js';
import { isAxiosError } from 'axios';
import z from 'zod';
import { processApplicationRun } from './entities/application-run/process-application-run.js';
import { ApplicationRun } from './entities/application-run/types.js';
import { processRunItem } from './entities/run-item/process-run-item.js';
import { ApplicationRunItem } from './entities/run-item/types.js';
import { downloadWithRetry } from './utils/downloadWithRetry.js';
import type { Readable } from 'node:stream';

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
    redactAuthorizationHeader(error);
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
      case 403: {
        throw new APIError(`Access forbidden: ${error.message}`, {
          context: {
            responseBody: errorResponseSchema.parse(error.response?.data),
          },
          originalError: error,
          statusCode: 403,
        });
      }
      case 410: {
        throw new APIError(`Resource gone: ${error.message}`, {
          context: {
            responseBody: errorResponseSchema.parse(error.response?.data),
          },
          originalError: error,
          statusCode: 410,
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
  listApplications(): Promise<ApplicationReadShortResponse[]>;
  getApplication(applicationId: string): Promise<ApplicationReadResponse>;
  listApplicationRuns(options?: {
    applicationId?: string;
    applicationVersion?: string;
    page?: number;
    pageSize?: number;
    customMetadata?: string;
    sort?: string[];
  }): Promise<ApplicationRun[]>;
  createApplicationRun(request: RunCreationRequest): Promise<RunCreationResponse>;
  getRun(applicationRunId: string): Promise<ApplicationRun>;
  cancelApplicationRun(applicationRunId: string): Promise<void>;
  listRunResults(
    applicationRunId: string,
    options?: {
      page?: number;
      pageSize?: number;
      sort?: string[];
      externalIdIn?: string[];
      state?: ItemState;
      terminationReason?: ItemTerminationReason;
    }
  ): Promise<ApplicationRunItem[]>;
  getRunItem(applicationRunId: string, externalId: string): Promise<ApplicationRunItem>;
  updateRunMetadata(
    applicationRunId: string,
    customMetadata: Record<string, unknown> | null,
    customMetadataChecksum?: string | null
  ): Promise<CustomMetadataUpdateResponse>;
  updateRunItemMetadata(
    applicationRunId: string,
    externalId: string,
    customMetadata: Record<string, unknown> | null,
    customMetadataChecksum?: string | null
  ): Promise<CustomMetadataUpdateResponse>;
  deleteRunResults(applicationRunId: string): Promise<void>;
  getApplicationVersionDetails(
    applicationId: string,
    version: string
  ): Promise<VersionReadResponse>;
  downloadArtifact(runId: string, artifactId: string): Promise<ArrayBuffer>;
  downloadArtifactStream(runId: string, artifactId: string): Promise<Readable>;
  createGrant(request: GrantCreateRequest): Promise<GrantReadResponse>;
  listGrants(options?: {
    resourceType?: ResourceType;
    resourceId?: string;
    subjectType?: SubjectType;
    subjectId?: string;
    relation?: GrantRelation[];
    revoked?: boolean;
    page?: number;
    pageSize?: number;
    sort?: string[];
  }): Promise<GrantReadResponse[]>;
  getGrant(grantId: string): Promise<GrantReadResponse>;
  revokeGrant(grantId: string): Promise<GrantReadResponse>;
  createShareToken(request: ShareTokenCreateRequest): Promise<ShareTokenCreateResponse>;
  listShareTokens(options?: {
    runId?: string;
    createdBy?: string;
    revoked?: boolean;
    page?: number;
    pageSize?: number;
    sort?: string[];
  }): Promise<ShareTokenReadResponse[]>;
  getShareToken(shareTokenId: string): Promise<ShareTokenReadResponse>;
  revokeShareToken(shareTokenId: string): Promise<ShareTokenReadResponse>;
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
  async listApplications(): Promise<ApplicationReadShortResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listApplicationsV1ApplicationsGet();
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve detailed information about a specific application version
   *
   * This method fetches comprehensive details about a specific version of an
   * application, including its changelog, release date, and any version-specific
   * configurations or features.
   *
   * @param applicationId - The unique identifier of the application
   * @param version - The version string of the application to retrieve
   * @returns A promise that resolves to the application version details
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid application ID or version, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const appVersion = await sdk.getApplicationVersionDetails('app-123', 'v1.2.0');
   *   console.log(`Application Version: ${appVersion.version}`);
   *   console.log(`Release Date: ${appVersion.release_date}`);
   *   console.log(`Changelog: ${appVersion.changelog}`);
   * } catch (error) {
   *   console.error('Failed to get application version details:', error.message);
   * }
   * ```
   */

  async getApplicationVersionDetails(
    applicationId: string,
    version: string
  ): Promise<VersionReadResponse> {
    const client = await this.#getClient();
    try {
      const response =
        await client.applicationVersionDetailsV1ApplicationsApplicationIdVersionsVersionGet({
          applicationId,
          version,
        });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve detailed information about a specific application
   *
   * This method fetches comprehensive details about an application, including
   * its name, description, regulatory classes, and all available versions.
   * This provides more detailed information compared to the summary returned
   * by `listApplications()`.
   *
   * @param applicationId - The unique identifier of the application to retrieve
   * @returns A promise that resolves to the complete application details
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid application ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const application = await sdk.getApplication('app-123');
   *   console.log(`Application: ${application.name}`);
   *   console.log(`Description: ${application.description}`);
   *   console.log(`Available versions: ${application.versions.length}`);
   *
   *   application.versions.forEach(version => {
   *     console.log(`- ${version.version} (ID: ${version.application_version_id})`);
   *   });
   * } catch (error) {
   *   console.error('Failed to get application details:', error.message);
   * }
   * ```
   */
  async getApplication(applicationId: string): Promise<ApplicationReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.readApplicationByIdV1ApplicationsApplicationIdGet({
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
    customMetadata?: string;
    sort?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<ApplicationRun[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listRunsV1RunsGet({
        applicationId: options?.applicationId,
        applicationVersion: options?.applicationVersion,
        customMetadata: options?.customMetadata,
        sort: options?.sort,
        page: options?.page,
        pageSize: options?.pageSize,
      });

      // Enrich each raw RunReadResponse with computed properties
      return response.data.map(processApplicationRun);
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
      const response = await client.createRunV1RunsPost({
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
  async getRun(applicationRunId: string): Promise<ApplicationRun> {
    const client = await this.#getClient();
    try {
      const response = await client.getRunV1RunsRunIdGet({
        runId: applicationRunId,
      });

      // Enrich raw RunReadResponse with computed properties
      return processApplicationRun(response.data);
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
      await client.cancelRunV1RunsRunIdCancelPost({
        runId: applicationRunId,
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
  async listRunResults(
    applicationRunId: string,
    {
      page,
      pageSize,
      sort,
      externalIdIn,
      state,
      terminationReason,
    }: {
      page?: number;
      pageSize?: number;
      sort?: string[];
      externalIdIn?: string[];
      state?: ItemState;
      terminationReason?: ItemTerminationReason;
    } = {}
  ): Promise<ApplicationRunItem[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listRunItemsV1RunsRunIdItemsGet({
        runId: applicationRunId,
        page,
        pageSize,
        sort,
        externalIdIn,
        state,
        terminationReason,
      });

      // Enrich each raw ItemResultReadResponse with computed properties
      return response.data.map(processRunItem);
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Retrieve a single item from an application run by its external ID
   *
   * This method fetches details for one specific result item within a run,
   * identified by the `external_id` supplied when the run was created.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @param externalId - The external ID of the item, as supplied when creating the run
   * @returns A promise that resolves to the enriched run item
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the request fails (e.g., 404 if the item doesn't exist)
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const item = await sdk.getRunItem('run-123', 'slide-001');
   *   console.log(`Item status: ${item.status}`);
   * } catch (error) {
   *   console.error('Failed to get run item:', error.message);
   * }
   * ```
   */
  async getRunItem(applicationRunId: string, externalId: string): Promise<ApplicationRunItem> {
    const client = await this.#getClient();
    try {
      const response = await client.getItemByRunV1RunsRunIdItemsExternalIdGet({
        runId: applicationRunId,
        externalId,
      });
      return processRunItem(response.data);
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Set (replace) the custom metadata attached to an application run
   *
   * This method overwrites the run's custom metadata, an arbitrary JSON object
   * that consumers can use to store their own attributes (e.g. tags, notes,
   * external references) alongside a run. Pass `null` to clear existing metadata.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @param customMetadata - The new custom metadata object, or `null` to clear it
   * @param customMetadataChecksum - Optional checksum for optimistic concurrency control
   * @returns A promise that resolves to the updated metadata checksum
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the request fails (e.g., 404 if the run doesn't exist, 422 on checksum mismatch)
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   await sdk.updateRunMetadata('run-123', { note: 'Reviewed by QA' });
   * } catch (error) {
   *   console.error('Failed to update run metadata:', error.message);
   * }
   * ```
   */
  async updateRunMetadata(
    applicationRunId: string,
    customMetadata: Record<string, unknown> | null,
    customMetadataChecksum?: string | null
  ): Promise<CustomMetadataUpdateResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.putRunCustomMetadataV1RunsRunIdCustomMetadataPut({
        runId: applicationRunId,
        customMetadataUpdateRequest: {
          custom_metadata: customMetadata,
          custom_metadata_checksum: customMetadataChecksum,
        },
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Set (replace) the custom metadata attached to a single run item
   *
   * This method overwrites the custom metadata of one item within a run,
   * identified by its `external_id`. Pass `null` to clear existing metadata.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @param externalId - The external ID of the item, as supplied when creating the run
   * @param customMetadata - The new custom metadata object, or `null` to clear it
   * @param customMetadataChecksum - Optional checksum for optimistic concurrency control
   * @returns A promise that resolves to the updated metadata checksum
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the request fails (e.g., 404 if the item doesn't exist, 422 on checksum mismatch)
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   await sdk.updateRunItemMetadata('run-123', 'slide-001', { reviewed: true });
   * } catch (error) {
   *   console.error('Failed to update run item metadata:', error.message);
   * }
   * ```
   */
  async updateRunItemMetadata(
    applicationRunId: string,
    externalId: string,
    customMetadata: Record<string, unknown> | null,
    customMetadataChecksum?: string | null
  ): Promise<CustomMetadataUpdateResponse> {
    const client = await this.#getClient();
    try {
      const response =
        await client.putItemCustomMetadataByRunV1RunsRunIdItemsExternalIdCustomMetadataPut({
          runId: applicationRunId,
          externalId,
          customMetadataUpdateRequest: {
            custom_metadata: customMetadata,
            custom_metadata_checksum: customMetadataChecksum,
          },
        });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Delete the results (output artifacts) of an application run
   *
   * This method permanently deletes the output artifacts produced by a
   * terminated run. The run and its items remain queryable, but their
   * output artifacts are no longer available for download.
   *
   * @param applicationRunId - The unique identifier of the application run
   * @returns A promise that resolves when the deletion request succeeds
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the request fails (e.g., 404 if the run doesn't exist)
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   await sdk.deleteRunResults('run-123');
   *   console.log('Run results deleted');
   * } catch (error) {
   *   console.error('Failed to delete run results:', error.message);
   * }
   * ```
   */
  async deleteRunResults(applicationRunId: string): Promise<void> {
    const client = await this.#getClient();
    try {
      await client.deleteRunItemsV1RunsRunIdArtifactsDelete({
        runId: applicationRunId,
      });
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

  /**
   * Download an artifact file from a completed application run
   *
   * This method retrieves the binary content of a specific artifact produced
   * during an application run. Artifacts can include generated reports, processed
   * images, or other output files from the AI model execution.
   *
   * The download is performed with automatic retries for transient failures.
   * Non-retryable HTTP status codes (403, 404, 410, 422) will abort immediately.
   *
   * @param runId - The unique identifier of the application run
   * @param artifactId - The unique identifier of the artifact to download
   * @returns A promise that resolves to an ArrayBuffer containing the artifact's binary content
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the API request fails (e.g., 403, 404, 410, 422, or other HTTP errors)
   * @throws {UnexpectedError} If a non-HTTP error occurs
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * try {
   *   const buffer = await sdk.downloadArtifact('run-123', 'artifact-456');
   *   console.log(`Downloaded ${buffer.byteLength} bytes`);
   *
   *   // Write to file (Node.js)
   *   fs.writeFileSync('output.bin', Buffer.from(buffer));
   * } catch (error) {
   *   console.error('Failed to download artifact:', error.message);
   * }
   * ```
   */
  async downloadArtifact(runId: string, artifactId: string): Promise<ArrayBuffer> {
    const client = await this.#getClient();
    try {
      const response = await downloadWithRetry(
        () =>
          client.getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet(
            {
              runId,
              artifactId,
            },
            {
              responseType: 'arraybuffer',
            }
          ),
        [403, 404, 410, 422]
      );
      return response.data as ArrayBuffer;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Download an artifact file from a completed application run as a stream
   *
   * Prefer this method over `downloadArtifact` when downloading large (e.g. multi-gigabyte)
   * artifacts: instead of buffering the entire file into memory before returning it, this
   * method streams the artifact's bytes as they arrive, keeping memory usage low regardless
   * of the artifact's size.
   *
   * The download is performed with automatic retries for transient failures.
   * Non-retryable HTTP status codes (403, 404, 410, 422) will abort immediately.
   *
   * @param runId - The unique identifier of the application run
   * @param artifactId - The unique identifier of the artifact to download
   * @returns A promise that resolves to a Node.js `Readable` stream yielding the artifact's binary content
   * @throws {AuthenticationError} If no valid authentication token is available
   * @throws {APIError} If the API request fails (e.g., 403, 404, 410, 422, or other HTTP errors)
   * @throws {UnexpectedError} If a non-HTTP error occurs
   *
   * @example
   * ```typescript
   * import { pipeline } from 'node:stream/promises';
   * import { createWriteStream } from 'node:fs';
   *
   * const stream = await sdk.downloadArtifactStream('run-123', 'artifact-456');
   * await pipeline(stream, createWriteStream('output.bin'));
   * ```
   *
   * @remarks
   * Retries only cover failures at the initial-request stage (a non-2xx status surfaced from
   * the response headers before the body begins streaming). Once the response body has started
   * streaming, a mid-stream connection drop CANNOT be retried by this method — the consumer must
   * listen for the stream's `error` event and re-download if needed.
   */
  async downloadArtifactStream(runId: string, artifactId: string): Promise<Readable> {
    const client = await this.#getClient();
    try {
      const response = await downloadWithRetry(
        () =>
          client.getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet(
            {
              runId,
              artifactId,
            },
            {
              responseType: 'stream',
            }
          ),
        [403, 404, 410, 422]
      );
      return response.data as Readable;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Create a grant to share access to a resource with a subject (user or organization)
   *
   * @param request - The grant creation request
   * @returns A promise that resolves to the created grant
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid request data, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const grant = await sdk.createGrant({
   *   resource_type: 'run',
   *   resource_id: 'run-123',
   *   subject_type: 'user',
   *   subject_email: 'colleague@example.com',
   *   relation: 'viewer',
   * });
   * ```
   */
  async createGrant(request: GrantCreateRequest): Promise<GrantReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.createGrantV1AccessGrantsPost({
        grantCreateRequest: request,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * List grants, optionally filtered by resource, subject, relation, or revocation status
   *
   * @param options - Optional filters and pagination/sort options
   * @returns A promise that resolves to an array of grants
   * @throws {Error} If the request fails due to network issues, authentication problems, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const grants = await sdk.listGrants({ resourceType: 'run', resourceId: 'run-123' });
   * ```
   */
  async listGrants({
    resourceType,
    resourceId,
    subjectType,
    subjectId,
    relation,
    revoked,
    page,
    pageSize,
    sort,
  }: {
    resourceType?: ResourceType;
    resourceId?: string;
    subjectType?: SubjectType;
    subjectId?: string;
    relation?: GrantRelation[];
    revoked?: boolean;
    page?: number;
    pageSize?: number;
    sort?: string[];
  } = {}): Promise<GrantReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listGrantsV1AccessGrantsGet({
        resourceType,
        resourceId,
        subjectType,
        subjectId,
        relation,
        revoked,
        page,
        pageSize,
        sort,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Get a grant by its ID
   *
   * @param grantId - The unique identifier of the grant
   * @returns A promise that resolves to the grant details
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid grant ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const grant = await sdk.getGrant('grant-123');
   * ```
   */
  async getGrant(grantId: string): Promise<GrantReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.getGrantV1AccessGrantsGrantIdGet({ grantId });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Revoke a grant by its ID
   *
   * @param grantId - The unique identifier of the grant to revoke
   * @returns A promise that resolves to the revoked grant details
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid grant ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * await sdk.revokeGrant('grant-123');
   * ```
   */
  async revokeGrant(grantId: string): Promise<GrantReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.revokeGrantV1AccessGrantsGrantIdDelete({ grantId });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Create a share token. The returned share_token value is shown only once and is never stored.
   * Use `createGrant` with `subject_type: 'share_token'` to grant access to a resource.
   *
   * @param request - The share token creation request
   * @returns A promise that resolves to the created share token, including the one-time token value
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid request data, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const shareToken = await sdk.createShareToken({ expires_at: '2026-01-01T00:00:00Z' });
   * console.log(shareToken.share_token); // Only shown once
   * ```
   */
  async createShareToken(request: ShareTokenCreateRequest): Promise<ShareTokenCreateResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.createShareTokenV1AccessShareTokensPost({
        shareTokenCreateRequest: request,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * List share tokens, optionally filtered by run, creator, or revocation status
   *
   * @param options - Optional filters and pagination/sort options
   * @returns A promise that resolves to an array of share tokens
   * @throws {Error} If the request fails due to network issues, authentication problems, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const shareTokens = await sdk.listShareTokens({ runId: 'run-123' });
   * ```
   */
  async listShareTokens({
    runId,
    createdBy,
    revoked,
    page,
    pageSize,
    sort,
  }: {
    runId?: string;
    createdBy?: string;
    revoked?: boolean;
    page?: number;
    pageSize?: number;
    sort?: string[];
  } = {}): Promise<ShareTokenReadResponse[]> {
    const client = await this.#getClient();
    try {
      const response = await client.listShareTokensV1AccessShareTokensGet({
        runId,
        createdBy,
        revoked,
        page,
        pageSize,
        sort,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Get a share token by its ID
   *
   * @param shareTokenId - The unique identifier of the share token
   * @returns A promise that resolves to the share token details (excludes the token value)
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid share token ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * const shareToken = await sdk.getShareToken('share-token-123');
   * ```
   */
  async getShareToken(shareTokenId: string): Promise<ShareTokenReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.getShareTokenV1AccessShareTokensShareTokenIdGet({
        shareTokenId,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }

  /**
   * Revoke a share token by its ID. Invalidates the credential regardless of any active grants.
   *
   * @param shareTokenId - The unique identifier of the share token to revoke
   * @returns A promise that resolves to the revoked share token details
   * @throws {Error} If the request fails due to network issues, authentication problems, invalid share token ID, or API errors
   *
   * @example
   * ```typescript
   * const sdk = new PlatformSDKHttp({ tokenProvider: () => 'your-token' });
   *
   * await sdk.revokeShareToken('share-token-123');
   * ```
   */
  async revokeShareToken(shareTokenId: string): Promise<ShareTokenReadResponse> {
    const client = await this.#getClient();
    try {
      const response = await client.revokeShareTokenV1AccessShareTokensShareTokenIdDelete({
        shareTokenId,
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  }
}
