import crypto from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';
import { z } from 'zod';
import { Issuer, generators } from 'openid-client';
import { saveData, loadData, removeData } from './token-storage.js';

/**
 * Authentication utilities for the Aignostics Platform SDK
 * This module is the only consumer of token-storage and provides
 * a clean interface for authentication operations.
 */

/**
 * Token data schema for validation
 */
const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional(),
  scope: z.string().optional(),
  stored_at: z.number(),
});

export type TokenData = z.infer<typeof TokenSchema>;

/**
 * Authentication state information
 */
export interface AuthState {
  isAuthenticated: boolean;
  token?: {
    type: string;
    scope: string;
    expiresAt?: Date;
    storedAt: Date;
  };
}

/**
 * OAuth login configuration
 */
export interface LoginConfig {
  issuerURL: string;
  clientID: string;
  audience?: string;
  scope?: string;
}

/**
 * Save token data with timestamp
 */
async function saveToken(tokenData: Omit<TokenData, 'stored_at'>): Promise<void> {
  const dataToStore: TokenData = {
    ...tokenData,
    stored_at: Date.now(),
  };
  return saveData(dataToStore);
}

/**
 * Load and validate token data
 */
async function loadToken(): Promise<TokenData | null> {
  try {
    const data = await loadData();
    const result = TokenSchema.safeParse(data);

    if (!result.success) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.warn(`Warning: Could not load token: ${error}`);
    return null;
  }
}

/**
 * Check if a token exists and is valid (not expired)
 */
async function isTokenValid(tokenData: TokenData): Promise<boolean> {
  // Check if token has expiration and if it's expired
  if (tokenData.expires_in) {
    const expirationTime = tokenData.stored_at + tokenData.expires_in * 1000;
    const now = Date.now();

    if (now >= expirationTime) {
      return false;
    }
  }

  return true;
}

/**
 * Get a valid access token from storage
 * @returns Valid access token or null if not found/expired
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const tokenData = await loadToken();

    if (!tokenData) {
      return null;
    }

    if (!(await isTokenValid(tokenData))) {
      return null;
    }

    return tokenData.access_token;
  } catch (error) {
    console.warn(`Warning: Could not retrieve token: ${error}`);
    return null;
  }
}

/**
 * Get current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const tokenData = await loadToken();

    if (!tokenData) {
      return { isAuthenticated: false };
    }

    const isValid = await isTokenValid(tokenData);

    if (!isValid) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      token: {
        type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || 'N/A',
        expiresAt: tokenData.expires_in
          ? new Date(tokenData.stored_at + tokenData.expires_in * 1000)
          : undefined,
        storedAt: new Date(tokenData.stored_at),
      },
    };
  } catch (error) {
    console.warn(`Warning: Could not get auth state: ${error}`);
    return { isAuthenticated: false };
  }
}

/**
 * Perform OAuth2 PKCE login flow
 */
export async function login(config: LoginConfig): Promise<void> {
  const open = (await import('open')).default;
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  console.log('🔐 Starting authentication process...');

  // Start local server to handle OAuth callback
  const server = await startCallbackServer();
  const address = server.address();
  const actualPort = typeof address === 'object' && address !== null ? address.port : 8989;
  const redirectUri = `http://localhost:${actualPort}`;

  try {
    const issuer = await Issuer.discover(config.issuerURL);
    const client = new issuer.Client({
      client_id: config.clientID,
      redirect_uris: [redirectUri],
      response_types: ['code'],
      scope: config.scope || 'openid profile email offline_access',
      audience: config.audience || 'https://aignostics-platform-samia',
      token_endpoint_auth_method: 'none',
    });

    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authorizationUrl = client.authorizationUrl({
      scope: config.scope || 'openid profile email offline_access',
      audience: config.audience || 'https://aignostics-platform-samia',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    console.log('🌐 Opening browser for authentication...');
    console.log("📝 If the browser doesn't open automatically, visit:");
    console.log(`   ${authorizationUrl}`);
    console.log('');
    console.log('⏳ Waiting for authentication callback...');

    await open(authorizationUrl);

    // Wait for the callback
    const authCode = await waitForCallback(server);

    console.log('✅ Authentication callback received!');

    // Exchange authorization code for tokens
    const tokenSet = await client.callback(
      redirectUri,
      { code: authCode },
      { code_verifier: codeVerifier }
    );

    // Save the token securely
    await saveToken({
      access_token: tokenSet.access_token!,
      refresh_token: tokenSet.refresh_token,
      expires_in: tokenSet.expires_in,
      token_type: tokenSet.token_type,
      scope: tokenSet.scope,
    });

    console.log('🎉 Login successful! Token saved securely.');
    console.log('🔑 You are now authenticated and can use the SDK.');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  } finally {
    // Always close the server
    server.close();
  }
}

/**
 * Logout and remove stored tokens
 */
export async function logout(): Promise<void> {
  try {
    await removeData();
    console.log('✅ Logged out successfully. Token removed.');
  } catch (error) {
    console.error('❌ Error during logout:', error);
    throw error;
  }
}

/**
 * Start a local HTTP server to handle OAuth callbacks
 */
async function startCallbackServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.listen(8989, 'localhost', () => {
      resolve(server);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        // Try a random port if 8989 is in use
        server.listen(0, 'localhost', () => {
          resolve(server);
        });
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Wait for OAuth callback and extract authorization code
 */
async function waitForCallback(server: http.Server): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        reject(new Error('Authentication timeout - no callback received within 5 minutes'));
      },
      5 * 60 * 1000
    ); // 5 minutes timeout

    server.on('request', (req, res) => {
      try {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        // Handle OAuth callback
        if (url.pathname === '/') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          if (error) {
            const errorMsg = errorDescription || error;

            // Send error response to browser
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Authentication Failed - Aignostics Platform SDK</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    .error { color: #d32f2f; }
                    .container { max-width: 600px; margin: 0 auto; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1 class="error">❌ Authentication Failed</h1>
                    <p>Error: ${errorMsg}</p>
                    <p>Please try again or check your authentication settings.</p>
                    <p>You can close this browser window.</p>
                  </div>
                </body>
              </html>
            `);

            clearTimeout(timeout);
            reject(new Error(`Authentication failed: ${errorMsg}`));
            return;
          }

          if (code) {
            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Authentication Successful - Aignostics Platform SDK</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                    .success { color: #2e7d32; }
                    .container { max-width: 600px; margin: 0 auto; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1 class="success">✅ Authentication Successful!</h1>
                    <p>You have successfully authenticated with the Aignostics Platform.</p>
                    <p>You can now close this browser window and return to your terminal.</p>
                    <p>The SDK is ready to use! 🚀</p>
                  </div>
                </body>
              </html>
            `);

            clearTimeout(timeout);
            resolve(code);
            return;
          }
        }

        // Handle other paths (favicon, etc.)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}
