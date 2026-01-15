import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { UserChoices } from "./prompts.js";

// Mock fs-extra before importing the module
const mockExistsSync = jest.fn<(path: string) => boolean>();
const mockEnsureDir = jest.fn<() => Promise<void>>();
const mockCopy = jest.fn<() => Promise<void>>();
const mockReadFile = jest.fn<() => Promise<string>>();
const mockWriteFile = jest.fn<() => Promise<void>>();

jest.unstable_mockModule("fs-extra", () => {
  const mockModule = {
    existsSync: mockExistsSync,
    ensureDir: mockEnsureDir,
    copy: mockCopy,
    readFile: mockReadFile,
    writeFile: mockWriteFile,
  };
  return {
    default: mockModule,
    ...mockModule,
  };
});

const mockExeca = jest.fn<() => Promise<{ stdout: string; stderr: string }>>();
jest.unstable_mockModule("execa", () => ({
  execa: mockExeca,
}));

const mockSpinner = {
  start: jest.fn(),
  stop: jest.fn(),
};
const mockCancel = jest.fn();

jest.unstable_mockModule("@clack/prompts", () => ({
  spinner: jest.fn(() => mockSpinner),
  cancel: mockCancel,
}));

// Import after mocking
const { createProject, getTsStrictnessDescription } = await import("./actions.js");

describe("getTsStrictnessDescription", () => {
  it("should return correct description for relaxed level", () => {
    const result = getTsStrictnessDescription("relaxed");
    expect(result).toBe("Relaxed (strict: false)");
  });

  it("should return correct description for moderate level", () => {
    const result = getTsStrictnessDescription("moderate");
    expect(result).toBe("Moderate (strict: true)");
  });

  it("should return correct description for strict level", () => {
    const result = getTsStrictnessDescription("strict");
    expect(result).toBe("Strict (maximum options)");
  });
});

