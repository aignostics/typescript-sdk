import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Mock responses for API endpoints
 */
export const mockResponses = {
  // Mock successful applications list response
  applicationsSuccess: [
    {
      application_id: '1',
      name: 'Test Application 1',
      description: 'A test application',
      regulatory_classes: [],
    },
    {
      application_id: '2',
      name: 'Test Application 2',
      description: 'Another test application',
      regulatory_classes: [],
    },
  ],

  // Mock empty applications list
  applicationsEmpty: [],

  // Mock application versions response
  applicationVersionsSuccess: [
    {
      application_version_id: 'v1.0.0',
      version: '1.0.0',
      application_id: '1',
      changelog: 'Initial version',
      input_artifacts: [],
      output_artifacts: [],
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      application_version_id: 'v1.1.0',
      version: '1.1.0',
      application_id: '1',
      changelog: 'Bug fixes and improvements',
      input_artifacts: [],
      output_artifacts: [],
      created_at: '2023-02-01T00:00:00Z',
    },
  ],

  // Mock application runs response
  applicationRunsSuccess: [
    {
      application_run_id: 'run-1',
      application_version_id: 'v1.0.0',
      organization_id: 'org-1',
      status: 'COMPLETED',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T01:00:00Z',
    },
    {
      application_run_id: 'run-2',
      application_version_id: 'v1.1.0',
      organization_id: 'org-1',
      status: 'RUNNING',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:30:00Z',
    },
  ],

  // Mock single run response
  runSuccess: {
    application_run_id: 'run-1',
    application_version_id: 'v1.0.0',
    organization_id: 'org-1',
    status: 'COMPLETED',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T01:00:00Z',
  },

  // Mock create application run response
  createRunSuccess: {
    application_run_id: 'new-run-123',
  },

  // Mock run results response
  runResultsSuccess: [
    {
      item_id: 'item-1',
      reference: 'test-ref-1',
      status: 'SUCCEEDED',
      input_artifacts: [],
      output_artifacts: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T01:00:00Z',
    },
    {
      item_id: 'item-2',
      reference: 'test-ref-2',
      status: 'SUCCEEDED',
      input_artifacts: [],
      output_artifacts: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T01:00:00Z',
    },
  ],

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

/**
 * HTTP request handlers for different scenarios
 */
export const handlers = {
  // Successful API responses
  success: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.applicationsSuccess, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.json(mockResponses.applicationVersionsSuccess, { status: 200 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.applicationRunsSuccess, { status: 200 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.createRunSuccess, { status: 200 });
    }),
    http.get('*/v1/runs/:applicationRunId', () => {
      return HttpResponse.json(mockResponses.runSuccess, { status: 200 });
    }),
    http.post('*/v1/runs/:applicationRunId/cancel', () => {
      return HttpResponse.json({}, { status: 200 });
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
      return HttpResponse.json(mockResponses.runResultsSuccess, { status: 200 });
    }),
  ],

  // Empty responses
  empty: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.applicationsEmpty, { status: 200 });
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.json([], { status: 200 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json([], { status: 200 });
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
      return HttpResponse.json([], { status: 200 });
    }),
  ],

  // Not found responses
  notFoundError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs/:applicationRunId', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.post('*/v1/runs/:applicationRunId/cancel', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
  ],

  validationError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs/:applicationRunId', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.post('*/v1/runs/:applicationRunId/cancel', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
      return HttpResponse.json(mockResponses.validationError, { status: 422 });
    }),
  ],

  internalServerError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs/:applicationRunId', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.post('*/v1/runs/:applicationRunId/cancel', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
      return HttpResponse.json(mockResponses.error, { status: 500 });
    }),
  ],

  // Network error (connection failure)
  networkError: [
    http.get('*/v1/applications', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/applications/:applicationId/versions', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs', () => {
      return HttpResponse.error();
    }),
    http.post('*/v1/runs', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs/:applicationRunId', () => {
      return HttpResponse.error();
    }),
    http.post('*/v1/runs/:applicationRunId/cancel', () => {
      return HttpResponse.error();
    }),
    http.get('*/v1/runs/:applicationRunId/results', () => {
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
export const server = createMockServer('success');

/**
 * Helper function to reset handlers for a specific scenario
 */
export function setMockScenario(scenario: keyof typeof handlers) {
  server.use(...handlers[scenario]);
}
