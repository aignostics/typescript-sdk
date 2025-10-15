import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/test-utils/http-mocks.ts'],
  format: ['cjs', 'esm'],
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: ['axios'],
});
