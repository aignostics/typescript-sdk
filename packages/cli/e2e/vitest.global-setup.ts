import { executeCLI } from './utils/command.js';

const refreshToken = process.env.E2E_REFRESH_TOKEN;

export async function setup() {
  if (!refreshToken) {
    throw new Error('E2E_REFRESH_TOKEN environment variable is not set.');
  }

  console.log('🔐 Logging in...');
  await executeCLI(['login', '--refreshToken', refreshToken]);
  console.log('✅ Logged in.');

  return async () => {
    console.log('🔓 Logging out...');
    await executeCLI(['logout']);
    console.log('✅ Logged out.');
  };
}
