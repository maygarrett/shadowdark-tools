import { describe, expect, it } from "vitest";
import {
  calculatePowerCheckModifier,
  getAvailablePowersForClass,
  getCastingAbility,
  getKnownPowerLimit,
  getPowerSource,
} from "./powers";
import { characterSchema } from "./character.schema";
import { starWarsShadowdarkRuleset } from "../rules/star-wars-shadowdark";

describe("power rules", () => {
  it("calculates level 1 known power limits", () => {
    expect(getKnownPowerLimit(1, "knight", "guardian", starWarsShadowdarkRuleset)).toBe(1);
    expect(getKnownPowerLimit(1, "consular", "deacon", starWarsShadowdarkRuleset)).toBe(2);
    expect(getKnownPowerLimit(1, "consular", "sage", starWarsShadowdarkRuleset)).toBe(3);
    expect(getKnownPowerLimit(1, "trooper", undefined, starWarsShadowdarkRuleset)).toBe(0);
    expect(getKnownPowerLimit(1, "scoundrel", undefined, starWarsShadowdarkRuleset)).toBe(0);
    expect(getKnownPowerLimit(1, "bounty-hunter", undefined, starWarsShadowdarkRuleset)).toBe(0);
    expect(getKnownPowerLimit(1, "agent", undefined, starWarsShadowdarkRuleset)).toBe(0);
  });

  it("maps classes to casting abilities", () => {
    expect(getCastingAbility("knight", starWarsShadowdarkRuleset)).toBe("wis");
    expect(getCastingAbility("consular", starWarsShadowdarkRuleset)).toBe("int");
    expect(getCastingAbility("trooper", starWarsShadowdarkRuleset)).toBe("con");
    expect(getCastingAbility("scoundrel", starWarsShadowdarkRuleset)).toBe("cha");
    expect(getCastingAbility("bounty-hunter", starWarsShadowdarkRuleset)).toBe("wis");
    expect(getCastingAbility("agent", starWarsShadowdarkRuleset)).toBe("int");
  });

  it("calculates known power limits through level 10", () => {
    expect(getKnownPowerLimit(10, "knight", "guardian", starWarsShadowdarkRuleset)).toBe(10);
    expect(getKnownPowerLimit(10, "consular", "deacon", starWarsShadowdarkRuleset)).toBe(12);
    expect(getKnownPowerLimit(10, "trooper", undefined, starWarsShadowdarkRuleset)).toBe(5);
    expect(getKnownPowerLimit(3, "scoundrel", undefined, starWarsShadowdarkRuleset)).toBe(1);
  });

  it("filters available powers by class source", () => {
    expect(getPowerSource("knight", starWarsShadowdarkRuleset)).toBe("force");
    expect(getPowerSource("trooper", starWarsShadowdarkRuleset)).toBe("tech");
    expect(
      getAvailablePowersForClass("knight", starWarsShadowdarkRuleset).map(
        (power) => power.id,
      ),
    ).toContain("force-vigil");
    expect(
      getAvailablePowersForClass("trooper", starWarsShadowdarkRuleset).map(
        (power) => power.id,
      ),
    ).toContain("perimeter-sensor");
  });

  it("filters exclusions, GM approval, and level 1 tier limits", () => {
    const levelOneKnightPowers = getAvailablePowersForClass(
      "knight",
      starWarsShadowdarkRuleset,
      { level: 1 },
    );
    const levelOnePowerIds = levelOneKnightPowers.map((power) => power.id);

    expect(levelOnePowerIds).toContain("force-push");
    expect(levelOnePowerIds).toContain("force-vigil");
    expect(levelOnePowerIds).not.toContain("force-jump");
    expect(levelOnePowerIds).not.toContain("force-trance");
    expect(levelOnePowerIds).not.toContain("excluded-cure-wounds");
    expect(
      getAvailablePowersForClass("knight", starWarsShadowdarkRuleset, {
        includeGmApproval: true,
        level: 1,
      }).map((power) => power.id),
    ).toContain("force-trance");
  });

  it("includes new tier 1 spell-derived powers for Force and Tech classes", () => {
    const levelOneForcePowerIds = getAvailablePowersForClass(
      "knight",
      starWarsShadowdarkRuleset,
      { level: 1 },
    ).map((power) => power.id);
    const levelOneTechPowerIds = getAvailablePowersForClass(
      "trooper",
      starWarsShadowdarkRuleset,
      { level: 1 },
    ).map((power) => power.id);

    expect(levelOneForcePowerIds).toEqual(
      expect.arrayContaining(["thermal-burst", "force-imbue"]),
    );
    expect(levelOneTechPowerIds).toEqual(
      expect.arrayContaining([
        "flame-projector",
        "energized-weapon",
        "personal-shield",
      ]),
    );
  });

  it("gates new higher-tier spell-derived powers by character level", () => {
    const availableIds = (classId: string, level: number) =>
      getAvailablePowersForClass(classId, starWarsShadowdarkRuleset, {
        level,
      }).map((power) => power.id);

    expect(availableIds("knight", 1)).not.toContain("force-premonition");
    expect(availableIds("trooper", 1)).not.toContain("predictive-analysis");
    expect(availableIds("knight", 3)).toEqual(
      expect.arrayContaining(["force-premonition", "force-stasis"]),
    );
    expect(availableIds("trooper", 3)).toEqual(
      expect.arrayContaining(["predictive-analysis", "paralysis-field"]),
    );

    expect(availableIds("knight", 3)).not.toContain("force-detonation");
    expect(availableIds("trooper", 3)).not.toContain("thermal-detonator-burst");
    expect(availableIds("knight", 5)).toEqual(
      expect.arrayContaining(["force-detonation", "force-transmission"]),
    );
    expect(availableIds("trooper", 5)).toEqual(
      expect.arrayContaining(["thermal-detonator-burst", "encrypted-commlink"]),
    );

    expect(availableIds("knight", 5)).not.toContain("force-wall");
    expect(availableIds("trooper", 5)).not.toContain("hardlight-wall");
    expect(availableIds("knight", 7)).toEqual(
      expect.arrayContaining(["advanced-telekinesis", "force-wall"]),
    );
    expect(availableIds("trooper", 7)).toEqual(
      expect.arrayContaining(["grav-manipulator", "hardlight-wall"]),
    );

    expect(availableIds("knight", 7)).not.toContain("force-shift");
    expect(availableIds("trooper", 7)).not.toContain("long-range-teleport");
    expect(availableIds("knight", 9)).toEqual(
      expect.arrayContaining(["force-transcendence", "force-shift"]),
    );
    expect(availableIds("trooper", 9)).toEqual(
      expect.arrayContaining(["dimensional-jump-drive", "long-range-teleport"]),
    );
  });

  it("includes structured Force and Tech check bonuses in power check modifiers", () => {
    const now = new Date().toISOString();
    const character = characterSchema.parse({
      id: "force-check-character",
      schemaVersion: 1,
      rulesetId: starWarsShadowdarkRuleset.id,
      rulesetVersion: starWarsShadowdarkRuleset.version,
      name: "Force Checker",
      level: 1,
      abilities: {
        str: 10,
        dex: 10,
        con: 10,
        int: 14,
        wis: 10,
        cha: 10,
      },
      hp: {
        max: 6,
        current: 6,
      },
      speciesId: "duros",
      classId: "consular",
      subclassId: "sage",
      knownForcePowerIds: ["force-push"],
      startingGearIds: [],
      inventory: {
        credits: 0,
        entries: [],
      },
      resources: [],
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
            ],
            choiceSelections: [],
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

    const techCharacter = characterSchema.parse({
      ...character,
      id: "tech-check-character",
      classId: "trooper",
      subclassId: undefined,
      abilities: {
        ...character.abilities,
        con: 14,
        int: 10,
      },
      talentHistory: [
        {
          id: "tech-calibration",
          levelGained: 1,
          tableSource: "class",
          tableId: "trooper-talents",
          selectionMode: "manual",
          talentId: "tech-calibration",
          talent: {
            featureId: "tech-calibration",
            name: "Tech Calibration",
            description: "+2 to Tech checks.",
            effects: [
              {
                type: "powerCheckBonus",
                value: 2,
                target: { domain: "power", powerKind: "tech" },
              },
            ],
            choiceSelections: [],
          },
        },
      ],
    });

    expect(calculatePowerCheckModifier(character, starWarsShadowdarkRuleset)).toBe(4);
    expect(calculatePowerCheckModifier(techCharacter, starWarsShadowdarkRuleset)).toBe(4);
  });
});
