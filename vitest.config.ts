import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    setupFiles: ['./vitest.setup.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
      include: ['src/**/*.{test,spec}.ts'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'docs/',
        'src/generated/**',
        'src/test-utils/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      watermarks: {
        lines: [70, 85],
        statements: [70, 85],
        functions: [80, 95],
      },
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 95,
        statements: 85,
        '**/*.ts': {
          lines: 70,
        },
        // add exception for this executable index file
        'src/cli/index.ts': {
          lines: 50,
        },
      },
    },
  },
});
