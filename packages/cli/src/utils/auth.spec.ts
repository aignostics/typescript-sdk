import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.js';

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
        expires_in: 3600,
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
        expires_in: 3600,
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
      const mockTokenData = {
        access_token: 'valid-token',
        token_type: 'Bearer',
        scope: 'openid profile email',
        expires_in: 3600,
        stored_at: storedAt,
      };

      mockTokenStorage.load.mockResolvedValue(mockTokenData);

      const result = await authService.getAuthState();

      expect(result.isAuthenticated).toBe(true);
      expect(result.token).toEqual({
        type: 'Bearer',
        scope: 'openid profile email',
        expiresAt: new Date(storedAt + 3600000),
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
        expires_in: 3600,
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
});
