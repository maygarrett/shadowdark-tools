import { describe, expect, it } from "vitest";
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
});
