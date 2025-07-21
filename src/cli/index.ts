import { main } from './cli.js';
import { fileURLToPath } from 'url';

// Get current file path for ESM compatibility
const __filename = fileURLToPath(import.meta.url);

// Check if this module is being run directly
const isMainModule = process.argv[1] === __filename || process.argv[1]?.endsWith('/cli/index.cjs');

if (isMainModule) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export * from './cli.js';
