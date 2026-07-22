import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { ItemResultReadResponse, RunReadResponse } from '@aignostics/sdk';

describe('Application Results Access', () => {
  it('Should retrieve items and their associated output artifacts for a specified application run by run ID', async ({
    annotate,
  }) => {
    await annotate('SWR-APP-RESULTS-RETRIEVE-ITEMS', 'tests');
    await annotate('TC-RESULTS-RETRIEVE', 'id');

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

    const { stdout: runResultsStdout, exitCode: runResultsExitCode } = await executeCLI([
      'runs',
      'results',
      'list',
      latestRunId,
      '--format',
      'json',
    ]);

    expect(runResultsExitCode).toBe(0);

    const runResults = JSON.parse(String(runResultsStdout)) as RunReadResponse[];
    expect(Array.isArray(runResults)).toBe(true);
  });

  it('Should provide execution state, output availability, termination status, and error details for each item', async ({
    annotate,
  }) => {
    await annotate('SWR-APP-RESULTS-ITEM-STATUS', 'tests');
    await annotate('SWR-APP-RESULTS-ARTIFACT-STATUS', 'tests');
    await annotate('TC-RESULTS-STATUS', 'id');

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

    const { stdout: runResultsStdout, exitCode: runResultsExitCode } = await executeCLI([
      'runs',
      'results',
      'list',
      latestRunId,
      '--format',
      'json',
    ]);

    expect(runResultsExitCode).toBe(0);

    const runResults = JSON.parse(String(runResultsStdout)) as ItemResultReadResponse[];

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

  it('Should return an error when uuid is not valid', async ({ annotate }) => {
    await annotate('SWR-ERROR-COMM-MESSAGES', 'tests');
    await annotate('SWR-ERROR-COMM-CLI-OUTPUT', 'tests');
    await annotate('TC-RESULTS-INVALID-UUID', 'id');

    const { stderr, exitCode } = await executeCLI(
      ['runs', 'results', 'list', 'non-existent-run-id'],
      {
        reject: false,
      }
    );

    // Verify error written to stderr
    expect(stderr).toMatch(/API_ERROR/);
    expect(stderr).toMatch(/Validation error/);

    // Verify machine-readable operation status (non-zero exit code)
    expect(exitCode).not.toBe(0);
  });
});
