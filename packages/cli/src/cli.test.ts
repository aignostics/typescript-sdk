import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { main } from "./cli.js";
import { factories, handlers, server } from "@aignostics/sdk/test";
import { http, HttpResponse } from "msw";
import { ZodError } from "zod";
import { Readable } from "stream";

// Mock process.exit to prevent test runner from exiting
const mockExit = vi.fn();
vi.stubGlobal("process", {
  ...process,
  exit: mockExit,
});

// Mock auth service to avoid real authentication
vi.mock("./utils/auth.js", () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    getValidAccessToken: vi.fn().mockResolvedValue("mock-token"),
    loginWithCallback: vi.fn().mockResolvedValue(""),
    completeLogin: vi.fn().mockResolvedValue(undefined),
    loginWithRefreshToken: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    getAuthState: vi.fn().mockResolvedValue({
      isAuthenticated: true,
      token: {
        type: "Bearer",
        scope: "openid profile email offline_access",
        expiresAt: new Date("2025-01-01T12:59:59.000Z"),
        storedAt: new Date("2024-12-01T10:00:00.000Z"),
      },
    }),
  })),
}));

// Mock OAuth callback server
vi.mock("./utils/oauth-callback-server.js", () => ({
  startCallbackServer: vi.fn().mockResolvedValue({
    address: vi.fn().mockReturnValue({ port: 8989 }),
    close: vi.fn(),
  }),
  waitForCallback: vi.fn().mockResolvedValue("test-auth-code"),
}));

// Mock crypto for login
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi
      .fn()
      .mockReturnValue(Buffer.from("test-code-verifier", "utf-8")),
  },
}));

