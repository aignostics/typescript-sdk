# AI Coding Agent Instructions

## Project Overview

This is an Nx monorepo containing TypeScript packages for the Aignostics Platform:

- **SDK Package** (`packages/sdk/`): Core TypeScript SDK with auto-generated API clients
- **CLI Package** (`packages/cli/`): Command-line interface for platform interaction
- **Monorepo Structure**: Nx workspace with shared tooling and independent package publishing

## Key Nx Commands

### Multi-package Operations

```bash
nx run-many -t build    # Build all packages
nx run-many -t test     # Test all packages
nx run-many -t lint     # Lint all packages
```

### Single Package Operations

```bash
nx build sdk           # Build only SDK package
nx test cli            # Test only CLI package
nx codegen sdk         # Generate OpenAPI client for SDK
```

## SDK Package Details

### OpenAPI Code Generation

- **Generated files**: `packages/sdk/src/generated/` (auto-generated, git-ignored)
- **Source spec**: External OpenAPI JSON from Python SDK repository
- **Command**: `nx codegen sdk` - runs Docker-based generation
- **Never edit**: Files in `src/generated/` are automatically overwritten

### Core Architecture

- **Main SDK class**: `PlatformSDK` in `packages/sdk/src/platform-sdk.ts`
- **Wrapper pattern**: SDK wraps generated clients for simplified API
- **Configuration**: See `packages/sdk/README.md` for user-facing configuration options

### Development References

- **User documentation**: `packages/sdk/README.md`
- **HTTP mocking**: `docs/HTTP_MOCKING.md`

## CLI Package Details

### Architecture

- **Main entry**: `packages/cli/src/index.ts` (executable)
- **Business logic**: `packages/cli/src/cli-functions.ts`
- **SDK dependency**: Imports and uses the SDK package
- **Authentication**: Token storage system detailed in `docs/TOKEN_STORAGE.md`

### Development References

- **User documentation**: `packages/cli/README.md`

## Testing & Quality

### Workspace-wide Standards

- **Testing patterns**: `docs/TESTING_CONVENTION.md`
- **Coverage requirement**: 85% threshold for both packages
- **Test isolation**: Automatic mock cleanup between tests
