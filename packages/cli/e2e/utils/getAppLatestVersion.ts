import { ApplicationVersion } from '@aignostics/sdk';
import { executeCLI } from './command.js';

export const getAppLatestVersion = async (applicationId: string) => {
  const { stdout } = await executeCLI([
    'applications',
    'versions',
    'list',
    applicationId,
    '--format',
    'json',
  ]);

  const versions = JSON.parse(String(stdout)) as Array<ApplicationVersion>;

  return versions[0]?.number;
};
