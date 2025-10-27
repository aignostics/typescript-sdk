import { execa } from 'execa';
import { beforeAll, beforeEach, expect, vi } from 'vitest';

const refreshToken = process.env.E2E_REFRESH_TOKEN;
const testEnvironment = process.env.E2E_TEST_ENVIRONMENT || 'develop';
// Start the mock server before all tests
beforeAll(() => {
  beforeEach(async () => {
    const { stdout: output } = await execa('node', [
      __CLI_BIN__,
      'login',
      '--refreshToken',
      refreshToken,
      '--environment',
      testEnvironment,
    ]);

    await vi.waitFor(() => expect(output).contain('Data saved securely to OS keychain'));
  });
});
