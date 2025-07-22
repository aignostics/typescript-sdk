# Dependency Injection in Auth Module

The Auth module has been refactored to use dependency injection for better testability and flexibility.

## Class-Based API

### Basic Usage

```typescript
import { AuthService, FileSystemTokenStorage } from './utils/auth.js';

// Create an auth service with file system storage
const authService = new AuthService(new FileSystemTokenStorage());

// Use the auth service
const token = await authService.getValidAccessToken();
const authState = await authService.getAuthState();
```

### Custom Token Storage

You can implement your own token storage strategy:

```typescript
import { AuthService, TokenStorage } from './utils/auth.js';

class InMemoryTokenStorage implements TokenStorage {
  private data: Record<string, unknown> | null = null;

  async save(data: Record<string, unknown>): Promise<void> {
    this.data = data;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.data;
  }

  async remove(): Promise<void> {
    this.data = null;
  }

  async exists(): Promise<boolean> {
    return this.data !== null;
  }
}

// Use in-memory storage for testing
const authService = new AuthService(new InMemoryTokenStorage());
```

### OAuth Flow

```typescript
import crypto from 'crypto';
import { startCallbackServer, waitForCallback } from './utils/oauth-callback-server.js';

const authService = new AuthService(new FileSystemTokenStorage());
const codeVerifier = crypto.randomBytes(32).toString('hex');

// Start local server
const server = await startCallbackServer();
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 8989;

try {
  // Start OAuth flow
  await authService.loginWithCallback({
    issuerURL: 'https://auth.example.com',
    clientID: 'your-client-id',
    redirectUri: `http://localhost:${port}`,
    codeVerifier,
    audience: 'your-audience',
    scope: 'openid profile email offline_access',
  });

  // Wait for callback
  const authCode = await waitForCallback(server);

  // Complete login
  await authService.completeLogin(
    {
      issuerURL: 'https://auth.example.com',
      clientID: 'your-client-id',
      redirectUri: `http://localhost:${port}`,
      codeVerifier,
      audience: 'your-audience',
      scope: 'openid profile email offline_access',
    },
    authCode
  );
} finally {
  server.close();
}
```

## Backward Compatibility

The module still exports function-based APIs for backward compatibility:

```typescript
import { getValidAccessToken, getAuthState, login, logout } from './utils/auth.js';

// These functions use a default AuthService instance with FileSystemTokenStorage
const token = await getValidAccessToken();
const authState = await getAuthState();
```

## Testing Benefits

The class-based approach makes testing much easier:

```typescript
import { AuthService } from './utils/auth.js';

// Mock storage for tests
const mockStorage = {
  save: vi.fn(),
  load: vi.fn(),
  remove: vi.fn(),
  exists: vi.fn(),
};

const authService = new AuthService(mockStorage);

// Test with controlled storage behavior
mockStorage.load.mockResolvedValue({ access_token: 'test-token', stored_at: Date.now() });
const token = await authService.getValidAccessToken();
expect(token).toBe('test-token');
```

## Migration Guide

### Before (Function-based)

```typescript
import { getValidAccessToken, login, logout } from './utils/auth.js';
```

### After (Class-based)

```typescript
import { AuthService, FileSystemTokenStorage } from './utils/auth.js';

const authService = new AuthService(new FileSystemTokenStorage());
// Use authService.getValidAccessToken(), authService.login(), etc.
```

### Or continue using functions (deprecated)

```typescript
import { getValidAccessToken, login, logout } from './utils/auth.js';
// Functions work the same way but are deprecated
```
