import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleLogin, handleLogout, handleStatus } from './cli.js';
import * as auth from '../utils/auth.js';

// Mock the auth module
vi.mock('../utils/auth.js');

describe('CLI Handler Functions', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as unknown as () => never);

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  describe('handleLogin', () => {
    it('should call login with correct configuration', async () => {
      vi.mocked(auth.login).mockResolvedValue();

      await handleLogin('https://example.com/oauth', 'test-client-id');

      expect(auth.login).toHaveBeenCalledWith({
        issuerURL: 'https://example.com/oauth',
        clientID: 'test-client-id',
        audience: 'https://aignostics-platform-samia',
        scope: 'openid profile email offline_access',
      });
    });

    it('should propagate login errors', async () => {
      const loginError = new Error('OAuth login failed');
      vi.mocked(auth.login).mockRejectedValue(loginError);

      await expect(handleLogin('https://example.com/oauth', 'test-client-id')).rejects.toThrow(
        'OAuth login failed'
      );
    });
  });

  describe('handleLogout', () => {
    it('should call logout function', async () => {
      vi.mocked(auth.logout).mockResolvedValue();

      await handleLogout();

      expect(auth.logout).toHaveBeenCalled();
    });

    it('should propagate logout errors', async () => {
      const logoutError = new Error('Logout failed');
      vi.mocked(auth.logout).mockRejectedValue(logoutError);

      await expect(handleLogout()).rejects.toThrow('Logout failed');
    });
  });

  describe('handleStatus', () => {
    it('should display authenticated status with token details', async () => {
      const mockAuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email',
          expiresAt: new Date('2024-12-31T23:59:59Z'),
          storedAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(auth.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(auth.getAuthState).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(consoleSpy.log).toHaveBeenCalledWith('Token details:');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Scope: openid profile email');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Expires: 1/1/2025, 12:59:59 AM');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Stored: 1/1/2024, 1:00:00 AM');
    });

    it('should display authenticated status with non-expiring token', async () => {
      const mockAuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email',
          expiresAt: undefined, // Non-expiring token
          storedAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(auth.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Expires: Never');
    });

    it('should display unauthenticated status', async () => {
      const mockAuthState = {
        isAuthenticated: false,
      };

      vi.mocked(auth.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(auth.getAuthState).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '❌ Not authenticated. Run "aignostics-platform login" to authenticate.'
      );
    });

    it('should handle errors and exit with code 1', async () => {
      const authError = new Error('Auth state check failed');
      vi.mocked(auth.getAuthState).mockRejectedValue(authError);

      try {
        await handleStatus();
        expect.fail('Expected handleStatus to throw');
      } catch (error) {
        expect(error.message).toContain('process.exit called');
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error checking status:', authError);
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
