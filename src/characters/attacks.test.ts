import { describe, expect, it } from "vitest";
import { characterSchema, type Character, type InventoryEntry } from "./character.schema";
import {
  addDamageBonus,
  deriveArmorProficiencyWarnings,
  deriveWeaponAttacks,
} from "./attacks";
import { createTalentHistoryEntry } from "./talents";
import { starWarsShadowdarkRuleset } from "../rules/star-wars-shadowdark";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString();

  return characterSchema.parse({
    id: "attack-test-character",
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: "Attack Tester",
    level: 1,
    abilities: {
      str: 14,
      dex: 16,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    hp: {
      max: 8,
      current: 8,
    },
    speciesId: "human",
    speciesVariantId: "human-republican",
    classId: "knight",
    subclassId: "guardian",
    knownForcePowerIds: [],
    startingGearIds: [],
    inventory: {
      credits: 0,
      entries: [],
    },
    resources: [],
    backgroundId: "outer-rim-farmer",
    affinity: "neutral",
    viceId: "duty",
    destinyId: "light-mentor-major-goal",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function entry(
  gearItemId: string,
  overrides: Partial<InventoryEntry> = {},
): InventoryEntry {
  return {
    id: `${gearItemId}-entry`,
    gearItemId,
    quantity: 1,
    slotsPerItem: 1,
    carried: true,
    equipped: true,
    ...overrides,
  };
}

describe("weapon attacks", () => {
  it("derives attacks from equipped weapons only", () => {
    const character = makeCharacter({
      inventory: {
        credits: 0,
        entries: [
          entry("blaster-pistol"),
          entry("vibrosword", { equipped: false }),
          entry("light-trooper-armor"),
        ],
      },
    });

    expect(deriveWeaponAttacks(character, starWarsShadowdarkRuleset).map((attack) => attack.name)).toEqual([
      "Blaster Pistol",
    ]);
  });

  it("uses DEX for blasters and ranged weapons", () => {
    const character = makeCharacter({
      inventory: {
        credits: 0,
        entries: [entry("blaster-pistol")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.attackAbility).toBe("dex");
    expect(attack.attackExpression).toBe("1d20+3");
  });

  it("uses STR for vibroswords, lightsabers, and staves", () => {
    const character = makeCharacter({
      inventory: {
        credits: 0,
        entries: [entry("vibrosword"), entry("lightsaber-single"), entry("electrostaff")],
      },
    });

    expect(
      deriveWeaponAttacks(character, starWarsShadowdarkRuleset).map((attack) => [
        attack.name,
        attack.attackAbility,
      ]),
    ).toEqual([
      ["Vibrosword", "str"],
      ["Lightsaber (single)", "str"],
      ["Electrostaff", "str"],
    ]);
  });

  it("uses the better of STR or DEX for light, knife, finesse, and thrown weapons", () => {
    const character = makeCharacter({
      abilities: {
        str: 8,
        dex: 16,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      inventory: {
        credits: 0,
        entries: [entry("vibroknife"), entry("lightsaber-double-blade"), entry("throwing-knife")],
      },
    });

    expect(
      deriveWeaponAttacks(character, starWarsShadowdarkRuleset).every(
        (attack) => attack.attackAbility === "dex",
      ),
    ).toBe(true);
  });

  it("adds Dark Side damage and combines with existing damage modifiers", () => {
    const character = makeCharacter({
      affinity: "dark",
      inventory: {
        credits: 0,
        entries: [entry("lightsaber-single")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.damageExpression).toBe("2d4+3");
    expect(addDamageBonus("1d6", 2)).toBe("1d6+2");
  });

  it("applies structured attack and damage bonuses from talent history", () => {
    const character = makeCharacter({
      talentHistory: [
        {
          id: "lightsaber-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-weapon-mastery-3-6",
          talent: {
            featureId: "talent-knight-weapon-mastery",
            name: "Weapon Mastery",
            description: "+1 to attack and damage with lightsabers.",
            effects: [
              { type: "attackBonus", value: 1, target: "lightsabers" },
              { type: "damageBonus", value: 1, target: "lightsabers" },
            ],
            choiceSelections: [],
          },
        },
      ],
      inventory: {
        credits: 0,
        entries: [entry("lightsaber-single")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.attackExpression).toBe("1d20+3");
    expect(attack.damageExpression).toBe("2d4+2");
  });

  it("applies weapon category choice bonuses only to matching equipped weapons", () => {
    const weaponMastery = createTalentHistoryEntry(
      1,
      {
        tableId: "trooper-talents",
        talentId: "talent-trooper-weapon-mastery",
        selectionMode: "manual",
        choiceSelections: [
          {
            choiceId: "weapon-category",
            type: "weaponCategory",
            value: "rifles",
            label: "Rifles",
          },
        ],
      },
      starWarsShadowdarkRuleset,
    );

    const character = makeCharacter({
      classId: "trooper",
      subclassId: undefined,
      talentHistory: weaponMastery ? [weaponMastery] : [],
      inventory: {
        credits: 0,
        entries: [entry("blaster-rifle"), entry("shock-baton")],
      },
    });
    const attacks = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);
    const rifleAttack = attacks.find((attack) => attack.gearItemId === "blaster-rifle");
    const batonAttack = attacks.find((attack) => attack.gearItemId === "shock-baton");

    expect(rifleAttack?.attackExpression).toBe("1d20+4");
    expect(rifleAttack?.damageExpression).toBe("1d10+1");
    expect(batonAttack?.attackExpression).toBe("1d20+3");
    expect(batonAttack?.damageExpression).toBe("1d4");
  });

  it("applies broad melee choice bonuses only to matching weapon range type", () => {
    const shiiCho = createTalentHistoryEntry(
      2,
      {
        tableId: "sage-talents",
        talentId: "talent-sage-shii-cho-expert",
        selectionMode: "manual",
        choiceSelections: [
          {
            choiceId: "shii-cho-benefit",
            type: "textOption",
            value: "melee-attack",
            label: "+1 melee attacks",
          },
        ],
      },
      starWarsShadowdarkRuleset,
    );

    const character = makeCharacter({
      classId: "consular",
      subclassId: "sage",
      abilities: {
        str: 14,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      talentHistory: shiiCho ? [shiiCho] : [],
      inventory: {
        credits: 0,
        entries: [entry("vibroblade"), entry("blaster-rifle")],
      },
    });
    const attacks = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);
    const bladeAttack = attacks.find((attack) => attack.gearItemId === "vibroblade");
    const rifleAttack = attacks.find((attack) => attack.gearItemId === "blaster-rifle");

    expect(bladeAttack?.attackExpression).toBe("1d20+1");
    expect(rifleAttack?.attackExpression).toBe("1d20+0");
  });

  it("stacks duplicate talent bonuses", () => {
    const talent = {
      levelGained: 1,
      tableSource: "class" as const,
      tableId: "knight-talents",
      selectionMode: "manual" as const,
      talentId: "talent-knight-weapon-mastery-3-6",
      talent: {
        featureId: "talent-knight-weapon-mastery",
        name: "Weapon Mastery",
        description: "+1 to attack and damage with lightsabers.",
        effects: [
          { type: "attackBonus" as const, value: 1, target: "lightsabers" },
          { type: "damageBonus" as const, value: 1, target: "lightsabers" },
        ],
        choiceSelections: [],
      },
    };
    const character = makeCharacter({
      talentHistory: [
        { ...talent, id: "lightsaber-talent-1" },
        { ...talent, id: "lightsaber-talent-2", levelGained: 2 },
      ],
      inventory: {
        credits: 0,
        entries: [entry("lightsaber-single")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.attackExpression).toBe("1d20+4");
    expect(attack.damageExpression).toBe("2d4+3");
  });

  it("warns for weapons outside class proficiency", () => {
    const character = makeCharacter({
      inventory: {
        credits: 0,
        entries: [entry("blaster-rifle")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.warnings).toContain("Blaster Rifle is outside class weapon proficiency.");
  });

  it("suppresses proficiency warnings for Mandalorian human variants", () => {
    const character = makeCharacter({
      speciesVariantId: "human-mandalorian",
      inventory: {
        credits: 0,
        entries: [entry("blaster-rifle")],
      },
    });
    const [attack] = deriveWeaponAttacks(character, starWarsShadowdarkRuleset);

    expect(attack.warnings).toEqual([]);
  });

  it("warns for armor outside class proficiency unless Mandalorian training applies", () => {
    const knight = makeCharacter({
      inventory: {
        credits: 0,
        entries: [entry("heavy-trooper-armor")],
      },
    });
    const mandalorian = makeCharacter({
      speciesVariantId: "human-mandalorian",
      inventory: {
        credits: 0,
        entries: [entry("heavy-trooper-armor")],
      },
    });

    expect(deriveArmorProficiencyWarnings(knight, starWarsShadowdarkRuleset)).toContain(
      "Heavy Trooper Armor: heavy armor is outside class proficiency.",
    );
    expect(deriveArmorProficiencyWarnings(mandalorian, starWarsShadowdarkRuleset)).toEqual(
      [],
    );
  });
});
