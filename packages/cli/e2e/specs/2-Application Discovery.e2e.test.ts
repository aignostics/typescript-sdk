/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect } from 'vitest';
import { executeCLI } from '../utils/command.js';

type Application = {
  application_id: string;
  name: string;
  regulatory_classes: string[];
  description: string;
  latest_version: {
    number: string;
    released_at: string;
  };
};

type ApplicationVersion = {
  number: string;
  released_at: string;
};

describe('SWR Application List Retrieval', () => {
  it('should retrieve all available applications for authenticated user', async () => {
    const { stdout, exitCode } = await executeCLI(['list-applications']);

    expect(exitCode).toBe(0);

    // Parse the applications from the output
    const output = String(stdout);
    const applicationsMatch = output.match(/Applications: (\[.*\])/s);
    expect(applicationsMatch).toBeTruthy();

    const applications = JSON.parse(applicationsMatch![1]) as Array<Application>;
    expect(Array.isArray(applications)).toBe(true);
  });
});

describe('SWR Application Details', () => {
  it('should provide application identification, description, and regulatory compliance information', async () => {
    const { stdout, exitCode } = await executeCLI(['list-applications']);

    expect(exitCode).toBe(0);

    // Parse the applications from the output
    const output = String(stdout);
    const applicationsMatch = output.match(/Applications: (\[.*\])/s);
    expect(applicationsMatch).toBeTruthy();

    const applications = JSON.parse(applicationsMatch![1]) as Array<Application>;
    expect(Array.isArray(applications)).toBe(true);

    // Find test-app in the list
    const testApp = applications.find(app => app.application_id === 'test-app');
    expect(testApp).toBeDefined();

    // Assert test-app properties
    expect(testApp).toMatchObject({
      application_id: 'test-app',
      name: 'test-app',
      regulatory_classes: expect.arrayContaining([expect.any(String)]),
      description: expect.any(String),
    });
  });
});

describe('SWR Version List Retrieval', () => {
  it('should retrieve all versions for a specified application', async () => {
    const { stdout, exitCode } = await executeCLI(['list-application-versions', 'test-app']);

    expect(exitCode).toBe(0);

    // Parse the versions from the output
    const output = String(stdout);
    const versionsMatch = output.match(/Application versions for test-app: (\[.*\])/s);
    expect(versionsMatch).toBeTruthy();

    const versions = JSON.parse(versionsMatch![1]) as Array<ApplicationVersion>;
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);

    // Verify each version has required properties
    versions.forEach(version => {
      expect(version).toHaveProperty('number');
      expect(version).toHaveProperty('released_at');
      expect(version.number).toMatch(/\d+\.\d+\.\d+/);
      expect(version.released_at).toMatch(
        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z$/
      );
    });
  });
});
