import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node18',
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@aignostics/platform-typescript-sdk',
    '@napi-rs/keyring',
    'express',
    'keytar',
    'open',
    'openid-client',
    'yargs',
    'zod',
  ],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
