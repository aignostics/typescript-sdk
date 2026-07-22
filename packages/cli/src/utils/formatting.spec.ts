import { describe, it, expect, vi } from 'vitest';
import { printJson, printKeyValue, printTable, printResult } from './formatting.js';

describe('formatting utils', () => {
  describe('printJson', () => {
    it('prints pretty-printed JSON', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printJson({ a: 1, b: 'two' });

      expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1, b: 'two' }, null, 2));
      logSpy.mockRestore();
    });
  });

  describe('printKeyValue', () => {
    it('prints one `Key: value` line per pair', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printKeyValue([
        ['Name', 'Alice'],
        ['Age', 30],
      ]);

      expect(logSpy).toHaveBeenCalledWith('Name: Alice');
      expect(logSpy).toHaveBeenCalledWith('Age: 30');
      logSpy.mockRestore();
    });
  });

  describe('printTable', () => {
    it('renders a table containing the headers and row values', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      printTable(
        ['Name', 'Age'],
        [
          ['Alice', 30],
          ['Bob', 25],
        ]
      );

      const output = logSpy.mock.calls[0][0] as string;
      expect(output).toContain('Name');
      expect(output).toContain('Age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
      logSpy.mockRestore();
    });
  });

  describe('printResult', () => {
    it('delegates to the text printer for the "text" format', () => {
      const textPrinter = vi.fn();

      printResult('text', { a: 1 }, textPrinter);

      expect(textPrinter).toHaveBeenCalledWith({ a: 1 });
    });

    it('prints JSON directly for the "json" format, ignoring the text printer', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const textPrinter = vi.fn();

      printResult('json', { a: 1 }, textPrinter);

      expect(textPrinter).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
      logSpy.mockRestore();
    });
  });
});
