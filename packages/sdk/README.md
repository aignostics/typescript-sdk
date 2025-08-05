# Aignostics Platform TypeScript SDK

The TypeScript SDK for the Aignostics Platform.

## Installation

```bash
npm install @aignostics/sdk
```

## Usage

```typescript
import { PlatformSDKHttp } from '@aignostics/sdk';

// Create SDK instance with a token provider
const sdk = new PlatformSDKHttp({
  baseURL: 'https://api.aignostics.com',
  tokenProvider: () => 'your-access-token-here',
});

// Use the SDK
const applications = await sdk.listApplications();
console.log(applications);
```

## API Reference

For detailed API documentation, see the main project documentation.

## Note

Authentication utilities (AuthService, TokenStorage, etc.) are now part of the CLI package and not exported from the SDK. The SDK focuses solely on API communication and requires you to provide your own token management.
