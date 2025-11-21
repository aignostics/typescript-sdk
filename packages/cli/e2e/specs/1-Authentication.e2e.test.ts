import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { FileSystemTokenStorage } from '../../src/utils/token-storage.js';

const refreshToken = process.env.E2E_REFRESH_TOKEN || '';
const environment = process.env.E2E_TEST_ENVIRONMENT || 'staging';

const tokenStorage = new FileSystemTokenStorage();

describe('Authentication', () => {
  it('Should call authenticated test-api command when authenticated', async () => {
    const { stdout: loginStdout } = await executeCLI(['login', '--refreshToken', refreshToken]);
    expect(loginStdout).toContain('🎉 Login with refresh token successful! Token saved securely.');

    const { stdout: testApiStdout } = await executeCLI(['test-api']);
    expect(testApiStdout).toContain('API connection successful');
  });

  it('Should refresh token automatically when expired', async () => {
    const data = await tokenStorage.load(environment);

    await tokenStorage.save(environment, {
      ...data,
      expires_at_ms: Date.now() - 1000, // set expiry in the past
    });

    const { stdout: testApiStdout } = await executeCLI(['test-api']);
    expect(testApiStdout).toContain('Access token expired, attempting to refresh...');
    expect(testApiStdout).toContain('Token refreshed successfully');
    expect(testApiStdout).toContain('API connection successful');
  });

  it('Should try to refresh token and fail with invalid refresh token', async () => {
    const data = await tokenStorage.load(environment);

    await tokenStorage.save(environment, {
      ...data,
      refresh_token: 'invalid-refresh-token',
      expires_at_ms: Date.now() - 1000, // set expiry in the past
    });

    const { stderr: testApiStderr } = await executeCLI(['test-api'], { reject: false });
    expect(testApiStderr).toContain('Warning: Token refresh failed');
    await tokenStorage.save(environment, { ...data });
  });

  it('Should reject calls to api without authentication', async () => {
    const data = await tokenStorage.load(environment);
    await tokenStorage.remove(environment);

    const { stderr: testApiStderr } = await executeCLI(['test-api'], { reject: false });

    expect(testApiStderr).toContain('API connection failed: AuthenticationError:');

    await tokenStorage.save(environment, { ...data });
  });
});
