# AI Coding Agent Instructions

## Project Overview
This is a TypeScript SDK for the Aignostics Platform with automated OpenAPI code generation, CLI tools, and comprehensive CI/CD. The architecture follows a **code-first approach** where the core SDK (`src/index.ts`) wraps auto-generated API clients (`src/generated/`) to provide a simplified interface.

### Unit Test Isolation
- **Automatic State Reset**: All mocks and spies are automatically cleared between tests
- **No Manual Cleanup**: Don't use `vi.clearAllMocks()` or `vi.restoreAllMocks()` - Vitest handles this automatically
- **Mock Configuration**: Use `vi.mock()` at module level, not in `beforeEach`
- **Console Mocking**: Mock console methods in `beforeEach` to avoid test noise

### HTTP Request Mocking
- **SDK Mocking**: Mock `PlatformSDK` methods directly for CLI function unit tests
- **CLI Integration**: Mock CLI functions themselves for integration tests, not underlying HTTP calls  
- **Generated Client**: Never mock `src/generated/api.ts` directly - use SDK wrapper
- **Network Testing**: Use `jsonplaceholder.typicode.com` for integration tests
- **Error Scenarios**: Test both success and failure paths with proper error handlinghis is a TypeScript SDK for the Aignostics Platform with automated OpenAPI code generation, CLI tools, and comprehensive CI/CD. The architecture follows a **code-first approach** where the core SDK (`src/index.ts`) wraps auto-generated API clients (`src/generated/`) to provide a simplified interface.

## Critical Architecture Patterns

### 1. Docker-Based OpenAPI Code Generation
- **Key Files**: `package.json:codegen:generate`, `openapitools.json`, `src/generated/`
- **Workflow**: `npm run codegen` → Docker pulls OpenAPI spec → Generates TypeScript-Axios client
- **Never edit**: Files in `src/generated/` are auto-generated and git-ignored
- **Integration**: Main SDK imports from `src/generated/api.ts` (specifically `PublicApi`, `ApplicationReadResponse`)

### 2. SDK Architecture Pattern
- **Core Class**: `PlatformSDK` in `src/index.ts` - lazy-loads generated client via `ensureClient()`
- **Configuration**: `PlatformSDKConfig` interface with `baseURL`, `apiKey`, `timeout`
- **Auth Pattern**: Automatic token resolution: explicit `apiKey` → stored token → fallback token
- **Token Storage**: Cross-platform secure storage in `src/utils/token-storage.ts` using AES-256-CBC encryption
- **Error Handling**: Wraps generated client exceptions with descriptive messages

### 3. CLI Integration
- **Structure**: `src/cli/` with `cli.ts` (pure functions), `cli-functions.ts` (business logic), and `index.ts` (executable entry point)
- **Commands**: `info`, `test-api`, `list-applications`, `login`, `logout`, `status` - all use SDK internally
- **Authentication**: OAuth2 PKCE flow with secure token storage to OS-specific config directories
- **Binary**: `package.json:bin` maps `aignostics-platform` to `dist/cli/index.js`
- **Testing**: Two test files - `cli-functions.test.ts` (unit tests) and `cli.test.ts` (integration tests with mocked CLI functions)

### 4. Token Management System
- **Storage Location**: OS-appropriate config directories (macOS: Library/Application Support, Linux: ~/.config, Windows: %APPDATA%)
- **Encryption**: AES-256-CBC with machine-specific keys derived from hostname/platform/architecture
- **File Security**: Created with restricted permissions (0o600 for files, 0o700 for directories)
- **Token Priority**: `PlatformSDK` checks: explicit apiKey → stored token → hardcoded fallback
- **CLI Commands**: `login` (OAuth2 PKCE), `logout` (remove token), `status` (check auth state)
- **Validation**: Automatic expiration checking and graceful error handling

## Essential Development Workflows

### Build & Test Chain
```bash
npm run build    # codegen + compile (required before testing)
npm run codegen  # Docker-based OpenAPI generation
npm run lint     # ESLint check for code quality
npm run lint:fix # Auto-fix linting issues
npm test         # Vitest with 85% coverage requirement
npm run docs     # TypeDoc excluding generated code
```

### Node.js Compatibility Testing
- **Scripts**: `scripts/test-node-compatibility.sh` - Docker-based LTS testing with Verdaccio
- **Process**: Spins up local npm registry → publishes package → tests across Node 18/20/22
- **Known Issue**: ENEEDAUTH errors with Verdaccio anonymous publishing

### Code Quality Gates
- **Coverage**: 85% threshold in `vitest.config.ts`, excludes `src/generated/**`
- **SonarQube**: Separate workflow with coverage integration
- **Linting**: ESLint + Prettier, `src/cli.ts` excluded from coverage
- **Test Isolation**: Vitest configured with `clearMocks: true`, `restoreMocks: true`, `mockReset: true` for automatic state reset between tests

## Testing Patterns

### Unit Test Isolation
- **Automatic State Reset**: All mocks and spies are automatically cleared between tests
- **No Manual Cleanup**: Don't use `vi.clearAllMocks()` or `vi.restoreAllMocks()` - Vitest handles this automatically
- **Mock Configuration**: Use `vi.mock()` at module level, not in `beforeEach`
- **Console Mocking**: Mock console methods in `beforeEach` to avoid test noise

## Project-Specific Conventions

### Import Patterns
- **SDK**: `import { PlatformSDK } from '@aignostics/platform-typescript-sdk'`
- **Generated Types**: `export * from './generated/index'` re-exports all API types
- **CLI**: Uses `../index` imports, not direct generated imports

### Configuration Management
- **TypeScript**: `NodeNext` module resolution with `exactOptionalPropertyTypes`
- **Testing**: Vitest with v8 coverage, network-dependent tests use `jsonplaceholder.typicode.com`
- **Release**: Semantic-release with GitHub packages registry

### Docker Integration Points
- **Code Gen**: `openapitools/openapi-generator-cli:v7.14.0` with user ID mapping
- **Testing**: Verdaccio + Node Alpine containers for compatibility testing
- **CI/CD**: GitHub Actions with Docker for consistent environments

## Key Integration Dependencies

### External API Contract
- **OpenAPI Source**: `https://raw.githubusercontent.com/aignostics/python-sdk/refs/heads/main/codegen/in/api.json`
- **Generated Client**: TypeScript-Axios with OAuth2 authentication
- **API Endpoints**: `/v1/applications`, `/v1/runs` (see `src/generated/api.ts`)

### Authentication Flow
- **Current**: Hard-coded JWT in `src/index.ts:ensureClient()`
- **Generated**: OAuth2AuthorizationCodeBearer in generated client
- **TODO**: Make token configurable via `PlatformSDKConfig.apiKey`

## Development Anti-Patterns
- **Never**: Edit `src/generated/` files directly
- **Don't**: Import generated types directly in CLI - use SDK wrapper
- **Avoid**: Running tests without `npm run build` first
- **Always**: Run `npm run lint` before committing changes
- **Warning**: Docker daemon required for code generation and compatibility testing

## Quick Debug Commands
```bash
# Test CLI locally without Docker
npm run build && node dist/cli.js info
# Quick compatibility test
npm run test:quick
# Check for linting issues
npm run lint
# Auto-fix linting issues
npm run lint:fix
# Check generated API structure
ls -la src/generated/
```
