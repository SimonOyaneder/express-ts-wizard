#!/usr/bin/env node

import * as p from "@clack/prompts";
import kleur from "kleur";
import { runPrompts } from "./prompts.js";
import { createProject, getTsStrictnessDescription } from "./actions.js";

/**
 * Displays the final success message with next steps for the user.
 * @param {string} projectName - Name of the created project
 * @param {string} strictnessDescription - Human-readable TypeScript strictness level
 * @returns {void}
 */
function displaySuccessMessage(projectName: string, strictnessDescription: string): void {
  const nextSteps = [
    `cd ${projectName}`,
    "npm run dev        → Start server with hot-reload",
    "npm run build      → Compile to JavaScript",
    "npm run start      → Run the compiled version",
    "npm run type-check → Check types without compiling",
    "",
    kleur.gray("Tip: Use 'npm ci' for deterministic installs (recommended in CI/CD)"),
  ];

  p.note(nextSteps.join("\n"), "Next steps");

  p.outro(
    kleur.green("✔") +
      ` Project ${kleur.cyan(projectName)} created with TypeScript ${kleur.yellow(strictnessDescription)}`
  );
}

/**
 * Main entry point for the CLI wizard.
 * Orchestrates the prompt collection, project creation, and success messaging.
 * @returns {Promise<void>} Resolves when the CLI completes or exits on error
 */
async function main(): Promise<void> {
  console.clear();

  const choices = await runPrompts();

  if (!choices) {
    process.exit(0);
  }

  console.log();

  try {
    await createProject(choices);
    const strictnessDescription = getTsStrictnessDescription(choices.tsStrictness);
    displaySuccessMessage(choices.projectName, strictnessDescription);
  } catch (error) {
    p.cancel("Error creating project");
    console.error(error);
    process.exit(1);
  }
}

main();
