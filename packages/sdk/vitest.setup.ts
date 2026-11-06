import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/test-utils/http-mocks.js';

// Start the mock server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledFrame({ frame, defaults }) {
      // Ignore localhost requests (used by OAuth callback server tests)
      const request =
        frame.protocol === 'http' ? (frame.data as { request: Request }).request : null;
      if (request?.url.includes('localhost')) {
        return;
      }
      // Warn about other unhandled requests
      defaults.warn();
    },
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});
