import { describe, expect, it } from "vitest";
import {
  getAvailablePowersForClass,
  getCastingAbility,
  getKnownPowerLimit,
  getPowerSource,
} from "./powers";
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
});
