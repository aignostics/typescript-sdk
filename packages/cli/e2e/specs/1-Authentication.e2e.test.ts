import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { FileSystemTokenStorage } from '../../src/utils/token-storage.js';
import { chromium } from 'playwright';

const refreshToken = process.env.E2E_REFRESH_TOKEN || '';
const environment = process.env.E2E_TEST_ENVIRONMENT || 'staging';
const adminEmail = process.env.E2E_ADMIN_USER_EMAIL || '';
const adminPassword = process.env.E2E_ADMIN_USER_PASSWORD || '';

const tokenStorage = new FileSystemTokenStorage();

describe('Authentication', () => {
  it('should complete login flow', async () => {
    const browser = await chromium.launch({ headless: true });
    let authUrl = '';

    // Step 1: Start CLI login command (non-blocking)
    const cliPromise = executeCLI(['login']);

    // Step 2: Capture the auth URL from CLI output in real-time
    cliPromise.stdout?.on('data', data => {
      const output = String(data);
      console.log('CLI Output:', output);

      // Extract URL - adjust regex based on your CLI output format
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch && !authUrl) {
        authUrl = urlMatch[0];
      }

      console.log('Captured URL:', authUrl);
    });

    // Step 3: Wait for URL to be captured
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (authUrl) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 500);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 10000);
    });

    if (!authUrl) {
      throw new Error('Failed to capture auth URL from CLI');
    }

    console.log('Auth URL:', authUrl);

    // Step 4: Automate browser login
    const page = await browser.newPage();
    await page.goto(authUrl);

    // Wait for Auth0 login page
    await page.waitForSelector('input[name="username"], input[type="email"]', {
      timeout: 10000,
    });

    // Fill in credentials
    await page.fill('input[name="username"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);

    const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    // Click login button
    await continueButton.click();

    // Step 6: Wait for success page or redirect
    await page.waitForURL(/success|authorized|complete|localhost/, {
      timeout: 10000,
    });

    await page.close();

    // Step 7: Wait for CLI to complete
    const result = await cliPromise;

    console.log('CLI completed with output:', result.stdout);

    // Step 8: Verify success
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/🔑 You are now authenticated and can use the SDK./i);
  }, 60000); // 60 second timeout

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
