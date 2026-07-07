import { describe, it, expect } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeCLI } from '../utils/command.js';
import { FileSystemTokenStorage } from '../../src/utils/token-storage.js';
import { chromium, type Page } from 'playwright';

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
// The post-login redirect makes a full round-trip through Auth0 before landing
// back on the local callback, which can take noticeably longer than a single
// page interaction — give it more headroom (still well within PKCE_TEST_TIMEOUT).
const POST_LOGIN_NAVIGATION_TIMEOUT = 30000;
const PKCE_TEST_TIMEOUT = 60000;
const INTERVAL_CHECK_TIMEOUT = 500;

const DIAGNOSTICS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../test-results');

/**
 * On failure the raw error is just a navigation timeout, which hides *why* the
 * login did not complete (wrong/rotated credentials, an added Auth0 consent or
 * bot-detection screen, or genuine latency). Dump the current URL, a screenshot
 * and the page HTML so a failing CI run carries the evidence to tell these apart.
 * Best-effort: never let diagnostics capture mask the original failure.
 */
async function capturePageDiagnostics(page: Page, label: string): Promise<void> {
  try {
    const currentUrl = page.url();
    console.error(`[e2e-diagnostics] ${label}: page still at ${currentUrl}`);

    await mkdir(DIAGNOSTICS_DIR, { recursive: true });
    const base = resolve(DIAGNOSTICS_DIR, label);
    await page.screenshot({ path: `${base}.png`, fullPage: true }).catch(() => undefined);
    const html = await page.content().catch(() => '<unavailable>');
    await writeFile(`${base}.html`, html);
    await writeFile(`${base}.url.txt`, currentUrl);
  } catch (diagnosticError) {
    console.error('[e2e-diagnostics] failed to capture diagnostics:', diagnosticError);
  }
}

describe('Authentication', () => {
  it(
    'Should complete PKCE authentication login flow with browser automation',
    async ({ annotate }) => {
      await annotate('SWR-AUTH-CUSTOM-PROVIDER', 'tests');
      await annotate('SWR-AUTH-CODE-FLOW', 'tests');
      await annotate('TC-AUTH-PKCE', 'id');

      const browser = await chromium.launch({ headless: true });
      let page: Page | undefined;
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

        page = await browser.newPage();
        await page.goto(authUrl);

        await page.waitForSelector('input[name="username"], input[type="email"]', {
          timeout: PLAYWRIGHT_TIMEOUT,
        });

        await page.fill('input[name="username"], input[type="email"]', adminEmail);
        await page.fill('input[name="password"], input[type="password"]', adminPassword);

        const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
        await continueButton.click();

        const callbackUrl = /success|authorized|complete|localhost/;

        // A brand-new user is shown a one-time Auth0 Forms "Complete your profile"
        // prompt asking for a full name before the flow redirects to the callback.
        // Race the redirect against that prompt: fill and submit it if it appears,
        // otherwise (profile already provisioned) the redirect happens directly.
        const fullNameInput = page.locator('input[name="full_name"]');
        const reachedCallback = await Promise.race([
          page.waitForURL(callbackUrl, { timeout: POST_LOGIN_NAVIGATION_TIMEOUT }).then(() => true),
          fullNameInput
            .waitFor({ state: 'visible', timeout: POST_LOGIN_NAVIGATION_TIMEOUT })
            .then(() => false),
        ]);

        if (!reachedCallback) {
          await fullNameInput.fill('E2E Test Admin');
          await page.locator('button.af-nextButton').click();

          await page.waitForURL(callbackUrl, {
            timeout: POST_LOGIN_NAVIGATION_TIMEOUT,
          });
        }

        await page.close();
        page = undefined;

        const result = await cliPromise;

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(/🔑 You are now authenticated and can use the SDK./i);
      } catch (error) {
        if (page) {
          await capturePageDiagnostics(page, 'pkce-login-failure');
        }
        throw error;
      } finally {
        await browser.close();
      }
    },
    PKCE_TEST_TIMEOUT
  );

  it('Should call authenticated test-api command when authenticated', async ({ annotate }) => {
    await annotate('SWR-AUTH-TOKEN-BASED', 'tests');
    await annotate('SWR-AUTH-SECURE-STORAGE', 'tests');
    await annotate('TC-AUTH-TOKEN', 'id');

    const { stdout: loginStdout } = await executeCLI(['login', '--refreshToken', refreshToken]);
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

    await executeCLI(['logout'], { reject: false });

    const { stderr: testApiStderr } = await executeCLI(['test-api'], { reject: false });

    expect(testApiStderr).toContain('API connection failed: AuthenticationError:');

    await tokenStorage.save(environment, { ...data });
  });
});
