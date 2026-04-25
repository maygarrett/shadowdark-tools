import { characterSchema, type Character } from "./character.schema";

const characterStorageKey = "shadowdark-tools.characters.v1";

export const characterStoragePlaceholder = {
  enabled: true,
  driver: "localStorage",
};

export function listCharacters(): Character[] {
  const parsedCharacters = readCharacters();

  return parsedCharacters.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCharacter(characterId: string): Character | undefined {
  return readCharacters().find((character) => character.id === characterId);
}

export function saveCharacter(character: Character): void {
  const existingCharacters = readCharacters();
  const nextCharacters = [
    ...existingCharacters.filter((existing) => existing.id !== character.id),
    character,
  ];

  localStorage.setItem(characterStorageKey, JSON.stringify(nextCharacters));
}

export function clearCharactersForTests(): void {
  localStorage.removeItem(characterStorageKey);
}

function readCharacters(): Character[] {
  const rawCharacters = localStorage.getItem(characterStorageKey);

  if (!rawCharacters) {
    return [];
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawCharacters);
  } catch {
    return [];
  }

  const parsedCharacters = characterSchema.array().safeParse(parsedValue);

  return parsedCharacters.success ? parsedCharacters.data : [];
}
