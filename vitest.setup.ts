import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './packages/sdk/src/test-utils/http-mocks';

// Randomize timezone for each test run to ensure timezone independence
const timezones = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

if (!process.env.TZ) {
  const randomTimezone = timezones[Math.floor(Math.random() * timezones.length)];
  process.env.TZ = randomTimezone;
}

console.log(`🌍 Running tests with timezone: ${process.env.TZ}`);

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
