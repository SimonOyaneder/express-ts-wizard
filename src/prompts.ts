import * as p from "@clack/prompts";
import kleur from "kleur";

/** Available TypeScript strictness levels for project configuration */
export type TsStrictness = "relaxed" | "moderate" | "strict";

/** User selections from the interactive wizard */
export interface UserChoices {
  readonly projectName: string;
  readonly tsStrictness: TsStrictness;
  readonly initGit: boolean;
}

/**
 * Runs the interactive CLI wizard to collect user preferences.
 * Displays prompts for project name, TypeScript strictness, and Git initialization.
 * @returns {Promise<UserChoices | null>} The user's choices, or null if cancelled
 */
export async function runPrompts(): Promise<UserChoices | null> {
  p.intro(kleur.bgCyan().black(" create-express-ts "));

  const project = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What is your project name?",
          placeholder: "my-express-app",
          defaultValue: "my-express-app",
          validate: (value) => {
            if (!value) return "Project name is required";
            if (!/^[a-z0-9-_]+$/i.test(value)) {
              return "Only letters, numbers, hyphens and underscores allowed";
            }
          },
        }),

      tsStrictness: () =>
        p.select({
          message: "Which TypeScript strictness level do you prefer?",
          options: [
            {
              value: "relaxed",
              label: "Relaxed",
              hint: "strict: false - Minimal configuration",
            },
            {
              value: "moderate",
              label: "Moderate",
              hint: "strict: true - Recommended",
            },
            {
              value: "strict",
              label: "Strict",
              hint: "strict + additional options - Maximum type safety",
            },
          ],
          initialValue: "moderate" as TsStrictness,
        }),

      initGit: () =>
        p.confirm({
          message: "Initialize Git repository?",
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  return project as UserChoices;
}
