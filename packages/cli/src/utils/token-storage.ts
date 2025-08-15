import * as fs from 'node:fs';
import path from 'node:path';
import * as os from 'node:os';
import { Entry } from '@napi-rs/keyring';
import { type TokenStorage } from './auth.js';

/**
 * Cross-platform secure storage utility using OS-native secure storage
 * Uses @napi-rs/keyring for secure storage in OS keychain/credential manager:
 * - macOS: Keychain
 * - Linux: libsecret (GNOME Keyring, KWallet)
 * - Windows: Credential Manager
 *
 * This is a generic storage service that can store any JSON-serializable data.
 * Token validation, expiration checking, and refresh logic should be handled by the caller.
 *
 * Recommended usage with validation:
 * ```typescript
 * import { z } from 'zod';
 * import { loadData, saveData } from './token-storage.js';
 *
 * const TokenSchema = z.object({
 *   access_token: z.string(),
 *   refresh_token: z.string().optional(),
 *   expires_at: z.number().optional(),
 *   stored_at: z.number(),
 * });
 *
 * async function getValidatedToken() {
 *   const data = await loadData();
 *   const result = TokenSchema.safeParse(data);
 *   if (!result.success) {
 *     return null;
 *   }
 *
 *   const token = result.data;
 *   // Check expiration
 *   if (token.expires_at && Date.now() > token.expires_at) {
 *     return null;
 *   }
 *
 *   return token;
 * }
 * ```
 */

const SERVICE_NAME = 'aignostics-platform';

/**
 * Save data securely using OS keychain/credential manager
 * @param data - Any JSON-serializable data to store
 */
export async function saveData(name: string, data: unknown): Promise<void> {
  const entry = new Entry(SERVICE_NAME, name);
  try {
    const serializedData = JSON.stringify(data);
    entry.setPassword(serializedData);
    console.log(`✅ Data saved securely to OS keychain`);
  } catch {
    // Fallback to file-based storage if keyring fails
    console.warn('Warning: Could not save to OS keychain, falling back to file storage');
    await saveDataToFile(name, data);
  }
}

/**
 * Load data from OS keychain/credential manager
 * @returns The stored data as unknown, or null if not found
 */
export async function loadData(name: string): Promise<unknown> {
  const entry = new Entry(SERVICE_NAME, name);
  try {
    const serializedData = entry.getPassword();

    if (!serializedData) {
      // Try fallback file storage
      return await loadDataFromFile(name);
    }

    try {
      const data: unknown = JSON.parse(serializedData);
      return data;
    } catch (parseError) {
      console.warn(`Warning: Could not parse data from keychain: ${String(parseError)}`);
      return null;
    }
  } catch (error) {
    console.warn(`Warning: Could not load data from keychain: ${String(error)}`);
    // Try fallback file storage
    return await loadDataFromFile(name);
  }
}

/**
 * Check if data exists in storage
 */
export async function hasData(name: string): Promise<boolean> {
  const data = await loadData(name);
  return data !== null && data !== undefined;
}

/**
 * Remove the stored data from OS keychain/credential manager
 */
export async function removeData(name: string): Promise<void> {
  const entry = new Entry(SERVICE_NAME, name);
  try {
    const success = entry.deletePassword();
    if (success) {
      console.log('✅ Data removed from OS keychain');
    }

    // Also try to remove from fallback file storage
    await removeDataFromFile(name);
  } catch (error) {
    console.warn(`Warning: Could not remove data from keychain: ${String(error)}`);
    // Try fallback file storage
    await removeDataFromFile(name);
  }
}

// Fallback file-based storage functions for when keyring is not available

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
 * Get the full path to the data file (fallback)
 */
function getDataFilePath(name: string): string {
  const configDir = ensureConfigDir();
  // Sanitize the name to prevent path traversal
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(configDir, `${safeName}.json`);
}

/**
 * Save data to file (fallback)
 */
async function saveDataToFile(name: string, data: unknown): Promise<void> {
  const dataFilePath = getDataFilePath(name);

  try {
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2), { mode: 0o600 });
    console.log(`✅ Data saved to file: ${dataFilePath}`);
  } catch (error) {
    throw new Error(`Failed to save data to file: ${String(error)}`);
  }
}

/**
 * Load data from file (fallback)
 */
async function loadDataFromFile(name: string): Promise<unknown> {
  const dataFilePath = getDataFilePath(name);

  try {
    if (!fs.existsSync(dataFilePath)) {
      return null;
    }

    const fileData = await fs.promises.readFile(dataFilePath, 'utf8');
    const data: unknown = JSON.parse(fileData);

    return data;
  } catch (error) {
    console.warn(`Warning: Could not load data from file: ${String(error)}`);
    return null;
  }
}

/**
 * Remove data file (fallback)
 */
async function removeDataFromFile(name: string): Promise<void> {
  const dataFilePath = getDataFilePath(name);

  try {
    if (fs.existsSync(dataFilePath)) {
      await fs.promises.unlink(dataFilePath);
      console.log('✅ Data file removed');
    }
  } catch {
    // Ignore file removal errors
  }
}

/**
 * Implementation of TokenStorage using the token-storage module
 * This provides a clean interface for the auth module to use.
 */
export class FileSystemTokenStorage implements TokenStorage {
  async save(name: string, data: Record<string, unknown>): Promise<void> {
    return saveData(name, data);
  }

  async load(name: string): Promise<Record<string, unknown> | null> {
    const data = await loadData(name);
    return data as Record<string, unknown> | null;
  }

  async remove(name: string): Promise<void> {
    return removeData(name);
  }

  async exists(name: string): Promise<boolean> {
    return hasData(name);
  }
}
