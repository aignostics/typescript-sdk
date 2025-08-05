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

### Package Installation Policy

Before installing any npm packages, always research and include information about:

- **Maintenance state**: When was it last updated, frequency of releases
- **Community health**: Open issues count, response time to issues, number of contributors
- **License compatibility**: Verify license is compatible with our open source policy
- **Security**: Check for known vulnerabilities or security advisories
- **Alternatives**: Consider if there are better-maintained or more suitable alternatives

## Commit Message Standards

### Conventional Commits Format

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature for SDK or CLI users (user-facing functionality)
- **fix**: Bug fix for SDK or CLI users
- **chore**: Maintenance, tooling, dependencies, build processes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or modifying tests
- **ci**: CI/CD pipeline changes

### Scoping Rules

- **Single package changes**: Use package name as scope (`sdk`, `cli`)
- **Monorepo tooling**: Use `workspace`, `build`, `deps`, or omit scope
- **Documentation**: Use `docs` or specific area like `api-docs`

### Examples

```bash
# User-facing features (only for SDK/CLI functionality)
feat(sdk): add support for batch processing
feat(cli): implement new auth command

# Everything else is typically chore
chore(deps): update dependencies to latest versions
chore(workspace): add license checking and attribution generation
chore(build): update tsconfig for better performance
chore: setup automated testing pipeline

# Bug fixes for users
fix(sdk): resolve authentication timeout issue
fix(cli): handle missing config file gracefully

# Documentation
docs(sdk): update API reference for new endpoints
docs: add contributing guidelines
```

### Important Notes

- **feat** is reserved for new user-facing functionality in SDK or CLI packages
- Most tooling, build, and maintenance work should use **chore**
- Always include scope when changes affect a single package
- Keep descriptions concise and in present tense
