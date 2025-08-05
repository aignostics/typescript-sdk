# Token Storage Implementation

## Overview

The `handleLogin` function now securely saves authentication tokens to cross-platform OS locations using a custom token storage utility. This provides persistent authentication across CLI sessions without requiring users to re-login frequently.

## Features

### 🔐 Secure Token Storage

- **Cross-platform**: Works on macOS, Linux, and Windows
- **OS-appropriate locations**:
  - **macOS**: `~/Library/Application Support/aignostics-platform/`
  - **Linux**: `~/.config/aignostics-platform/`
  - **Windows**: `%APPDATA%\aignostics-platform\`
- **Encrypted**: Tokens are encrypted using AES-256-CBC with machine-specific keys
- **File permissions**: Stored with restricted permissions (owner read/write only)

### 🛠 New CLI Commands

#### `login`

```bash
aignostics-platform login [--issuerURL <url>] [--clientID <id>]
```

- Performs OAuth2 PKCE authentication flow
- Saves the received token securely to OS config directory
- Shows success message with token storage location

#### `logout`

```bash
aignostics-platform logout
```

- Removes stored authentication token
- Clears all cached credentials

#### `status`

```bash
aignostics-platform status
```

- Shows current authentication status
- Displays token details if authenticated:
  - Token type (Bearer, etc.)
  - Scope
  - Expiration time
  - Storage timestamp

### 🔧 SDK Integration

The `PlatformSDK` now automatically uses stored tokens in this priority order:

1. **Explicit `apiKey`** provided in SDK constructor
2. **Stored token** from CLI login
3. **Fallback token** (hardcoded, for backward compatibility)

```typescript
// SDK automatically uses stored token
const sdk = new PlatformSDK({
  baseURL: 'https://platform.aignostics.com',
});

// Or explicitly provide a token
const sdk = new PlatformSDK({
  baseURL: 'https://platform.aignostics.com',
  apiKey: 'your-token-here',
});
```

## File Structure

```
src/
├── utils/
│   └── token-storage.ts       # Token storage utility
├── cli/
│   └── cli.ts                 # Updated with login/logout/status commands
└── index.ts                   # Updated SDK to use stored tokens
```

## Token Storage Utility API

### Core Functions

```typescript
// Save token after login
await saveToken({
  access_token: 'jwt-token',
  refresh_token: 'refresh-token', // optional
  expires_in: 3600, // optional
  token_type: 'Bearer', // optional
  scope: 'openid profile email', // optional
});

// Load stored token
const tokenData = await loadToken();

// Check if valid token exists
const isValid = await hasValidToken();

// Get current access token
const token = await getCurrentToken();

// Remove stored token
await removeToken();
```

### Token Data Structure

```typescript
interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  stored_at: number; // Unix timestamp
}
```

## Security Features

### Encryption

- Uses AES-256-CBC encryption
- Machine-specific encryption key derived from:
  - Hostname
  - Platform (OS type)
  - Architecture
- Initialization Vector (IV) randomized for each encryption

### File Security

- Token file created with `0o600` permissions (owner read/write only)
- Config directory created with `0o700` permissions (owner access only)
- Automatic cleanup on logout

### Token Validation

- Automatic expiration checking
- Graceful handling of corrupted token files
- Warning messages for token loading errors

## Usage Examples

### Basic Workflow

```bash
# 1. Login and store token
$ aignostics-platform login
Opening browser for authentication...
Paste the full redirect URL after login: http://localhost:8989?code=...
✅ Login successful! Token saved securely.

# 2. Check status
$ aignostics-platform status
✅ Authenticated
Token details:
  - Type: Bearer
  - Scope: openid profile email offline_access
  - Expires: 2025-07-19T16:30:00.000Z
  - Stored: 2025-07-18T16:30:00.000Z

# 3. Use APIs (token automatically loaded)
$ aignostics-platform list-applications
Applications: [...]

# 4. Logout when done
$ aignostics-platform logout
✅ Logged out successfully. Token removed.
```

### Programmatic Usage

```typescript
import { PlatformSDK } from '@aignostics/sdk';
import { hasValidToken, getCurrentToken } from './utils/token-storage';

// Check if user is authenticated
if (await hasValidToken()) {
  const sdk = new PlatformSDK();
  const apps = await sdk.listApplications();
  console.log('Applications:', apps);
} else {
  console.log('Please run: aignostics-platform login');
}
```

## Error Handling

### Token Loading Errors

- Corrupted token files are handled gracefully
- Warning messages displayed for debugging
- Fallback to unauthenticated state

### Permission Errors

- Clear error messages for file system permission issues
- Suggestions for resolving common problems

### Network Errors

- OAuth flow errors displayed with helpful context
- Retry suggestions for temporary failures

## Cross-Platform Compatibility

### Tested Platforms

- ✅ **macOS**: Uses `~/Library/Application Support/`
- ✅ **Linux**: Uses `~/.config/` or `$XDG_CONFIG_HOME`
- ✅ **Windows**: Uses `%APPDATA%`

### Environment Variables

- Respects `XDG_CONFIG_HOME` on Linux
- Falls back to standard locations if env vars not set

## Migration and Backward Compatibility

### Existing Users

- SDK continues to work with hardcoded tokens
- Explicit `apiKey` parameter still supported
- No breaking changes to existing API

### Token Migration

- Old tokens (if any) are automatically replaced
- New token format includes metadata
- Graceful handling of legacy token files

## Future Enhancements

### Planned Features

1. **Refresh Token Support**: Automatic token renewal
2. **Multiple Profiles**: Support for different environments/accounts
3. **Keychain Integration**: OS-native secure storage (keytar/keychain)
4. **Token Sharing**: Secure token sharing between applications

### Security Improvements

1. **Hardware Security**: Integration with TPM/Secure Enclave
2. **Token Rotation**: Automatic token rotation policies
3. **Audit Logging**: Token access logging for security monitoring
