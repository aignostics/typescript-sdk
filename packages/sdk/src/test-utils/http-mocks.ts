import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import type {
  ApplicationReadShortResponse,
  ApplicationReadResponse,
  ApplicationVersion,
  RunReadResponse,
  RunCreationResponse,
  ItemResultReadResponse,
  OutputArtifactResultReadResponse,
  VersionReadResponse,
  InputArtifact,
  OutputArtifact,
} from '../generated/index.js';

// Factories for generating mock data
const applicationVersionFactory = Factory.define<ApplicationVersion>(() => ({
  number: faker.system.semver(),
  released_at: faker.date.past().toISOString(),
}));

const applicationShortFactory = Factory.define<ApplicationReadShortResponse>(() => ({
  application_id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  regulatory_classes: faker.helpers.arrayElements(['RUO', 'IVDR', 'FDA'], { min: 1, max: 2 }),
  latest_version: applicationVersionFactory.build(),
}));

const applicationFactory = Factory.define<ApplicationReadResponse>(() => ({
  application_id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  regulatory_classes: faker.helpers.arrayElements(['RUO', 'IVDR', 'FDA'], { min: 1, max: 2 }),
  versions: applicationVersionFactory.buildList(faker.number.int({ min: 1, max: 3 })),
}));

const inputArtifactFactory = Factory.define<InputArtifact>(() => ({
  name: faker.system.fileName(),
  mime_type: faker.helpers.arrayElement(['image/tiff', 'image/jpeg', 'image/png']),
  metadata_schema: {
    type: 'object',
    properties: {
      checksum_base64_crc32c: { type: 'string' },
      mime_type: { type: 'string' },
      height: { type: 'integer' },
      width: { type: 'integer' },
      mpp: { type: 'number' },
    },
    required: ['checksum_base64_crc32c', 'mime_type'],
  },
}));

const outputArtifactSchemaFactory = Factory.define<OutputArtifact>(() => ({
  name: faker.system.fileName(),
  mime_type: faker.helpers.arrayElement(['application/json', 'image/tiff', 'text/csv']),
  metadata_schema: {
    type: 'object',
    properties: {
      mime_type: { type: 'string' },
      size_bytes: { type: 'integer' },
    },
  },
  scope: 'ITEM',
  visibility: 'EXTERNAL',
}));

const versionDetailsFactory = Factory.define<VersionReadResponse>(() => ({
  version_number: faker.system.semver(),
  changelog: faker.lorem.paragraph(),
  input_artifacts: inputArtifactFactory.buildList(faker.number.int({ min: 1, max: 3 })),
  output_artifacts: outputArtifactSchemaFactory.buildList(faker.number.int({ min: 1, max: 5 })),
  released_at: faker.date.past().toISOString(),
}));

const outputArtifactFactory = Factory.define<OutputArtifactResultReadResponse>(() => ({
  output_artifact_id: faker.string.uuid(),
  name: faker.system.fileName(),
  metadata: {
    mime_type: faker.helpers.arrayElement(['image/tiff', 'application/json', 'text/csv']),
    size_bytes: faker.number.int({ min: 1000, max: 1000000 }),
  },
  state: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'TERMINATED']),
  output: faker.helpers.arrayElement(['NONE', 'AVAILABLE', 'DELETED_BY_USER', 'DELETED_BY_SYSTEM']),
  download_url: faker.internet.url(),
  error_code: null,
}));

const itemResultFactory = Factory.define<ItemResultReadResponse>(() => ({
  item_id: faker.string.uuid(),
  run_id: faker.string.uuid(),
  external_id: `slide_${faker.number.int({ min: 1, max: 1000 })}`,
  custom_metadata: {
    case_id: faker.string.uuid(),
    specimen_type: faker.helpers.arrayElement(['biopsy', 'resection', 'cytology']),
  },
  custom_metadata_checksum: faker.string.alphanumeric(8),
  status: faker.helpers.arrayElement([
    'PENDING',
    'CANCELED_USER',
    'CANCELED_SYSTEM',
    'USER_ERROR',
    'SYSTEM_ERROR',
    'SUCCEEDED',
  ]),
  state: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'TERMINATED']),
  output: faker.helpers.arrayElement(['NONE', 'FULL']),
  termination_reason: faker.helpers.arrayElement([
    'SUCCEEDED',
    'USER_ERROR',
    'SYSTEM_ERROR',
    'SKIPPED',
  ]),
  error_message: null,
  message: faker.lorem.sentence(),
  terminated_at: faker.date.recent().toISOString(),
  output_artifacts: outputArtifactFactory.buildList(faker.number.int({ min: 0, max: 3 })),
  error_code: null,
}));

