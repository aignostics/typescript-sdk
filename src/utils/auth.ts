import crypto from 'node:crypto';
import { z } from 'zod';
import { Issuer, generators } from 'openid-client';
import { startCallbackServer, waitForCallback } from './oauth-callback-server.js';

/**
 * Authentication utilities for the Aignostics Platform SDK
 * This module provides a clean interface for authentication operations
 * with configurable token storage.
 */

/**
 * Token storage interface that the auth module depends on
 */
export interface TokenStorage {
  save(data: Record<string, unknown>): Promise<void>;
  load(): Promise<Record<string, unknown> | null>;
  remove(): Promise<void>;
  exists(): Promise<boolean>;
}

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
 * OAuth login configuration with callback URL
 */
export interface LoginWithCallbackConfig extends LoginConfig {
  redirectUri: string;
  codeVerifier: string;
}

/**
 * Authentication service class with configurable token storage
 */
export class AuthService {
  constructor(private tokenStorage: TokenStorage) {}

  /**
   * Perform OAuth2 PKCE login flow with external callback handling
   */
  async loginWithCallback(config: LoginWithCallbackConfig): Promise<string> {
    const open = (await import('open')).default;

    console.log('🔐 Starting authentication process...');

    try {
      const issuer = await Issuer.discover(config.issuerURL);
      const client = new issuer.Client({
        client_id: config.clientID,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
        scope: config.scope || 'openid profile email offline_access',
        audience: config.audience || 'https://aignostics-platform-samia',
        token_endpoint_auth_method: 'none',
      });

      const codeChallenge = generators.codeChallenge(config.codeVerifier);

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

      return authorizationUrl;
    } catch (error) {
      console.error('❌ Authentication setup failed:', error);
      throw error;
    }
  }

  /**
   * Complete the OAuth flow with authorization code
   */
  async completeLogin(config: LoginWithCallbackConfig, authCode: string): Promise<void> {
    try {
      const issuer = await Issuer.discover(config.issuerURL);
      const client = new issuer.Client({
        client_id: config.clientID,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
        scope: config.scope || 'openid profile email offline_access',
        audience: config.audience || 'https://aignostics-platform-samia',
        token_endpoint_auth_method: 'none',
      });

      console.log('✅ Authentication callback received!');

      // Exchange authorization code for tokens
      const tokenSet = await client.callback(
        config.redirectUri,
        { code: authCode },
        { code_verifier: config.codeVerifier }
      );

      // Save the token securely
      await this.saveToken({
        access_token: tokenSet.access_token!,
        refresh_token: tokenSet.refresh_token,
        expires_in: tokenSet.expires_in,
        token_type: tokenSet.token_type,
        scope: tokenSet.scope,
      });

      console.log('🎉 Login successful! Token saved securely.');
      console.log('🔑 You are now authenticated and can use the SDK.');
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Save token data with timestamp
   */
  private async saveToken(tokenData: Omit<TokenData, 'stored_at'>): Promise<void> {
    const dataToStore: TokenData = {
      ...tokenData,
      stored_at: Date.now(),
    };
    return this.tokenStorage.save(dataToStore);
  }

  /**
   * Load and validate token data
   */
  private async loadToken(): Promise<TokenData | null> {
    try {
      const data = await this.tokenStorage.load();
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
  private async isTokenValid(tokenData: TokenData): Promise<boolean> {
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
  async getValidAccessToken(): Promise<string | null> {
    try {
      const tokenData = await this.loadToken();

      if (!tokenData) {
        return null;
      }

      if (!(await this.isTokenValid(tokenData))) {
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
  async getAuthState(): Promise<AuthState> {
    try {
      const tokenData = await this.loadToken();

      if (!tokenData) {
        return { isAuthenticated: false };
      }

      const isValid = await this.isTokenValid(tokenData);

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
   * @deprecated Use loginWithCallback and completeLogin for better server lifecycle management
   */
  async login(config: LoginConfig): Promise<void> {
    const codeVerifier = crypto.randomBytes(32).toString('hex');

    // Start local server to handle OAuth callback
    const server = await startCallbackServer();
    const address = server.address();
    const actualPort = typeof address === 'object' && address !== null ? address.port : 8989;
    const redirectUri = `http://localhost:${actualPort}`;

    try {
      // Start the OAuth flow
      await this.loginWithCallback({
        ...config,
        redirectUri,
        codeVerifier,
      });

      // Wait for the callback
      const authCode = await waitForCallback(server);

      // Complete the login
      await this.completeLogin(
        {
          ...config,
          redirectUri,
          codeVerifier,
        },
        authCode
      );
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
  async logout(): Promise<void> {
    try {
      await this.tokenStorage.remove();
      console.log('✅ Logged out successfully. Token removed.');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  }
}
