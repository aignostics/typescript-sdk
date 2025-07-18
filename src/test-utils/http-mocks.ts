import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * Mock responses for API endpoints
 */
export const mockResponses = {
  // Mock successful applications list response
  applicationsSuccess: [
    { id: '1', name: 'Test Application 1', description: 'A test application' },
    { id: '2', name: 'Test Application 2', description: 'Another test application' },
  ],

  // Mock empty applications list
  applicationsEmpty: [],

  // Mock error response
  error: {
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
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
  ],

  // Empty responses
  empty: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.applicationsEmpty, { status: 200 });
    }),
  ],

  // Error responses
  error: [
    http.get('*/v1/applications', () => {
      return HttpResponse.json(mockResponses.error, { status: 404 });
    }),
  ],

  // Network error (connection failure)
  networkError: [
    http.get('*/v1/applications', () => {
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
