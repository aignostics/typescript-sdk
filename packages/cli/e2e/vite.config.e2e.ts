import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['./**/*.e2e.test.ts'],
    environment: 'node',
    pool: 'threads',
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts'), 'dotenv/config'],
    hookTimeout: 60000,
    testTimeout: 60000,
    globals: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit-e2e.xml',
    },
  },
});