const runFactory = Factory.define<RunReadResponse>(() => ({
  run_id: faker.string.uuid(),
  application_id: faker.string.uuid(),
  version_number: faker.system.semver(),
  custom_metadata: {
    study_id: faker.string.uuid(),
    batch_name: faker.string.alpha(10),
  },
  custom_metadata_checksum: faker.string.alphanumeric(8),
  state: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'TERMINATED']),
  output: faker.helpers.arrayElement(['NONE', 'PARTIAL', 'FULL']),
  termination_reason: faker.helpers.arrayElement([
    'ALL_ITEMS_PROCESSED',
    'CANCELED_BY_SYSTEM',
    'CANCELED_BY_USER',
  ]),
  error_code: null,
  error_message: null,
  submitted_at: faker.date.past().toISOString(),
  terminated_at: faker.date.recent().toISOString(),
  statistics: {
    item_count: faker.number.int({ min: 1, max: 50 }),
    item_pending_count: faker.number.int({ min: 0, max: 10 }),
    item_processing_count: faker.number.int({ min: 0, max: 5 }),
    item_user_error_count: faker.number.int({ min: 0, max: 2 }),
    item_system_error_count: faker.number.int({ min: 0, max: 1 }),
    item_skipped_count: faker.number.int({ min: 0, max: 3 }),
    item_succeeded_count: faker.number.int({ min: 0, max: 20 }),
  },
  submitted_by: faker.string.uuid(),
}));

const runCreationResponseFactory = Factory.define<RunCreationResponse>(() => ({
  run_id: faker.string.uuid(),
}));

/**
 * Mock responses for API endpoints using factories
 */
export const mockResponses = {
  // Mock successful applications list response
  applicationsSuccess: applicationShortFactory.buildList(3),

  // Mock empty applications list
  applicationsEmpty: [],

  // Mock single application response
  applicationSuccess: applicationFactory.build(),

  // Mock application version details response
  versionDetailsSuccess: versionDetailsFactory.build({ version_number: 'v1.0.0' }),

  // Mock application runs response
  applicationRunsSuccess: runFactory.buildList(2),

  // Mock single run response
  runSuccess: runFactory.build(),

  // Mock create application run response
  createRunSuccess: runCreationResponseFactory.build(),

  // Mock run results response
  runResultsSuccess: itemResultFactory.buildList(2),

  // Mock error response
  error: {
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
  },

  validationError: {
    detail: [
      {
        loc: ['field1'],
        type: 'missing',
        msg: 'field1 is required',
      },
    ],
  },
};

// Export factories for use in tests
export const factories = {
  applicationShort: applicationShortFactory,
  application: applicationFactory,
  applicationVersion: applicationVersionFactory,
  versionDetails: versionDetailsFactory,
  inputArtifact: inputArtifactFactory,
  outputArtifactSchema: outputArtifactSchemaFactory,
  run: runFactory,
  runCreationResponse: runCreationResponseFactory,
  itemResult: itemResultFactory,
  outputArtifact: outputArtifactFactory,
};

/**
 * HTTP request handlers for different scenarios
 */
export const handlers = {
  // Successful API responses
  success: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.applicationsSuccess, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.json(mockResponses.applicationSuccess, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.json(mockResponses.versionDetailsSuccess, { status: 200 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.applicationRunsSuccess, { status: 200 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.createRunSuccess, { status: 201 });
    }),
    http.get('*/v1/runs/:runId', () => {
      return HttpResponse.json(mockResponses.runSuccess, { status: 200 });
    }),
    http.post('*/v1/runs/:runId/cancel', () => {
      return HttpResponse.json({}, { status: 202 });
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.json(mockResponses.runResultsSuccess, { status: 200 });
    }),
  ],

  // Empty responses
  empty: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.applicationsEmpty, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.json(mockResponses.applicationSuccess, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.json(mockResponses.versionDetailsSuccess, { status: 200 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json([], { status: 200 });
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.json([], { status: 200 });
    }),
  ],

  // Not found responses
  notFoundError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs/:runId', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.post('*/v1/runs/:runId/cancel', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
  ],

  validationError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs/:runId', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.post('*/v1/runs/:runId/cancel', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
  ],

  internalServerError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs/:runId', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.post('*/v1/runs/:runId/cancel', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
  ],

  // Network error (connection failure)
  networkError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/applications/:applicationId', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/applications/:applicationId/versions/:version', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.error();
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs/:runId', () => {
      return HttpResponse.error();
    }),
    http.post('*/v1/runs/:runId/cancel', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs/:runId/items', () => {
      return HttpResponse.error();
    }),
  ],
};

/**
 * Create a mock server with specific handlers
 */
export function createMockServer(handlerSet: keyof typeof handlers = 'success') {
  return setupServer(...handlers[handlerSet]);
}

/**
 * Default mock server for successful responses
 */
export const server = setupServer();

/**
 * Helper function to reset handlers for a specific scenario
 */
export function setMockScenario(scenario: keyof typeof handlers) {
  server.use(...handlers[scenario]);
}
