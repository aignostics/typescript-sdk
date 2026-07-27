import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/test-utils/http-mocks.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  fixedExtension: false,
  deps: {
    alwaysBundle: ['p-retry'],
    neverBundle: ['msw', 'fishery', '@faker-js/faker'],
  },
});
