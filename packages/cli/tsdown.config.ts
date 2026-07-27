import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  fixedExtension: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
