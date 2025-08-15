import { z } from 'zod';
import { Issuer, generators } from 'openid-client';
import { environmentConfig, EnvironmentKey } from './environment';

/**
 * Authentication utilities for the Aignostics Platform SDK
 * This module provides a clean interface for authentication operations
 * with configurable token storage.
 */

/**
 * Token storage interface that the auth module depends on
 */
export interface TokenStorage {
  save(name: string, data: Record<string, unknown>): Promise<void>;
  load(name: string): Promise<Record<string, unknown> | null>;
  remove(name: string): Promise<void>;
  exists(name: string): Promise<boolean>;
}

/**
 * Token data schema for validation
 */
const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().nullable().default(null),
  expires_at_ms: z.number().nullable().default(null),
  token_type: z.string().nullable().default(null),
  scope: z.string().nullable().default(null),
  stored_at: z.number(),
});

const tokenSetValidationSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_at: z.number(),
  token_type: z.literal('Bearer'),
  scope: z.string(),
});

export type TokenData = z.infer<typeof tokenSchema>;

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
export interface LoginWithCallbackConfig {
  redirectUri: string;
  codeVerifier: string;
}

/**
 * Authentication service class with configurable token storage
 */
export class AuthService {
  constructor(private readonly tokenStorage: TokenStorage) {}

  /**
   * Perform OAuth2 PKCE login flow with external callback handling
   */
  async loginWithCallback(
    environment: EnvironmentKey,
    config: LoginWithCallbackConfig
  ): Promise<string> {
    const oauthConfig = environmentConfig[environment];
    const open = (await import('open')).default;

    try {
      const issuer = await Issuer.discover(oauthConfig.issuerURL);
      const client = new issuer.Client({
        client_id: oauthConfig.clientID,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
        scope: oauthConfig.scope,
        audience: oauthConfig.audience,
        token_endpoint_auth_method: 'none',
      });

      const codeChallenge = generators.codeChallenge(config.codeVerifier);

      const authorizationUrl = client.authorizationUrl({
        scope: oauthConfig.scope,
        audience: oauthConfig.audience,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

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
  async completeLogin(
    environment: EnvironmentKey,
    config: LoginWithCallbackConfig,
    authCode: string
  ): Promise<void> {
    const oauthConfig = environmentConfig[environment];
    try {
      const issuer = await Issuer.discover(oauthConfig.issuerURL);
      const client = new issuer.Client({
        client_id: oauthConfig.clientID,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
        scope: oauthConfig.scope,
        audience: oauthConfig.audience,
        token_endpoint_auth_method: 'none',
      });

      // Exchange authorization code for tokens
      const tokenSet = tokenSetValidationSchema.parse(
        await client.callback(
          config.redirectUri,
          { code: authCode },
          { code_verifier: config.codeVerifier }
        )
      );

      // Save the token securely
      await this.saveToken(
        environment,
        tokenSchema.omit({ stored_at: true }).parse({
          access_token: tokenSet.access_token,
          refresh_token: tokenSet.refresh_token,
          expires_at_ms: tokenSet.expires_at * 1000,
          token_type: tokenSet.token_type,
          scope: tokenSet.scope,
        })
      );
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Save token data with timestamp
   */
  private async saveToken(
    environment: EnvironmentKey,
    tokenData: Omit<TokenData, 'stored_at'>
  ): Promise<TokenData> {
    const dataToStore: TokenData = {
      ...tokenData,
      stored_at: Date.now(),
    };
    await this.tokenStorage.save(environment, dataToStore);
    return dataToStore;
  }

  /**
   * Load and validate token data
   */
  private async loadToken(environment: EnvironmentKey): Promise<TokenData | null> {
    try {
      const data = await this.tokenStorage.load(environment);
      const result = tokenSchema.safeParse(data);

      if (!result.success) {
        return null;
      }

      return result.data;
    } catch (error) {
      console.warn(`Warning: Could not load token: ${String(error)}`);
      return null;
    }
  }

  /**
   * Check if a token exists and is valid (not expired)
   */
  private isTokenValid(tokenData: TokenData): boolean {
    // Check if token has expiration and if it's expired
    if (tokenData.expires_at_ms) {
      const now = Date.now();

      if (now >= tokenData.expires_at_ms) {
        return false;
      }
    }

    return true;
  }

  /**
   * Refresh an expired token using the refresh token
   */
  private async refreshToken(
    environment: EnvironmentKey,
    tokenData: TokenData
  ): Promise<TokenData | null> {
    const config = environmentConfig[environment];
    if (!tokenData.refresh_token) {
      return null;
    }

    try {
      const issuer = await Issuer.discover(config.issuerURL);
      const client = new issuer.Client({
        client_id: config.clientID,
        redirect_uris: [], // Not needed for refresh
        response_types: ['code'],
        scope: config.scope || 'openid profile email offline_access',
        audience: config.audience || 'https://aignostics-platform-samia',
        token_endpoint_auth_method: 'none',
      });

      const tokenSet = tokenSetValidationSchema.parse(
        await client.refresh(tokenData.refresh_token)
      );

      const newTokenData: Omit<TokenData, 'stored_at'> = {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token || tokenData.refresh_token, // Keep old refresh token if not renewed
        expires_at_ms: tokenSet.expires_at * 1000,
        token_type: tokenSet.token_type,
        scope: tokenSet.scope,
      };

      return this.saveToken(environment, newTokenData);
    } catch (error) {
      console.warn(`Warning: Token refresh failed: ${String(error)}`);
      return null;
    }
  }

  /**
   * Get a valid access token from storage, refreshing if necessary
   * @param config Optional login config for token refresh. If not provided and refresh is needed, returns null
   * @returns Valid access token or null if not found/expired/refresh failed
   */
  async getValidAccessToken(environment: EnvironmentKey): Promise<string | null> {
    try {
      const config = environmentConfig[environment];
      const tokenData = await this.loadToken(environment);

      if (!tokenData) {
        return null;
      }

      // If token is valid, return it
      if (this.isTokenValid(tokenData)) {
        return tokenData.access_token;
      }

      // If token is expired but we have a refresh token and config, try to refresh
      if (tokenData.refresh_token && config) {
        console.log('Access token expired, attempting to refresh...');
        const refreshedTokenData = await this.refreshToken(environment, tokenData);

        if (refreshedTokenData) {
          console.log('✅ Token refreshed successfully');
          return refreshedTokenData.access_token;
        } else {
          console.warn('❌ Token refresh failed');
        }
      }

      return null;
    } catch (error) {
      console.warn(`Warning: Could not retrieve token: ${String(error)}`);
      return null;
    }
  }

  /**
   * Get current authentication state
   */
  async getAuthState(environment: EnvironmentKey): Promise<AuthState> {
    try {
      const tokenData = await this.loadToken(environment);

      if (!tokenData) {
        return { isAuthenticated: false };
      }

      const isValid = this.isTokenValid(tokenData);

      if (!isValid) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        token: {
          type: tokenData.token_type || 'Bearer',
          scope: tokenData.scope || 'N/A',
          expiresAt: tokenData.expires_at_ms ? new Date(tokenData.expires_at_ms) : undefined,
          storedAt: new Date(tokenData.stored_at),
        },
      };
    } catch (error) {
      console.warn(`Warning: Could not get auth state: ${String(error)}`);
      return { isAuthenticated: false };
    }
  }

  /**
   * Logout and remove stored tokens
   */
  async logout(environment: EnvironmentKey): Promise<void> {
    try {
      await this.tokenStorage.remove(environment);
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  }
}
