import { describe, expect, it } from "vitest";
import { characterSchema, type InventoryEntry } from "./character.schema";
import {
  calculateArmorClass,
  calculateUsedInventorySlots,
  createStartingInventoryEntries,
} from "./inventory";
import { starWarsShadowdarkRuleset } from "../rules/star-wars-shadowdark";

describe("inventory calculations", () => {
  it("calculates used slots from carried quantity and slots per item", () => {
    const entries: InventoryEntry[] = [
      {
        id: "carried-bulk",
        customName: "Power cells",
        quantity: 3,
        slotsPerItem: 0.5,
        carried: true,
        equipped: false,
      },
      {
        id: "stored-crate",
        customName: "Stored crate",
        quantity: 10,
        slotsPerItem: 2,
        carried: false,
        equipped: false,
      },
      {
        id: "equipped-hidden",
        customName: "Worn shield",
        quantity: 1,
        slotsPerItem: 1,
        carried: false,
        equipped: true,
      },
    ];

    expect(calculateUsedInventorySlots(entries)).toBe(2.5);
  });

  it("creates starting inventory from class starting gear", () => {
    const entries = createStartingInventoryEntries("trooper", starWarsShadowdarkRuleset);
    const gearItemIds = entries.map((entry) => entry.gearItemId);

    expect(gearItemIds).toContain("sporting-carbine");
    expect(gearItemIds).toContain("light-trooper-armor");
    expect(entries.find((entry) => entry.gearItemId === "rations-3-days")?.quantity).toBe(3);
  });

  it("uses equipped armor to calculate armor class", () => {
    const now = new Date().toISOString();
    const character = characterSchema.parse({
      id: "armored-character",
      schemaVersion: 1,
      rulesetId: starWarsShadowdarkRuleset.id,
      rulesetVersion: starWarsShadowdarkRuleset.version,
      name: "Armored Hero",
      level: 1,
      abilities: {
        str: 10,
        dex: 12,
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
      inventory: {
        credits: 0,
        entries: [
          {
            id: "armor",
            gearItemId: "light-trooper-armor",
            quantity: 1,
            slotsPerItem: 1,
            carried: true,
            equipped: true,
          },
        ],
      },
      resources: [],
      backgroundId: "war-refugee",
      affinity: "neutral",
      viceId: "duty",
      destinyId: "light-mentor-major-goal",
      createdAt: now,
      updatedAt: now,
    });

    expect(calculateArmorClass(character, starWarsShadowdarkRuleset)).toBe(14);
  });

  it("applies resolver AC bonuses only when simple conditions are provable", () => {
    const now = new Date().toISOString();
    const character = characterSchema.parse({
      id: "conditional-ac-character",
      schemaVersion: 1,
      rulesetId: starWarsShadowdarkRuleset.id,
      rulesetVersion: starWarsShadowdarkRuleset.version,
      name: "Guarded Hero",
      level: 1,
      abilities: {
        str: 10,
        dex: 12,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      hp: {
        max: 6,
        current: 6,
      },
      speciesId: "human",
      speciesVariantId: "human-republican",
      classId: "knight",
      subclassId: "guardian",
      knownForcePowerIds: [],
      startingGearIds: [],
      inventory: {
        credits: 0,
        entries: [
          {
            id: "lightsaber",
            gearItemId: "lightsaber-single",
            quantity: 1,
            slotsPerItem: 1,
            carried: true,
            equipped: true,
          },
        ],
      },
      resources: [],
      talentHistory: [
        {
          id: "bulwark",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-bulwark-stance-10-11",
          talent: {
            featureId: "talent-knight-bulwark-stance",
            name: "Bulwark Stance",
            description: "+1 AC while wielding a lightsaber.",
            effects: [
              {
                type: "acBonus",
                value: 1,
                condition: "While wielding a lightsaber.",
              },
            ],
          },
        },
      ],
      hpGainHistory: [],
      backgroundId: "war-refugee",
      affinity: "neutral",
      viceId: "duty",
      destinyId: "light-mentor-major-goal",
      createdAt: now,
      updatedAt: now,
    });
    const unequippedCharacter = {
      ...character,
      inventory: {
        credits: 0,
        entries: [],
      },
    };

    expect(calculateArmorClass(character, starWarsShadowdarkRuleset)).toBe(14);
    expect(calculateArmorClass(unequippedCharacter, starWarsShadowdarkRuleset)).toBe(11);
  });
});
