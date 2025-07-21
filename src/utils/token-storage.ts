import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Entry } from '@napi-rs/keyring';

/**
 * Cross-platform token storage utility using OS-native secure storage
 * Uses keytar for secure storage in OS keychain/credential manager:
 * - macOS: Keychain
 * - Linux: libsecret (GNOME Keyring, KWallet)
 * - Windows: Credential Manager
 */

const SERVICE_NAME = 'aignostics-platform';
const ACCOUNT_NAME = 'default';

/**
 * Token data structure
 */
export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  stored_at: number; // Unix timestamp
}

const entry = new Entry(SERVICE_NAME, ACCOUNT_NAME);

/**
 * Save token data securely using OS keychain/credential manager
 */
export async function saveToken(tokenData: Omit<TokenData, 'stored_at'>): Promise<void> {
  const dataToStore: TokenData = {
    ...tokenData,
    stored_at: Date.now(),
  };

  try {
    const serializedData = JSON.stringify(dataToStore);
    entry.setPassword(serializedData);
    console.log(`✅ Token saved securely to OS keychain`);
  } catch (error) {
    // Fallback to file-based storage if keytar fails
    console.warn('Warning: Could not save to OS keychain, falling back to file storage');
    await saveTokenToFile(dataToStore);
  }
}

/**
 * Load token data from OS keychain/credential manager
 */
export async function loadToken(): Promise<TokenData | null> {
  try {
    const serializedData = await entry.getPassword();

    if (!serializedData) {
      // Try fallback file storage
      return await loadTokenFromFile();
    }

    const tokenData: TokenData = JSON.parse(serializedData);
    return tokenData;
  } catch (error) {
    console.warn(`Warning: Could not load token from keychain: ${error}`);
    // Try fallback file storage
    return await loadTokenFromFile();
  }
}

/**
 * Check if a token exists and is valid (not expired)
 */
export async function hasValidToken(): Promise<boolean> {
  const tokenData = await loadToken();

  if (!tokenData) {
    return false;
  }

  // Check if token has expiration and if it's expired
  if (tokenData.expires_in) {
    const expirationTime = tokenData.stored_at + tokenData.expires_in * 1000;
    const now = Date.now();

    if (now >= expirationTime) {
      console.log('Token has expired');
      return false;
    }
  }

  return true;
}

/**
 * Remove the stored token from OS keychain/credential manager
 */
export async function removeToken(): Promise<void> {
  try {
    const success = await entry.deletePassword();
    if (success) {
      console.log('✅ Token removed from OS keychain');
    }

    // Also try to remove from fallback file storage
    await removeTokenFromFile();
  } catch (error) {
    console.warn(`Warning: Could not remove token from keychain: ${error}`);
    // Try fallback file storage
    await removeTokenFromFile();
  }
}

/**
 * Get the current token if it exists and is valid
 */
export async function getCurrentToken(): Promise<string | null> {
  const tokenData = await loadToken();

  if (!tokenData || !(await hasValidToken())) {
    return null;
  }

  return tokenData.access_token;
}

// Fallback file-based storage functions for when keytar is not available

/**
 * Get the appropriate config directory for the current OS (fallback)
 */
function getConfigDir(): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', SERVICE_NAME);
    case 'win32': // Windows
      return path.join(
        process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
        SERVICE_NAME
      );
    default: // Linux and other Unix-like systems
      return path.join(process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config'), SERVICE_NAME);
  }
}

/**
 * Ensure the config directory exists (fallback)
 */
function ensureConfigDir(): string {
  const configDir = getConfigDir();

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 }); // Owner read/write/execute only
  }

  return configDir;
}

/**
 * Get the full path to the token file (fallback)
 */
function getTokenFilePath(): string {
  const configDir = ensureConfigDir();
  return path.join(configDir, 'auth.json');
}

/**
 * Save token data to file (fallback)
 */
async function saveTokenToFile(tokenData: TokenData): Promise<void> {
  const tokenFilePath = getTokenFilePath();

  try {
    await fs.promises.writeFile(tokenFilePath, JSON.stringify(tokenData, null, 2), { mode: 0o600 });
    console.log(`✅ Token saved to file: ${tokenFilePath}`);
  } catch (error) {
    throw new Error(`Failed to save token to file: ${error}`);
  }
}

/**
 * Load token data from file (fallback)
 */
async function loadTokenFromFile(): Promise<TokenData | null> {
  const tokenFilePath = getTokenFilePath();

  try {
    if (!fs.existsSync(tokenFilePath)) {
      return null;
    }

    const fileData = await fs.promises.readFile(tokenFilePath, 'utf8');
    const tokenData: TokenData = JSON.parse(fileData);

    return tokenData;
  } catch (error) {
    console.warn(`Warning: Could not load token from file: ${error}`);
    return null;
  }
}

/**
 * Remove token file (fallback)
 */
async function removeTokenFromFile(): Promise<void> {
  const tokenFilePath = getTokenFilePath();

  try {
    if (fs.existsSync(tokenFilePath)) {
      await fs.promises.unlink(tokenFilePath);
      console.log('✅ Token file removed');
    }
  } catch (error) {
    // Ignore file removal errors
  }
}
