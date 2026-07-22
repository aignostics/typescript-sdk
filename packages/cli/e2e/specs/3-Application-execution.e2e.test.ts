import { describe, it, expect } from "vitest";
import { executeCLI } from "../utils/command.js";
import { generateInputArtifactsForTest } from "../utils/getAppInputArtifacts.js";
import { getAppLatestVersion } from "../utils/getAppLatestVersion.js";

describe("SWR Application Execution access", async () => {
  const latestVersion = await getAppLatestVersion("test-app");

  it("Should create application runs with specified application version, input items, and item- and run metadata and return a unique run identifier upon successful creation.", async ({
    annotate,
  }) => {
    await annotate("SWR-APP-EXEC-RUN-CREATION", "tests");
    await annotate("SWR-APP-EXEC-INPUT-ARTIFACT", "tests");
    await annotate("TC-RUN-CREATE", "id");

    const items = await generateInputArtifactsForTest(
      "test-app",
      latestVersion,
      2,
    );

    const { stdout, exitCode } = await executeCLI([
      "runs",
      "create",
      "test-app",
      "1.0.0",
      "--items",
      JSON.stringify(items),
      "--format",
      "json",
    ]);

    expect(exitCode).toBe(0);

    const runDetails = JSON.parse(String(stdout)) as { run_id: string };

    expect(runDetails).toHaveProperty("run_id");
  });

  it("Should return an error on on non-existent version", async ({
    annotate,
  }) => {
    await annotate("SWR-ERROR-COMM-DIAGNOSTIC-CONTEXT", "tests");
    await annotate("SWR-ERROR-COMM-CLI-OUTPUT", "tests");
    await annotate("TC-RUN-CREATE-INVALID-VERSION", "id");

    const items = await generateInputArtifactsForTest(
      "test-app",
      latestVersion,
      2,
    );

    const { stderr, exitCode } = await executeCLI(
      ["runs", "create", "test-app", "2.0.0", "--items", JSON.stringify(items)],
      { reject: false },
    );

    // Verify error written to stderr
    expect(stderr).toMatch(/API_ERROR/);
    expect(stderr).toMatch(/application version not found/);

    // Verify machine-readable operation status (non-zero exit code)
    expect(exitCode).not.toBe(0);
  });

  it("Should return an error on missing arguments", async ({ annotate }) => {
    await annotate("SWR-ERROR-COMM-MESSAGES", "tests");
    await annotate("TC-RUN-CREATE-MISSING-ARGS", "id");

    const { stderr } = await executeCLI(["runs", "create"], { reject: false });
    expect(stderr).toContain(
      "❌ Not enough non-option arguments: got 0, need at least 2",
    );
  });

  it("Should validate items before submission", async ({ annotate }) => {
    await annotate("SWR-APP-EXEC-REQUEST-VALIDATION", "tests");
    await annotate("SWR-ERROR-COMM-MESSAGES", "tests");
    await annotate("TC-RUN-CREATE-INVALID-JSON", "id");

    const { stderr } = await executeCLI(
      ["runs", "create", "test-app", latestVersion, "--items", "invalid-json"],
      { reject: false },
    );
    expect(stderr).toContain("❌ Invalid items JSON:");
  });
});
