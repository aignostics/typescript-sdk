import { describe, it, expect } from 'vitest';
import { getRunProgress, getRunStatus, canDownloadRunItems } from './utils.js';
import type { RunReadResponse } from '../../generated/index.js';

/**
 * Helper to build a minimal RunReadResponse with sensible defaults.
 * Only the fields used by the utility functions need to be realistic.
 */
function buildRun(
  overrides: Partial<Pick<RunReadResponse, 'state' | 'termination_reason'>> & {
    statistics?: Partial<RunReadResponse['statistics']>;
  } = {}
): RunReadResponse {
  return {
    run_id: 'run-1',
    application_id: 'app-1',
    version_number: '1.0.0',
    state: overrides.state ?? 'PENDING',
    output: 'NONE',
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

describe('getRunProgress', () => {
  it('should return 0 when item_count is 0', () => {
    const run = buildRun({ statistics: { item_count: 0 } });
    expect(getRunProgress(run)).toBe(0);
  });

  it('should return 100 when all items succeeded', () => {
    const run = buildRun({
      statistics: { item_count: 10, item_succeeded_count: 10 },
    });
    expect(getRunProgress(run)).toBe(100);
  });

  it('should return 50 when half the items are processed', () => {
    const run = buildRun({
      statistics: { item_count: 10, item_succeeded_count: 5 },
    });
    expect(getRunProgress(run)).toBe(50);
  });

  it('should include user errors in the processed count', () => {
    const run = buildRun({
      statistics: { item_count: 10, item_user_error_count: 3, item_succeeded_count: 7 },
    });
    expect(getRunProgress(run)).toBe(100);
  });

  it('should include system errors in the processed count', () => {
    const run = buildRun({
      statistics: { item_count: 4, item_system_error_count: 2, item_succeeded_count: 1 },
    });
    expect(getRunProgress(run)).toBe(75);
  });

  it('should include skipped items in the processed count', () => {
    const run = buildRun({
      statistics: { item_count: 5, item_skipped_count: 2, item_succeeded_count: 3 },
    });
    expect(getRunProgress(run)).toBe(100);
  });

  it('should round to the nearest integer', () => {
    // 1/3 = 33.33...% → 33
    const run = buildRun({
      statistics: { item_count: 3, item_succeeded_count: 1 },
    });
    expect(getRunProgress(run)).toBe(33);
  });

  it('should combine all terminal item types', () => {
    const run = buildRun({
      statistics: {
        item_count: 20,
        item_succeeded_count: 5,
        item_user_error_count: 3,
        item_system_error_count: 2,
        item_skipped_count: 4,
      },
    });
    // (5 + 3 + 2 + 4) / 20 = 14/20 = 70%
    expect(getRunProgress(run)).toBe(70);
  });
});

describe('getRunStatus', () => {
  it('should return PENDING when state is PENDING', () => {
    const run = buildRun({ state: 'PENDING' });
    expect(getRunStatus(run)).toBe('PENDING');
  });

  it('should return PROCESSING when state is PROCESSING', () => {
    const run = buildRun({ state: 'PROCESSING' });
    expect(getRunStatus(run)).toBe('PROCESSING');
  });

  it('should return CANCELED when terminated by user', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'CANCELED_BY_USER',
    });
    expect(getRunStatus(run)).toBe('CANCELED');
  });

  it('should return FAILED when terminated by system', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'CANCELED_BY_SYSTEM',
    });
    expect(getRunStatus(run)).toBe('FAILED');
  });

  it('should return COMPLETED when all items succeeded', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      statistics: { item_count: 10, item_succeeded_count: 10 },
    });
    expect(getRunStatus(run)).toBe('COMPLETED');
  });

  it('should return COMPLETED_WITH_ERRORS when not all items succeeded', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      statistics: { item_count: 10, item_succeeded_count: 7 },
    });
    expect(getRunStatus(run)).toBe('COMPLETED_WITH_ERRORS');
  });

  it('should return COMPLETED_WITH_ERRORS when some items had errors', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      statistics: {
        item_count: 10,
        item_succeeded_count: 8,
        item_user_error_count: 2,
      },
    });
    expect(getRunStatus(run)).toBe('COMPLETED_WITH_ERRORS');
  });
});

describe('canDownloadRunItems', () => {
  it('should return false for PENDING runs', () => {
    const run = buildRun({ state: 'PENDING' });
    expect(canDownloadRunItems(run)).toBe(false);
  });

  it('should return false for PROCESSING runs', () => {
    const run = buildRun({ state: 'PROCESSING' });
    expect(canDownloadRunItems(run)).toBe(false);
  });

  it('should return false for CANCELED runs', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'CANCELED_BY_USER',
    });
    expect(canDownloadRunItems(run)).toBe(false);
  });

  it('should return false for FAILED runs', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'CANCELED_BY_SYSTEM',
    });
    expect(canDownloadRunItems(run)).toBe(false);
  });

  it('should return true for COMPLETED runs', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      statistics: { item_count: 5, item_succeeded_count: 5 },
    });
    expect(canDownloadRunItems(run)).toBe(true);
  });

  it('should return true for COMPLETED_WITH_ERRORS runs', () => {
    const run = buildRun({
      state: 'TERMINATED',
      termination_reason: 'ALL_ITEMS_PROCESSED',
      statistics: { item_count: 5, item_succeeded_count: 3 },
    });
    expect(canDownloadRunItems(run)).toBe(true);
  });
});
