import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  format: ['esm', 'cjs'],
  target: 'node22',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@aignostics/sdk',
    '@napi-rs/keyring',
    'express',
    'open',
    'openid-client',
    'yargs',
    'zod',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
