import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['./**/*.e2e.test.ts'],
    environment: 'node',
    globalSetup: path.resolve(__dirname, './vitest.global-setup.ts'),
    setupFiles: ['dotenv/config'],
    hookTimeout: 60000,
    testTimeout: 60000,
    globals: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit-e2e.xml',
    },
    // Disable concurrent test file execution to prevent auth state conflicts
    fileParallelism: false,
  },
});
