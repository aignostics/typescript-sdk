#!/usr/bin/env node

import { main } from './cli';

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

export * from './cli';
