import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { RunReadResponse } from '@aignostics/sdk';

describe('SWR Application Run management', () => {
  it('Should retrieve a list of application runs with optional filtering by application ID and application version.', async ({
    annotate,
  }) => {
    await annotate('SWR-APP-RUN-MGMT-LIST', 'tests');
    await annotate('TC-RUN-LIST', 'id');

    const { stdout, exitCode } = await executeCLI([
      'runs',
      'list',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '1.0.0',
      '--format',
      'json',
    ]);

    expect(exitCode).toBe(0);

    const runs = JSON.parse(String(stdout)) as Array<RunReadResponse>;
    expect(Array.isArray(runs)).toBe(true);

    expect(runs[0].application_id).toBe('test-app');
  });
  it('Should retrieve detailed information for a specific application run by run ID', async ({
    annotate,
  }) => {
    await annotate('SWR-APP-RUN-MGMT-DETAILS', 'tests');
    await annotate('TC-RUN-DETAILS', 'id');

    const { stdout, exitCode } = await executeCLI([
      'runs',
      'list',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '1.0.0',
      '--format',
      'json',
    ]);

    expect(exitCode).toBe(0);
    const runs = JSON.parse(String(stdout)) as Array<RunReadResponse>;
    const latestRunId = runs[0].run_id;

    const { stdout: runDetailsStdout, exitCode: runDetailsExitCode } = await executeCLI([
      'runs',
      'get',
      latestRunId,
      '--format',
      'json',
    ]);

    expect(runDetailsExitCode).toBe(0);

    const runDetails = JSON.parse(String(runDetailsStdout)) as RunReadResponse;
    expect(runDetails.run_id).toBe(latestRunId);
    expect(runDetails.application_id).toBe('test-app');
  });

  it('Should cancel a running or queued application run by run ID', async ({ annotate }) => {
    await annotate('SWR-APP-RUN-MGMT-CANCEL', 'tests');
    await annotate('TC-RUN-CANCEL', 'id');

    const { stdout, exitCode } = await executeCLI([
      'runs',
      'list',
      '--applicationId',
      'test-app',
      '--applicationVersion',
      '1.0.0',
      '--format',
      'json',
    ]);

    expect(exitCode).toBe(0);
    const runs = JSON.parse(String(stdout)) as Array<RunReadResponse>;
    const pendingRunId = runs.find(run => run.state === 'PENDING')?.run_id;

    if (!pendingRunId) {
      console.warn('No PENDING runs found to cancel. Skipping runs cancel test.');
      return;
    }
    const { stdout: cancelRunStdout, exitCode: cancelRunExitCode } = await executeCLI([
      'runs',
      'cancel',
      pendingRunId,
    ]);

    expect(cancelRunExitCode).toBe(0);

    expect(cancelRunStdout).toContain(`✅ Successfully cancelled application run: ${pendingRunId}`);
  });
});
