# Software Architecture Document
**Aignostics TypeScript SDK Repository**

Based on the arc42 template by Dr. Gernot Starke and Dr. Peter Hruschka  
Version: 1.0  
Date: December 2, 2025

---

## Table of Contents

1. [Introduction and Goals](#1-introduction-and-goals)
2. [Constraints](#2-constraints)
3. [Context and Scope](#3-context-and-scope)
4. [Solution Strategy](#4-solution-strategy)
5. [Building Block View](#5-building-block-view)
6. [Runtime View](#6-runtime-view)
7. [Deployment View](#7-deployment-view)
8. [Cross-Cutting Concepts](#8-cross-cutting-concepts)
9. [Architecture Decisions](#9-architecture-decisions)
10. [Quality Requirements](#10-quality-requirements)
11. [Risks and Technical Debt](#11-risks-and-technical-debt)

---

## 1. Introduction and Goals

### 1.1 Requirements Overview

The Aignostics TypeScript SDK Repository provides TypeScript developers with tools to interact with the Aignostics Platform for AI-powered pathology analysis:

- **SDK Package (`@aignostics/sdk`)**: Type-safe HTTP client library for programmatic platform access
- **CLI Package (`@aignostics/cli`)**: Command-line interface for interactive platform operations

**Primary Use Cases:**
- Application discovery and version management
- AI model execution (run creation and management)
- Result retrieval and processing
- Authentication and authorization

### 1.2 Quality Goals

| Priority | Quality Goal | Motivation |
|----------|-------------|------------|
| 1 | **Type Safety** | Catch errors at compile-time, improve developer experience |
| 2 | **Testability** | Enable reliable CI/CD, ensure code quality (85% coverage) |
| 3 | **Security** | Protect sensitive tokens using OS-native secure storage |
| 4 | **Maintainability** | Clear separation of concerns, automated code generation |
| 5 | **Developer Experience** | Simple API surface, comprehensive error messages |

### 1.3 Stakeholders

| Role | Expectation |
|------|-------------|
| **SDK Users** | Simple, type-safe API for platform integration |
| **CLI Users** | Interactive tool for platform operations without coding |
| **Platform Engineers** | Maintainable codebase aligned with API evolution |
| **Security Teams** | Secure token management and authentication flows |
| **DevOps** | Reliable testing, clear build pipeline, npm publishing |

---

## 2. Constraints

### 2.1 Technical Constraints

| Constraint | Background |
|------------|------------|
| **Node.js ≥ 18.0.0** | Required for native ES modules, modern JavaScript features |
| **TypeScript Strict Mode** | Enforces type safety across codebase |
| **OpenAPI Specification** | External dependency from Platform API (staging endpoint) |
| **Docker** | Required for OpenAPI code generation (v7.14.0) |
| **npm Registry** | Packages published to public npm registry |
| **Nx** | Workspace orchestration and build caching |

### 2.2 Organizational Constraints

| Constraint | Background |
|------------|------------|
| **Conventional Commits** | Enforced for semantic versioning and changelog generation |
| **85% Test Coverage** | Minimum threshold for quality assurance |
| **MIT License** | Open-source license for both packages |
| **License Policy** | Strict whitelist for dependencies (see `LICENSE_POLICY.md`) |

### 2.3 Conventions

| Convention | Details |
|------------|---------|
| **Test Naming** | `.spec.ts` (unit), `.test.ts` (integration) |
| **Code Style** | ESLint + Prettier configuration |
| **Git Workflow** | Feature branches, pre-commit hooks for license checks |
| **Documentation** | JSDoc for public API, Markdown for guides |

---

## 3. Context and Scope

### 3.1 Business Context

```mermaid
graph LR
    subgraph "External Systems"
        API[Aignostics Platform API]
        AUTH[Auth0 OIDC Provider]
        NPM[npm Registry]
        KEYCHAIN[OS Keychain/Credential Manager]
    end
    
    subgraph "TypeScript SDK Repository"
        SDK[SDK Package]
        CLI[CLI Package]
    end
    
    subgraph "Users"
        DEV[TypeScript Developers]
        OPS[Operations/Scientists]
    end
    
    DEV -->|uses| SDK
    OPS -->|uses| CLI
    SDK -->|HTTP/JSON| API
    CLI -->|uses| SDK
    CLI -->|OAuth2 PKCE| AUTH
    CLI -->|stores tokens| KEYCHAIN
    SDK -->|published to| NPM
    CLI -->|published to| NPM
```

**External Interfaces:**

| System | Interface | Purpose |
|--------|-----------|---------|
| **Aignostics Platform API** | REST (JSON/HTTP) | AI model execution, data retrieval |
| **Auth0** | OAuth2/OIDC | User authentication, token issuance |
| **OS Keychain** | Native API | Secure token storage |
| **npm Registry** | HTTP | Package distribution |

### 3.2 Technical Context

```mermaid
graph TB
    subgraph "SDK Package"
        SDK_MAIN[PlatformSDKHttp]
        SDK_GEN[Generated OpenAPI Client]
        SDK_ERR[Error Hierarchy]
        SDK_TYPES[Type Exports]
    end
    
    subgraph "CLI Package"
        CLI_BIN[CLI Binary]
        CLI_CMDS[Command Functions]
        CLI_AUTH[AuthService]
        CLI_STORAGE[TokenStorage]
    end
    
    subgraph "Build Pipeline"
        CODEGEN[OpenAPI Generator]
        TSUP[tsup Bundler]
        NX[Nx Orchestrator]
    end
    
    CODEGEN -->|generates| SDK_GEN
    SDK_GEN -->|wrapped by| SDK_MAIN
    SDK_MAIN -->|used by| CLI_CMDS
    CLI_AUTH -->|uses| CLI_STORAGE
    CLI_CMDS -->|uses| CLI_AUTH
    CLI_BIN -->|invokes| CLI_CMDS
    
    NX -->|coordinates| TSUP
    TSUP -->|bundles| SDK_MAIN
    TSUP -->|bundles| CLI_BIN
```

---

## 4. Solution Strategy

### 4.1 Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **Nx Workspace** | Enables independent package publishing with shared tooling |
| **OpenAPI Code Generation** | Maintains API contract alignment, reduces manual coding |
| **Wrapper Pattern** | Abstracts generated code, provides simplified API |
| **Token Provider Pattern** | Enables dynamic token refresh without SDK reinitialization |
| **MSW (Mock Service Worker)** | VCR-like HTTP mocking for realistic tests |
| **Dependency Injection** | Testable authentication with pluggable storage |

### 4.2 Top-Level Decomposition

The system is decomposed into two independently deployable packages:

1. **SDK Package**: Pure library with zero external service dependencies (except Platform API)
2. **CLI Package**: Application that composes SDK with authentication and user interface

**Key Design Principle:** SDK is authentication-agnostic; CLI provides authentication implementation.

### 4.3 Quality Achievement Strategy

| Quality Goal | Strategy |
|--------------|----------|
| **Type Safety** | TypeScript strict mode, auto-generated types from OpenAPI |
| **Testability** | Dependency injection, HTTP mocking, isolated test setup |
| **Security** | OS-native keychain, PKCE OAuth flow, encrypted file fallback |
| **Maintainability** | Code generation, clear package boundaries, comprehensive docs |

---

## 5. Building Block View

### 5.1 Level 1: System Overview

```mermaid
graph TB
    subgraph "TypeScript SDK Repository"
        SDK[SDK Package<br/>aignostics/sdk]
        CLI[CLI Package<br/>aignostics/cli]
    end
    
    subgraph "Shared Infrastructure"
        NX_CONFIG[nx.json]
        VITEST[vitest.setup.ts]
        TSCONFIG[tsconfig.base.json]
        ESLINT[eslint.config.mjs]
        SCRIPTS[License Scripts]
    end
    
    CLI -->|depends on| SDK
    SDK -.->|uses config| NX_CONFIG
    CLI -.->|uses config| NX_CONFIG
    SDK -.->|uses| VITEST
    CLI -.->|uses| VITEST
    SDK -.->|extends| TSCONFIG
    CLI -.->|extends| TSCONFIG
```

**Package Responsibilities:**

| Package | Responsibility | Exports |
|---------|---------------|---------|
| **@aignostics/sdk** | Platform API client library | `PlatformSDKHttp`, types, errors, test utilities |
| **@aignostics/cli** | Interactive CLI application | Binary executable (`aignostics`) |

### 5.2 Level 2: SDK Package Structure

```mermaid
graph TB
    subgraph "packages/sdk/src"
        INDEX[index.ts<br/>Public Exports]
        PLATFORM[platform-sdk.ts<br/>PlatformSDKHttp]
        ERRORS[errors.ts<br/>Error Classes]
        
        subgraph "generated/"
            API[api.ts<br/>PublicApi]
            MODELS[model/*.ts<br/>Type Definitions]
        end
        
        subgraph "test-utils/"
            MOCKS[http-mocks.ts<br/>MSW Setup]
            FACTORIES[factories.ts<br/>Mock Data]
        end
    end
    
    INDEX -->|exports| PLATFORM
    INDEX -->|exports| ERRORS
    INDEX -->|re-exports| API
    INDEX -->|re-exports| MODELS
    PLATFORM -->|uses| API
    PLATFORM -->|throws| ERRORS
    MOCKS -->|uses| FACTORIES
```

**Key Components:**

- **`index.ts`**: Public API surface (default export, named exports)
- **`platform-sdk.ts`**: Main SDK class implementing `PlatformSDK` interface
- **`errors.ts`**: Error hierarchy (`BaseError`, `APIError`, `AuthenticationError`, etc.)
- **`generated/`**: Auto-generated OpenAPI client (git-ignored, regenerated on build)
- **`test-utils/`**: MSW server, mock scenarios, test factories

### 5.3 Level 2: CLI Package Structure

```mermaid
graph TB
    subgraph "packages/cli/src"
        BIN[bin.ts<br/>Executable Entry]
        CLI[cli.ts<br/>yargs Config]
        FUNCS[cli-functions.ts<br/>Command Logic]
        
        subgraph "utils/"
            AUTH[auth.ts<br/>AuthService]
            STORAGE[token-storage.ts<br/>FileSystemTokenStorage]
            OAUTH[oauth-callback-server.ts<br/>Express Server]
            ENV[environment.ts<br/>Config]
        end
    end
    
    BIN -->|invokes| CLI
    CLI -->|calls| FUNCS
    FUNCS -->|uses| AUTH
    FUNCS -->|uses SDK| SDK_PKG[SDK Package]
    AUTH -->|depends on| STORAGE
    AUTH -->|uses| OAUTH
    AUTH -->|uses| ENV
```

**Key Components:**

- **`bin.ts`**: Executable entry point with shebang (`#!/usr/bin/env node`)
- **`cli.ts`**: yargs command definitions and argument parsing
- **`cli-functions.ts`**: Business logic for each command (SDK initialization, error handling)
- **`utils/auth.ts`**: `AuthService` class for OAuth flows and token management
- **`utils/token-storage.ts`**: OS-native secure storage with file fallback
- **`utils/oauth-callback-server.ts`**: Local Express server for OAuth callback

### 5.4 Level 3: SDK Core Class

**Component:** `PlatformSDKHttp`

**Responsibilities:**
- Token provider invocation
- HTTP client instantiation (per-request fresh client)
- API method wrapping (simplified signatures)
- Error transformation (Axios → SDK errors)

**Interface Implementation:**

```typescript
interface PlatformSDK {
  // Connection
  testConnection(): Promise<boolean>
  
  // Applications
  listApplications(): Promise<ApplicationReadShortResponse[]>
  getApplication(id: string): Promise<ApplicationReadResponse>
  getApplicationVersionDetails(id: string, version: string): Promise<VersionReadResponse>
  
  // Runs
  listApplicationRuns(options?): Promise<RunReadResponse[]>
  createApplicationRun(request): Promise<RunCreationResponse>
  getRun(id: string): Promise<RunReadResponse>
  cancelApplicationRun(id: string): Promise<void>
  listRunResults(id: string): Promise<ItemResultReadResponse[]>
  
  // Metadata
  getVersion(): string
  getConfig(): PlatformSDKConfig
}
```

**Key Design Pattern: Private Client Factory**

The SDK uses `#getClient()` private method that:
1. Invokes `tokenProvider()` to get current access token
2. Throws `AuthenticationError` if no token available
3. Returns fresh `PublicApi` instance with token

**Benefits:**
- Always uses latest token (supports transparent refresh)
- Thread-safe (no shared state)
- Simple implementation

### 5.5 Level 3: CLI Authentication Flow

**Component:** `AuthService`

```mermaid
sequenceDiagram
    participant CLI
    participant AuthService
    participant TokenStorage
    participant Auth0
    participant ExpressServer
    
    CLI->>AuthService: loginWithCallback(env, config)
    AuthService->>Auth0: Discover OIDC endpoints
    Auth0-->>AuthService: Issuer metadata
    AuthService->>AuthService: Generate PKCE challenge
    AuthService->>ExpressServer: Start callback server (port 8989)
    AuthService->>CLI: Return authorization URL
    CLI->>Browser: Open authorization URL
    Browser->>Auth0: User authenticates
    Auth0->>ExpressServer: Callback with auth code
    ExpressServer-->>AuthService: Return auth code
    AuthService->>Auth0: Exchange code for tokens (PKCE)
    Auth0-->>AuthService: Access token + refresh token
    AuthService->>TokenStorage: saveData(env, tokens)
    TokenStorage->>OS Keychain: Store securely
    AuthService-->>CLI: Success
```

**Key Methods:**

- `loginWithCallback()`: Start OAuth PKCE flow
- `completeLogin()`: Exchange authorization code for tokens
- `loginWithRefreshToken()`: Direct refresh token exchange
- `getValidAccessToken()`: Retrieve token with auto-refresh
- `logout()`: Remove stored tokens
- `getAuthState()`: Check authentication status

---

## 6. Runtime View

### 6.1 Scenario: SDK API Call with Token Refresh

```mermaid
sequenceDiagram
    participant App as User Application
    participant SDK as PlatformSDKHttp
    participant TP as TokenProvider
    participant Auth as AuthService
    participant Storage as TokenStorage
    participant API as Platform API
    
    App->>SDK: listApplications()
    SDK->>SDK: #getClient()
    SDK->>TP: tokenProvider()
    TP->>Auth: getValidAccessToken(env)
    Auth->>Storage: loadData(env)
    Storage-->>Auth: TokenData (expired)
    Auth->>Auth: isTokenValid() → false
    Auth->>Auth0: refresh(refresh_token)
    Auth0-->>Auth: New access token
    Auth->>Storage: saveData(env, newToken)
    Auth-->>TP: access_token (new)
    TP-->>SDK: access_token
    SDK->>SDK: new PublicApi(token)
    SDK->>API: GET /v1/applications
    API-->>SDK: 200 OK + data
    SDK-->>App: ApplicationReadShortResponse[]
```

**Key Steps:**
1. SDK invokes token provider (async function)
2. Token provider checks token validity
3. If expired, automatic refresh using refresh token
4. Fresh access token used for API request
5. Success response returned to caller

### 6.2 Scenario: CLI User Login (OAuth PKCE)

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI Command
    participant Auth as AuthService
    participant Server as Express Server
    participant Browser
    participant Auth0
    participant Storage as TokenStorage
    
    User->>CLI: aignostics login
    CLI->>Auth: loginWithCallback(env, config)
    Auth->>Server: startCallbackServer() → port 8989
    Auth->>Auth0: Discover OIDC config
    Auth->>Auth: Generate PKCE verifier + challenge
    Auth->>Browser: open(authorizationUrl)
    Browser->>Auth0: User login page
    User->>Auth0: Enter credentials
    Auth0->>Server: GET /callback?code=xyz
    Server-->>CLI: Auth code received
    CLI->>Auth: completeLogin(env, config, code)
    Auth->>Auth0: POST /oauth/token (code + verifier)
    Auth0-->>Auth: TokenSet (access + refresh)
    Auth->>Storage: saveData(env, tokens)
    Storage->>Keychain: Save to OS keychain
    Auth-->>CLI: Success
    CLI->>Server: Close server
    CLI->>User: "Login successful!"
```

**Key Steps:**
1. Start local Express server on port 8989
2. Generate PKCE code verifier and challenge
3. Open browser to Auth0 authorization URL
4. User authenticates via Auth0 UI
5. Auth0 redirects to `http://localhost:8989/callback?code=...`
6. Exchange authorization code for tokens
7. Save tokens to OS keychain securely
8. Close local server

### 6.3 Scenario: CLI Command Execution

```mermaid
sequenceDiagram
    participant User
    participant Bin as bin.ts
    participant Yargs as cli.ts
    participant Func as cli-functions.ts
    participant SDK as @aignostics/sdk
    participant API as Platform API
    
    User->>Bin: aignostics list-applications
    Bin->>Yargs: Parse arguments
    Yargs->>Yargs: Resolve command handler
    Yargs->>Func: listApplications(env, authService)
    Func->>SDK: new PlatformSDKHttp(config)
    Func->>SDK: listApplications()
    SDK->>API: GET /v1/applications
    API-->>SDK: 200 OK + data
    SDK-->>Func: ApplicationReadShortResponse[]
    Func->>User: JSON.stringify(data)
```

### 6.4 Scenario: Error Handling Flow

```mermaid
sequenceDiagram
    participant App
    participant SDK as PlatformSDKHttp
    participant Client as PublicApi (generated)
    participant API
    
    App->>SDK: getApplication('invalid-id')
    SDK->>Client: readApplicationByIdV1ApplicationsApplicationIdGet()
    Client->>API: GET /v1/applications/invalid-id
    API-->>Client: 404 Not Found + error body
    Client-->>SDK: AxiosError (status: 404)
    SDK->>SDK: handleRequestError(error)
    SDK->>SDK: Create APIError(statusCode: 404)
    SDK-->>App: throw APIError
    App->>App: catch (error)
    App->>App: if (error instanceof APIError)
```

**Error Transformation:**
- Axios errors → `APIError` (with status code)
- Missing token → `AuthenticationError`
- Unknown errors → `UnexpectedError`
- Validation errors (422) → `APIError` with parsed details

---

## 7. Deployment View

### 7.1 npm Package Distribution

```mermaid
graph TB
    subgraph "Development Environment"
        CODE[Source Code]
        NX[Nx Build]
        TSUP[tsup Bundler]
    end
    
    subgraph "Build Artifacts"
        SDK_DIST[sdk/dist/]
        CLI_DIST[cli/dist/]
    end
    
    subgraph "npm Registry"
        SDK_PKG[SDK Package]
        CLI_PKG[CLI Package]
    end
    
    subgraph "User Environments"
        APP[TypeScript App]
        TERMINAL[Command Line]
    end
    
    CODE -->|nx build sdk| NX
    NX -->|tsup| TSUP
    TSUP -->|generates| SDK_DIST
    TSUP -->|generates| CLI_DIST
    
    SDK_DIST -->|npm publish| SDK_PKG
    CLI_DIST -->|npm publish| CLI_PKG
    
    SDK_PKG -->|npm install| APP
    CLI_PKG -->|npm install -g| TERMINAL
```

**Package Outputs:**

| Package | Formats | Entry Points |
|---------|---------|--------------|
| **@aignostics/sdk** | ESM + CJS | `dist/index.{js,cjs}`, `dist/test-utils/http-mocks.{js,cjs}` |
| **@aignostics/cli** | ESM + CJS | `dist/bin.{js,cjs}` (executable) |

### 7.2 Token Storage Deployment

```mermaid
graph TB
    subgraph "macOS"
        CLI_MAC[CLI Application]
        KEYCHAIN[Keychain.app]
        FILE_MAC[~/.config/aignostics-platform/]
    end
    
    subgraph "Linux"
        CLI_LIN[CLI Application]
        GNOME[GNOME Keyring]
        FILE_LIN[~/.config/aignostics-platform/]
    end
    
    subgraph "Windows"
        CLI_WIN[CLI Application]
        CREDMAN[Credential Manager]
        FILE_WIN[%APPDATA%/aignostics-platform/]
    end
    
    CLI_MAC -->|primary| KEYCHAIN
    CLI_MAC -.->|fallback| FILE_MAC
    
    CLI_LIN -->|primary| GNOME
    CLI_LIN -.->|fallback| FILE_LIN
    
    CLI_WIN -->|primary| CREDMAN
    CLI_WIN -.->|fallback| FILE_WIN
```

**Storage Strategy:**
- **Primary:** OS-native secure storage via `@napi-rs/keyring`
- **Fallback:** Encrypted JSON file with restricted permissions (0o600)
- **Service Name:** `aignostics-platform`
- **Entry Name:** Environment key (`production`, `staging`, `develop`)

### 7.3 Code Generation Workflow

```mermaid
graph LR
    subgraph "External API"
        SPEC[OpenAPI Spec<br/>platform-staging.aignostics.com]
    end
    
    subgraph "Local Development"
        CMD[nx codegen sdk]
        DOCKER[Docker Container<br/>openapi-generator-cli:v7.14.0]
        GEN[packages/sdk/src/generated/]
    end
    
    subgraph "Build Process"
        BUILD[nx build sdk]
        DIST[packages/sdk/dist/]
    end
    
    CMD -->|runs| DOCKER
    DOCKER -->|downloads| SPEC
    DOCKER -->|generates| GEN
    GEN -->|included in| BUILD
    BUILD -->|produces| DIST
```

**Code Generation Steps:**
1. Delete existing `packages/sdk/src/generated/`
2. Run Docker container with OpenAPI Generator
3. Download spec from `https://platform-staging.aignostics.com/api/v1/openapi.json`
4. Generate TypeScript Axios client
5. Output to `packages/sdk/src/generated/`

**Important:** Generated code is git-ignored and must be regenerated in CI/CD.

---

## 8. Cross-Cutting Concepts

### 8.1 Error Handling Strategy

**Hierarchy:**

```
BaseError (abstract)
├── AuthenticationError (no token, invalid token)
├── APIError (HTTP errors, validation errors)
├── ConfigurationError (invalid SDK config)
└── UnexpectedError (unknown errors)
```

**Error Context:**
- `code`: Machine-readable error code
- `message`: Human-readable message
- `context`: Additional metadata (response body, validation details)
- `originalError`: Wrapped original error
- `statusCode`: HTTP status (APIError only)

**Usage Pattern:**

Users can handle errors by type:
```typescript
try {
  await sdk.getApplication('id');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle auth issues
  } else if (error instanceof APIError) {
    // Handle API errors (check statusCode)
  }
}
```

### 8.2 Testing Strategy

**Test Types:**

| Type | File Pattern | Scope | Mocking |
|------|-------------|-------|---------|
| **Unit** | `.spec.ts` | Single function/class | Full mocking |
| **Integration** | `.test.ts` | Multiple components | HTTP mocking (MSW) |
| **E2E** | `e2e/**/*.test.ts` | Full CLI flow | Real HTTP (staging) |

**HTTP Mocking Architecture:**

```mermaid
graph TB
    TEST[Test Suite]
    MSW[MSW Server]
    SCENARIOS[Mock Scenarios]
    FACTORIES[Data Factories]
    
    TEST -->|uses| MSW
    MSW -->|configured by| SCENARIOS
    SCENARIOS -->|generates data via| FACTORIES
    
    subgraph "Scenarios"
        SUCCESS[Success Response]
        EMPTY[Empty Response]
        NOT_FOUND[404 Not Found]
        VALIDATION[422 Validation Error]
        SERVER_ERR[500 Server Error]
        NETWORK[Network Failure]
    end
```

**Mock Scenario Switching:**
```typescript
import { setMockScenario } from '@aignostics/sdk/test';

it('handles 404 errors', async () => {
  setMockScenario('notFound');
  await expect(sdk.getApplication('id')).rejects.toThrow(APIError);
});
```

**Test Isolation:**
- MSW server reset between tests
- Automatic mock cleanup (vitest `unstubAllGlobals`)
- Randomized timezone per test run
- Independent E2E test execution

### 8.3 Configuration Management

**SDK Configuration:**

```typescript
interface PlatformSDKConfig {
  baseURL?: string;           // Default: https://api.aignostics.com
  tokenProvider: TokenProvider; // Required
  timeout?: number;           // Default: 10000ms
}
```

**CLI Configuration:**

Environment-specific settings in `utils/environment.ts`:
```typescript
{
  production: { endpoint, issuerURL, clientID, scope, audience },
  staging: { ... },
  develop: { ... }
}
```

**Environment Selection:**
- CLI flag: `--environment <env>`
- Default: `production`
- Affects: API endpoint, OAuth provider, token storage key

### 8.4 Security Concepts

**Token Protection:**
1. **Primary Storage:** OS-native secure storage (Keychain/Credential Manager)
2. **Fallback Storage:** Encrypted file with restricted permissions (0o600)
3. **Transport:** TLS for all HTTP communication
4. **Memory:** Tokens retrieved on-demand, not held in memory

**OAuth Security:**
- **PKCE Flow:** Prevents authorization code interception
- **Code Verifier:** Random 32-byte hex string
- **Localhost Callback:** Reduces attack surface
- **Token Rotation:** Refresh tokens enable token renewal

**Dependency Security:**
- License policy enforcement (pre-commit hook)
- Automated vulnerability scanning (npm audit in CI)
- Dependency updates monitored

### 8.5 Build and Release

**Build Pipeline:**

```mermaid
graph LR
    COMMIT[Git Commit]
    CODEGEN[Generate API Client]
    TYPECHECK[Type Check]
    LINT[Lint]
    TEST[Test]
    BUILD[Build Packages]
    PUBLISH[Publish to npm]
    
    COMMIT --> CODEGEN
    CODEGEN --> TYPECHECK
    TYPECHECK --> LINT
    LINT --> TEST
    TEST --> BUILD
    BUILD --> PUBLISH
```

**Nx Build Graph:**
- `sdk:codegen` → `sdk:build` → `cli:build`
- Build cache enabled for faster rebuilds
- Parallel test execution

**Semantic Release:**
- Conventional commits analyzed
- Version bumped automatically
- Changelog generated
- Git tags created
- npm publish (independent package versions)

---

## 9. Architecture Decisions

### 9.1 ADR-001: Wrapper Pattern for Generated Code

**Context:** OpenAPI Generator produces verbose client with complex signatures.

**Decision:** Wrap generated client in `PlatformSDKHttp` class with simplified methods.

**Rationale:**
- Shields users from generated code complexity
- Enables custom error handling
- Allows method signature simplification
- Provides flexibility to change code generator

**Consequences:**
- Additional maintenance layer
- Manual updates when API changes
- Improved developer experience

### 9.2 ADR-002: Token Provider Pattern

**Context:** SDK needs access tokens but shouldn't manage authentication.

**Decision:** Accept `TokenProvider` function that returns current token.

**Rationale:**
- Separates authentication concern from API client
- Enables dynamic token refresh without SDK reinitialization
- Supports multiple authentication strategies (OAuth, API keys, etc.)
- SDK remains authentication-agnostic

**Consequences:**
- Users must implement token management
- CLI handles OAuth + refresh logic
- SDK methods always use fresh tokens

### 9.3 ADR-003: Dependency Injection for Token Storage

**Context:** CLI needs secure token storage with testable implementation.

**Decision:** `AuthService` depends on `TokenStorage` interface.

**Rationale:**
- Enables test mocking (no filesystem in unit tests)
- Supports multiple storage backends
- Clear separation of concerns
- Follows SOLID principles

**Consequences:**
- Slightly more complex initialization
- Improved testability
- Easy to add alternative storage

### 9.4 ADR-004: Dual Storage Strategy (Keychain + File)

**Context:** OS keychain may fail due to permissions or missing dependencies.

**Decision:** Primary storage is OS keychain; fallback to encrypted file.

**Rationale:**
- Best security when keychain available
- Graceful degradation on keychain failure
- User doesn't need to troubleshoot keychain issues
- Works across all environments

**Consequences:**
- More complex storage logic
- Silent fallback (may mask issues)
- File storage less secure than keychain

### 9.5 ADR-005: MSW for HTTP Mocking

**Context:** Need realistic HTTP testing without real API calls.

**Decision:** Use MSW (Mock Service Worker) for network-level mocking.

**Rationale:**
- Tests real HTTP client logic (Axios)
- No need to mock SDK internals
- Scenario-based testing (success, errors, edge cases)
- Realistic request/response handling

**Consequences:**
- Additional test infrastructure
- Excellent test realism
- Shared mocks between SDK and CLI

### 9.6 ADR-006: TypeScript SDK Repository with Independent Publishing

**Context:** SDK and CLI are related but serve different users.

**Decision:** Use Nx workspace for TypeScript SDK repository with independent package versions.

**Rationale:**
- Shared tooling (linting, testing, type checking)
- Independent release cycles
- CLI depends on SDK naturally
- Easier cross-package refactoring

**Consequences:**
- More complex CI/CD (two packages)
- Better separation of concerns
- Improved code reuse

### 9.7 ADR-007: Docker-Based Code Generation

**Context:** OpenAPI Generator requires specific version and dependencies.

**Decision:** Use Docker container for code generation instead of npm package.

**Rationale:**
- Consistent tool version across environments
- No local npm dependency on generator
- Isolated environment for generation
- Easier upgrades (change Docker tag)

**Consequences:**
- Requires Docker locally and in CI
- Slightly slower first-time setup
- Completely reproducible generation

---

## 10. Quality Requirements

### 10.1 Quality Tree

```
Quality
├── Type Safety (High Priority)
│   ├── Strict TypeScript mode
│   ├── Generated types from OpenAPI
│   └── Compile-time error catching
├── Testability (High Priority)
│   ├── 85% code coverage minimum
│   ├── Isolated unit tests
│   ├── Integration tests with MSW
│   └── E2E tests against staging
├── Security (High Priority)
│   ├── OS-native token storage
│   ├── OAuth2 PKCE flow
│   ├── TLS-only communication
│   └── Dependency license validation
├── Maintainability (Medium Priority)
│   ├── Clear package boundaries
│   ├── Automated code generation
│   ├── Comprehensive documentation
│   └── Conventional commits
└── Performance (Lower Priority)
    ├── Build caching (Nx)
    ├── Per-request client creation
    └── Reasonable timeout defaults
```

### 10.2 Quality Scenarios

| Quality Attribute | Scenario | Measure |
|-------------------|----------|---------|
| **Type Safety** | Developer adds new SDK method | Compile error if types mismatch |
| **Testability** | New feature added | Coverage remains ≥ 85% |
| **Security** | CLI stores token | Token saved to OS keychain (not plaintext) |
| **Maintainability** | API endpoint added | Code regeneration updates types automatically |
| **Developer Experience** | User encounters error | Error message clearly indicates problem and solution |
| **Reliability** | Network failure | Graceful error handling, no unhandled exceptions |

### 10.3 Test Coverage Requirements

| Package | Threshold | Metric | Exclusions |
|---------|-----------|--------|------------|
| **SDK** | 85% | Branches, Functions, Lines, Statements | `src/generated/**`, `src/test-utils/**`, `*.test.ts` |
| **CLI** | 85% | Branches, Functions, Lines, Statements | `*.test.ts`, `e2e/**` |

**Enforcement:**
- Vitest coverage reports
- CI pipeline fails if below threshold
- Coverage reports uploaded to Codecov

---

## 11. Risks and Technical Debt

### 11.1 Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **OpenAPI Spec Breaking Changes** | High | High | Versioned code generation, comprehensive tests |
| **Auth0 Service Downtime** | Low | High | Clear error messages, retry logic |
| **OS Keychain Unavailable** | Medium | Low | File storage fallback |
| **Generated Code Quality Issues** | Medium | Medium | Wrapper pattern isolates generated code |
| **Dependency Vulnerabilities** | Medium | Medium | Automated npm audit, license checking |

### 11.2 Technical Debt

| Item | Impact | Priority | Notes |
|------|--------|----------|-------|
| **Single-file CLI Functions** | Low | Low | `cli-functions.ts` could be split if it grows beyond ~500 lines |
| **Test Utilities in SDK Package** | Low | Medium | MSW exports increase package size; consider separate test package |
| **Manual Wrapper Maintenance** | Medium | Medium | SDK methods must be manually updated when API changes |
| **Docker Dependency** | Low | Low | Code generation requires Docker; could add npm fallback |
| **Silent Keychain Fallback** | Low | Medium | File storage fallback happens silently; consider warning |

### 11.3 Future Improvements

**Potential Enhancements:**
1. **SDK Streaming Support:** WebSocket or SSE for real-time run status
2. **CLI Progress Indicators:** Better UX for long-running operations
3. **SDK Retry Logic:** Automatic retry with exponential backoff
4. **CLI Configuration File:** Support for `.aignosticsrc` configuration
5. **SDK Browser Support:** Bundle for browser environments
6. **Multi-Region Support:** Automatic region detection and selection

**Scalability Considerations:**
- SDK is stateless and scales with application
- CLI is single-user, no scaling concerns
- Token refresh handles long-running sessions
- Build pipeline could benefit from better caching

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Application** | AI model or processing pipeline on Aignostics Platform |
| **Run** | Execution of an application on a set of data items |
| **Token Provider** | Async function that returns current access token |
| **PKCE** | Proof Key for Code Exchange (OAuth security extension) |
| **MSW** | Mock Service Worker (HTTP mocking library) |
| **Nx** | Build system and task orchestrator for typescript sdk monorepo |
| **Arc42** | Documentation template for software architecture |

## Appendix B: References

- [Nx Documentation](https://nx.dev)
- [OpenAPI Generator](https://openapi-generator.tech)
- [Arc42 Template](https://arc42.org)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [MSW Documentation](https://mswjs.io)
- [Conventional Commits](https://www.conventionalcommits.org)

---

**Document Version:** 1.0  
**Last Updated:** December 2, 2025  
**Maintained By:** Aignostics Platform Team
