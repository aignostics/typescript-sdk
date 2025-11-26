/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';
import { getAppInputArtifacts, generateSampleMetadata } from '../utils/getAppInputArtifacts.js';

describe('SWR Application Execution access', () => {
  it('Should create application runs with specified application version, input items, and item- and run metadata and return a unique run identifier upon successful creation.', async () => {
    const { stdout, exitCode } = await executeCLI([
      'create-run',
      'test-app',
      '0.99.0',
      '--items',
      JSON.stringify([
        {
          external_id: 'slide_1',
          input_artifacts: [
            {
              name: 'whole_slide_image',
              download_url: 'https://...',
              metadata: {
                specimen: {
                  disease: 'LUNG_CANCER',
                  tissue: 'LUNG',
                },
                staining_method: 'H&E',
                width_px: 136223,
                height_px: 87761,
                resolution_mpp: 0.2628238,
                checksum_base64_crc32c: '64RKKA==',
              },
            },
          ],
        },
        {
          external_id: 'slide_2',
          input_artifacts: [
            {
              name: 'whole_slide_image',
              download_url: 'https://...',
              metadata: {
                specimen: {
                  disease: 'LUNG_CANCER',
                  tissue: 'LUNG',
                },
                staining_method: 'H&E',
                width_px: 136223,
                height_px: 87761,
                resolution_mpp: 0.2628238,
                checksum_base64_crc32c: '64RKKA==',
              },
            },
          ],
        },
      ]),
    ]);

    expect(exitCode).toBe(0);

    // Match the JSON object after the prefix
    const runDetails = String(stdout).match(/Application run created successfully: (\{[\s\S]*\})/);
    expect(runDetails).toBeTruthy();

    const runId = JSON.parse(runDetails![1]);

    expect(runId).toHaveProperty('run_id');
  });

  it('Should validate items before submission', async () => {
    const { stderr } = await executeCLI(
      ['create-run', 'test-app', '0.99.0', '--items', 'invalid-json'],
      { reject: false }
    );
    expect(stderr).toContain('❌ Invalid items JSON:');
  });
});
