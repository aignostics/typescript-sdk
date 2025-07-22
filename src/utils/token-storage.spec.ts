import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { saveData, loadData, hasData, removeData } from './token-storage.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Entry } from '@napi-rs/keyring';

// Mock external dependencies
vi.mock('@napi-rs/keyring');

vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:os');

describe('Token Storage Module', () => {
  let consoleSpy: {
    log: MockInstance<typeof console.log>;
    warn: MockInstance<typeof console.warn>;
  };
  const mockEntry = {
    setPassword: vi.fn(),
    getPassword: vi.fn(),
    deletePassword: vi.fn(),
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log'),
      warn: vi.spyOn(console, 'warn'),
    };

    // Get the mocked Entry constructor
    vi.mocked(Entry).mockImplementation(() => mockEntry as unknown as Entry);

    // Mock os and path functions
    vi.mocked(os.platform).mockReturnValue('linux');
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
    vi.mocked(path.join).mockImplementation((...segments) => segments.join('/'));

    // Mock fs functions
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.promises.writeFile).mockResolvedValue();
    vi.mocked(fs.promises.readFile).mockResolvedValue('{}');
    vi.mocked(fs.promises.unlink).mockResolvedValue();
  });

  describe('saveData', () => {
    it('should save data to OS keychain successfully', async () => {
      const testData = { token: 'test-token', expires: 3600 };
      mockEntry.setPassword.mockResolvedValue(true);

      await saveData(testData);

      expect(mockEntry.setPassword).toHaveBeenCalledWith(JSON.stringify(testData));
      expect(console.log).toHaveBeenCalledWith('✅ Data saved securely to OS keychain');
    });

    it('should fallback to file storage when keychain fails', async () => {
      const testData = { token: 'test-token' };
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Keychain error');
      });

      await saveData(testData);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Warning: Could not save to OS keychain, falling back to file storage'
      );
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        token: 'test-token',
        metadata: {
          user: 'testuser',
          permissions: ['read', 'write'],
        },
        timestamp: Date.now(),
      };

      await saveData(complexData);

      expect(mockEntry.setPassword).toHaveBeenCalledWith(JSON.stringify(complexData));
    });
  });

  describe('loadData', () => {
    it('should load data from OS keychain successfully', async () => {
      const testData = { token: 'test-token', expires: 3600 };
      mockEntry.getPassword.mockReturnValue(JSON.stringify(testData));

      const result = await loadData();

      expect(result).toEqual(testData);
      expect(mockEntry.getPassword).toHaveBeenCalled();
    });

    it('should return null when no data in keychain', async () => {
      mockEntry.getPassword.mockReturnValue(null);
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await loadData();

      expect(result).toBeNull();
    });

    it('should fallback to file storage when keychain fails', async () => {
      mockEntry.getPassword.mockImplementation(() => {
        throw new Error('Keychain error');
      });
      const testData = { token: 'file-token' };
      vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(testData));

      const result = await loadData();

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load data from keychain')
      );
      expect(result).toEqual(testData);
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockEntry.getPassword.mockReturnValue('invalid-json');

      const result = await loadData();

      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should fallback to file when keychain returns empty', async () => {
      mockEntry.getPassword.mockReturnValue('');
      const testData = { token: 'file-token' };
      vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(testData));

      const result = await loadData();

      expect(result).toEqual(testData);
    });
  });

  describe('hasData', () => {
    it('should return true when data exists', async () => {
      mockEntry.getPassword.mockReturnValue('{"token": "test"}');

      const result = await hasData();

      expect(result).toBe(true);
    });

    it('should return false when no data exists', async () => {
      mockEntry.getPassword.mockReturnValue(null);
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await hasData();

      expect(result).toBe(false);
    });

    it('should return false when data is undefined', async () => {
      mockEntry.getPassword.mockReturnValue(undefined);
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await hasData();

      expect(result).toBe(false);
    });
  });

  describe('removeData', () => {
    it('should remove data from OS keychain successfully', async () => {
      mockEntry.deletePassword.mockResolvedValue(true);

      await removeData();

      expect(mockEntry.deletePassword).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Data removed from OS keychain');
    });

    it('should handle keychain removal failure gracefully', async () => {
      mockEntry.deletePassword.mockImplementation(() => {
        throw new Error('Keychain error');
      });

      await removeData();

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not remove data from keychain')
      );
      // Should still try file cleanup
      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should clean up both keychain and file storage', async () => {
      mockEntry.deletePassword.mockResolvedValue(true);

      await removeData();

      expect(mockEntry.deletePassword).toHaveBeenCalled();
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('Cross-platform path handling', () => {
    it('should use correct path for macOS', async () => {
      vi.mocked(os.platform).mockReturnValue('darwin');
      vi.mocked(os.homedir).mockReturnValue('/Users/testuser');

      const testData = { token: 'test' };
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Force file fallback');
      });

      await saveData(testData);

      expect(path.join).toHaveBeenCalledWith(
        '/Users/testuser',
        'Library',
        'Application Support',
        'aignostics-platform'
      );
    });

    it('should use correct path for Windows', async () => {
      vi.mocked(os.platform).mockReturnValue('win32');
      vi.mocked(os.homedir).mockReturnValue('C:\\Users\\testuser');
      process.env.APPDATA = 'C:\\Users\\testuser\\AppData\\Roaming';

      const testData = { token: 'test' };
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Force file fallback');
      });

      await saveData(testData);

      expect(path.join).toHaveBeenCalledWith(
        'C:\\Users\\testuser\\AppData\\Roaming',
        'aignostics-platform'
      );
    });

    it('should use XDG_CONFIG_HOME when available on Linux', async () => {
      vi.mocked(os.platform).mockReturnValue('linux');
      process.env.XDG_CONFIG_HOME = '/custom/config';

      const testData = { token: 'test' };
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Force file fallback');
      });

      await saveData(testData);

      expect(path.join).toHaveBeenCalledWith('/custom/config', 'aignostics-platform');
    });

    it('should create config directory if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const testData = { token: 'test' };
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Force file fallback');
      });

      await saveData(testData);

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
        mode: 0o700,
      });
    });
  });

  describe('File storage fallback', () => {
    it('should handle file write errors gracefully', async () => {
      mockEntry.setPassword.mockImplementation(() => {
        throw new Error('Keychain unavailable');
      });
      vi.mocked(fs.promises.writeFile).mockRejectedValue(new Error('Disk full'));

      await expect(saveData({ token: 'test' })).rejects.toThrow('Failed to save data to file');
    });

    it('should handle file read errors gracefully', async () => {
      mockEntry.getPassword.mockReturnValue(null);
      vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not readable'));

      const result = await loadData();

      expect(result).toBeNull();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not load data from file')
      );
    });

    it('should ignore file removal errors', async () => {
      mockEntry.deletePassword.mockResolvedValue(true);
      vi.mocked(fs.promises.unlink).mockRejectedValue(new Error('File not found'));

      // Should not throw
      await expect(removeData()).resolves.not.toThrow();
    });
  });
});
