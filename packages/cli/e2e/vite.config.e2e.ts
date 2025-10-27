import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolve the CLI executable:
 *  - Prefer `bin` from packages/cli/package.json (best for real-world e2e).
 *  - Fallback to built dist file if needed.
 */
function resolveCliBin() {
  const root = path.resolve(__dirname, '..', 'package.json');
  const pkgContent = fs.readFileSync(root, 'utf8');
  const pkg = JSON.parse(pkgContent) as { bin?: string | Record<string, string> };

  let binEntry: string | undefined;
  if (typeof pkg.bin === 'string') {
    binEntry = pkg.bin;
  } else if (pkg.bin && typeof pkg.bin === 'object') {
    const binKeys = Object.keys(pkg.bin);
    if (binKeys.length > 0) {
      const firstKey = binKeys[0];
      if (firstKey !== undefined) {
        binEntry = pkg.bin[firstKey];
      }
    }
  }

  const candidate = binEntry
    ? path.resolve(path.dirname(root), binEntry)
    : path.resolve(path.dirname(root), 'dist/bin.cjs');

  return candidate;
}

export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.test.ts'],
    environment: 'node',
    pool: 'threads',
    setupFiles: ['dotenv/config', './vitest.setup.ts'],
    hookTimeout: 60000,
    testTimeout: 60000,
    globals: true,
  },
  define: {
    __CLI_BIN__: JSON.stringify(resolveCliBin()),
  },
});
