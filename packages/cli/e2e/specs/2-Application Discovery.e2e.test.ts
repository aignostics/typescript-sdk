/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect } from "vitest";
import { executeCLI } from "../utils/command.js";

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

describe("SWR Application List Retrieval", () => {
  it("should retrieve all available applications for authenticated user", async ({
    annotate,
  }) => {
    await annotate("SWR-APP-DISCOVERY-LIST", "tests");
    await annotate("TC-APP-LIST", "id");

    const { stdout, exitCode } = await executeCLI([
      "applications",
      "list",
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(0);

    const applications = JSON.parse(String(stdout)) as Array<Application>;
    expect(Array.isArray(applications)).toBe(true);
  });
});

describe("SWR Application Details", () => {
  it("should provide application identification, description, and regulatory compliance information", async ({
    annotate,
  }) => {
    await annotate("SWR-APP-DISCOVERY-VERSION-DETAILS", "tests");
    await annotate("TC-APP-DETAILS", "id");

    const { stdout, exitCode } = await executeCLI([
      "applications",
      "list",
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(0);

    const applications = JSON.parse(String(stdout)) as Array<Application>;
    expect(Array.isArray(applications)).toBe(true);

    // Find test-app in the list
    const testApp = applications.find(
      (app) => app.application_id === "test-app",
    );
    expect(testApp).toBeDefined();

    // Assert test-app properties
    expect(testApp).toMatchObject({
      application_id: "test-app",
      name: "Test Application",
      regulatory_classes: expect.arrayContaining([expect.any(String)]),
      description: expect.any(String),
    });
  });
});

describe("SWR Version List Retrieval", () => {
  it("should retrieve all versions for a specified application", async ({
    annotate,
  }) => {
    await annotate("SWR-APP-DISCOVERY-VERSION-LIST", "tests");
    await annotate("SWR-APP-DISCOVERY-DETAILS", "tests");
    await annotate("TC-VERSION-LIST", "id");

    const { stdout, exitCode } = await executeCLI([
      "applications",
      "versions",
      "list",
      "test-app",
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(0);

    const versions = JSON.parse(String(stdout)) as Array<ApplicationVersion>;
    expect(Array.isArray(versions)).toBe(true);
    expect(versions.length).toBeGreaterThan(0);

    // Verify each version has required properties
    versions.forEach((version) => {
      expect(version).toHaveProperty("number");
      expect(version).toHaveProperty("released_at");
      expect(version.number).toMatch(/\d+\.\d+\.\d+/);
      expect(version.released_at).toMatch(
        /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?Z$/,
      );
    });
  });

  it("should return an error when the app does not exist", async ({
    annotate,
  }) => {
    await annotate("TC-VERSION-LIST-NOT-FOUND", "id");

    const { stderr } = await executeCLI(
      ["applications", "versions", "list", "non-existent-app"],
      {
        reject: false,
      },
    );

    expect(stderr).toMatch(/API_ERROR'/);
    expect(stderr).toMatch(/application not found/);
  });
});

describe("SWR Specific Version Details", () => {
  it("should provide details for a specific application version", async ({
    annotate,
  }) => {
    await annotate("SWR-APP-DISCOVERY-VERSION-DETAILS", "tests");
    await annotate("TC-VERSION-DETAILS", "id");

    const { stdout, exitCode } = await executeCLI([
      "applications",
      "versions",
      "get",
      "test-app",
      "1.0.0",
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(0);

    const versionDetails = JSON.parse(String(stdout));
    expect(versionDetails).toMatchObject({
      version_number: "1.0.0",
      changelog: expect.any(String),
      input_artifacts: expect.any(Array),
    });
  });

  it("should return an error for non-existent application version", async ({
    annotate,
  }) => {
    await annotate("SWR-ERROR-COMM-DIAGNOSTIC-CONTEXT", "tests");
    await annotate("SWR-ERROR-COMM-CLASSIFICATION", "tests");
    await annotate("TC-VERSION-DETAILS-NOT-FOUND", "id");

    const { stderr } = await executeCLI(
      ["applications", "versions", "get", "test-app", "2.0.0"],
      {
        reject: false,
      },
    );
    expect(stderr).toMatch(/API_ERROR/);
    expect(stderr).toMatch(/Application version not found/);
  });
});
