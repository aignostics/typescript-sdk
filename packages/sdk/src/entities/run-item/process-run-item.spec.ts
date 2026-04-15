import { describe, it, expect } from 'vitest';
import { processRunItem } from './process-run-item.js';
import type { ItemResultReadResponse } from '../../generated/index.js';

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
    input_artifacts: [],
    output_artifacts: [],
  } as ItemResultReadResponse;
}

describe('processRunItem', () => {
  it('should preserve all original ItemResultReadResponse fields', () => {
    const raw = buildItem({ state: 'PENDING' });
    const result = processRunItem(raw);

    expect(result.item_id).toBe(raw.item_id);
    expect(result.external_id).toBe(raw.external_id);
    expect(result.state).toBe(raw.state);
    expect(result.output_artifacts).toEqual(raw.output_artifacts);
  });

  it('should add status and can_download for a PENDING item', () => {
    const result = processRunItem(buildItem({ state: 'PENDING' }));

    expect(result.status).toBe('PENDING');
    expect(result.can_download).toBe(false);
  });

  it('should add status and can_download for a PROCESSING item', () => {
    const result = processRunItem(buildItem({ state: 'PROCESSING' }));

    expect(result.status).toBe('PROCESSING');
    expect(result.can_download).toBe(false);
  });

  it('should mark a successfully terminated item as COMPLETED and downloadable', () => {
    const result = processRunItem(
      buildItem({ state: 'TERMINATED', termination_reason: 'SUCCEEDED' })
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.can_download).toBe(true);
  });

  it('should mark a SYSTEM_ERROR terminated item as FAILED and not downloadable', () => {
    const result = processRunItem(
      buildItem({ state: 'TERMINATED', termination_reason: 'SYSTEM_ERROR' })
    );

    expect(result.status).toBe('FAILED');
    expect(result.can_download).toBe(false);
  });

  it('should mark a USER_ERROR terminated item as FAILED and not downloadable', () => {
    const result = processRunItem(
      buildItem({ state: 'TERMINATED', termination_reason: 'USER_ERROR' })
    );

    expect(result.status).toBe('FAILED');
    expect(result.can_download).toBe(false);
  });

  it('should mark a SKIPPED terminated item as SKIPPED and not downloadable', () => {
    const result = processRunItem(
      buildItem({ state: 'TERMINATED', termination_reason: 'SKIPPED' })
    );

    expect(result.status).toBe('SKIPPED');
    expect(result.can_download).toBe(false);
  });
});
