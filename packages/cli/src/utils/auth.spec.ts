/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { AuthService, type TokenStorage } from './auth.js';
import * as client from 'openid-client';
import { ChildProcess } from 'child_process';
import { environmentConfig } from './environment.js';

// Mock external dependencies
vi.mock('open', () => ({
  default: vi.fn(),
}));

vi.mock('openid-client', () => ({
  discovery: vi.fn(),
  None: vi.fn(() => 'none-auth'),
  refreshTokenGrant: vi.fn(),
  authorizationCodeGrant: vi.fn(),
  buildAuthorizationUrl: vi.fn(),
  calculatePKCECodeChallenge: vi.fn(() => Promise.resolve('mock-code-challenge')),
}));

vi.mock('node:http', () => ({
  default: {
    createServer: vi.fn(() => ({
      listen: vi.fn((port, host, callback: unknown) => {
        if (callback && typeof callback === 'function') {
          (callback as () => void)();
        }
      }),
      on: vi.fn(),
      address: vi.fn(() => ({ port: 8989 })),
      close: vi.fn(),
    })),
  },
}));

vi.mock('./environment.js', () => ({
  environmentConfig: {
    production: {
      issuerURL: 'https://test-issuer.com',
      clientID: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectURI: 'https://test-redirect.com',
    },
  },
}));
const environment = 'production';
const NOW = 1_700_000_000_000;
const noneAuth = 'none-auth' as unknown as ReturnType<typeof client.None>;
const mockConfig = { id: 'mock-config' } as unknown as client.Configuration;
type TokenResponse = Awaited<ReturnType<typeof client.refreshTokenGrant>>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockTokenStorage: { [K in keyof TokenStorage]: Mock<TokenStorage[K]> };
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    // Create mock token storage
    mockTokenStorage = {
      save: vi.fn<TokenStorage['save']>(),
      load: vi.fn<TokenStorage['load']>(),
      remove: vi.fn<TokenStorage['remove']>(),
      exists: vi.fn<TokenStorage['exists']>(),
    };

    // Create auth service with mock storage
    authService = new AuthService(mockTokenStorage);

    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getValidAccessToken', () => {
    it('should return access token when valid token exists', async () => {
      const mockTokenData = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_at: Date.now() + 3600,
        scope: 'openid profile email',
        stored_at: Date.now() - 1000, // stored 1 second ago
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBe('valid-token');
    });

    it('should return null when token is expired', async () => {
      const mockTokenData = {
        access_token: 'expired-token',
        expires_at_ms: Date.now() - 360000, // expired one hour ago
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getValidAccessToken(environment);

      expect(mockTokenStorage.load).toHaveBeenCalledWith(environment);
      expect(result).toBeNull();
    });

    it('should return null when no token exists', async () => {
      mockTokenStorage.load.mockResolvedValue(null);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBeNull();
    });

    it('should return access token when token has no expiration', async () => {
      const mockTokenData = {
        access_token: 'non-expiring-token',
        token_type: 'Bearer',
        stored_at: Date.now(),
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBe('non-expiring-token');
    });

    it('should handle invalid token data gracefully', async () => {
      mockTokenStorage.load.mockResolvedValue({ invalid: 'data' });

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      mockTokenStorage.load.mockRejectedValue(new Error('Storage error'));

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load token')
      );
    });
  });

  describe('getAuthState', () => {
    it('should return authenticated state with token details', async () => {
      const storedAt = Date.now() - 1000;
      const expirationDate = Date.now() + 360000;
      const mockTokenData = {
        access_token: 'valid-token',
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_at_ms: expirationDate,
        stored_at: storedAt,
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getAuthState(environment);

      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toEqual({
        type: 'Bearer',
        scope: 'openid profile email',
        expiresAt: new Date(expirationDate),
        storedAt: new Date(storedAt),
      });
    });

    it('should return unauthenticated state when no token exists', async () => {
      mockTokenStorage.load.mockResolvedValue(null);

      const result = await authService.getAuthState(environment);

      expect(result.isAuthenticated).toBe(false);
      expect(result.token).toBeUndefined();
    });

    it('should return unauthenticated state when token is expired', async () => {
      const mockTokenData = {
        access_token: 'expired-token',
        expires_at_ms: Date.now() - 3600000, // expired one hour ago
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getAuthState(environment);

      expect(result.isAuthenticated).toBe(false);
      expect(result.token).toBeUndefined();
    });

    it('should handle token with default values', async () => {
      const storedAt = Date.now() - 1000;
      const mockTokenData = {
        access_token: 'valid-token',
        stored_at: storedAt,
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getAuthState(environment);

      expect(result.isAuthenticated).toBe(true);
      expect(result.token?.type).toBe('Bearer');
      expect(result.token?.scope).toBe('N/A');
    });

    it('should handle storage errors gracefully', async () => {
      mockTokenStorage.load.mockRejectedValue(new Error('Storage error'));

      const result = await authService.getAuthState(environment);

      expect(result.isAuthenticated).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load token')
      );
    });
  });

  describe('logout', () => {
    it('should remove token data and log success', async () => {
      mockTokenStorage.remove.mockResolvedValue(undefined);

      await authService.logout('production');

      expect(mockTokenStorage.remove).toHaveBeenCalled();
    });

    it('should handle storage errors and throw an error', async () => {
      mockTokenStorage.remove.mockRejectedValue(new Error('Storage error'));

      try {
        await authService.logout('production');
        expect.fail('Expected logout to throw');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Storage error');
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error during logout:', expect.any(Error));
    });
  });

  describe('loginWithRefreshToken', () => {
    it('should successfully login with refresh token and save new tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const newTokenSet = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'bearer' as const,
        scope: 'openid profile email',
      };

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockResolvedValue(
        newTokenSet as unknown as TokenResponse
      );
      mockTokenStorage.save.mockResolvedValue(undefined);

      await authService.loginWithRefreshToken(environment, refreshToken);

      expect(client.discovery).toHaveBeenCalledWith(
        new URL(environmentConfig.production.issuerURL),
        environmentConfig.production.clientID,
        undefined,
        noneAuth
      );
      expect(client.refreshTokenGrant).toHaveBeenCalledWith(mockConfig, refreshToken);
      expect(mockTokenStorage.save).toHaveBeenCalledWith(environment, {
        access_token: newTokenSet.access_token,
        refresh_token: newTokenSet.refresh_token,
        expires_at_ms: NOW + newTokenSet.expires_in * 1000,
        token_type: 'Bearer',
        scope: newTokenSet.scope,
        stored_at: expect.any(Number) as number,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🎉 Login with refresh token successful! Token saved securely.'
      );
    });

    it('should keep old refresh token when new one is not provided', async () => {
      const refreshToken = 'original-refresh-token';
      const newTokenSetWithoutRefreshToken = {
        access_token: 'new-access-token',
        // No refresh_token in response
        expires_in: 3600,
        token_type: 'bearer' as const,
        scope: 'openid profile email',
      };

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockResolvedValue(
        newTokenSetWithoutRefreshToken as unknown as TokenResponse
      );
      mockTokenStorage.save.mockResolvedValue(undefined);

      await authService.loginWithRefreshToken(environment, refreshToken);

      expect(mockTokenStorage.save).toHaveBeenCalledWith(environment, {
        access_token: 'new-access-token',
        refresh_token: 'original-refresh-token', // Should keep original
        expires_at_ms: NOW + newTokenSetWithoutRefreshToken.expires_in * 1000,
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: expect.any(Number) as number,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '🎉 Login with refresh token successful! Token saved securely.'
      );
    });

    it('should handle issuer discovery errors', async () => {
      const refreshToken = 'valid-refresh-token';
      const error = new Error('Issuer discovery failed');

      vi.mocked(client.discovery).mockRejectedValue(error);

      await expect(authService.loginWithRefreshToken(environment, refreshToken)).rejects.toThrow(
        'Issuer discovery failed'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Login with refresh token failed:', error);
    });

    it('should handle token refresh errors', async () => {
      const refreshToken = 'invalid-refresh-token';
      const error = new Error('Token refresh failed');

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockRejectedValue(error);

      await expect(authService.loginWithRefreshToken(environment, refreshToken)).rejects.toThrow(
        'Token refresh failed'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Login with refresh token failed:', error);
    });

    it('should handle invalid token response format', async () => {
      const refreshToken = 'valid-refresh-token';
      const invalidTokenSet = {
        access_token: 'new-access-token',
        // Missing required fields like expires_in, token_type
      };

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockResolvedValue(
        invalidTokenSet as unknown as TokenResponse
      );

      await expect(authService.loginWithRefreshToken(environment, refreshToken)).rejects.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Login with refresh token failed:',
        expect.any(Error)
      );
    });
  });

  describe('loginWithCallback', () => {
    const callbackConfig = {
      redirectUri: 'http://localhost:3000/callback',
      codeVerifier: 'test-code-verifier',
    };

    it('should discover issuer, build the authorization URL, and open it', async () => {
      const mockOpen = (await import('open')).default;

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.buildAuthorizationUrl).mockReturnValue(
        new URL('https://test-auth-url.com/')
      );
      vi.mocked(mockOpen).mockResolvedValue(null as unknown as ChildProcess);

      const result = await authService.loginWithCallback('production', callbackConfig);

      expect(client.discovery).toHaveBeenCalledWith(
        new URL(environmentConfig.production.issuerURL),
        environmentConfig.production.clientID,
        undefined,
        noneAuth
      );
      expect(client.calculatePKCECodeChallenge).toHaveBeenCalledWith(callbackConfig.codeVerifier);
      expect(client.buildAuthorizationUrl).toHaveBeenCalledWith(mockConfig, {
        redirect_uri: callbackConfig.redirectUri,
        scope: environmentConfig.production.scope,
        audience: environmentConfig.production.audience,
        code_challenge: 'mock-code-challenge',
        code_challenge_method: 'S256',
      });
      expect(mockOpen).toHaveBeenCalledWith('https://test-auth-url.com/');
      expect(result).toBe('https://test-auth-url.com/');
    });

    it('should handle issuer discovery errors', async () => {
      const error = new Error('Issuer discovery failed');
      vi.mocked(client.discovery).mockRejectedValue(error);

      await expect(authService.loginWithCallback(environment, callbackConfig)).rejects.toThrow(
        'Issuer discovery failed'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Authentication setup failed:', error);
    });
  });

  describe('completeLogin', () => {
    const callbackConfig = {
      redirectUri: 'http://localhost:3000/callback',
      codeVerifier: 'test-code-verifier',
    };

    it('should exchange authorization code for tokens and save them', async () => {
      const mockTokenSet = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'bearer' as const,
        scope: 'openid profile email',
      };

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.authorizationCodeGrant).mockResolvedValue(
        mockTokenSet as unknown as TokenResponse
      );
      mockTokenStorage.save.mockResolvedValue(undefined);

      await authService.completeLogin(environment, callbackConfig, 'auth-code-123');

      expect(client.discovery).toHaveBeenCalledWith(
        new URL(environmentConfig.production.issuerURL),
        environmentConfig.production.clientID,
        undefined,
        noneAuth
      );
      expect(client.authorizationCodeGrant).toHaveBeenCalledWith(
        mockConfig,
        new URL('http://localhost:3000/callback?code=auth-code-123'),
        { pkceCodeVerifier: callbackConfig.codeVerifier }
      );
      expect(mockTokenStorage.save).toHaveBeenCalledWith(environment, {
        access_token: mockTokenSet.access_token,
        refresh_token: mockTokenSet.refresh_token,
        expires_at_ms: NOW + mockTokenSet.expires_in * 1000,
        token_type: 'Bearer',
        scope: mockTokenSet.scope,
        stored_at: expect.any(Number) as number,
      });
    });

    it('should handle token exchange errors', async () => {
      const error = new Error('Token exchange failed');

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.authorizationCodeGrant).mockRejectedValue(error);

      await expect(
        authService.completeLogin(environment, callbackConfig, 'invalid-code')
      ).rejects.toThrow('Token exchange failed');
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Token exchange failed:', error);
    });

    it('should handle invalid token response format', async () => {
      const invalidTokenSet = {
        access_token: 'new-access-token',
        // Missing required fields
      };

      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.authorizationCodeGrant).mockResolvedValue(
        invalidTokenSet as unknown as TokenResponse
      );

      await expect(
        authService.completeLogin(environment, callbackConfig, 'auth-code-123')
      ).rejects.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Token exchange failed:', expect.any(Error));
    });
  });

  describe('getValidAccessToken with refresh', () => {
    it('should refresh expired token when refresh token is available', async () => {
      // Setup expired token
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'valid-refresh-token',
        expires_at_ms: NOW - 3600000, // expired 1 hour ago
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: NOW - 7200000, // stored 2 hours ago
      };

      const newTokenSet = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'bearer' as const,
        scope: 'openid profile email',
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockResolvedValue(
        newTokenSet as unknown as TokenResponse
      );
      mockTokenStorage.save.mockResolvedValue(undefined);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBe('new-access-token');
      expect(client.refreshTokenGrant).toHaveBeenCalledWith(mockConfig, 'valid-refresh-token');
      expect(mockTokenStorage.save).toHaveBeenCalledWith(environment, {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at_ms: NOW + newTokenSet.expires_in * 1000,
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: expect.any(Number) as number,
      });
      expect(consoleSpy.log).toHaveBeenCalledWith('Access token expired, attempting to refresh...');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Token refreshed successfully');
    });

    it('should return null when expired token has no refresh token', async () => {
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: null,
        expires_at_ms: NOW - 3600000, // expired 1 hour ago
        stored_at: NOW - 7200000,
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBeNull();
    });

    it('should return null when refresh token request fails', async () => {
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'invalid-refresh-token',
        expires_at_ms: NOW - 3600000,
        stored_at: NOW - 7200000,
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockRejectedValue(new Error('Refresh failed'));

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith('❌ Token refresh failed');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Token refresh failed')
      );
    });

    it('should keep old refresh token when new one is not provided', async () => {
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'original-refresh-token',
        expires_at_ms: NOW - 3600000,
        stored_at: NOW - 7200000,
      };

      const newTokenSetWithoutRefreshToken = {
        access_token: 'new-access-token',
        // No refresh_token in response
        expires_in: 3600,
        token_type: 'bearer' as const,
        scope: 'openid profile email',
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(client.discovery).mockResolvedValue(mockConfig);
      vi.mocked(client.refreshTokenGrant).mockResolvedValue(
        newTokenSetWithoutRefreshToken as unknown as TokenResponse
      );
      mockTokenStorage.save.mockResolvedValue(undefined);

      const result = await authService.getValidAccessToken(environment);

      expect(result).toBe('new-access-token');
      expect(mockTokenStorage.save).toHaveBeenCalledWith(environment, {
        access_token: 'new-access-token',
        refresh_token: 'original-refresh-token', // Should keep original
        expires_at_ms: NOW + newTokenSetWithoutRefreshToken.expires_in * 1000,
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: expect.any(Number) as number,
      });
    });
  });
});
