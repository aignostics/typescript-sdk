import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';

describe('cli smoke', () => {
  it('prints help and exits 0', async () => {
    const { stdout, exitCode } = await executeCLI(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage');
  });

  it('prints version and exits 0', async () => {
    const { stdout, exitCode } = await executeCLI(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/); // version pattern
  });

  it('shows info command output', async () => {
    const { stdout, exitCode } = await executeCLI(['info']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Aignostics Platform SDK');
    expect(stdout).toContain('Version');
  });

  it('calls authenticated test-api command', async () => {
    const { stdout } = await executeCLI(['test-api']);
    expect(stdout).toContain('API connection successful');
  });
});
