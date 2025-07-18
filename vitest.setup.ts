import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/test-utils/http-mocks';

// Start the mock server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Log warnings for unhandled requests
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
