import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { handleLogin, handleLogout, handleStatus } from './cli.js';
import * as auth from '../utils/auth.js';

// Mock the auth module
vi.mock('../utils/auth.js');

describe('CLI Handler Functions', () => {
  let consoleSpy: {
    log: MockInstance<typeof console.log>;
    error: MockInstance<typeof console.error>;
  };
  let mockExit: MockInstance<typeof process.exit>;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

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
      const expiresAt = new Date('2024-12-31T23:59:59Z');
      const storedAt = new Date('2024-01-01T00:00:00Z');

      const mockAuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email',
          expiresAt,
          storedAt,
        },
      };

      vi.mocked(auth.getAuthState).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(auth.getAuthState).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(consoleSpy.log).toHaveBeenCalledWith('Token details:');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(consoleSpy.log).toHaveBeenCalledWith('  - Scope: openid profile email');
      expect(consoleSpy.log).toHaveBeenCalledWith(`  - Expires: ${expiresAt.toLocaleString()}`);
      expect(consoleSpy.log).toHaveBeenCalledWith(`  - Stored: ${storedAt.toLocaleString()}`);
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
