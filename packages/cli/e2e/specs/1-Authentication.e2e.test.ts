import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { FileSystemTokenStorage } from '../../src/utils/token-storage.js';
import { chromium } from 'playwright';

const refreshToken = process.env.E2E_REFRESH_TOKEN || '';
const environment = process.env.E2E_TEST_ENVIRONMENT || 'staging';
const adminEmail = process.env.E2E_ADMIN_USER_EMAIL || '';
const adminPassword = process.env.E2E_ADMIN_USER_PASSWORD || '';

const tokenStorage = new FileSystemTokenStorage();

if (!adminEmail || !adminPassword) {
  throw new Error(
    'E2E_ADMIN_USER_EMAIL and E2E_ADMIN_USER_PASSWORD must be set for PKCE auth tests'
  );
}

const PLAYWRIGHT_TIMEOUT = 10000;
const PKCE_TEST_TIMEOUT = 60000;
const INTERVAL_CHECK_TIMEOUT = 500;

describe('Authentication', () => {
  it(
    'Should complete PKCE authentication login flow with browser automation @tests:SWR-AUTH-CODE-FLOW @tests:SWR-AUTH-CUSTOM-PROVIDER',
    async () => {
      const browser = await chromium.launch({ headless: true });
      try {
        let authUrl = '';

        const cliPromise = executeCLI(['login']);

        const dataHandler = (data: Buffer) => {
          const output = String(data);

          const urlMatch = output.match(/https:\/\/[^\s]+/);
          if (urlMatch && !authUrl) {
            authUrl = urlMatch[0];
            cliPromise.stdout?.off('data', dataHandler); // Clean up
          }
        };
        cliPromise.stdout?.on('data', dataHandler);

        // Wait for URL to be captured with timeout
        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (authUrl) {
              clearInterval(checkInterval);
              clearTimeout(timeoutId);
              resolve();
            }
          }, INTERVAL_CHECK_TIMEOUT);

          const timeoutId = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timeout waiting for auth URL'));
          }, PLAYWRIGHT_TIMEOUT);
        });

        if (!authUrl) {
          throw new Error('Failed to capture auth URL from CLI');
        }

        console.log('Auth URL:', authUrl);

        const page = await browser.newPage();
        await page.goto(authUrl);

        await page.waitForSelector('input[name="username"], input[type="email"]', {
          timeout: PLAYWRIGHT_TIMEOUT,
        });

        await page.fill('input[name="username"], input[type="email"]', adminEmail);
        await page.fill('input[name="password"], input[type="password"]', adminPassword);

        const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        await continueButton.click();

        await page.waitForURL(/success|authorized|complete|localhost/, {
          timeout: PLAYWRIGHT_TIMEOUT,
        });

        await page.close();

        const result = await cliPromise;

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/🔑 You are now authenticated and can use the SDK./i);
      } finally {
        await browser.close();
      }
    },
    PKCE_TEST_TIMEOUT
  ); // 60 second timeout

  it('Should call authenticated test-api command when authenticated @tests:SWR-AUTH-TOKEN-BASED @tests:SWR-AUTH-SECURE-STORAGE', async () => {
    const { stdout: loginStdout } = await executeCLI(['login', '--refreshToken', refreshToken]);
    expect(loginStdout).toContain('🎉 Login with refresh token successful! Token saved securely.');

    const { stdout: testApiStdout } = await executeCLI(['test-api']);
    expect(testApiStdout).toContain('API connection successful');
  });

  it('Should refresh token automatically when expired @tests:SWR-AUTH-AUTO-REFRESH', async () => {
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

  it('Should try to refresh token and fail with invalid refresh token @tests:SWR-AUTH-AUTO-REFRESH', async () => {
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

  it('Should reject calls to api without authentication @tests:SWR-AUTH-VALIDATION @tests:SWR-AUTH-TOKEN-REMOVAL', async () => {
    const data = await tokenStorage.load(environment);

    await executeCLI(['logout'], { reject: false });

    const { stderr: testApiStderr } = await executeCLI(['test-api'], { reject: false });

    expect(testApiStderr).toContain('API connection failed: AuthenticationError:');

    await tokenStorage.save(environment, { ...data });
  });
});
