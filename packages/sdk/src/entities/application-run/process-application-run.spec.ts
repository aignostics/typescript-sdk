import { describe, it, expect } from 'vitest';
import { processApplicationRun } from './process-application-run.js';
import type { RunReadResponse } from '../../generated/index.js';

function buildRun(
  overrides: Partial<Pick<RunReadResponse, 'state' | 'termination_reason' | 'output'>> & {
    statistics?: Partial<RunReadResponse['statistics']>;
  } = {}
): RunReadResponse {
  return {
    run_id: 'run-1',
    application_id: 'app-1',
    version_number: '1.0.0',
    state: overrides.state ?? 'PENDING',
    output: overrides.output ?? 'NONE',
    termination_reason: overrides.termination_reason ?? null,
    error_code: null,
    error_message: null,
    submitted_at: '2026-01-01T00:00:00Z',
    submitted_by: 'user-1',
    statistics: {
      item_count: 0,
      item_pending_count: 0,
      item_processing_count: 0,
      item_user_error_count: 0,
      item_system_error_count: 0,
      item_skipped_count: 0,
      item_succeeded_count: 0,
      ...overrides.statistics,
    },
  } as RunReadResponse;
}

describe('processApplicationRun', () => {
  it('should preserve all original RunReadResponse fields', () => {
    const raw = buildRun({ state: 'PENDING' });
    const result = processApplicationRun(raw);

    expect(result.run_id).toBe(raw.run_id);
    expect(result.application_id).toBe(raw.application_id);
    expect(result.version_number).toBe(raw.version_number);
    expect(result.state).toBe(raw.state);
    expect(result.statistics).toEqual(raw.statistics);
  });

  it('should add progress property for a PENDING run with no items', () => {
    const result = processApplicationRun(buildRun({ state: 'PENDING' }));
    expect(result.progress).toBe(0);
  });

  it('should add status property for a PENDING run', () => {
    const result = processApplicationRun(buildRun({ state: 'PENDING' }));
    expect(result.status).toBe('PENDING');
  });

  it('should add can_download property for a PENDING run', () => {
    const result = processApplicationRun(buildRun({ state: 'PENDING' }));
    expect(result.can_download).toBe(false);
  });

  it('should compute correct values for a completed run', () => {
    const raw = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      output: 'FULL',
      statistics: { item_count: 10, item_succeeded_count: 10 },
    });
    const result = processApplicationRun(raw);

    expect(result.progress).toBe(100);
    expect(result.status).toBe('COMPLETED');
    expect(result.can_download).toBe(true);
  });

  it('should compute correct values for a run completed with errors', () => {
    const raw = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      output: 'PARTIAL',
      statistics: {
        item_count: 10,
        item_succeeded_count: 7,
        item_user_error_count: 3,
      },
    });
    const result = processApplicationRun(raw);

    expect(result.progress).toBe(100);
    expect(result.status).toBe('COMPLETED_WITH_ERRORS');
    expect(result.can_download).toBe(true);
  });

  it('should compute correct values for a canceled run', () => {
    const raw = buildRun({
      state: 'TERMINATED',
      termination_reason: 'CANCELED_BY_USER',
      statistics: {
        item_count: 10,
        item_succeeded_count: 3,
      },
    });
    const result = processApplicationRun(raw);

    expect(result.progress).toBe(30);
    expect(result.status).toBe('CANCELED');
    expect(result.can_download).toBe(false);
  });

  it('should compute correct values for a processing run', () => {
    const raw = buildRun({
      state: 'PROCESSING',
      statistics: {
        item_count: 20,
        item_succeeded_count: 8,
        item_processing_count: 4,
        item_pending_count: 8,
      },
    });
    const result = processApplicationRun(raw);

    expect(result.progress).toBe(40);
    expect(result.status).toBe('PROCESSING');
    expect(result.can_download).toBe(false);
  });
});
