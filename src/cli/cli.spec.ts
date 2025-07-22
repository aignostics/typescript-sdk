import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { handleLogin, handleLogout, handleStatus } from './cli';
import { loginWithCallback, completeLogin, logout, getAuthState } from '../utils/auth';
import { startCallbackServer, waitForCallback } from '../utils/oauth-callback-server';
import crypto from 'crypto';

// Mock external dependencies
vi.mock('../utils/auth');
vi.mock('../utils/oauth-callback-server');
vi.mock('crypto');

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('CLI Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);
  });

  describe('handleLogin', () => {
    it('should complete login flow successfully', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockAuthCode = 'test-auth-code';
      const mockCodeVerifier = 'test-code-verifier';

      // Setup mocks
      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue(mockCodeVerifier),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (waitForCallback as Mock).mockResolvedValue(mockAuthCode);
      (loginWithCallback as Mock).mockResolvedValue(undefined);
      (completeLogin as Mock).mockResolvedValue(undefined);

      await handleLogin('https://test-issuer.com', 'test-client-id');

      // Verify the flow
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(startCallbackServer).toHaveBeenCalled();
      expect(loginWithCallback).toHaveBeenCalledWith({
        issuerURL: 'https://test-issuer.com',
        clientID: 'test-client-id',
        redirectUri: 'http://localhost:8989',
        codeVerifier: mockCodeVerifier,
        audience: 'https://aignostics-platform-samia',
        scope: 'openid profile email offline_access',
      });
      expect(waitForCallback).toHaveBeenCalledWith(mockServer);
      expect(completeLogin).toHaveBeenCalledWith(
        {
          issuerURL: 'https://test-issuer.com',
          clientID: 'test-client-id',
          redirectUri: 'http://localhost:8989',
          codeVerifier: mockCodeVerifier,
          audience: 'https://aignostics-platform-samia',
          scope: 'openid profile email offline_access',
        },
        mockAuthCode
      );
      expect(mockServer.close).toHaveBeenCalled();

      // Verify console messages
      expect(mockConsole.log).toHaveBeenCalledWith('🔐 Starting authentication process...');
      expect(mockConsole.log).toHaveBeenCalledWith('⏳ Waiting for authentication callback...');
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Authentication callback received!');
      expect(mockConsole.log).toHaveBeenCalledWith('🎉 Login successful! Token saved securely.');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔑 You are now authenticated and can use the SDK.'
      );
    });

    it('should handle server address as number', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue(8990),
        close: vi.fn(),
      };
      const mockCodeVerifier = 'test-code-verifier';

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue(mockCodeVerifier),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (waitForCallback as Mock).mockResolvedValue('auth-code');
      (loginWithCallback as Mock).mockResolvedValue(undefined);
      (completeLogin as Mock).mockResolvedValue(undefined);

      await handleLogin('https://test-issuer.com', 'test-client-id');

      expect(loginWithCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUri: 'http://localhost:8989', // Should fallback to 8989
        })
      );
    });

    it('should handle authentication errors and close server', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Authentication failed');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (loginWithCallback as Mock).mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Authentication failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle callback wait errors and close server', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Callback timeout');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (loginWithCallback as Mock).mockResolvedValue(undefined);
      (waitForCallback as Mock).mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Callback timeout'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle token exchange errors and close server', async () => {
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Token exchange failed');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (loginWithCallback as Mock).mockResolvedValue(undefined);
      (waitForCallback as Mock).mockResolvedValue('auth-code');
      (completeLogin as Mock).mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Token exchange failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    it('should call logout function', async () => {
      (logout as Mock).mockResolvedValue(undefined);

      await handleLogout();

      expect(logout).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = new Error('Logout failed');
      (logout as Mock).mockRejectedValue(mockError);

      await expect(handleLogout()).rejects.toThrow('Logout failed');
    });
  });

  describe('handleStatus', () => {
    it('should display authenticated status with expiring token', async () => {
      const mockExpiresAt = new Date('2025-01-01T12:59:59.000Z');
      const mockStoredAt = new Date('2024-12-01T10:00:00.000Z');

      const mockAuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email offline_access',
          expiresAt: mockExpiresAt,
          storedAt: mockStoredAt,
        },
      };

      (getAuthState as Mock).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(mockConsole.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(mockConsole.log).toHaveBeenCalledWith('Token details:');
      expect(mockConsole.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '  - Scope: openid profile email offline_access'
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        `  - Expires: ${mockExpiresAt.toLocaleString()}`
      );
      expect(mockConsole.log).toHaveBeenCalledWith(`  - Stored: ${mockStoredAt.toLocaleString()}`);
    });

    it('should display authenticated status with non-expiring token', async () => {
      const mockStoredAt = new Date('2024-12-01T10:00:00.000Z');

      const mockAuthState = {
        isAuthenticated: true,
        token: {
          type: 'Bearer',
          scope: 'openid profile email offline_access',
          expiresAt: null,
          storedAt: mockStoredAt,
        },
      };

      (getAuthState as Mock).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(mockConsole.log).toHaveBeenCalledWith('✅ Authenticated');
      expect(mockConsole.log).toHaveBeenCalledWith('Token details:');
      expect(mockConsole.log).toHaveBeenCalledWith('  - Type: Bearer');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '  - Scope: openid profile email offline_access'
      );
      expect(mockConsole.log).toHaveBeenCalledWith('  - Expires: Never');
      expect(mockConsole.log).toHaveBeenCalledWith(`  - Stored: ${mockStoredAt.toLocaleString()}`);
    });

    it('should display not authenticated status', async () => {
      const mockAuthState = {
        isAuthenticated: false,
        token: null,
      };

      (getAuthState as Mock).mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(mockConsole.log).toHaveBeenCalledWith(
        '❌ Not authenticated. Run "aignostics-platform login" to authenticate.'
      );
    });

    it('should handle auth state check errors', async () => {
      const mockError = new Error('Failed to check auth state');
      (getAuthState as Mock).mockRejectedValue(mockError);

      await expect(handleStatus()).rejects.toThrow('process.exit called');

      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations to complete

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Error checking status:', mockError);
    });
  });
});