describe("CLI Integration Tests", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  let originalArgv: string[];
  let originalStdin: typeof process.stdin;
  let originalStdinIsTTY: boolean | undefined;

  beforeEach(() => {
    // Store original argv
    originalArgv = process.argv;

    // Simulate an interactive terminal by default so `runs create` doesn't
    // try to read items from stdin (which would otherwise hang in tests).
    originalStdin = process.stdin;
    originalStdinIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = true;

    server.use(...handlers.success);

    // Mock console methods to avoid noise in tests
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore stdin
    process.stdin = originalStdin;
    process.stdin.isTTY = originalStdinIsTTY;

    // Restore original argv
    process.argv = originalArgv;
  });

  describe("info command", () => {
    it("should display SDK information", async () => {
      // Mock process.argv for yargs
      process.argv = ["node", "cli.js", "info"];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith("Aignostics Platform SDK");
      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Version:",
        "0.0.0-development",
      );
    });
  });

  describe("test-api command", () => {
    it("should test API connection successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "test-api",
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "✅ API connection successful",
      );
    });
  });

  describe("applications list command", () => {
    it("should list applications successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "applications",
        "list",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("application_id"),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("name"),
      );
    });
  });

  describe("applications get command", () => {
    it("should get application details successfully", async () => {
      const application = factories.application.build();
      server.use(
        http.get("*/v1/applications/:applicationId", () =>
          HttpResponse.json(application, { status: 200 }),
        ),
      );
      process.argv = [
        "node",
        "cli.js",
        "applications",
        "get",
        application.application_id,
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(application.application_id),
      );
    });

    it("should print error responses", async () => {
      const application = factories.application.build();
      server.use(
        http.get("*/v1/applications/:applicationId", () =>
          HttpResponse.error(),
        ),
      );
      process.argv = [
        "node",
        "cli.js",
        "applications",
        "get",
        application.application_id,
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Failed to get application details:"),
        expect.any(Error),
      );
    });
  });

  describe("applications versions list command", () => {
    it("should list application versions successfully", async () => {
      const application = factories.application.build();
      server.use(
        http.get("*/v1/applications/:applicationId", () =>
          HttpResponse.json(application, { status: 200 }),
        ),
      );
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "applications",
        "versions",
        "list",
        application.application_id,
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.toSatisfy(
          (str) =>
            typeof str === "string" &&
            application.versions.every((version) =>
              str.includes(version.number),
            ),
        ),
      );
    });

    it("should print error responses", async () => {
      const application = factories.application.build();
      server.use(
        http.get("*/v1/applications/:applicationId", () =>
          HttpResponse.error(),
        ),
      );
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "applications",
        "versions",
        "list",
        application.application_id,
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Failed to list application versions:"),
        expect.any(Error),
      );
    });
  });

  describe("applications versions get command", () => {
    it("should get application version details successfully", async () => {
      const application = factories.application.build();
      const version = application.versions[0];

      server.use(
        http.get(
          "*/v1/applications/:applicationId/versions/:versionNumber",
          () => HttpResponse.json(version, { status: 200 }),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "applications",
        "versions",
        "get",
        application.application_id,
        version.number,
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(version.number),
      );
    });

    it("should print error responses", async () => {
      const application = factories.application.build();
      const version = application.versions[0];

      server.use(
        http.get(
          "*/v1/applications/:applicationId/versions/:versionNumber",
          () => HttpResponse.error(),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "applications",
        "versions",
        "get",
        application.application_id,
        version.number,
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "❌ Failed to get application version details:",
        ),
        expect.any(Error),
      );
    });

    it("should require applicationId and versionNumber parameters", async () => {
      process.argv = ["node", "cli.js", "applications", "versions", "get"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs list command", () => {
    it("should list application runs successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("state"),
      );
    });

    it("should support filtering by applicationId", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--applicationId",
        "app1",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should support filtering by applicationVersion", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--applicationVersion",
        "v1.0.0",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });
  });

  describe("runs get command", () => {
    it("should get run details successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "get",
        "run-1",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("state"),
      );
    });

    it("should require applicationRunId parameter", async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ["node", "cli.js", "runs", "get"];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs cancel command", () => {
    it("should cancel run successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "cancel",
        "run-1",
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "✅ Successfully cancelled application run: run-1",
      );
    });

    it("should require applicationRunId parameter", async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ["node", "cli.js", "runs", "cancel"];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs results list command", () => {
    it("should list run results successfully", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "results",
        "list",
        "run-1",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("item_id"),
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("status"),
      );
    });

    it("should require applicationRunId parameter", async () => {
      // Mock process.argv for yargs - missing applicationRunId
      process.argv = ["node", "cli.js", "runs", "results", "list"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs results delete command", () => {
    it("should delete run results successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "results",
        "delete",
        "run-1",
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "✅ Successfully deleted results for run: run-1",
      );
    });

    it("should require applicationRunId parameter", async () => {
      process.argv = ["node", "cli.js", "runs", "results", "delete"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs metadata set command", () => {
    it("should update run custom metadata successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "metadata",
        "set",
        "run-1",
        '{"note":"reviewed"}',
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "✅ Updated custom metadata for run run-1:",
        expect.stringContaining("custom_metadata_checksum"),
      );
    });

    it("should require applicationRunId and customMetadata parameters", async () => {
      process.argv = ["node", "cli.js", "runs", "metadata", "set"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs items get command", () => {
    it("should get a single run item successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "items",
        "get",
        "run-1",
        "ext-1",
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "Run item details for run-1/ext-1:",
        expect.stringContaining("item_id"),
      );
    });

    it("should require applicationRunId and externalId parameters", async () => {
      process.argv = ["node", "cli.js", "runs", "items", "get"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs items metadata set command", () => {
    it("should update run item custom metadata successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "items",
        "metadata",
        "set",
        "run-1",
        "ext-1",
        '{"reviewed":true}',
        "--endpoint",
        "https://api.example.com",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "✅ Updated custom metadata for item run-1/ext-1:",
        expect.stringContaining("custom_metadata_checksum"),
      );
    });

    it("should require applicationRunId, externalId, and customMetadata parameters", async () => {
      process.argv = ["node", "cli.js", "runs", "items", "metadata", "set"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("runs create command", () => {
    it("should create application run successfully with empty items", async () => {
      // Mock process.argv for yargs
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--endpoint",
        "https://api.example.com",
        "--items",
        "[]",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should create application run successfully with default empty items", async () => {
      // Mock process.argv for yargs - without explicit --items parameter
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--endpoint",
        "https://api.example.com",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should require applicationId and versionNumber parameters", async () => {
      // Mock process.argv for yargs - missing applicationId and versionNumber
      process.argv = ["node", "cli.js", "runs", "create"];

      await main();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Not enough non-option arguments"),
      );
    });
  });

  describe("CLI argument parsing", () => {
    it("should handle version flag", async () => {
      // Mock process.argv for yargs
      process.argv = ["node", "cli.js", "--version"];

      // Mock process.exit to prevent actual exit
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      try {
        await main();
      } catch (error) {
        expect((error as Error).message).toContain("process.exit");
      }

      exitSpy.mockRestore();
    });

    it("should handle help flag", async () => {
      mockExit.mockImplementation(() => {});
      vi.stubGlobal("process", { ...process, exit: mockExit });
      // Mock process.argv for yargs
      process.argv = ["node", "cli.js", "--help"];

      await expect(main()).rejects.toThrow();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("Usage:"),
      );
    });

    it("should require a command", async () => {
      // Mock process.argv for yargs
      process.argv = ["node", "cli.js"];

      await main();

      // Check that process.exit(1) was called
      expect(mockExit).toHaveBeenCalledWith(1);

      // Check that the error was logged with custom message
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "You need at least one command before moving on",
        ),
      );
    });
  });

  describe("auth login command", () => {
    it("should login with refresh token when --refreshToken is provided", async () => {
      const refreshToken = "test-refresh-token-12345";

      process.argv = [
        "node",
        "cli.js",
        "auth",
        "login",
        "--refreshToken",
        refreshToken,
        "--environment",
        "production",
      ];

      await main();

      // Verify that loginWithRefreshToken was called (it's mocked in the AuthService mock above)
      // Since we're mocking the entire AuthService, we need to verify the command executed without errors
      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe("environment validation", () => {
    it("should accept valid production environment", async () => {
      process.argv = ["node", "cli.js", "info", "--environment", "production"];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith("Aignostics Platform SDK");
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("should accept valid staging environment", async () => {
      process.argv = ["node", "cli.js", "info", "--environment", "staging"];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith("Aignostics Platform SDK");
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("should reject invalid environment", async () => {
      process.argv = [
        "node",
        "cli.js",
        "test-api",
        "--environment",
        "invalid-env",
      ];

      try {
        await main();
      } catch (error) {
        // Error is expected when validation fails
        expect((error as ZodError).message).toMatch(
          /Invalid option: expected one of "production"|"staging"|"develop"/,
        );
      }

      // Verify that an error was logged and process exited
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should use production as default environment", async () => {
      process.argv = ["node", "cli.js", "info"];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith("Aignostics Platform SDK");
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it("should accept develop environment", async () => {
      process.argv = ["node", "cli.js", "info", "--environment", "develop"];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith("Aignostics Platform SDK");
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe("auth logout command", () => {
    it("should logout successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "logout",
        "--environment",
        "production",
      ];

      await main();

      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should logout from staging environment", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "logout",
        "--environment",
        "staging",
      ];

      await main();

      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe("auth status command", () => {
    it("should check authentication status successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "status",
        "--environment",
        "production",
      ];

      await main();

      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should check status for staging environment", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "status",
        "--environment",
        "staging",
      ];

      await main();

      expect(consoleSpy.error).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe("auth login command without refresh token", () => {
    it("should initiate login flow without refresh token", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "login",
        "--environment",
        "production",
      ];

      await main();

      // Login should complete without errors (mocked)
      expect(mockExit).not.toHaveBeenCalled();
    });

    it("should login with staging environment", async () => {
      process.argv = [
        "node",
        "cli.js",
        "auth",
        "login",
        "--environment",
        "staging",
      ];

      await main();

      expect(mockExit).not.toHaveBeenCalled();
    });
  });

  describe("runs list with options", () => {
    it("should support filtering by customMetadata", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--customMetadata",
        "$.key=value",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should support sort option", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--sort",
        '["run_id"]',
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should support multiple filters combined", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "list",
        "--applicationId",
        "app1",
        "--applicationVersion",
        "v1.0.0",
        "--sort",
        '["-submitted_at"]',
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });
  });

  describe("runs create with items", () => {
    it("should create application run with items", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--items",
        '[{"wsi_id": "wsi-123"}]',
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });

    it("should handle invalid items JSON", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--items",
        "not-valid-json",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Invalid items JSON:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle non-array items JSON", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--items",
        '{"wsi_id": "wsi-123"}',
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Invalid items JSON:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should reject combining --items and --items-file", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--items",
        "[]",
        "--itemsFile",
        "./items.json",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("mutually exclusive"),
      );
    });

    it("should create application run with items piped via stdin", async () => {
      const stdinStream = Readable.from([
        Buffer.from('[{"wsi_id": "wsi-456"}]'),
      ]) as unknown as typeof process.stdin;
      stdinStream.isTTY = false;
      process.stdin = stdinStream;

      process.argv = [
        "node",
        "cli.js",
        "runs",
        "create",
        "test-app",
        "v1.0.0",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("run_id"),
      );
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully for test-api", async () => {
      server.use(http.get("*/v1/applications", () => HttpResponse.error()));

      process.argv = ["node", "cli.js", "test-api"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ API connection failed:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs get", async () => {
      server.use(http.get("*/v1/runs/:runId", () => HttpResponse.error()));

      process.argv = ["node", "cli.js", "runs", "get", "run-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to get run:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs cancel", async () => {
      server.use(
        http.post("*/v1/runs/:runId/cancel", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "runs", "cancel", "run-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to cancel application run:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs results list", async () => {
      server.use(
        http.get("*/v1/runs/:runId/items", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "runs", "results", "list", "run-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to list run results:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs results delete", async () => {
      server.use(
        http.delete("*/v1/runs/:runId/artifacts", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "runs", "results", "delete", "run-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to delete run results:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs metadata set", async () => {
      server.use(
        http.put("*/v1/runs/:runId/custom-metadata", () =>
          HttpResponse.error(),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "runs",
        "metadata",
        "set",
        "run-1",
        "{}",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to update run metadata:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle invalid custom metadata JSON for runs metadata set", async () => {
      process.argv = [
        "node",
        "cli.js",
        "runs",
        "metadata",
        "set",
        "run-1",
        "not-json",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Invalid custom metadata JSON:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs items get", async () => {
      server.use(
        http.get("*/v1/runs/:runId/items/:externalId", () =>
          HttpResponse.error(),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "runs",
        "items",
        "get",
        "run-1",
        "ext-1",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to get run item:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs items metadata set", async () => {
      server.use(
        http.put("*/v1/runs/:runId/items/:externalId/custom-metadata", () =>
          HttpResponse.error(),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "runs",
        "items",
        "metadata",
        "set",
        "run-1",
        "ext-1",
        "{}",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to update run item metadata:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs list", async () => {
      server.use(http.get("*/v1/runs", () => HttpResponse.error()));

      process.argv = ["node", "cli.js", "runs", "list"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to list application runs:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("should handle API errors for runs create", async () => {
      server.use(http.post("*/v1/runs", () => HttpResponse.error()));

      process.argv = ["node", "cli.js", "runs", "create", "test-app", "v1.0.0"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to create application run:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("grants create command", () => {
    it("should create a grant successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "grants",
        "create",
        "--resourceType",
        "run",
        "--resourceId",
        "run-1",
        "--subjectType",
        "user",
        "--subjectEmail",
        "colleague@example.com",
        "--relation",
        "viewer",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("grant_id"),
      );
    });

    it("should handle API errors for grants create", async () => {
      server.use(http.post("*/v1/access/grants", () => HttpResponse.error()));

      process.argv = [
        "node",
        "cli.js",
        "grants",
        "create",
        "--resourceType",
        "run",
        "--resourceId",
        "run-1",
        "--subjectType",
        "user",
        "--relation",
        "viewer",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to create grant:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("grants list command", () => {
    it("should list grants successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "grants",
        "list",
        "--resourceId",
        "run-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("grant_id"),
      );
    });

    it("should handle API errors for grants list", async () => {
      server.use(http.get("*/v1/access/grants", () => HttpResponse.error()));

      process.argv = ["node", "cli.js", "grants", "list"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to list grants:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("grants get command", () => {
    it("should get grant details successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "grants",
        "get",
        "grant-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("grant_id"),
      );
    });

    it("should handle API errors for grants get", async () => {
      server.use(
        http.get("*/v1/access/grants/:grantId", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "grants", "get", "grant-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to get grant:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("grants revoke command", () => {
    it("should revoke a grant successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "grants",
        "revoke",
        "grant-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("grant_id"),
      );
    });

    it("should handle API errors for grants revoke", async () => {
      server.use(
        http.delete("*/v1/access/grants/:grantId", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "grants", "revoke", "grant-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to revoke grant:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("share-tokens create command", () => {
    it("should create a share token successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "share-tokens",
        "create",
        "--expiresAt",
        "2026-01-01T00:00:00Z",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("share_token"),
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "⚠️  Save the share_token value now — it will not be shown again.",
      );
    });

    it("should handle API errors for share-tokens create", async () => {
      server.use(
        http.post("*/v1/access/share-tokens", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "share-tokens", "create"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to create share token:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("share-tokens list command", () => {
    it("should list share tokens successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "share-tokens",
        "list",
        "--runId",
        "run-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("share_token_id"),
      );
    });

    it("should handle API errors for share-tokens list", async () => {
      server.use(
        http.get("*/v1/access/share-tokens", () => HttpResponse.error()),
      );

      process.argv = ["node", "cli.js", "share-tokens", "list"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to list share tokens:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("share-tokens get command", () => {
    it("should get share token details successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "share-tokens",
        "get",
        "share-token-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("share_token_id"),
      );
    });

    it("should handle API errors for share-tokens get", async () => {
      server.use(
        http.get("*/v1/access/share-tokens/:shareTokenId", () =>
          HttpResponse.error(),
        ),
      );

      process.argv = ["node", "cli.js", "share-tokens", "get", "share-token-1"];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to get share token:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("share-tokens revoke command", () => {
    it("should revoke a share token successfully", async () => {
      process.argv = [
        "node",
        "cli.js",
        "share-tokens",
        "revoke",
        "share-token-1",
        "--format",
        "json",
      ];

      await main();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining("share_token_id"),
      );
    });

    it("should handle API errors for share-tokens revoke", async () => {
      server.use(
        http.delete("*/v1/access/share-tokens/:shareTokenId", () =>
          HttpResponse.error(),
        ),
      );

      process.argv = [
        "node",
        "cli.js",
        "share-tokens",
        "revoke",
        "share-token-1",
      ];

      await main();

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "❌ Failed to revoke share token:",
        expect.any(Error),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("unknown command handling", () => {
    it("should handle unknown command", async () => {
      process.argv = ["node", "cli.js", "unknown-command"];

      await main();

      expect(mockExit).toHaveBeenCalledWith(1);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Unknown argument: unknown-command"),
      );
    });
  });
});
