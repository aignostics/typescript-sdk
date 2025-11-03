import { afterAll, beforeAll, expect } from 'vitest';
import { executeCLI } from './utils/command.js';

const refreshToken = process.env.E2E_REFRESH_TOKEN;

beforeAll(async () => {
  console.log('🔐 Logging in using refresh token for e2e tests...');

  if (!refreshToken) {
    throw new Error('E2E_REFRESH_TOKEN environment variable is not set.');
  }

  const { stdout } = await executeCLI(['login', '--refreshToken', refreshToken]);

  expect(stdout).contain('🎉 Login with refresh token successful! Token saved securely.');
});

afterAll(async () => {
  console.log('🔓 Logging out after e2e tests...');

  const { stdout } = await executeCLI(['logout']);

  expect(stdout).contain('✅ Logged out successfully. Token removed.');
});
