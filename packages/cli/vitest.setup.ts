import { server } from '@aignostics/sdk/test';
import { afterAll, beforeAll, afterEach } from 'vitest';

// Start the mock server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest(request, print) {
      // Ignore localhost requests (used by OAuth callback server tests)
      if (request.url.includes('localhost')) {
        return;
      }
      // Warn about other unhandled requests
      print.warning();
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
