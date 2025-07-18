# Aignostics Platform TypeScript SDK

The official TypeScript SDK for the Aignostics Platform, providing a comprehensive set of tools and utilities for interacting with the Aignostics API.

## Features

- 🚀 **Type-safe API client** - Generated from OpenAPI specifications
- 🔧 **CLI tool** - Command-line interface for platform operations
- 📚 **Auto-generated documentation** - Up-to-date API documentation
- 🧪 **Comprehensive testing** - 85%+ code coverage with Vitest
- 🔄 **Automatic releases** - Semantic versioning and changelog generation
- 🛡️ **Code quality** - ESLint, Prettier, and SonarQube integration

## Installation

```bash
npm install @aignostics/platform-typescript-sdk
```

## Usage

### SDK Usage

```typescript
import { PlatformSDK } from '@aignostics/platform-typescript-sdk';

// Initialize the SDK
const sdk = new PlatformSDK({
  baseURL: 'https://api.aignostics.com',
  apiKey: 'your-api-key',
  timeout: 10000,
});

// Test connection
try {
  await sdk.testConnection();
  console.log('Connected successfully!');
} catch (error) {
  console.error('Connection failed:', error);
}
```

### CLI Usage

```bash
# Install globally
npm install -g @aignostics/platform-typescript-sdk

# Use the CLI
aignostics-platform info
aignostics-platform test-api --endpoint https://api.aignostics.com
```

## API Documentation

The complete API documentation is available at [https://aignostics-platform-sdk.github.io](https://aignostics-platform-sdk.github.io).

## Development

### Prerequisites

- Node.js 18+
- Docker (for code generation)

### Setup

```bash
# Clone the repository
git clone https://github.com/aignostics/platform-typescript-sdk.git
cd platform-typescript-sdk

# Install dependencies
npm install

# Generate code from OpenAPI spec
npm run codegen

# Build the project
npm run build
```

### Available Scripts

- `npm run build` - Build the project (includes code generation)
- `npm run codegen` - Generate TypeScript code from OpenAPI specification
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run docs` - Generate documentation

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://conventionalcommits.org/). Please format your commits accordingly:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on [GitHub](https://github.com/aignostics/platform-typescript-sdk/issues) or contact the development team.

---

Made with ❤️ by the Aignostics team
