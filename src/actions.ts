import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import { execa } from "execa";
import { fileURLToPath } from "url";
import type { TsStrictness, UserChoices } from "./prompts.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

/**
 * Resolves the templates directory path.
 * Works in both development (src/templates) and production (dist/templates) environments.
 * @returns {string} The absolute path to the templates directory
 */
function getTemplatesDirectory(): string {
  const productionPath = path.join(currentDirectory, "templates");
  const developmentPath = path.join(currentDirectory, "..", "src", "templates");

  if (fs.existsSync(productionPath)) {
    return productionPath;
  }
  return developmentPath;
}

/**
 * Copies template files to the target project directory.
 * @param {string} templatesDirectory - Path to the templates directory
 * @param {string} projectPath - Path to the new project directory
 * @param {string} projectName - Name of the project for package.json
 * @param {TsStrictness} tsStrictness - TypeScript strictness level to use
 * @returns {Promise<void>} Resolves when all files are copied
 * @throws {Error} If file operations fail
 */
async function copyProjectFiles(
  templatesDirectory: string,
  projectPath: string,
  projectName: string,
  tsStrictness: TsStrictness
): Promise<void> {
  await fs.ensureDir(path.join(projectPath, "src"));

  const sourceIndexPath = path.join(templatesDirectory, "base", "src", "index.ts");
  await fs.copy(sourceIndexPath, path.join(projectPath, "src", "index.ts"));

  const gitignoreSourcePath = path.join(templatesDirectory, "base", "gitignore");
  await fs.copy(gitignoreSourcePath, path.join(projectPath, ".gitignore"));

  const packageTemplateContent = await fs.readFile(
    path.join(templatesDirectory, "base", "package.template.json"),
    "utf-8"
  );
  const packageJsonContent = packageTemplateContent.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
  await fs.writeFile(path.join(projectPath, "package.json"), packageJsonContent);

  const tsconfigSourcePath = path.join(templatesDirectory, "tsconfig", `${tsStrictness}.json`);
  await fs.copy(tsconfigSourcePath, path.join(projectPath, "tsconfig.json"));
}

/**
 * Installs npm dependencies in the project directory.
 * Generates package-lock.json for deterministic installs.
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<void>} Resolves when dependencies are installed and lock file is generated
 * @throws {Error} If npm install fails
 */
async function installDependencies(projectPath: string): Promise<void> {
  await execa("npm", ["install"], {
    cwd: projectPath,
    stdio: "pipe",
  });
  
  // Verify package-lock.json was created
  const lockFilePath = path.join(projectPath, "package-lock.json");
  if (!fs.existsSync(lockFilePath)) {
    throw new Error("package-lock.json was not generated");
  }
}

/**
 * Initializes a Git repository with an initial commit.
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<void>} Resolves when Git is initialized and first commit is made
 * @throws {Error} If git commands fail
 */
async function initializeGitRepository(projectPath: string): Promise<void> {
  await execa("git", ["init"], {
    cwd: projectPath,
    stdio: "pipe",
  });

  await execa("git", ["add", "."], {
    cwd: projectPath,
    stdio: "pipe",
  });

  await execa("git", ["commit", "-m", "Initial commit from express-ts-wizard"], {
    cwd: projectPath,
    stdio: "pipe",
  });
}

/**
 * Creates a new Express + TypeScript project based on user choices.
 * Handles directory creation, file copying, dependency installation, and Git initialization.
 * @param {UserChoices} choices - User selections from the wizard
 * @returns {Promise<void>} Resolves when the project is fully created
 * @throws {Error} If the target directory already exists or file operations fail
 */
export async function createProject(choices: UserChoices): Promise<void> {
  const { projectName, tsStrictness, initGit } = choices;
  const projectPath = path.resolve(process.cwd(), projectName);
  const templatesDirectory = getTemplatesDirectory();

  if (fs.existsSync(projectPath)) {
    p.cancel(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  const spinner = p.spinner();

  spinner.start("Creating project structure...");
  try {
    await copyProjectFiles(templatesDirectory, projectPath, projectName, tsStrictness);
    spinner.stop("Project structure created ✓");
  } catch (error) {
    spinner.stop("Error creating structure");
    throw error;
  }

  spinner.start("Installing dependencies...");
  try {
    await installDependencies(projectPath);
    spinner.stop("Dependencies installed ✓");
  } catch (error) {
    spinner.stop("Error installing dependencies");
    throw error;
  }

  if (initGit) {
    spinner.start("Initializing Git...");
    try {
      await initializeGitRepository(projectPath);
      spinner.stop("Git initialized ✓");
    } catch {
      spinner.stop("Error initializing Git (may not be installed)");
      // Git initialization is optional, so we don't throw
    }
  }
}

/**
 * Returns a human-readable description of the TypeScript strictness level.
 * @param {TsStrictness} level - The strictness level
 * @returns {string} A formatted description of the strictness level
 */
export function getTsStrictnessDescription(level: TsStrictness): string {
  const descriptions: Record<TsStrictness, string> = {
    relaxed: "Relaxed (strict: false)",
    moderate: "Moderate (strict: true)",
    strict: "Strict (maximum options)",
  };
  return descriptions[level];
}
