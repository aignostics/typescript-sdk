import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getValidAccessToken, getAuthState, login, logout } from './auth.js';
import * as tokenStorage from './token-storage.js';
import http from 'node:http';

// Mock token-storage module
vi.mock('./token-storage.js');

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

vi.mock('./oauth-callback-server.js', () => ({
  startCallbackServer: vi.fn(),
  waitForCallback: vi.fn(),
}));

vi.mock('node:http', () => ({
  default: {
    createServer: vi.fn(() => ({
      listen: vi.fn((port, host, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
      }),
      on: vi.fn(),
      address: vi.fn(() => ({ port: 8989 })),
      close: vi.fn(),
    })),
  },
}));

describe('Auth Module', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
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
        expires_in: 3600,
        scope: 'openid profile email',
        stored_at: Date.now() - 1000, // stored 1 second ago
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getValidAccessToken();

      expect(result).toBe('valid-token');
    });

    it('should return null when no token exists', async () => {
      vi.mocked(tokenStorage.loadData).mockResolvedValue(null);

      const result = await getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should return null when token is expired', async () => {
      const mockTokenData = {
        access_token: 'expired-token',
        expires_in: 3600,
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should return token when no expiration is set', async () => {
      const mockTokenData = {
        access_token: 'non-expiring-token',
        stored_at: Date.now(),
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getValidAccessToken();

      expect(result).toBe('non-expiring-token');
    });

    it('should handle invalid token data gracefully', async () => {
      vi.mocked(tokenStorage.loadData).mockResolvedValue({ invalid: 'data' });

      const result = await getValidAccessToken();

      expect(result).toBeNull();
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(tokenStorage.loadData).mockRejectedValue(new Error('Storage error'));

      const result = await getValidAccessToken();

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load token')
      );
    });
  });

  describe('getAuthState', () => {
    it('should return authenticated state with token details', async () => {
      const storedAt = Date.now() - 1000;
      const mockTokenData = {
        access_token: 'valid-token',
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_in: 3600,
        stored_at: storedAt,
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toEqual({
        type: 'Bearer',
        scope: 'openid profile email',
        expiresAt: new Date(storedAt + 3600000),
        storedAt: new Date(storedAt),
      });
    });

    it('should return unauthenticated state when no token exists', async () => {
      vi.mocked(tokenStorage.loadData).mockResolvedValue(null);

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(result.token).toBeUndefined();
    });

    it('should return unauthenticated state when token is expired', async () => {
      const mockTokenData = {
        access_token: 'expired-token',
        expires_in: 3600,
        stored_at: Date.now() - 7200000, // stored 2 hours ago
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(false);
    });

    it('should handle token without expiration', async () => {
      const storedAt = Date.now();
      const mockTokenData = {
        access_token: 'non-expiring-token',
        token_type: 'Custom',
        scope: 'custom-scope',
        stored_at: storedAt,
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toEqual({
        type: 'Custom',
        scope: 'custom-scope',
        expiresAt: undefined,
        storedAt: new Date(storedAt),
      });
    });

    it('should use default values for missing token fields', async () => {
      const storedAt = Date.now();
      const mockTokenData = {
        access_token: 'minimal-token',
        stored_at: storedAt,
      };

      vi.mocked(tokenStorage.loadData).mockResolvedValue(mockTokenData);

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.token?.type).toBe('Bearer');
      expect(result.token?.scope).toBe('N/A');
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(tokenStorage.loadData).mockRejectedValue(new Error('Storage error'));

      const result = await getAuthState();

      expect(result.isAuthenticated).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load token')
      );
    });
  });

  describe('logout', () => {
    it('should remove token data and log success', async () => {
      vi.mocked(tokenStorage.removeData).mockResolvedValue();

      await logout();

      expect(tokenStorage.removeData).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Logged out successfully. Token removed.');
    });

    it('should handle storage errors and throw an error', async () => {
      vi.mocked(tokenStorage.removeData).mockRejectedValue(new Error('Storage error'));

      try {
        await logout();
        expect.fail('Expected logout to throw');
      } catch (error) {
        expect(error.message).toContain('Storage error');
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error during logout:', expect.any(Error));
    });
  });

  describe('login', () => {
    it('should handle OAuth flow errors gracefully', async () => {
      const { Issuer } = await import('openid-client');
      const { startCallbackServer } = await import('./oauth-callback-server.js');

      // Mock the callback server first (since it's called before OAuth discovery)
      const mockServer = {
        address: vi.fn(() => ({ port: 8989 })),
        close: vi.fn(),
      };
      vi.mocked(startCallbackServer).mockResolvedValue(mockServer as unknown as http.Server);

      // Then mock the OAuth discovery to fail
      vi.mocked(Issuer.discover).mockRejectedValue(new Error('Network error'));

      const config = {
        issuerURL: 'https://example.com/oauth',
        clientID: 'test-client-id',
      };

      await expect(login(config)).rejects.toThrow('Network error');

      // Verify server was closed even on error
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should complete successful OAuth flow and save token', async () => {
      const { Issuer } = await import('openid-client');
      const { startCallbackServer, waitForCallback } = await import('./oauth-callback-server.js');

      // Mock the OAuth server discovery
      const mockClient = {
        authorizationUrl: vi.fn(() => 'https://auth.example.com/authorize?code_challenge=test'),
        callback: vi.fn().mockResolvedValue({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid profile email',
        }),
      };

      const mockIssuer = {
        Client: vi.fn(() => mockClient),
      };

      vi.mocked(Issuer.discover).mockResolvedValue(
        mockIssuer as unknown as Awaited<ReturnType<typeof Issuer.discover>>
      );

      // Mock the callback server
      const mockServer = {
        address: vi.fn(() => ({ port: 8989 })),
        close: vi.fn(),
      };

      vi.mocked(startCallbackServer).mockResolvedValue(mockServer as unknown as http.Server);
      vi.mocked(waitForCallback).mockResolvedValue('test-auth-code');

      // Mock open function
      const { default: open } = await import('open');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(open).mockResolvedValue({} as any);

      // Mock tokenStorage.saveData
      vi.mocked(tokenStorage.saveData).mockResolvedValue();

      const config = {
        issuerURL: 'https://example.com/oauth',
        clientID: 'test-client-id',
      };

      await login(config);

      // Verify that saveData was called with the token
      expect(tokenStorage.saveData).toHaveBeenCalledWith({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'openid profile email',
        stored_at: expect.any(Number),
      });

      // Verify server was closed
      expect(mockServer.close).toHaveBeenCalled();
    });

    // Note: Full OAuth flow testing would require more complex mocking
    // of HTTP servers, callbacks, etc. This is a minimal test to ensure
    // the function handles basic error cases.
  });
});
