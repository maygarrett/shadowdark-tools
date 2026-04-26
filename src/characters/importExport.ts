import { ZodError } from "zod";
import { characterSchema, type Character } from "./character.schema";

export function parseImportedCharacter(value: unknown): Character {
  return characterSchema.parse(normalizeImportedCharacter(value));
}

export function parseImportedCharacterJson(jsonText: string): Character {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(jsonText);
  } catch {
    throw new Error("Import file must contain valid JSON.");
  }

  try {
    return parseImportedCharacter(parsedValue);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatCharacterImportError(error));
    }

    throw error;
  }
}

export function serializeCharacterForExport(character: Character): string {
  return `${JSON.stringify(character, null, 2)}\n`;
}

export function getCharacterExportFileName(character: Character): string {
  const slug = character.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "character"}.json`;
}

function normalizeImportedCharacter(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  return {
    schemaVersion: 1,
    knownForcePowerIds: [],
    startingGearIds: [],
    inventory: {
      credits: 0,
      entries: [],
    },
    resources: [],
    ...value,
  };
}

function formatCharacterImportError(error: ZodError): string {
  const issueSummary = error.issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";

      return `${path}${issue.message}`;
    })
    .join("; ");

  return `Import file is not a valid character. ${issueSummary}`;
}
