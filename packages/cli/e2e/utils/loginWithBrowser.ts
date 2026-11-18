import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { executeCLI } from './command.js';

const PLAYWRIGHT_TIMEOUT = 10000;
// The post-login redirect makes a full round-trip through Auth0 before landing
// back on the local callback, which can take noticeably longer than a single
// page interaction, so it gets more headroom.
const POST_LOGIN_NAVIGATION_TIMEOUT = 30000;
const INTERVAL_CHECK_TIMEOUT = 500;

const DIAGNOSTICS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../test-results');

/**
 * Reads the e2e user's credentials, which every browser login needs.
 */
const getAdminCredentials = () => {
  const email = process.env.E2E_ADMIN_USER_EMAIL || '';
  const password = process.env.E2E_ADMIN_USER_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_USER_EMAIL and E2E_ADMIN_USER_PASSWORD must be set for the e2e tests'
    );
  }

  return { email, password };
};

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

/**
 * Runs `auth login` and completes the Auth0 login in a headless browser with the
 * e2e user's email and password. The CLI stores the resulting tokens, including a
 * refresh token, in its token storage. Returns the finished CLI process.
 *
 * @param diagnosticsLabel - File name prefix for the diagnostics written on failure
 */
export const loginWithBrowser = async (diagnosticsLabel: string) => {
  const { email, password } = getAdminCredentials();

  const browser = await chromium.launch({ headless: true });
  let page: Page | undefined;
  try {
    let authUrl = '';

    const cliPromise = executeCLI(['auth', 'login']);

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

    await page.fill('input[name="username"], input[type="email"]', email);

    // Auth0 Universal Login runs identifier-first: the username screen
    // (/u/login/identifier) only carries a hidden, nameless password
    // placeholder, and the real password field is on the next screen
    // (/u/login/password). Submit the username first when no password
    // field is visible yet.
    const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    const passwordInput = page.locator('input[name="password"]');
    if (!(await passwordInput.isVisible())) {
      await continueButton.click();
    }
    await passwordInput.fill(password);
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

    return await cliPromise;
  } catch (error) {
    if (page) {
      await capturePageDiagnostics(page, diagnosticsLabel);
    }
    throw error;
  } finally {
    await browser.close();
  }
};
