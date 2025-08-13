/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.js';
import { BaseClient, Issuer } from 'openid-client';
import { ChildProcess } from 'child_process';

// Mock external dependencies
vi.mock('open', () => ({
  default: vi.fn(),
}));

vi.mock('openid-client', () => ({
  Issuer: {
    discover: vi.fn(),
  },
  generators: {
    codeChallenge: vi.fn(() => 'mock-code-challenge'),
  },
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

describe('AuthService', () => {
  let authService: AuthService;
  let mockTokenStorage: {
    save: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
  };
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Create mock token storage
    mockTokenStorage = {
      save: vi.fn(),
      load: vi.fn(),
      remove: vi.fn(),
      exists: vi.fn(),
    };

    // Create auth service with mock storage
    authService = new AuthService(mockTokenStorage);

    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
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

      const result = await authService.getValidAccessToken();

      expect(result).toBe('valid-token');
    });

    it('should return null when token is expired', async () => {
      const mockTokenData = {
        access_token: 'expired-token',
        expires_at_ms: Date.now() - 360000, // expired one hour ago
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should return null when no token exists', async () => {
      mockTokenStorage.load.mockResolvedValue(null);

      const result = await authService.getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should return access token when token has no expiration', async () => {
      const mockTokenData = {
        access_token: 'non-expiring-token',
        token_type: 'Bearer',
        stored_at: Date.now(),
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getValidAccessToken();

      expect(result).toBe('non-expiring-token');
    });

    it('should handle invalid token data gracefully', async () => {
      mockTokenStorage.load.mockResolvedValue({ invalid: 'data' });

      const result = await authService.getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      mockTokenStorage.load.mockRejectedValue(new Error('Storage error'));

      const result = await authService.getValidAccessToken();

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

      const result = await authService.getAuthState();

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

      const result = await authService.getAuthState();

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

      const result = await authService.getAuthState();

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

      const result = await authService.getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.token?.type).toBe('Bearer');
      expect(result.token?.scope).toBe('N/A');
    });

    it('should handle storage errors gracefully', async () => {
      mockTokenStorage.load.mockRejectedValue(new Error('Storage error'));

      const result = await authService.getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load token')
      );
    });
  });

  describe('logout', () => {
    it('should remove token data and log success', async () => {
      mockTokenStorage.remove.mockResolvedValue(undefined);

      await authService.logout();

      expect(mockTokenStorage.remove).toHaveBeenCalled();
    });

    it('should handle storage errors and throw an error', async () => {
      mockTokenStorage.remove.mockRejectedValue(new Error('Storage error'));

      try {
        await authService.logout();
        expect.fail('Expected logout to throw');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Storage error');
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error during logout:', expect.any(Error));
    });
  });

  describe('loginWithCallback', () => {
    const mockConfig = {
      issuerURL: 'https://test-issuer.com',
      clientID: 'test-client-id',
      redirectUri: 'http://localhost:3000/callback',
      codeVerifier: 'test-code-verifier',
      audience: 'test-audience',
      scope: 'openid profile email',
    };

    it('should discover issuer, create client, and open authorization URL', async () => {
      const mockClient = {
        authorizationUrl: vi.fn(() => 'https://test-auth-url.com'),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const mockOpen = (await import('open')).default;
      const { Issuer } = await import('openid-client');

      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);
      vi.mocked(mockOpen).mockResolvedValue(null as unknown as ChildProcess);

      const result = await authService.loginWithCallback(mockConfig);

      expect(Issuer.discover).toHaveBeenCalledWith(mockConfig.issuerURL);
      expect(mockIssuer.Client).toHaveBeenCalledWith({
        client_id: mockConfig.clientID,
        redirect_uris: [mockConfig.redirectUri],
        response_types: ['code'],
        scope: mockConfig.scope,
        audience: mockConfig.audience,
        token_endpoint_auth_method: 'none',
      });
      expect(mockClient.authorizationUrl).toHaveBeenCalledWith({
        scope: mockConfig.scope,
        audience: mockConfig.audience,
        code_challenge: 'mock-code-challenge',
        code_challenge_method: 'S256',
      });
      expect(mockOpen).toHaveBeenCalledWith('https://test-auth-url.com');
      expect(result).toBe('https://test-auth-url.com');
    });

    it('should use default values when optional config is not provided', async () => {
      const configWithoutOptionals = {
        issuerURL: 'https://test-issuer.com',
        clientID: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        codeVerifier: 'test-code-verifier',
      };

      const mockClient = {
        authorizationUrl: vi.fn(() => 'https://test-auth-url.com'),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const mockOpen = (await import('open')).default;
      const { Issuer } = await import('openid-client');

      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);
      vi.mocked(mockOpen).mockResolvedValue(null as unknown as ChildProcess);

      await authService.loginWithCallback(configWithoutOptionals);

      expect(mockIssuer.Client).toHaveBeenCalledWith({
        client_id: configWithoutOptionals.clientID,
        redirect_uris: [configWithoutOptionals.redirectUri],
        response_types: ['code'],
        scope: 'openid profile email offline_access',
        audience: 'https://aignostics-platform-samia',
        token_endpoint_auth_method: 'none',
      });
    });

    it('should handle issuer discovery errors', async () => {
      const error = new Error('Issuer discovery failed');
      const { Issuer } = await import('openid-client');
      vi.mocked(Issuer.discover).mockRejectedValue(error);

      await expect(authService.loginWithCallback(mockConfig)).rejects.toThrow(
        'Issuer discovery failed'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Authentication setup failed:', error);
    });
  });

  describe('completeLogin', () => {
    const mockConfig = {
      issuerURL: 'https://test-issuer.com',
      clientID: 'test-client-id',
      redirectUri: 'http://localhost:3000/callback',
      codeVerifier: 'test-code-verifier',
      audience: 'test-audience',
      scope: 'openid profile email',
    };

    it('should exchange authorization code for tokens and save them', async () => {
      const mockTokenSet = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor((Date.now() + 3600000) / 1000), // 1 hour from now
        token_type: 'Bearer' as const,
        scope: 'openid profile email',
      };

      const mockClient = {
        callback: vi.fn(() => mockTokenSet),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const { Issuer } = await import('openid-client');

      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);
      mockTokenStorage.save.mockResolvedValue(undefined);

      await authService.completeLogin(mockConfig, 'auth-code-123');

      expect(Issuer.discover).toHaveBeenCalledWith(mockConfig.issuerURL);
      expect(mockClient.callback).toHaveBeenCalledWith(
        mockConfig.redirectUri,
        { code: 'auth-code-123' },
        { code_verifier: mockConfig.codeVerifier }
      );
      expect(mockTokenStorage.save).toHaveBeenCalledWith({
        access_token: mockTokenSet.access_token,
        refresh_token: mockTokenSet.refresh_token,
        expires_at_ms: mockTokenSet.expires_at * 1000,
        token_type: mockTokenSet.token_type,
        scope: mockTokenSet.scope,
        stored_at: expect.any(Number) as number,
      });
    });

    it('should handle token exchange errors', async () => {
      const mockClient = {
        callback: vi.fn(() => {
          throw new Error('Token exchange failed');
        }),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const error = new Error('Token exchange failed');
      const { Issuer } = await import('openid-client');

      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);

      await expect(authService.completeLogin(mockConfig, 'invalid-code')).rejects.toThrow(
        'Token exchange failed'
      );
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Token exchange failed:', error);
    });

    it('should handle invalid token response format', async () => {
      const invalidTokenSet = {
        access_token: 'new-access-token',
        // Missing required fields
      };

      const mockClient = {
        callback: vi.fn(() => invalidTokenSet),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const { Issuer } = await import('openid-client');

      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);

      await expect(authService.completeLogin(mockConfig, 'auth-code-123')).rejects.toThrow();
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Token exchange failed:', expect.any(Error));
    });
  });

  describe('getValidAccessToken with refresh', () => {
    const mockConfig = {
      issuerURL: 'https://test-issuer.com',
      clientID: 'test-client-id',
      audience: 'test-audience',
      scope: 'openid profile email',
    };

    it('should refresh expired token when refresh token is available', async () => {
      // Setup expired token
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'valid-refresh-token',
        expires_at_ms: Date.now() - 3600000, // expired 1 hour ago
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      const newTokenSet = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor((Date.now() + 3600000) / 1000), // 1 hour from now
        token_type: 'Bearer' as const,
        scope: 'openid profile email',
      };

      const mockClient = {
        refresh: vi.fn(() => newTokenSet),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const { Issuer } = await import('openid-client');

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);
      mockTokenStorage.save.mockResolvedValue(undefined);

      const result = await authService.getValidAccessToken(mockConfig);

      expect(result).toBe('new-access-token');
      expect(mockClient.refresh).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockTokenStorage.save).toHaveBeenCalledWith({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at_ms: newTokenSet.expires_at * 1000,
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
        expires_at_ms: Date.now() - 3600000, // expired 1 hour ago
        stored_at: Date.now() - 7200000,
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);

      const result = await authService.getValidAccessToken(mockConfig);

      expect(result).toBeNull();
    });

    it('should return null when refresh token request fails', async () => {
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'invalid-refresh-token',
        expires_at_ms: Date.now() - 3600000,
        stored_at: Date.now() - 7200000,
      };

      const mockClient = {
        refresh: vi.fn(() => {
          throw new Error('Refresh failed');
        }),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const { Issuer } = await import('openid-client');

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);

      const result = await authService.getValidAccessToken(mockConfig);

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
        expires_at_ms: Date.now() - 3600000,
        stored_at: Date.now() - 7200000,
      };

      const newTokenSetWithoutRefreshToken = {
        access_token: 'new-access-token',
        // No refresh_token in response
        expires_at: Math.floor((Date.now() + 3600000) / 1000),
        token_type: 'Bearer' as const,
        scope: 'openid profile email',
      };

      const mockClient = {
        refresh: vi.fn(() => newTokenSetWithoutRefreshToken),
      };
      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };
      const { Issuer } = await import('openid-client');

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);
      vi.mocked(Issuer.discover).mockResolvedValue(mockIssuer as unknown as Issuer<BaseClient>);
      mockTokenStorage.save.mockResolvedValue(undefined);

      const result = await authService.getValidAccessToken(mockConfig);

      expect(result).toBe('new-access-token');
      expect(mockTokenStorage.save).toHaveBeenCalledWith({
        access_token: 'new-access-token',
        refresh_token: 'original-refresh-token', // Should keep original
        expires_at_ms: newTokenSetWithoutRefreshToken.expires_at * 1000,
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: expect.any(Number) as number,
      });
    });

    it('should return null when config is not provided for refresh', async () => {
      const expiredTokenData = {
        access_token: 'expired-token',
        refresh_token: 'valid-refresh-token',
        expires_at_ms: Date.now() - 3600000,
        stored_at: Date.now() - 7200000,
      };

      mockTokenStorage.load.mockResolvedValue(expiredTokenData);

      // Call without config
      const result = await authService.getValidAccessToken();

      expect(result).toBeNull();
    });
  });
});
