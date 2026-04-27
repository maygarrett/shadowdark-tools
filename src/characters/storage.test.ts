import { beforeEach, describe, expect, it } from "vitest";
import { characterSchema, type Character } from "./character.schema";
import {
  clearCharactersForTests,
  deleteCharacter,
  getCharacter,
  importCharacter,
  listCharacters,
  saveCharacter,
} from "./storage";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString();

  return characterSchema.parse({
    id: "duplicate-id",
    schemaVersion: 1,
    rulesetId: "star-wars-shadowdark",
    rulesetVersion: "0.1.0",
    name: "Duplicate Name",
    level: 1,
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    hp: {
      max: 6,
      current: 6,
    },
    speciesId: "duros",
    classId: "trooper",
    knownForcePowerIds: [],
    startingGearIds: [],
    resources: [],
    backgroundId: "war-refugee",
    affinity: "neutral",
    viceId: "duty",
    destinyId: "light-mentor-major-goal",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("character storage", () => {
  beforeEach(() => {
    clearCharactersForTests();
  });

  it("creates a new ID when importing a duplicate character ID", () => {
    const firstCharacter = importCharacter(makeCharacter());
    const secondCharacter = importCharacter(makeCharacter());

    expect(firstCharacter.id).toBe("duplicate-id");
    expect(secondCharacter.id).not.toBe("duplicate-id");
    expect(listCharacters()).toHaveLength(2);
  });

  it("loads old characters without talent or HP gain history", () => {
    const character = makeCharacter();
    const { talentHistory, hpGainHistory, inventory, ...legacyCharacter } = character;

    localStorage.setItem(
      "shadowdark-tools.characters.v1",
      JSON.stringify([legacyCharacter]),
    );

    const loadedCharacter = getCharacter(character.id);

    expect(loadedCharacter?.talentHistory).toEqual([]);
    expect(loadedCharacter?.hpGainHistory).toEqual([]);
    expect(loadedCharacter?.inventory).toEqual({ credits: 0, entries: [] });
  });

  it("deletes one character without removing other saved characters", () => {
    saveCharacter(makeCharacter({ id: "first-character", name: "First Hero" }));
    saveCharacter(makeCharacter({ id: "second-character", name: "Second Hero" }));

    deleteCharacter("first-character");

    expect(getCharacter("first-character")).toBeUndefined();
    expect(getCharacter("second-character")?.name).toBe("Second Hero");
    expect(listCharacters()).toHaveLength(1);
  });
});
