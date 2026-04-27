import { describe, expect, it } from "vitest";
import { characterSchema, type Character } from "./character.schema";
import {
  getCharacterExportFileName,
  parseImportedCharacterJson,
  serializeCharacterForExport,
} from "./importExport";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString();

  return characterSchema.parse({
    id: "round-trip-character",
    schemaVersion: 1,
    rulesetId: "star-wars-shadowdark",
    rulesetVersion: "0.1.0",
    name: "Vexa Sol",
    playerName: "Garrett",
    level: 1,
    abilities: {
      str: 14,
      dex: 8,
      con: 12,
      int: 10,
      wis: 16,
      cha: 9,
    },
    hp: {
      max: 8,
      current: 5,
    },
    notes: "Portable character.",
    speciesId: "human",
    speciesVariantId: "human-republican",
    classId: "knight",
    subclassId: "guardian",
    knownForcePowerIds: ["force-push"],
    startingGearIds: ["shock-baton", "knight-robes"],
    inventory: {
      credits: 40,
      entries: [
        {
          id: "shock-baton-entry",
          gearItemId: "shock-baton",
          quantity: 1,
          slotsPerItem: 1,
          carried: true,
          equipped: true,
          notes: "Old reliable.",
        },
        {
          id: "blaster-rifle-entry",
          gearItemId: "blaster-rifle",
          quantity: 2,
          slotsPerItem: 1,
          carried: true,
          equipped: false,
        },
      ],
    },
    resources: [],
    talentHistory: [
      {
        id: "level-1-talent",
        levelGained: 1,
        tableSource: "class",
        tableId: "knight-talents",
        selectionMode: "manual",
        talentId: "talent-knight-weapon-mastery-3-6",
        talent: {
          featureId: "talent-knight-weapon-mastery",
          name: "Weapon Mastery",
          description: "+1 to attack and damage with lightsabers.",
          choiceSelections: [],
        },
      },
    ],
    hpGainHistory: [],
    backgroundId: "outer-rim-farmer",
    affinity: "light",
    viceId: "attachment",
    destinyId: "light-save-defined-threat",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("character import/export", () => {
  it("preserves character data through an export/import round trip", () => {
    const character = makeCharacter();
    const importedCharacter = parseImportedCharacterJson(
      serializeCharacterForExport(character),
    );

    expect(importedCharacter).toEqual(character);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseImportedCharacterJson("{not valid json")).toThrow(
      /valid JSON/i,
    );
  });

  it("handles missing optional fields safely", () => {
    const character = makeCharacter();
    const {
      inventory,
      knownForcePowerIds,
      startingGearIds,
      resources,
      talentHistory,
      hpGainHistory,
      notes,
      ...legacyCharacter
    } = character;

    const importedCharacter = parseImportedCharacterJson(
      JSON.stringify(legacyCharacter),
    );

    expect(importedCharacter.knownForcePowerIds).toEqual([]);
    expect(importedCharacter.startingGearIds).toEqual([]);
    expect(importedCharacter.inventory).toEqual({ credits: 0, entries: [] });
    expect(importedCharacter.resources).toEqual([]);
    expect(importedCharacter.talentHistory).toEqual([]);
    expect(importedCharacter.hpGainHistory).toEqual([]);
    expect(importedCharacter).not.toHaveProperty("notes");
  });

  it("preserves talent and HP gain histories", () => {
    const character = makeCharacter({
      hpGainHistory: [
        {
          id: "hp-2",
          levelGained: 2,
          hitDie: "d10",
          constitutionModifier: 1,
          roll: {
            expression: "1d10+1",
            rolls: [5],
            total: 6,
          },
          gain: 6,
        },
      ],
    });
    const importedCharacter = parseImportedCharacterJson(
      serializeCharacterForExport(character),
    );

    expect(importedCharacter.talentHistory).toEqual(character.talentHistory);
    expect(importedCharacter.hpGainHistory).toEqual(character.hpGainHistory);
  });

  it("uses a safe character-name JSON filename", () => {
    expect(getCharacterExportFileName(makeCharacter())).toBe("vexa-sol.json");
  });
});
