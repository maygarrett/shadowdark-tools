import { characterSchema, type Character } from "./character.schema";

export function parseImportedCharacter(value: unknown): Character {
  return characterSchema.parse(value);
}
