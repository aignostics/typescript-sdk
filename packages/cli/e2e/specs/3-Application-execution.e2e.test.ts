import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { generateInputArtifactsForTest } from '../utils/getAppInputArtifacts.js';
import { getAppLatestVersion } from '../utils/getAppLatestVersion.js';

describe('SWR Application Execution access', async () => {
  const latestVersion = await getAppLatestVersion('test-app');

  it('Should create application runs with specified application version, input items, and item- and run metadata and return a unique run identifier upon successful creation. @tests:SWR-APP-EXEC-RUN-CREATION @tests:SWR-APP-EXEC-INPUT-ARTIFACT', async () => {
    const items = await generateInputArtifactsForTest('test-app', latestVersion, 2);

    const { stdout, exitCode } = await executeCLI([
      'create-run',
      'test-app',
      '0.99.0',
      '--items',
      JSON.stringify(items),
    ]);

    expect(exitCode).toBe(0);

    // Match the JSON object after the prefix
    const runDetails = String(stdout).match(/Application run created successfully: (\{[\s\S]*\})/);
    expect(runDetails).toBeTruthy();

    const runId = JSON.parse(runDetails![1]) as string;

    expect(runId).toHaveProperty('run_id');
  });

  it('Should return an error on on non-existent version @tests:SWR-ERROR-COMM-DIAGNOSTIC-CONTEXT @tests:SWR-ERROR-COMM-CLI-OUTPUT', async () => {
    const items = await generateInputArtifactsForTest('test-app', latestVersion, 2);

    const { stderr, exitCode } = await executeCLI(
      ['create-run', 'test-app', '2.0.0', '--items', JSON.stringify(items)],
      { reject: false }
    );

    // Verify error written to stderr
    expect(stderr).toMatch(/API_ERROR/);
    expect(stderr).toMatch(/application version not found/);

    // Verify machine-readable operation status (non-zero exit code)
    expect(exitCode).not.toBe(0);
  });

  it('Should return an error on missing arguments @tests:SWR-ERROR-COMM-MESSAGES', async () => {
    const { stderr } = await executeCLI(['create-run'], { reject: false });
    expect(stderr).toContain('❌ Not enough non-option arguments: got 0, need at least 2');
  });

  it('Should validate items before submission @tests:SWR-APP-EXEC-REQUEST-VALIDATION @tests:SWR-ERROR-COMM-MESSAGES', async () => {
    const { stderr } = await executeCLI(
      ['create-run', 'test-app', latestVersion, '--items', 'invalid-json'],
      { reject: false }
    );
    expect(stderr).toContain('❌ Invalid items JSON:');
  });
});
