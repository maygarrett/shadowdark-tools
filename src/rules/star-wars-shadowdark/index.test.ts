import { describe, expect, it } from "vitest";
import { validateTalentTables } from "../../characters/talents";
import { rulesetSchema } from "../rules.schema";
import { starWarsShadowdarkRuleset } from ".";

function expectUniqueIds(
  category: string,
  records: ReadonlyArray<{ id: string }>,
): void {
  const ids = records.map((record) => record.id);
  const uniqueIds = new Set(ids);

  expect(uniqueIds.size, `${category} IDs should be unique`).toBe(ids.length);
}

describe("Star Wars Shadowdark ruleset data", () => {
  it("passes zod validation", () => {
    expect(() => rulesetSchema.parse(starWarsShadowdarkRuleset)).not.toThrow();
  });

  it("has unique IDs within each category", () => {
    expectUniqueIds("species", starWarsShadowdarkRuleset.species);
    expectUniqueIds("species variants", starWarsShadowdarkRuleset.speciesVariants);
    expectUniqueIds("classes", starWarsShadowdarkRuleset.classes);
    expectUniqueIds("subclasses", starWarsShadowdarkRuleset.subclasses);
    expectUniqueIds("backgrounds", starWarsShadowdarkRuleset.backgrounds);
    expectUniqueIds("vices", starWarsShadowdarkRuleset.vices);
    expectUniqueIds("destinies", starWarsShadowdarkRuleset.destinies);
    expectUniqueIds("force powers", starWarsShadowdarkRuleset.forcePowers);
    expectUniqueIds("gear", starWarsShadowdarkRuleset.gear);
    expectUniqueIds("features", starWarsShadowdarkRuleset.features);
    expectUniqueIds("talent tables", starWarsShadowdarkRuleset.talentTables);
  });

  it("resolves class subclass references", () => {
    const subclassIds = new Set(
      starWarsShadowdarkRuleset.subclasses.map((subclass) => subclass.id),
    );
    const classIds = new Set(
      starWarsShadowdarkRuleset.classes.map((characterClass) => characterClass.id),
    );

    for (const characterClass of starWarsShadowdarkRuleset.classes) {
      for (const subclassId of characterClass.subclassIds) {
        expect(
          subclassIds.has(subclassId),
          `${characterClass.id} references missing subclass ${subclassId}`,
        ).toBe(true);
      }
    }

    for (const subclass of starWarsShadowdarkRuleset.subclasses) {
      expect(
        classIds.has(subclass.classId),
        `${subclass.id} references missing class ${subclass.classId}`,
      ).toBe(true);
    }
  });

  it("resolves gear IDs used by class starting gear", () => {
    const gearIds = new Set(starWarsShadowdarkRuleset.gear.map((item) => item.id));

    for (const characterClass of starWarsShadowdarkRuleset.classes) {
      for (const gearId of characterClass.startingGearIds) {
        expect(
          gearIds.has(gearId),
          `${characterClass.id} references missing gear ${gearId}`,
        ).toBe(true);
      }
    }
  });

  it("includes inventory metadata for gear items", () => {
    for (const item of starWarsShadowdarkRuleset.gear) {
      expect(
        typeof item.slotsPerItem,
        `${item.id} should define slotsPerItem`,
      ).toBe("number");
      expect(item.slotsPerItem, `${item.id} slots should be non-negative`).toBeGreaterThanOrEqual(0);

      if (item.category === "weapon") {
        expect(item.equippable, `${item.id} should be equippable`).toBe(true);
        expect(item.equipmentSlot).toBe("weapon");
        expect(item.damage, `${item.id} should define damage`).toBeTruthy();
        expect(item.attackAbility, `${item.id} should define attack ability`).toBeTruthy();
        expect(item.weaponRangeType, `${item.id} should define range type`).toBeTruthy();
        expect(item.weaponCategory, `${item.id} should define weapon category`).toBeTruthy();
        expect(typeof item.hands, `${item.id} should define hands`).toBe("number");
      }

      if (item.category === "armor") {
        expect(item.equippable, `${item.id} should be equippable`).toBe(true);
        expect(item.equipmentSlot).toBe("armor");
        expect(item.armorCategory, `${item.id} should define armor category`).toBeTruthy();
      }
    }
  });

  it("includes valid power metadata and class casting rules", () => {
    const validAbilities = new Set(["str", "dex", "con", "int", "wis", "cha"]);
    const validPowerSources = new Set(["force", "tech", "none"]);
    const validProgressions = new Set(["knight", "priest", "half-level", "none"]);
    const powerIds = new Set(starWarsShadowdarkRuleset.forcePowers.map((power) => power.id));

    expect(powerIds.size).toBe(starWarsShadowdarkRuleset.forcePowers.length);

    for (const power of starWarsShadowdarkRuleset.forcePowers) {
      expect(["force", "tech"]).toContain(power.kind);
      expect(power.tier).toBeGreaterThanOrEqual(1);
      expect(power.description).toBeTruthy();

      if (!power.excluded) {
        expect(["star-wars-homebrew", "shadowdark-derived"]).toContain(power.source);
        expect(power.availability.length).toBeGreaterThan(0);
        expect(["allowed", "gm-approval"]).toContain(power.approval);
      }
    }

    expect(starWarsShadowdarkRuleset.forcePowers.find((power) => power.id === "excluded-cure-wounds")).toMatchObject({
      excluded: true,
      exclusionReason: "healing",
    });

    for (const characterClass of starWarsShadowdarkRuleset.classes) {
      expect(validPowerSources.has(characterClass.powerSource)).toBe(true);
      expect(validProgressions.has(characterClass.knownPowerProgression)).toBe(true);

      if ((characterClass.powerSource as string) !== "none") {
        expect(
          characterClass.castingAbility &&
            validAbilities.has(characterClass.castingAbility),
        ).toBe(true);
      }
    }

    expect(
      starWarsShadowdarkRuleset.subclasses.find((subclass) => subclass.id === "sage")
        ?.knownPowerBonusAtLevel1,
    ).toBe(1);
  });

  it("includes valid talent table roll coverage", () => {
    expect(validateTalentTables(starWarsShadowdarkRuleset)).toEqual([]);
  });

  it("catches talent table gaps and overlaps", () => {
    const brokenRuleset = {
      ...starWarsShadowdarkRuleset,
      talentTables: [
        {
          ...starWarsShadowdarkRuleset.talentTables[0],
          id: "broken-talents",
          entries: [
            { id: "one", min: 2, max: 4, featureId: "talent-knight-shielded-mind" },
            { id: "two", min: 4, max: 5, featureId: "talent-knight-weapon-mastery" },
          ],
        },
      ],
    };

    expect(validateTalentTables(brokenRuleset)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("overlaps roll 4"),
        expect.stringContaining("missing roll 6"),
      ]),
    );
  });

  it("documents the Agent talent table source ambiguity", () => {
    const agentTable = starWarsShadowdarkRuleset.talentTables.find(
      (table) => table.id === "agent-talents",
    );

    expect(agentTable?.entries.map((entry) => [entry.min, entry.max])).toEqual([
      [2, 2],
      [3, 3],
      [4, 6],
      [7, 9],
      [10, 10],
      [11, 11],
      [12, 12],
    ]);
  });
});
