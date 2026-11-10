import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { createTestAppRun } from '../utils/createTestAppRun.js';
import { getAppLatestVersion } from '../utils/getAppLatestVersion.js';
import { RunReadResponse } from '@aignostics/sdk';

describe('SWR Application Run management', async () => {
  const latestVersion = await getAppLatestVersion('test-app');
  if (!latestVersion) throw new Error('No versions found for test-app');

  // The tests in this file run in order: the run is listed and read before the last test
  // cancels it.
  const runId = await createTestAppRun(latestVersion);

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
      latestVersion,
      '--format',
      'json',
    ]);

    expect(exitCode).toBe(0);

    const runs = JSON.parse(String(stdout)) as Array<RunReadResponse>;
    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThan(0);

    runs.forEach(run => {
      expect(run.application_id).toBe('test-app');
      expect(run.version_number).toBe(latestVersion);
    });
  });

  it('Should retrieve detailed information for a specific application run by run ID', async ({
    annotate,
  }) => {
    await annotate('SWR-APP-RUN-MGMT-DETAILS', 'tests');
    await annotate('TC-RUN-DETAILS', 'id');

    const { stdout: runDetailsStdout, exitCode: runDetailsExitCode } = await executeCLI([
      'runs',
      'get',
      runId,
      '--format',
      'json',
    ]);

    expect(runDetailsExitCode).toBe(0);

    const runDetails = JSON.parse(String(runDetailsStdout)) as RunReadResponse;
    expect(runDetails.run_id).toBe(runId);
    expect(runDetails.application_id).toBe('test-app');
  });

  it('Should cancel a running or queued application run by run ID', async ({ annotate }) => {
    await annotate('SWR-APP-RUN-MGMT-CANCEL', 'tests');
    await annotate('TC-RUN-CANCEL', 'id');

    const { stdout: cancelRunStdout, exitCode: cancelRunExitCode } = await executeCLI([
      'runs',
      'cancel',
      runId,
    ]);

    expect(cancelRunExitCode).toBe(0);

    expect(cancelRunStdout).toContain(`✅ Successfully cancelled application run: ${runId}`);
  });
});