describe("createProject", () => {
  const mockChoices: UserChoices = {
    projectName: "test-project",
    tsStrictness: "moderate",
    initGit: false,
  };

  /**
   * Helper function to setup existsSync mock for standard project creation scenarios.
   * @param {object} options - Configuration options
   * @param {boolean} options.projectExists - Whether the project directory already exists
   * @param {boolean} options.packageLockExists - Whether package-lock.json exists after npm install
   * @param {boolean} options.templatesInProduction - Whether templates exist in production path
   * @returns {void}
   */
  function setupExistsSyncMock(options: {
    projectExists: boolean;
    packageLockExists: boolean;
    templatesInProduction?: boolean;
  }): void {
    const { templatesInProduction = true } = options;
    mockExistsSync.mockImplementation((filePath: string) => {
      // Project directory check
      if (filePath.includes("test-project") && !filePath.includes("templates") && !filePath.includes("package-lock")) {
        return options.projectExists;
      }
      // Templates directory - production path check (dist/templates or similar without src/)
      if (filePath.includes("templates")) {
        // If path contains src/templates, it's development path - always return false for production check
        if (filePath.includes("src/templates") || filePath.includes("src\\templates")) {
          return false;
        }
        // Otherwise it's production path
        return templatesInProduction;
      }
      // package-lock.json check
      if (filePath.includes("package-lock.json")) {
        return options.packageLockExists;
      }
      return false;
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockExeca.mockResolvedValue({ stdout: "", stderr: "" });
    mockEnsureDir.mockResolvedValue(undefined);
    mockCopy.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue('{"name": "{{PROJECT_NAME}}"}');
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("should throw error if project directory already exists", async () => {
    setupExistsSyncMock({ projectExists: true, packageLockExists: false });

    // Mock process.exit to prevent actual exit
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(createProject(mockChoices)).rejects.toThrow("process.exit called");

    mockExit.mockRestore();
  });

  it("should create project structure with correct files", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    await createProject(mockChoices);

    // Verify ensureDir was called for src directory
    expect(mockEnsureDir).toHaveBeenCalled();

    // Verify copy was called for index.ts, gitignore, and tsconfig
    expect(mockCopy).toHaveBeenCalledTimes(3);

    // Verify package.json was written with project name replaced
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("should initialize git when initGit is true", async () => {
    const choicesWithGit: UserChoices = {
      ...mockChoices,
      initGit: true,
    };

    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    await createProject(choicesWithGit);

    // Verify git commands were called
    expect(mockExeca).toHaveBeenCalledWith("git", ["init"], expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith("git", ["add", "."], expect.any(Object));
    expect(mockExeca).toHaveBeenCalledWith(
      "git",
      ["commit", "-m", "Initial commit from express-ts-wizard"],
      expect.any(Object)
    );
  });

  it("should not initialize git when initGit is false", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    await createProject(mockChoices);

    // Verify git init was not called
    expect(mockExeca).not.toHaveBeenCalledWith("git", ["init"], expect.any(Object));
  });

  it("should replace project name placeholder in package.json", async () => {
    const templateContent = '{"name": "{{PROJECT_NAME}}", "version": "1.0.0"}';
    mockReadFile.mockResolvedValue(templateContent);

    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    await createProject(mockChoices);

    // Verify writeFile was called with replaced content
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("package.json"),
      '{"name": "test-project", "version": "1.0.0"}'
    );
  });

  it("should use correct tsconfig based on strictness level", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    const strictChoices: UserChoices = {
      ...mockChoices,
      tsStrictness: "strict",
    };

    await createProject(strictChoices);

    // Verify copy was called with strict.json tsconfig
    expect(mockCopy).toHaveBeenCalledWith(
      expect.stringContaining("strict.json"),
      expect.stringContaining("tsconfig.json")
    );
  });

  it("should throw error when package-lock.json is not generated", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: false });

    await expect(createProject(mockChoices)).rejects.toThrow(
      "package-lock.json was not generated"
    );
  });

  it("should use relaxed tsconfig when strictness is relaxed", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    const relaxedChoices: UserChoices = {
      ...mockChoices,
      tsStrictness: "relaxed",
    };

    await createProject(relaxedChoices);

    // Verify copy was called with relaxed.json tsconfig
    expect(mockCopy).toHaveBeenCalledWith(
      expect.stringContaining("relaxed.json"),
      expect.stringContaining("tsconfig.json")
    );
  });

  it("should use moderate tsconfig when strictness is moderate", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    await createProject(mockChoices);

    // Verify copy was called with moderate.json tsconfig
    expect(mockCopy).toHaveBeenCalledWith(
      expect.stringContaining("moderate.json"),
      expect.stringContaining("tsconfig.json")
    );
  });

  it("should use development templates path when production path does not exist", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true, templatesInProduction: false });

    await createProject(mockChoices);

    // Verify project was still created (using development path)
    expect(mockEnsureDir).toHaveBeenCalled();
    expect(mockCopy).toHaveBeenCalledTimes(3);
  });

  it("should use production templates path when it exists", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true, templatesInProduction: true });

    await createProject(mockChoices);

    // Verify project was created using production path
    expect(mockEnsureDir).toHaveBeenCalled();
    expect(mockCopy).toHaveBeenCalledTimes(3);
  });

  it("should throw error and stop spinner when copyProjectFiles fails", async () => {
    setupExistsSyncMock({ projectExists: false, packageLockExists: true });
    mockEnsureDir.mockRejectedValue(new Error("File system error"));

    await expect(createProject(mockChoices)).rejects.toThrow("File system error");

    // Verify spinner was stopped with error message
    expect(mockSpinner.stop).toHaveBeenCalledWith("Error creating structure");
  });

  it("should handle git initialization failure gracefully without throwing", async () => {
    const choicesWithGit: UserChoices = {
      ...mockChoices,
      initGit: true,
    };

    setupExistsSyncMock({ projectExists: false, packageLockExists: true });

    // Make git init fail
    mockExeca.mockImplementation((command: string) => {
      if (command === "git") {
        return Promise.reject(new Error("git not found"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Should not throw - git failure is handled gracefully
    await createProject(choicesWithGit);

    // Verify spinner was stopped with error message
    expect(mockSpinner.stop).toHaveBeenCalledWith("Error initializing Git (may not be installed)");
  });
});
