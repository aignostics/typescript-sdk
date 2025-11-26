import { ApplicationVersion } from '@aignostics/sdk';
import { executeCLI } from './command.js';

export const getAppLatestVersion = async (applicationId: string) => {
  const { stdout } = await executeCLI(['list-application-versions', applicationId]);

  // Parse the versions from the output
  const output = String(stdout);
  const versionsMatch = output.match(
    new RegExp(`Application versions for ${applicationId}: (\\[.*\\])`, 's')
  );

  if (!versionsMatch) {
    throw new Error('Failed to retrieve application versions.');
  }
  const versions = JSON.parse(versionsMatch[1] || '[]') as Array<ApplicationVersion>;

  return versions[0]?.number;
};
