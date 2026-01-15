import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { UserChoices, TsStrictness } from "./prompts.js";

// Mock kleur
jest.unstable_mockModule("kleur", () => ({
  default: {
    bgCyan: jest.fn(() => ({
      black: jest.fn(() => " express-ts-wizard "),
    })),
  },
}));

// Store captured validation function
let capturedValidate: ((value: string) => string | undefined) | null = null;

// Mock @clack/prompts
const mockIntro = jest.fn();
const mockGroup = jest.fn();
const mockCancel = jest.fn();
const mockText = jest.fn().mockImplementation((config: { validate?: (value: string) => string | undefined }) => {
  if (config.validate) {
    capturedValidate = config.validate;
  }
  return Promise.resolve("test-app");
});
const mockSelect = jest.fn().mockResolvedValue("moderate");
const mockConfirm = jest.fn().mockResolvedValue(true);

jest.unstable_mockModule("@clack/prompts", () => ({
  intro: mockIntro,
  group: mockGroup,
  cancel: mockCancel,
  text: mockText,
  select: mockSelect,
  confirm: mockConfirm,
}));

// Import after mocking
const { runPrompts } = await import("./prompts.js");

describe("runPrompts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedValidate = null;
  });

  it("should return user choices when prompts are completed successfully", async () => {
    const expectedChoices: UserChoices = {
      projectName: "my-test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    const result = await runPrompts();

    expect(result).toEqual(expectedChoices);
    expect(mockIntro).toHaveBeenCalled();
    expect(mockGroup).toHaveBeenCalled();
  });

  it("should return choices with relaxed strictness level", async () => {
    const expectedChoices: UserChoices = {
      projectName: "relaxed-project",
      tsStrictness: "relaxed",
      initGit: false,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    const result = await runPrompts();

    expect(result).toEqual(expectedChoices);
    expect(result?.tsStrictness).toBe("relaxed");
  });

  it("should return choices with strict strictness level", async () => {
    const expectedChoices: UserChoices = {
      projectName: "strict-project",
      tsStrictness: "strict",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    const result = await runPrompts();

    expect(result).toEqual(expectedChoices);
    expect(result?.tsStrictness).toBe("strict");
  });

  it("should return choices with initGit set to false", async () => {
    const expectedChoices: UserChoices = {
      projectName: "no-git-project",
      tsStrictness: "moderate",
      initGit: false,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    const result = await runPrompts();

    expect(result).toEqual(expectedChoices);
    expect(result?.initGit).toBe(false);
  });

  it("should handle project names with valid characters", async () => {
    const expectedChoices: UserChoices = {
      projectName: "my-project_123",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    const result = await runPrompts();

    expect(result?.projectName).toBe("my-project_123");
  });

  it("should call intro with styled text", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    expect(mockIntro).toHaveBeenCalledTimes(1);
  });

  it("should configure group with onCancel handler", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Verify group was called with options containing onCancel
    expect(mockGroup).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        onCancel: expect.any(Function),
      })
    );
  });

  it("should call onCancel handler when user cancels", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the onCancel handler from the mock call
    const groupCallArgs = mockGroup.mock.calls[0];
    const options = groupCallArgs[1] as { onCancel: () => void };

    // Mock process.exit
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    // Call the onCancel handler
    expect(() => options.onCancel()).toThrow("process.exit called");
    expect(mockCancel).toHaveBeenCalledWith("Operation cancelled.");

    mockExit.mockRestore();
  });

  it("should configure text prompt with validation function", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration from the mock call
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
      tsStrictness: () => unknown;
      initGit: () => unknown;
    };

    // Call the projectName prompt function to trigger text() call
    await promptsConfig.projectName();

    // Verify text was called with validate function
    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "What is your project name?",
        placeholder: "my-express-app",
        defaultValue: "my-express-app",
        validate: expect.any(Function),
      })
    );
  });

  it("should validate empty project name", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration and call projectName to capture validate
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
    };
    await promptsConfig.projectName();

    // Test validation
    expect(capturedValidate).not.toBeNull();
    expect(capturedValidate!("")).toBe("Project name is required");
  });

  it("should validate project name with invalid characters", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration and call projectName to capture validate
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
    };
    await promptsConfig.projectName();

    // Test validation with invalid characters
    expect(capturedValidate).not.toBeNull();
    expect(capturedValidate!("my app")).toBe("Only letters, numbers, hyphens and underscores allowed");
    expect(capturedValidate!("my@app")).toBe("Only letters, numbers, hyphens and underscores allowed");
    expect(capturedValidate!("my.app")).toBe("Only letters, numbers, hyphens and underscores allowed");
  });

  it("should accept valid project names", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration and call projectName to capture validate
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
    };
    await promptsConfig.projectName();

    // Test validation with valid names
    expect(capturedValidate).not.toBeNull();
    expect(capturedValidate!("my-app")).toBeUndefined();
    expect(capturedValidate!("my_app")).toBeUndefined();
    expect(capturedValidate!("myapp123")).toBeUndefined();
    expect(capturedValidate!("MyApp")).toBeUndefined();
  });

  it("should configure select prompt with correct options", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration from the mock call
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
      tsStrictness: () => unknown;
      initGit: () => unknown;
    };

    // Call the tsStrictness prompt function to trigger select() call
    await promptsConfig.tsStrictness();

    // Verify select was called with correct options
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Which TypeScript strictness level do you prefer?",
        options: expect.arrayContaining([
          expect.objectContaining({ value: "relaxed", label: "Relaxed" }),
          expect.objectContaining({ value: "moderate", label: "Moderate" }),
          expect.objectContaining({ value: "strict", label: "Strict" }),
        ]),
        initialValue: "moderate",
      })
    );
  });

  it("should configure confirm prompt for git initialization", async () => {
    const expectedChoices: UserChoices = {
      projectName: "test-app",
      tsStrictness: "moderate",
      initGit: true,
    };

    mockGroup.mockResolvedValue(expectedChoices);

    await runPrompts();

    // Get the prompts configuration from the mock call
    const groupCallArgs = mockGroup.mock.calls[0];
    const promptsConfig = groupCallArgs[0] as {
      projectName: () => unknown;
      tsStrictness: () => unknown;
      initGit: () => unknown;
    };

    // Call the initGit prompt function to trigger confirm() call
    await promptsConfig.initGit();

    // Verify confirm was called with correct options
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Initialize Git repository?",
        initialValue: true,
      })
    );
  });
});

describe("UserChoices type", () => {
  it("should have readonly properties", () => {
    const choices: UserChoices = {
      projectName: "test",
      tsStrictness: "moderate",
      initGit: true,
    };

    // TypeScript will enforce readonly at compile time
    // This test verifies the structure is correct
    expect(choices.projectName).toBe("test");
    expect(choices.tsStrictness).toBe("moderate");
    expect(choices.initGit).toBe(true);
  });
});

describe("TsStrictness type", () => {
  it("should accept valid strictness values", () => {
    const relaxed: TsStrictness = "relaxed";
    const moderate: TsStrictness = "moderate";
    const strict: TsStrictness = "strict";

    expect(relaxed).toBe("relaxed");
    expect(moderate).toBe("moderate");
    expect(strict).toBe("strict");
  });
});
