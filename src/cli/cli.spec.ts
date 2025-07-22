import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { startCallbackServer, waitForCallback } from '../utils/oauth-callback-server';
import crypto from 'crypto';
import { AuthService } from '../utils/auth';

// Mock external dependencies
vi.mock('../utils/oauth-callback-server');
vi.mock('crypto');

// Mock the auth module and create a mock authService instance
const mockAuthService = {
  loginWithCallback: vi.fn(),
  completeLogin: vi.fn(),
  logout: vi.fn(),
  getAuthState: vi.fn(),
};

// Mock the auth module to return our mock instance
vi.mock('../utils/auth', () => ({
  AuthService: vi.fn(),
  FileSystemTokenStorage: vi.fn(),
}));

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('CLI Handlers', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error);

    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    vi.mocked(AuthService).mockImplementation(() => mockAuthService as unknown as AuthService);
  });

  describe('handleLogin', () => {
    it('should complete login flow successfully', async () => {
      const { handleLogin } = await import('./cli');
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockAuthCode = 'test-auth-code';
      const mockCodeVerifier = 'test-code-verifier';
      const mockCodeVerifierHex = Buffer.from(mockCodeVerifier, 'utf-8').toString('hex');

      (crypto.randomBytes as Mock).mockReturnValue(Buffer.from(mockCodeVerifier, 'utf-8'));
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      (waitForCallback as Mock).mockResolvedValue(mockAuthCode);
      mockAuthService.loginWithCallback.mockResolvedValue(undefined);
      mockAuthService.completeLogin.mockResolvedValue(undefined);

      await handleLogin('https://test-issuer.com', 'test-client-id');

      // Verify the flow
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(startCallbackServer).toHaveBeenCalled();
      expect(mockAuthService.loginWithCallback).toHaveBeenCalledWith({
        issuerURL: 'https://test-issuer.com',
        clientID: 'test-client-id',
        redirectUri: 'http://localhost:8989',
        codeVerifier: mockCodeVerifierHex,
        audience: 'https://aignostics-platform-samia',
        scope: 'openid profile email offline_access',
      });
      expect(waitForCallback).toHaveBeenCalledWith(mockServer);
      expect(mockAuthService.completeLogin).toHaveBeenCalledWith(
        {
          issuerURL: 'https://test-issuer.com',
          clientID: 'test-client-id',
          redirectUri: 'http://localhost:8989',
          codeVerifier: mockCodeVerifierHex,
          audience: 'https://aignostics-platform-samia',
          scope: 'openid profile email offline_access',
        },
        mockAuthCode
      );
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle server address as number', async () => {
      const { handleLogin } = await import('./cli');
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
      mockAuthService.loginWithCallback.mockResolvedValue(undefined);
      mockAuthService.completeLogin.mockResolvedValue(undefined);

      await handleLogin('https://test-issuer.com', 'test-client-id');

      expect(mockAuthService.loginWithCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUri: 'http://localhost:8989', // Should fallback to 8989
        })
      );
    });

    it('should handle authentication errors and close server', async () => {
      const { handleLogin } = await import('./cli');
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Authentication failed');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      mockAuthService.loginWithCallback.mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Authentication failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle callback wait errors and close server', async () => {
      const { handleLogin } = await import('./cli');
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Callback timeout');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      mockAuthService.loginWithCallback.mockResolvedValue(undefined);
      (waitForCallback as Mock).mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Callback timeout'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should handle token exchange errors and close server', async () => {
      const { handleLogin } = await import('./cli');
      const mockServer = {
        address: vi.fn().mockReturnValue({ port: 8989 }),
        close: vi.fn(),
      };
      const mockError = new Error('Token exchange failed');

      (crypto.randomBytes as Mock).mockReturnValue({
        toString: vi.fn().mockReturnValue('test-code-verifier'),
      });
      (startCallbackServer as Mock).mockResolvedValue(mockServer);
      mockAuthService.loginWithCallback.mockResolvedValue(undefined);
      (waitForCallback as Mock).mockResolvedValue('auth-code');
      mockAuthService.completeLogin.mockRejectedValue(mockError);

      await expect(handleLogin('https://test-issuer.com', 'test-client-id')).rejects.toThrow(
        'Token exchange failed'
      );

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Authentication failed:', mockError);
      expect(mockServer.close).toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    it('should call logout function', async () => {
      const { handleLogout } = await import('./cli');
      mockAuthService.logout.mockResolvedValue(undefined);

      await handleLogout();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const { handleLogout } = await import('./cli');
      const mockError = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(mockError);

      await expect(handleLogout()).rejects.toThrow('Logout failed');
    });
  });

  describe('handleStatus', () => {
    it('should display authenticated status with expiring token', async () => {
      const { handleStatus } = await import('./cli');
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

      mockAuthService.getAuthState.mockResolvedValue(mockAuthState);

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
      const { handleStatus } = await import('./cli');
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

      mockAuthService.getAuthState.mockResolvedValue(mockAuthState);

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
      const { handleStatus } = await import('./cli');
      const mockAuthState = {
        isAuthenticated: false,
        token: null,
      };

      mockAuthService.getAuthState.mockResolvedValue(mockAuthState);

      await handleStatus();

      expect(mockConsole.log).toHaveBeenCalledWith(
        '❌ Not authenticated. Run "aignostics-platform login" to authenticate.'
      );
    });

    it('should handle auth state check errors', async () => {
      const { handleStatus } = await import('./cli');
      const mockError = new Error('Failed to check auth state');
      mockAuthService.getAuthState.mockRejectedValue(mockError);

      await expect(handleStatus()).rejects.toThrow('process.exit called');

      expect(mockConsole.error).toHaveBeenCalledWith('❌ Error checking status:', mockError);
    });
  });
});
