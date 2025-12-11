import { defineConfig } from 'tsup';

export default defineConfig([
  // Main SDK build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    target: 'node22',
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    outDir: 'dist',
    external: ['axios', 'yargs', 'open', 'openid-client', 'express', '@napi-rs/keyring'],
  },
  // CLI build (CommonJS only for better Node.js compatibility)
  {
    entry: ['src/cli/index.ts'],
    format: ['cjs'],
    target: 'node22',
    dts: false,
    sourcemap: true,
    clean: false, // Don't clean since main build already did
    splitting: false,
    treeshake: true,
    outDir: 'dist/cli',
    outExtension: () => ({ js: '.cjs' }),
    external: ['axios', 'yargs', 'open', 'openid-client', 'express', '@napi-rs/keyring'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
