# Aignostics Platform TypeScript SDK

[![codecov](https://codecov.io/github/aignostics/typescript-sdk/graph/badge.svg?token=Y5nGFdSlX1)](https://codecov.io/github/aignostics/typescript-sdk)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=aignostics_typescript-sdk&metric=alert_status&token=57884e493e2a2670dc8da5cc59eeb57e56d00d74)](https://sonarcloud.io/summary/new_code?id=aignostics_typescript-sdk)
[![CI/CD Pipeline](https://github.com/aignostics/typescript-sdk/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/aignostics/typescript-sdk/actions/workflows/ci-cd.yml)

The official TypeScript SDK for the Aignostics Platform, providing type-safe access to the Aignostics API. Also includes a CLI tool for command-line operations.

## Packages

- **[@aignostics/sdk](packages/sdk/)** - Core TypeScript SDK with auto-generated API clients
- **[@aignostics/cli](packages/cli/)** - Command-line interface for platform operations

## Features

- 🚀 **Type-safe API client** - Generated from OpenAPI specifications
- 🔧 **CLI tool** - Command-line interface for platform operations
- � **Monorepo structure** - Independent packages with shared tooling
- 🧪 **Comprehensive testing** - 85%+ code coverage with Vitest
- 🔄 **Automatic releases** - Semantic versioning per package
- 🛡️ **Code quality** - ESLint, Prettier, and SonarQube integration

## Installation

### SDK Package

```bash
npm install @aignostics/sdk
```

### CLI Package

```bash
npm install -g @aignostics/cli
```

## Usage

For detailed usage instructions, see the individual package documentation:

- **SDK Usage**: [packages/sdk/README.md](packages/sdk/README.md)
- **CLI Usage**: [packages/cli/README.md](packages/cli/README.md)

### Quick Start - SDK

```typescript
import { PlatformSDK } from '@aignostics/sdk';

const sdk = new PlatformSDK({
  baseURL: 'https://api.aignostics.com',
  tokenProvider: () => 'your-access-token-here',
});
```

### Quick Start - CLI

```bash
# Install and use the CLI
npm install -g @aignostics/cli
aignostics-platform info
```

## Developer Documentation

### Architecture & Development

- [HTTP Mocking Patterns](docs/HTTP_MOCKING.md) - Testing patterns for HTTP requests
- [Testing Conventions](docs/TESTING_CONVENTION.md) - Testing standards and best practices
- [Token Storage](docs/TOKEN_STORAGE.md) - CLI authentication implementation
- [Dependency Injection](docs/DEPENDENCY_INJECTION.md) - DI patterns and practices

## Development Setup

### Prerequisites

- Node.js 18+
- Docker (for OpenAPI code generation)

### Setup

```bash
# Clone the repository
git clone https://github.com/aignostics/typescript-sdk.git
cd typescript-sdk

# Install dependencies
npm install

# Build all packages
npm run build
```

### Nx Commands

```bash
# Build all packages
nx run-many -t build

# Test all packages
nx run-many -t test

# Work with individual packages
nx build sdk           # Build only SDK
nx test cli           # Test only CLI
nx codegen sdk        # Generate OpenAPI client
```

### Available Scripts

- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run codegen` - Generate OpenAPI client for SDK
- `npm run clean` - Clean all build outputs

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

For support, please open an issue on [GitHub](https://github.com/aignostics/typescript-sdk/issues) or contact the development team.

---

Made with ❤️ by the Aignostics team
