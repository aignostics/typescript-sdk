import { describe, it, expect } from 'vitest';
import { getItemStatus, canDownloadItem } from './utils.js';
import type { ItemResultReadResponse } from '../../generated/index.js';

/**
 * Helper to build a minimal ItemResultReadResponse with sensible defaults.
 * Only the fields used by the utility functions need to be realistic.
 */
function buildItem(
  overrides: Partial<Pick<ItemResultReadResponse, 'state' | 'termination_reason'>> = {}
): ItemResultReadResponse {
  return {
    item_id: 'item-1',
    external_id: 'slide_1',
    custom_metadata: null,
    state: overrides.state ?? 'PENDING',
    output: 'NONE',
    termination_reason: overrides.termination_reason ?? undefined,
    error_code: null,
    error_message: null,
    output_artifacts: [],
  } as ItemResultReadResponse;
}

describe('getItemStatus', () => {
  it('should return PENDING when state is PENDING', () => {
    expect(getItemStatus(buildItem({ state: 'PENDING' }))).toBe('PENDING');
  });

  it('should return PROCESSING when state is PROCESSING', () => {
    expect(getItemStatus(buildItem({ state: 'PROCESSING' }))).toBe('PROCESSING');
  });

  it('should return COMPLETED when terminated with SUCCEEDED', () => {
    expect(getItemStatus(buildItem({ state: 'TERMINATED', termination_reason: 'SUCCEEDED' }))).toBe(
      'COMPLETED'
    );
  });

  it('should return FAILED when terminated with SYSTEM_ERROR', () => {
    expect(
      getItemStatus(buildItem({ state: 'TERMINATED', termination_reason: 'SYSTEM_ERROR' }))
    ).toBe('FAILED');
  });

  it('should return FAILED when terminated with USER_ERROR', () => {
    expect(
      getItemStatus(buildItem({ state: 'TERMINATED', termination_reason: 'USER_ERROR' }))
    ).toBe('FAILED');
  });

  it('should return SKIPPED when terminated with SKIPPED', () => {
    expect(getItemStatus(buildItem({ state: 'TERMINATED', termination_reason: 'SKIPPED' }))).toBe(
      'SKIPPED'
    );
  });
});

describe('canDownloadItem', () => {
  it('should return false for PENDING items', () => {
    expect(canDownloadItem(buildItem({ state: 'PENDING' }))).toBe(false);
  });

  it('should return false for PROCESSING items', () => {
    expect(canDownloadItem(buildItem({ state: 'PROCESSING' }))).toBe(false);
  });

  it('should return true for COMPLETED items', () => {
    expect(
      canDownloadItem(buildItem({ state: 'TERMINATED', termination_reason: 'SUCCEEDED' }))
    ).toBe(true);
  });

  it('should return false for FAILED items (SYSTEM_ERROR)', () => {
    expect(
      canDownloadItem(buildItem({ state: 'TERMINATED', termination_reason: 'SYSTEM_ERROR' }))
    ).toBe(false);
  });

  it('should return false for FAILED items (USER_ERROR)', () => {
    expect(
      canDownloadItem(buildItem({ state: 'TERMINATED', termination_reason: 'USER_ERROR' }))
    ).toBe(false);
  });

  it('should return false for SKIPPED items', () => {
    expect(canDownloadItem(buildItem({ state: 'TERMINATED', termination_reason: 'SKIPPED' }))).toBe(
      false
    );
  });
});
