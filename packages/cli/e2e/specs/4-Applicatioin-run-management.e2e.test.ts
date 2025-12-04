import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { RunReadResponse } from '@aignostics/sdk';

describe('SWR Application Run management', () => {
  it('Should retrieve a list of application runs with optional filtering by application ID and application version. @tests:SWR-APP-RUN-MGMT-LIST', async () => {
    const { stdout, exitCode } = await executeCLI([
      'list-application-runs',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '0.99.0',
    ]);

    expect(exitCode).toBe(0);

    // Match the JSON array after the prefix
    const runList = String(stdout).match(/Application runs: (\[.*\])/s);
    expect(runList).toBeTruthy();

    const runs = JSON.parse(runList![1]) as Array<RunReadResponse>;
    expect(Array.isArray(runs)).toBe(true);

    expect(runs[0].application_id).toBe('test-app');
  });
  it('Should retrieve detailed information for a specific application run by run ID @tests:SWR-APP-RUN-MGMT-DETAILS', async () => {
    const { stdout, exitCode } = await executeCLI([
      'list-application-runs',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '0.99.0',
    ]);

    expect(exitCode).toBe(0);
    const runList = String(stdout).match(/Application runs: (\[.*\])/s);

    const runs = JSON.parse(runList![1]) as Array<RunReadResponse>;
    const latestRunId = runs[0].run_id;

    const { stdout: runDetailsStdout, exitCode: runDetailsExitCode } = await executeCLI([
      'get-run',
      latestRunId,
    ]);

    expect(runDetailsExitCode).toBe(0);

    const runDetailsMatch = String(runDetailsStdout).match(
      new RegExp(`Run details for ${latestRunId}: (\\{.*\\})`, 's')
    );
    expect(runDetailsMatch).toBeTruthy();

    const runDetails = JSON.parse(runDetailsMatch![1]) as RunReadResponse;
    expect(runDetails.run_id).toBe(latestRunId);
    expect(runDetails.application_id).toBe('test-app');
  });

  it('Should cancel a running or queued application run by run ID @tests:SWR-APP-RUN-MGMT-CANCEL', async () => {
    const { stdout, exitCode } = await executeCLI([
      'list-application-runs',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '0.99.0',
    ]);

    expect(exitCode).toBe(0);
    const runList = String(stdout).match(/Application runs: (\[.*\])/s);

    const runs = JSON.parse(runList![1]) as Array<RunReadResponse>;
    const pendingRunId = runs.find(run => run.state === 'PENDING')?.run_id;

    if (!pendingRunId) {
      console.warn('No PENDING runs found to cancel. Skipping cancel-run test.');
      return;
    }
    const { stdout: cancelRunStdout, exitCode: cancelRunExitCode } = await executeCLI([
      'cancel-run',
      pendingRunId,
    ]);

    expect(cancelRunExitCode).toBe(0);

    expect(cancelRunStdout).toContain(`✅ Successfully cancelled application run: ${pendingRunId}`);
  });
});
