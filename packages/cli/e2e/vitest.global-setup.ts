import { executeCLI } from './utils/command.js';

const refreshToken = process.env.E2E_REFRESH_TOKEN;

export async function setup() {
  if (!refreshToken) {
    throw new Error('E2E_REFRESH_TOKEN environment variable is not set.');
  }

  await executeCLI(['login', '--refreshToken', refreshToken]);

  return async () => {
    await executeCLI(['logout']);
  };
}
