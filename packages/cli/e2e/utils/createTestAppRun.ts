import { executeCLI } from './command.js';
import { generateInputArtifactsForTest } from './getAppInputArtifacts.js';

/**
 * Creates a run of `test-app` on the given version and returns its ID, so a test that reads,
 * lists or cancels a run does not depend on runs left behind by earlier test runs.
 */
export const createTestAppRun = async (version: string) => {
  const items = await generateInputArtifactsForTest('test-app', version, 2);

  const { stdout } = await executeCLI([
    'runs',
    'create',
    'test-app',
    version,
    '--items',
    JSON.stringify(items),
    '--format',
    'json',
  ]);

  return (JSON.parse(String(stdout)) as { run_id: string }).run_id;
};
