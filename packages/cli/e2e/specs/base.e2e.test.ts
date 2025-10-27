import { describe, it, expect } from 'vitest';
import { execa } from 'execa';

describe('cli smoke', () => {
  it('prints help and exits 0', async () => {
    const { stdout, exitCode } = await execa('node', [__CLI_BIN__, '--help']);
    expect(exitCode).toBe(0);
    expect(stdout.toLowerCase()).toContain('usage');
  });

  it('prints version and exits 0', async () => {
    const { stdout, exitCode } = await execa('node', [__CLI_BIN__, '--version']);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/); // version pattern
  });

  it('shows info command output', async () => {
    const { stdout, exitCode } = await execa('node', [__CLI_BIN__, 'info']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Aignostics Platform SDK');
    expect(stdout).toContain('Version');
  });

  it('calls authenticated test-api command', async () => {
    // This should fail with authentication error since we're not logged in
    const { stdout } = await execa('node', [__CLI_BIN__, 'test-api', '--environment', 'develop']);
    expect(stdout).toContain('API connection successful');
  });
});
