import { executeCLI } from './utils/command.js';
import { loginWithBrowser } from './utils/loginWithBrowser.js';

export async function setup() {
  console.log('🔐 Logging in...');
  await loginWithBrowser('global-setup-login-failure');
  console.log('✅ Logged in.');

  return async () => {
    console.log('🔓 Logging out...');
    await executeCLI(['auth', 'logout']);
    console.log('✅ Logged out.');
  };
}
