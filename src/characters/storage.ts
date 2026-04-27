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

export function deleteCharacter(characterId: string): void {
  const nextCharacters = readCharacters().filter(
    (character) => character.id !== characterId,
  );

  localStorage.setItem(characterStorageKey, JSON.stringify(nextCharacters));
}

export function importCharacter(character: Character): Character {
  const existingCharacters = readCharacters();
  const importedCharacter = existingCharacters.some(
    (existingCharacter) => existingCharacter.id === character.id,
  )
    ? { ...character, id: createCharacterId() }
    : character;

  localStorage.setItem(
    characterStorageKey,
    JSON.stringify([...existingCharacters, importedCharacter]),
  );

  return importedCharacter;
}

export function clearCharactersForTests(): void {
  localStorage.removeItem(characterStorageKey);
}

export function createCharacterId(): string {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `character-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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
