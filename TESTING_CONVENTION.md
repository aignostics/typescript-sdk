# Testing Convention

This repository follows a specific testing convention to distinguish between different types of tests:

## File Naming Convention

### Unit Tests (`.spec.ts`)

- **Purpose**: Test individual functions, classes, or modules in isolation
- **Naming**: Should match the file being tested (e.g., `auth.spec.ts` tests `auth.ts`)
- **Characteristics**:
  - Heavy use of mocks and stubs
  - Test individual functions/methods
  - Fast execution
  - No external dependencies

**Examples:**

- `src/utils/auth.spec.ts` - Tests `src/utils/auth.ts`
- `src/cli/cli-functions.spec.ts` - Tests `src/cli/cli-functions.ts`
- `src/utils/token-storage.spec.ts` - Tests `src/utils/token-storage.ts`

### Integration Tests (`.test.ts`)

- **Purpose**: Test multiple components working together or end-to-end functionality
- **Naming**: Descriptive of the integration being tested
- **Characteristics**:
  - Test component interactions
  - May use real implementations
  - Test CLI commands end-to-end
  - Test SDK integration with external APIs

**Examples:**

- `src/cli/cli.test.ts` - Tests CLI command integration
- `src/platform-sdk.test.ts` - Tests SDK integration with external APIs
- `src/index.test.ts` - Tests main SDK exports and integration

## Vitest Configuration

The project is configured to run both types of tests:

- `include: ['src/**/*.{test,spec}.ts']` in `vitest.config.ts`
- Both file patterns are excluded from coverage calculations
- TypeScript type checking is enabled for all test files

## Running Tests

```bash
# Run all tests (both unit and integration)
npm test

# Run only unit tests
npm test -- --run src/**/*.spec.ts

# Run only integration tests
npm test -- --run src/**/*.test.ts

# Run with coverage
npm run test:coverage
```

## Guidelines

### When to write unit tests (`.spec.ts`):

- Testing individual functions or methods
- Testing error handling and edge cases
- Testing business logic in isolation
- When you need fast, focused tests

### When to write integration tests (`.test.ts`):

- Testing CLI commands end-to-end
- Testing API integrations
- Testing multiple modules working together
- Testing user workflows

### Test Organization:

- Each source file should have a corresponding `.spec.ts` file for unit tests
- Integration tests can test multiple files together
- Group related tests in `describe` blocks
- Use descriptive test names that explain the behavior being tested

## Coverage Requirements

- Overall coverage: 85% minimum
- Per-file coverage: 70% minimum for individual files
- Unit tests should achieve high coverage of individual modules
- Integration tests ensure components work together correctly
