import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { loginWithBrowser } from '../utils/loginWithBrowser.js';
import { FileSystemTokenStorage } from '../../src/utils/token-storage.js';

const environment = process.env.E2E_TEST_ENVIRONMENT || 'staging';

const tokenStorage = new FileSystemTokenStorage();

const PKCE_TEST_TIMEOUT = 60000;

describe('Authentication', () => {
  it(
    'Should complete PKCE authentication login flow with browser automation',
    async ({ annotate }) => {
      await annotate('SWR-AUTH-CUSTOM-PROVIDER', 'tests');
      await annotate('SWR-AUTH-CODE-FLOW', 'tests');
      await annotate('TC-AUTH-PKCE', 'id');

      const result = await loginWithBrowser('pkce-login-failure');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/🔑 You are now authenticated and can use the SDK./i);
    },
    PKCE_TEST_TIMEOUT
  );

  it('Should call authenticated test-api command when authenticated', async ({ annotate }) => {
    await annotate('SWR-AUTH-TOKEN-BASED', 'tests');
    await annotate('SWR-AUTH-SECURE-STORAGE', 'tests');
    await annotate('TC-AUTH-TOKEN', 'id');

    const storedToken = await tokenStorage.load(environment);
    const refreshToken = storedToken?.refresh_token;
    if (typeof refreshToken !== 'string') {
      throw new Error('Token storage holds no refresh token from the browser login');
    }

    const { stdout: loginStdout } = await executeCLI([
      'auth',
      'login',
      '--refreshToken',
      refreshToken,
    ]);
    expect(loginStdout).toContain('🎉 Login with refresh token successful! Token saved securely.');

    const { stdout: testApiStdout } = await executeCLI(['test-api']);
    expect(testApiStdout).toContain('API connection successful');
  });

  it('Should refresh token automatically when expired', async ({ annotate }) => {
    await annotate('SWR-AUTH-AUTO-REFRESH', 'tests');
    await annotate('TC-AUTH-REFRESH', 'id');

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

  it('Should try to refresh token and fail with invalid refresh token', async ({ annotate }) => {
    await annotate('SWR-AUTH-AUTO-REFRESH', 'tests');
    await annotate('TC-AUTH-REFRESH-FAIL', 'id');

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

  it('Should reject calls to api without authentication', async ({ annotate }) => {
    await annotate('SWR-AUTH-VALIDATION', 'tests');
    await annotate('SWR-AUTH-TOKEN-REMOVAL', 'tests');
    await annotate('TC-AUTH-NO-AUTH', 'id');

    const data = await tokenStorage.load(environment);

    await executeCLI(['auth', 'logout'], { reject: false });

    const { stderr: testApiStderr } = await executeCLI(['test-api'], { reject: false });

    expect(testApiStderr).toContain('API connection failed: AuthenticationError:');

    await tokenStorage.save(environment, { ...data });
  });
});
