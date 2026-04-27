import { describe, expect, it } from "vitest";
import { characterSchema, type Character } from "./character.schema";
import {
  createEffectContext,
  getAbilityBonus,
  getArmorClassEffectBonus,
  getAttackBonus,
  getDamageBonus,
  getPowerCheckBonus,
  getRollMode,
  getUnresolvedConditionalEffects,
} from "./effects";
import { starWarsShadowdarkRuleset } from "../rules/star-wars-shadowdark";
import type { Ruleset } from "../rules/rules.schema";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString();

  return characterSchema.parse({
    id: "effect-test-character",
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: "Effect Tester",
    level: 1,
    abilities: {
      str: 14,
      dex: 16,
      con: 10,
      int: 14,
      wis: 14,
      cha: 10,
    },
    hp: {
      max: 8,
      current: 8,
    },
    speciesId: "human",
    speciesVariantId: "human-mandalorian",
    classId: "knight",
    subclassId: "guardian",
    knownForcePowerIds: ["force-ward"],
    startingGearIds: [],
    inventory: {
      credits: 0,
      entries: [
        {
          id: "lightsaber-entry",
          gearItemId: "lightsaber-single",
          quantity: 1,
          slotsPerItem: 1,
          carried: true,
          equipped: true,
        },
      ],
    },
    resources: [],
    talentHistory: [],
    hpGainHistory: [],
    backgroundId: "outer-rim-farmer",
    affinity: "neutral",
    viceId: "duty",
    destinyId: "light-mentor-major-goal",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("effect resolver", () => {
  it("collects species, variant, class, subclass, talent, and equipped gear effects", () => {
    const gearEffectRuleset: Ruleset = {
      ...starWarsShadowdarkRuleset,
      gear: [
        ...starWarsShadowdarkRuleset.gear,
        {
          id: "tactical-visor",
          name: "Tactical Visor",
          category: "equipment",
          tags: ["tech"],
          slotsPerItem: 1,
          equippable: true,
          equipmentSlot: "other",
          effects: [
            {
              type: "checkBonus",
              value: 1,
              target: { domain: "check", tags: ["perception"] },
            },
          ],
          description: "A visor with targeting telemetry.",
        },
      ],
    };
    const character = makeCharacter({
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
            effects: [{ type: "attackBonus", value: 1, target: "lightsabers" }],
          },
        },
      ],
      inventory: {
        credits: 0,
        entries: [
          {
            id: "visor-entry",
            gearItemId: "tactical-visor",
            quantity: 1,
            slotsPerItem: 1,
            carried: true,
            equipped: true,
          },
        ],
      },
    });
    const context = createEffectContext(character, gearEffectRuleset);

    expect(context.effects.map((effect) => effect.sourceType)).toEqual(
      expect.arrayContaining([
        "species",
        "speciesVariant",
        "class",
        "subclass",
        "talent",
        "gear",
      ]),
    );
  });

  it("applies attack bonuses by weapon category or tag", () => {
    const character = makeCharacter({
      talentHistory: [
        {
          id: "pistol-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "scoundrel-talents",
          selectionMode: "manual",
          talentId: "talent-scoundrel-sharpshot-4-6",
          talent: {
            featureId: "talent-scoundrel-sharpshot",
            name: "Sharpshot",
            description: "+1 to pistol/carbine attack and damage.",
            effects: [
              { type: "attackBonus", value: 1, target: "pistols" },
              { type: "attackBonus", value: 1, target: { domain: "attack", tags: ["light"] } },
            ],
          },
        },
      ],
    });
    const context = createEffectContext(character, starWarsShadowdarkRuleset);
    const blaster = starWarsShadowdarkRuleset.gear.find(
      (item) => item.id === "holdout-blaster",
    );

    expect(blaster).toBeDefined();
    expect(getAttackBonus(context, { weapon: blaster! })).toBe(2);
  });

  it("stacks matching damage bonuses", () => {
    const character = makeCharacter({
      talentHistory: [
        {
          id: "damage-talent",
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
              { type: "damageBonus", value: 1, target: "lightsabers" },
              { type: "damageBonus", value: 2, target: { domain: "damage", ids: ["lightsaber-single"] } },
            ],
          },
        },
      ],
    });
    const context = createEffectContext(character, starWarsShadowdarkRuleset);
    const lightsaber = starWarsShadowdarkRuleset.gear.find(
      (item) => item.id === "lightsaber-single",
    );

    expect(lightsaber).toBeDefined();
    expect(getDamageBonus(context, { weapon: lightsaber! })).toBe(3);
  });

  it("applies unconditional ability bonuses and leaves choice-based ability bonuses unapplied", () => {
    const character = makeCharacter({
      talentHistory: [
        {
          id: "ability-talents",
          levelGained: 1,
          tableSource: "subclass",
          tableId: "sentinel-talents",
          selectionMode: "manual",
          talentId: "talent-sentinel-agile-form-2-2",
          talent: {
            featureId: "talent-sentinel-agile-form",
            name: "Agile Form",
            description: "+2 Dexterity.",
            effects: [
              { type: "abilityBonus", ability: "dex", value: 2 },
              {
                type: "abilityBonus",
                ability: "str",
                value: 2,
                condition: "Choose Strength or Constitution.",
              },
            ],
          },
        },
      ],
    });
    const context = createEffectContext(character, starWarsShadowdarkRuleset);

    expect(getAbilityBonus(context, "dex")).toBe(2);
    expect(getAbilityBonus(context, "str")).toBe(0);
  });

  it("cancels advantage and disadvantage into a normal roll", () => {
    const character = makeCharacter({
      talentHistory: [
        {
          id: "roll-mode-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "trooper-talents",
          selectionMode: "manual",
          talentId: "talent-trooper-combat-readiness-7-7",
          talent: {
            featureId: "talent-trooper-combat-readiness",
            name: "Combat Readiness",
            description: "Gain advantage on initiative rolls.",
            effects: [
              { type: "advantage", target: "initiative" },
              { type: "rollMode", mode: "disadvantage", target: "initiative" },
            ],
          },
        },
      ],
    });
    const context = createEffectContext(character, starWarsShadowdarkRuleset);

    expect(getRollMode(context, { tags: ["initiative"] })).toBe("normal");
  });

  it("applies provable conditional AC effects and reports unresolved ones", () => {
    const talent = {
      id: "conditional-ac",
      levelGained: 1,
      tableSource: "class" as const,
      tableId: "knight-talents",
      selectionMode: "manual" as const,
      talentId: "talent-knight-bulwark-stance-10-11",
      talent: {
        featureId: "talent-knight-bulwark-stance",
        name: "Bulwark Stance",
        description: "+1 AC while wielding a lightsaber.",
        effects: [
          {
            type: "acBonus" as const,
            value: 1,
            condition: "While wielding a lightsaber.",
          },
        ],
      },
    };
    const withLightsaber = createEffectContext(
      makeCharacter({ talentHistory: [talent] }),
      starWarsShadowdarkRuleset,
    );
    const withoutLightsaber = createEffectContext(
      makeCharacter({
        talentHistory: [talent],
        inventory: { credits: 0, entries: [] },
      }),
      starWarsShadowdarkRuleset,
    );

    expect(getArmorClassEffectBonus(withLightsaber, { includeConditional: true })).toBe(3);
    expect(getArmorClassEffectBonus(withoutLightsaber, { includeConditional: true })).toBe(0);
    expect(getUnresolvedConditionalEffects(withoutLightsaber, { domain: "ac" })).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceName: "Bulwark Stance" }),
      expect.objectContaining({ sourceName: "Soresu (Form III)" }),
    ]));
  });

  it("applies Force and Tech power check bonuses by structured power kind and tags", () => {
    const character = makeCharacter({
      classId: "consular",
      subclassId: "sage",
      talentHistory: [
        {
          id: "force-attunement",
          levelGained: 1,
          tableSource: "class",
          tableId: "consular-talents",
          selectionMode: "manual",
          talentId: "talent-consular-force-attunement-3-6",
          talent: {
            featureId: "talent-consular-force-attunement",
            name: "Force Attunement",
            description: "+1 to Force checks.",
            effects: [
              {
                type: "powerCheckBonus",
                value: 1,
                target: { domain: "power", powerKind: "force" },
              },
              {
                type: "powerCheckBonus",
                value: 1,
                target: { domain: "power", powerKind: "force", tags: ["defense"] },
              },
            ],
          },
        },
      ],
    });
    const context = createEffectContext(character, starWarsShadowdarkRuleset);
    const forceWard = starWarsShadowdarkRuleset.forcePowers.find(
      (power) => power.id === "force-ward",
    );

    expect(forceWard).toBeDefined();
    expect(getPowerCheckBonus(context, { power: forceWard! })).toBe(3);
    expect(getPowerCheckBonus(context, { powerKind: "tech" })).toBe(0);
  });

  it("parses old talent snapshots without structured effects", () => {
    const now = new Date().toISOString();
    const oldCharacter = {
      id: "old-effect-character",
      schemaVersion: 1,
      rulesetId: starWarsShadowdarkRuleset.id,
      rulesetVersion: starWarsShadowdarkRuleset.version,
      name: "Old Effect Character",
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
      talentHistory: [
        {
          id: "old-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-weapon-mastery-3-6",
          talent: {
            featureId: "talent-knight-weapon-mastery",
            name: "Weapon Mastery",
            description: "+1 to attack and damage with lightsabers.",
          },
        },
      ],
      hpGainHistory: [],
      backgroundId: "outer-rim-farmer",
      affinity: "neutral",
      viceId: "duty",
      destinyId: "light-mentor-major-goal",
      createdAt: now,
      updatedAt: now,
    };

    expect(characterSchema.parse(oldCharacter).talentHistory[0].talent.effects).toEqual([]);
  });
});
