import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { ItemResultReadResponse, RunReadResponse } from '@aignostics/sdk';

describe('Application Results Access', () => {
  it('Should retrieve items and their associated output artifacts for a specified application run by run ID @tests:SWR-APP-RESULTS-RETRIEVE-ITEMS', async () => {
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

    const { stdout: runResultsStdout, exitCode: runResultsExitCode } = await executeCLI([
      'list-run-results',
      latestRunId,
    ]);

    expect(runResultsExitCode).toBe(0);

    const runResultsMatch = String(runResultsStdout).match(
      new RegExp(`Run results for ${latestRunId}: (\\[.*\\])`, 's')
    );
    expect(runResultsMatch).toBeTruthy();

    const runResults = JSON.parse(runResultsMatch![1]) as RunReadResponse[];
    expect(Array.isArray(runResults)).toBe(true);
  });

  it('Should provide execution state, output availability, termination status, and error details for each item @tests:SWR-APP-RESULTS-ITEM-STATUS @tests:SWR-APP-RESULTS-ARTIFACT-STATUS', async () => {
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

    const { stdout: runResultsStdout, exitCode: runResultsExitCode } = await executeCLI([
      'list-run-results',
      latestRunId,
    ]);

    expect(runResultsExitCode).toBe(0);

    const runResultsMatch = String(runResultsStdout).match(
      new RegExp(`Run results for ${latestRunId}: (\\[.*\\])`, 's')
    );
    expect(runResultsMatch).toBeTruthy();

    const runResults = JSON.parse(runResultsMatch![1]) as ItemResultReadResponse[];

    runResults.forEach(result => {
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('termination_reason');
      expect(result).toHaveProperty('error_message');
      expect(result).toHaveProperty('error_code');

      result.output_artifacts.forEach(artifact => {
        expect(artifact).toHaveProperty('state');
        expect(artifact).toHaveProperty('termination_reason');
        expect(artifact).toHaveProperty('download_url');
        expect(result).toHaveProperty('error_message');
        expect(result).toHaveProperty('error_code');
      });
    });
  });

  it('Should return an error when uuid is not valid @tests:SWR-ERROR-COMM-MESSAGES @tests:SWR-ERROR-COMM-CLI-OUTPUT', async () => {
    const { stderr, exitCode } = await executeCLI(['list-run-results', 'non-existent-run-id'], {
      reject: false,
    });

    // Verify error written to stderr
    expect(stderr).toMatch(/API_ERROR/);
    expect(stderr).toMatch(/Validation error/);

    // Verify machine-readable operation status (non-zero exit code)
    expect(exitCode).not.toBe(0);
  });
});
