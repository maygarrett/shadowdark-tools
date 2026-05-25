import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
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

function expectUniqueNames(
  category: string,
  records: ReadonlyArray<{ name: string }>,
): void {
  const names = records.map((record) => record.name);
  const uniqueNames = new Set(names);

  expect(uniqueNames.size, `${category} names should be unique`).toBe(names.length);
}

function expectPower(id: string) {
  const power = starWarsShadowdarkRuleset.forcePowers.find(
    (option) => option.id === id,
  );

  expect(power, `${id} should exist`).toBeDefined();
  return power!;
}

const newSpellPowerPairs = [
  {
    spellId: "augury",
    spellName: "Augury",
    tier: 2,
    range: "Self",
    duration: "Instant",
    forceId: "force-premonition",
    forceName: "Force Premonition",
    techId: "predictive-analysis",
    techName: "Predictive Analysis",
  },
  {
    spellId: "acid-arrow",
    spellName: "Acid Arrow",
    tier: 2,
    range: "Far",
    duration: "Focus",
    focus: true,
    damage: "1d6/round",
    forceId: "corrosive-force-bolt",
    forceName: "Corrosive Force Bolt",
    techId: "acid-dart-launcher",
    techName: "Acid Dart Launcher",
  },
  {
    spellId: "alter-self",
    spellName: "Alter Self",
    tier: 2,
    range: "Self",
    duration: "5 rounds",
    forceId: "force-shapeshift",
    forceName: "Force Shapeshift",
    techId: "adaptive-disguise-matrix",
    techName: "Adaptive Disguise Matrix",
  },
  {
    spellId: "detect-thoughts",
    spellName: "Detect Thoughts",
    tier: 2,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "mind-probe",
    forceName: "Mind Probe",
    techId: "neural-scanner",
    techName: "Neural Scanner",
  },
  {
    spellId: "fixed-object",
    spellName: "Fixed Object",
    tier: 2,
    range: "Close",
    duration: "5 rounds",
    forceId: "force-anchor",
    forceName: "Force Anchor",
    techId: "magnetic-stabilizer",
    techName: "Magnetic Stabilizer",
  },
  {
    spellId: "hold-person",
    spellName: "Hold Person",
    tier: 2,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "force-stasis",
    forceName: "Force Stasis",
    techId: "paralysis-field",
    techName: "Paralysis Field",
  },
  {
    spellId: "invisibility",
    spellName: "Invisibility",
    tier: 2,
    range: "Close",
    duration: "10 rounds",
    forceId: "force-veil",
    forceName: "Force Veil",
    techId: "active-cloaking",
    techName: "Active Cloaking",
  },
  {
    spellId: "knock",
    spellName: "Knock",
    tier: 2,
    range: "Near",
    duration: "Instant",
    forceId: "force-breach",
    forceName: "Force Breach",
    techId: "auto-slicer-pulse",
    techName: "Auto-Slicer Pulse",
  },
  {
    spellId: "levitate",
    spellName: "Levitate",
    tier: 2,
    range: "Self",
    duration: "Focus",
    focus: true,
    forceId: "force-lift",
    forceName: "Force Lift",
    techId: "repulsor-lift",
    techName: "Repulsor Lift",
  },
  {
    spellId: "mirror-image",
    spellName: "Mirror Image",
    tier: 2,
    range: "Self",
    duration: "5 rounds",
    forceId: "force-echoes",
    forceName: "Force Echoes",
    techId: "holographic-duplicates",
    techName: "Holographic Duplicates",
  },
  {
    spellId: "misty-step",
    spellName: "Misty Step",
    tier: 2,
    range: "Self",
    duration: "Instant",
    forceId: "force-blink",
    forceName: "Force Blink",
    techId: "short-range-teleport",
    techName: "Short-Range Teleport",
  },
  {
    spellId: "silence",
    spellName: "Silence",
    tier: 2,
    range: "Far",
    duration: "Focus",
    focus: true,
    forceId: "null-presence",
    forceName: "Null Presence",
    techId: "sound-dampener-field",
    techName: "Sound Dampener Field",
  },
  {
    spellId: "web",
    spellName: "Web",
    tier: 2,
    range: "Far",
    duration: "5 rounds",
    forceId: "force-snare",
    forceName: "Force Snare",
    techId: "adhesive-net-launcher",
    techName: "Adhesive Net Launcher",
  },
  {
    spellId: "command",
    spellName: "Command",
    tier: 3,
    range: "Far",
    duration: "Focus",
    focus: true,
    forceId: "dominating-word",
    forceName: "Dominating Word",
    techId: "authority-override",
    techName: "Authority Override",
  },
  {
    spellId: "lay-to-rest",
    spellName: "Lay to Rest",
    tier: 3,
    range: "Close",
    duration: "Instant",
    forceId: "spirit-release",
    forceName: "Spirit Release",
    techId: "neural-shutdown-protocol",
    techName: "Neural Shutdown Protocol",
  },
  {
    spellId: "rebuke-unholy",
    spellName: "Rebuke Unholy",
    tier: 3,
    range: "Near",
    duration: "Instant",
    forceId: "force-repulsion",
    forceName: "Force Repulsion",
    techId: "anti-entity-pulse",
    techName: "Anti-Entity Pulse",
  },
  {
    spellId: "speak-with-dead",
    spellName: "Speak With Dead",
    tier: 3,
    range: "Close",
    duration: "Instant",
    forceId: "echoes-of-the-force",
    forceName: "Echoes of the Force",
    techId: "post-mortem-data-extraction",
    techName: "Post-Mortem Data Extraction",
  },
  {
    spellId: "dispel-magic",
    spellName: "Dispel Magic",
    tier: 3,
    range: "Near",
    duration: "Instant",
    forceId: "force-disruption",
    forceName: "Force Disruption",
    techId: "signal-jammer",
    techName: "Signal Jammer",
  },
  {
    spellId: "fabricate",
    spellName: "Fabricate",
    tier: 3,
    range: "Near",
    duration: "10 rounds",
    forceId: "force-construct",
    forceName: "Force Construct",
    techId: "rapid-fabricator",
    techName: "Rapid Fabricator",
  },
  {
    spellId: "fireball",
    spellName: "Fireball",
    tier: 3,
    range: "Far",
    duration: "Instant",
    damage: "4d6",
    forceId: "force-detonation",
    forceName: "Force Detonation",
    techId: "thermal-detonator-burst",
    techName: "Thermal Detonator Burst",
  },
  {
    spellId: "fly",
    spellName: "Fly",
    tier: 3,
    range: "Self",
    duration: "5 rounds",
    forceId: "force-glide",
    forceName: "Force Glide",
    techId: "jetpack-boost",
    techName: "Jetpack Boost",
  },
  {
    spellId: "gaseous-form",
    spellName: "Gaseous Form",
    tier: 3,
    range: "Self",
    duration: "10 rounds",
    forceId: "force-dissolution",
    forceName: "Force Dissolution",
    techId: "vapor-phase-shift",
    techName: "Vapor Phase Shift",
  },
  {
    spellId: "illusion",
    spellName: "Illusion",
    tier: 3,
    range: "Far",
    duration: "Focus",
    focus: true,
    forceId: "force-illusion",
    forceName: "Force Illusion",
    techId: "holo-projection",
    techName: "Holo-Projection",
  },
  {
    spellId: "lightning-bolt",
    spellName: "Lightning Bolt",
    tier: 3,
    range: "Far",
    duration: "Instant",
    damage: "3d6",
    forceId: "force-surge",
    forceName: "Force Surge",
    techId: "arc-discharge",
    techName: "Arc Discharge",
  },
  {
    spellId: "magic-circle",
    spellName: "Magic Circle",
    tier: 3,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "force-barrier-ring",
    forceName: "Force Barrier Ring",
    techId: "containment-field",
    techName: "Containment Field",
  },
  {
    spellId: "protection-from-energy",
    spellName: "Protection From Energy",
    tier: 3,
    range: "Close",
    duration: "Focus",
    focus: true,
    forceId: "force-resistance",
    forceName: "Force Resistance",
    techId: "energy-shield-matrix",
    techName: "Energy Shield Matrix",
  },
  {
    spellId: "sending",
    spellName: "Sending",
    tier: 3,
    range: "Unlimited",
    duration: "Instant",
    forceId: "force-transmission",
    forceName: "Force Transmission",
    techId: "encrypted-commlink",
    techName: "Encrypted Commlink",
  },
  {
    spellId: "commune",
    spellName: "Commune",
    tier: 4,
    range: "Self",
    duration: "Instant",
    forceId: "commune-with-the-force",
    forceName: "Commune with the Force",
    techId: "strategic-uplink",
    techName: "Strategic Uplink",
  },
  {
    spellId: "control-water",
    spellName: "Control Water",
    tier: 4,
    range: "Far",
    duration: "Focus",
    focus: true,
    forceId: "force-flow",
    forceName: "Force Flow",
    techId: "hydrokinesis-system",
    techName: "Hydrokinesis System",
  },
  {
    spellId: "flame-strike",
    spellName: "Flame Strike",
    tier: 4,
    range: "Far",
    duration: "Instant",
    damage: "2d6",
    forceId: "force-impact",
    forceName: "Force Impact",
    techId: "orbital-strike-beacon",
    techName: "Orbital Strike Beacon",
  },
  {
    spellId: "pillar-of-salt",
    spellName: "Pillar of Salt",
    tier: 4,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "force-petrify",
    forceName: "Force Petrify",
    techId: "molecular-freeze-ray",
    techName: "Molecular Freeze Ray",
  },
  {
    spellId: "wrath",
    spellName: "Wrath",
    tier: 4,
    range: "Self",
    duration: "10 rounds",
    damage: "+1d8",
    forceId: "force-judgment",
    forceName: "Force Judgment",
    techId: "overload-strike",
    techName: "Overload Strike",
  },
  {
    spellId: "arcane-eye",
    spellName: "Arcane Eye",
    tier: 4,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "force-sight-projection",
    forceName: "Force Sight Projection",
    techId: "recon-drone",
    techName: "Recon Drone",
  },
  {
    spellId: "cloudkill",
    spellName: "Cloudkill",
    tier: 4,
    range: "Far",
    duration: "5 rounds",
    damage: "2d6/round",
    forceId: "force-decay-field",
    forceName: "Force Decay Field",
    techId: "toxic-gas-deployment",
    techName: "Toxic Gas Deployment",
  },
  {
    spellId: "confusion",
    spellName: "Confusion",
    tier: 4,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "mind-fracture",
    forceName: "Mind Fracture",
    techId: "neural-scrambler",
    techName: "Neural Scrambler",
  },
  {
    spellId: "dimension-door",
    spellName: "Dimension Door",
    tier: 4,
    range: "Self",
    duration: "Instant",
    forceId: "force-rift",
    forceName: "Force Rift",
    techId: "phase-gate",
    techName: "Phase Gate",
  },
  {
    spellId: "divination",
    spellName: "Divination",
    tier: 4,
    range: "Self",
    duration: "Instant",
    forceId: "deep-premonition",
    forceName: "Deep Premonition",
    techId: "predictive-algorithm",
    techName: "Predictive Algorithm",
  },
  {
    spellId: "passwall",
    spellName: "Passwall",
    tier: 4,
    range: "Close",
    duration: "5 rounds",
    forceId: "phase-through",
    forceName: "Phase Through",
    techId: "matter-phasing-tool",
    techName: "Matter Phasing Tool",
  },
  {
    spellId: "polymorph",
    spellName: "Polymorph",
    tier: 4,
    range: "Close",
    duration: "10 rounds",
    forceId: "force-transformation",
    forceName: "Force Transformation",
    techId: "bio-remodeling-suite",
    techName: "Bio-Remodeling Suite",
  },
  {
    spellId: "resilient-sphere",
    spellName: "Resilient Sphere",
    tier: 4,
    range: "Close",
    duration: "5 rounds",
    forceId: "force-bubble",
    forceName: "Force Bubble",
    techId: "energy-containment-sphere",
    techName: "Energy Containment Sphere",
  },
  {
    spellId: "stoneskin",
    spellName: "Stoneskin",
    tier: 4,
    range: "Self",
    duration: "10 rounds",
    forceId: "force-harden",
    forceName: "Force Harden",
    techId: "reinforced-plating",
    techName: "Reinforced Plating",
  },
  {
    spellId: "telekinesis",
    spellName: "Telekinesis",
    tier: 4,
    range: "Far",
    duration: "Focus",
    focus: true,
    forceId: "advanced-telekinesis",
    forceName: "Advanced Telekinesis",
    techId: "grav-manipulator",
    techName: "Grav Manipulator",
  },
  {
    spellId: "wall-of-force",
    spellName: "Wall of Force",
    tier: 4,
    range: "Near",
    duration: "5 rounds",
    forceId: "force-wall",
    forceName: "Force Wall",
    techId: "hardlight-wall",
    techName: "Hardlight Wall",
  },
  {
    spellId: "divine-vengeance",
    spellName: "Divine Vengeance",
    tier: 5,
    range: "Self",
    duration: "10 rounds",
    forceId: "force-retribution",
    forceName: "Force Retribution",
    techId: "targeted-extermination-protocol",
    techName: "Targeted Extermination Protocol",
  },
  {
    spellId: "dominion",
    spellName: "Dominion",
    tier: 5,
    range: "Near",
    duration: "10 rounds",
    forceId: "total-domination",
    forceName: "Total Domination",
    techId: "system-override",
    techName: "System Override",
  },
  {
    spellId: "judgment",
    spellName: "Judgment",
    tier: 5,
    range: "Close",
    duration: "5 rounds",
    forceId: "final-judgment",
    forceName: "Final Judgment",
    techId: "execution-strike",
    techName: "Execution Strike",
  },
  {
    spellId: "plane-shift",
    spellName: "Plane Shift",
    tier: 5,
    range: "Close",
    duration: "Instant",
    forceId: "force-transcendence",
    forceName: "Force Transcendence",
    techId: "dimensional-jump-drive",
    techName: "Dimensional Jump Drive",
  },
  {
    spellId: "prophecy",
    spellName: "Prophecy",
    tier: 5,
    range: "Self",
    duration: "Instant",
    forceId: "grand-vision",
    forceName: "Grand Vision",
    techId: "future-simulation-engine",
    techName: "Future Simulation Engine",
  },
  {
    spellId: "antimagic-shell",
    spellName: "Antimagic Shell",
    tier: 5,
    range: "Self",
    duration: "Focus",
    focus: true,
    forceId: "force-null-field",
    forceName: "Force Null Field",
    techId: "energy-suppression-field",
    techName: "Energy Suppression Field",
  },
  {
    spellId: "disintegrate",
    spellName: "Disintegrate",
    tier: 5,
    range: "Far",
    duration: "Instant",
    damage: "3d8",
    forceId: "force-annihilation",
    forceName: "Force Annihilation",
    techId: "disintegration-beam",
    techName: "Disintegration Beam",
  },
  {
    spellId: "hold-monster",
    spellName: "Hold Monster",
    tier: 5,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "greater-stasis",
    forceName: "Greater Stasis",
    techId: "heavy-restraint-field",
    techName: "Heavy Restraint Field",
  },
  {
    spellId: "power-word-kill",
    spellName: "Power Word Kill",
    tier: 5,
    range: "Near",
    duration: "Instant",
    forceId: "death-word",
    forceName: "Death Word",
    techId: "neural-kill-command",
    techName: "Neural Kill Command",
  },
  {
    spellId: "prismatic-orb",
    spellName: "Prismatic Orb",
    tier: 5,
    range: "Far",
    duration: "Instant",
    damage: "3d8",
    forceId: "force-spectrum-burst",
    forceName: "Force Spectrum Burst",
    techId: "multi-phase-energy-orb",
    techName: "Multi-Phase Energy Orb",
  },
  {
    spellId: "scrying",
    spellName: "Scrying",
    tier: 5,
    range: "Self",
    duration: "Focus",
    focus: true,
    forceId: "force-vision",
    forceName: "Force Vision",
    techId: "surveillance-feed",
    techName: "Surveillance Feed",
  },
  {
    spellId: "shapechange",
    spellName: "Shapechange",
    tier: 5,
    range: "Self",
    duration: "Focus",
    focus: true,
    forceId: "perfect-transformation",
    forceName: "Perfect Transformation",
    techId: "advanced-morph-system",
    techName: "Advanced Morph System",
  },
  {
    spellId: "summon-extraplanar",
    spellName: "Summon Extraplanar",
    tier: 5,
    range: "Near",
    duration: "Focus",
    focus: true,
    forceId: "force-summoning",
    forceName: "Force Summoning",
    techId: "reinforcement-beacon",
    techName: "Reinforcement Beacon",
  },
  {
    spellId: "teleport",
    spellName: "Teleport",
    tier: 5,
    range: "Close",
    duration: "Instant",
    forceId: "force-shift",
    forceName: "Force Shift",
    techId: "long-range-teleport",
    techName: "Long-Range Teleport",
  },
] as const;

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
    expectUniqueIds("languages", starWarsShadowdarkRuleset.languages);
    expectUniqueIds("vices", starWarsShadowdarkRuleset.vices);
    expectUniqueIds("destinies", starWarsShadowdarkRuleset.destinies);
    expectUniqueIds("force powers", starWarsShadowdarkRuleset.forcePowers);
    expectUniqueNames("force powers", starWarsShadowdarkRuleset.forcePowers);
    expectUniqueIds("gear", starWarsShadowdarkRuleset.gear);
    expectUniqueIds("features", starWarsShadowdarkRuleset.features);
    expectUniqueIds("talent tables", starWarsShadowdarkRuleset.talentTables);
  });

  it("uses real feature text for populated character rules", () => {
    const placeholderPattern = /placeholder|rule text placeholder|from the homebrew/i;

    for (const feature of starWarsShadowdarkRuleset.features) {
      expect(
        feature.description,
        `${feature.id} should not use generated placeholder text`,
      ).not.toMatch(placeholderPattern);

      for (const effect of feature.effects) {
        if (effect.type === "customText") {
          expect(
            effect.text,
            `${feature.id} custom text should not use generated placeholder text`,
          ).not.toMatch(placeholderPattern);
        }
      }
    }
  });

  it("resolves feature IDs used by species, variants, classes, subclasses, and backgrounds", () => {
    const featureIds = new Set(starWarsShadowdarkRuleset.features.map((feature) => feature.id));
    const featureSources = [
      ...starWarsShadowdarkRuleset.species,
      ...starWarsShadowdarkRuleset.speciesVariants,
      ...starWarsShadowdarkRuleset.classes,
      ...starWarsShadowdarkRuleset.subclasses,
      ...starWarsShadowdarkRuleset.backgrounds,
    ];

    for (const source of featureSources) {
      expect(source.featureIds.length, `${source.id} should have feature IDs`).toBeGreaterThan(0);

      for (const featureId of source.featureIds) {
        expect(
          featureIds.has(featureId),
          `${source.id} references missing feature ${featureId}`,
        ).toBe(true);
      }
    }
  });

  it("resolves language IDs used by species and variants", () => {
    const languageIds = new Set(
      starWarsShadowdarkRuleset.languages.map((language) => language.id),
    );
    const languageSources = [
      ...starWarsShadowdarkRuleset.species,
      ...starWarsShadowdarkRuleset.speciesVariants,
    ];

    for (const source of languageSources) {
      for (const languageId of source.grantedLanguageIds ?? []) {
        expect(
          languageIds.has(languageId),
          `${source.id} references missing language ${languageId}`,
        ).toBe(true);
      }
    }
  });

  it("defines strict additional language counts from species rules", () => {
    const droidProtocol = starWarsShadowdarkRuleset.speciesVariants.find(
      (variant) => variant.id === "droid-protocol",
    );
    const droidAssassin = starWarsShadowdarkRuleset.speciesVariants.find(
      (variant) => variant.id === "droid-hk-assassin",
    );
    const zabrak = starWarsShadowdarkRuleset.species.find(
      (species) => species.id === "zabrak",
    );
    const togruta = starWarsShadowdarkRuleset.species.find(
      (species) => species.id === "togruta",
    );

    expect(droidProtocol?.additionalLanguageCount).toBe(3);
    expect(droidAssassin?.additionalLanguageCount).toBe(1);
    expect(zabrak?.additionalLanguageCount).toBe(1);
    expect(togruta?.additionalLanguageCount).toBe(1);
  });

  it("represents major species restrictions and overrides in rules data", () => {
    const mechanicalBody = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "mechanical-body",
    );
    const wayOfTheWarrior = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "way-of-the-warrior",
    );

    expect(mechanicalBody?.description).toMatch(/cannot play Knight or Consular/i);
    expect(wayOfTheWarrior?.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "proficiencyOverride" }),
      ]),
    );
    expect(wayOfTheWarrior?.description).toMatch(/cannot begin play Force-sensitive/i);
  });

  it("defines choice requirements for choice-based talents and Human Adaptive", () => {
    const adaptive = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "adaptive",
    );
    const guardianForm = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "talent-guardian-form",
    );
    const trooperWeaponMastery = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "talent-trooper-weapon-mastery",
    );
    const forcePrecision = starWarsShadowdarkRuleset.features.find(
      (feature) => feature.id === "talent-sage-force-precision",
    );

    expect(adaptive?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "talentSelectionGrant", level: 1, count: 1 }),
      ]),
    );
    expect(guardianForm?.choices).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "ability" })]),
    );
    expect(trooperWeaponMastery?.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "weaponCategory",
          attackBonus: 1,
          damageBonus: 1,
        }),
      ]),
    );
    expect(forcePrecision?.choices).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "power" })]),
    );
  });

  it("requires explicit choices for talent descriptions with player-facing OR options", () => {
    const unresolvedChoicePattern = /\bOR\b/;
    const narrativeExceptions = [/melee or ranged weapon/i];

    for (const feature of starWarsShadowdarkRuleset.features.filter(
      (option) => option.kind === "talent",
    )) {
      if (
        unresolvedChoicePattern.test(feature.description) &&
        !narrativeExceptions.some((exception) => exception.test(feature.description))
      ) {
        expect(
          feature.choices.length,
          `${feature.id} should lock in its OR choice`,
        ).toBeGreaterThan(0);
      }
    }
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

  it("uses valid packaged image paths for rules options", () => {
    const imageSources = [
      ...starWarsShadowdarkRuleset.species,
      ...starWarsShadowdarkRuleset.speciesVariants,
      ...starWarsShadowdarkRuleset.classes,
      ...starWarsShadowdarkRuleset.subclasses,
    ].filter((option) => option.imagePath);

    for (const option of imageSources) {
      expect(option.imagePath, `${option.id} image should use packaged ruleset assets`).toMatch(
        /^images\/ruleset\//,
      );
      expect(
        existsSync(path.join(process.cwd(), "public", option.imagePath!)),
        `${option.id} image file should exist`,
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

  it("includes new allowed tier 1 spell-derived power metadata", () => {
    expect(expectPower("thermal-burst")).toMatchObject({
      name: "Thermal Burst",
      kind: "force",
      source: "shadowdark-derived",
      derivedFromSpellId: "burning-hands",
      derivedFromSpellName: "Burning Hands",
      approval: "allowed",
      excluded: false,
      tier: 1,
      range: "Close",
      duration: "Instant",
      damage: "1d6",
      tags: expect.arrayContaining(["damage", "fire", "area"]),
    });
    expect(expectPower("flame-projector")).toMatchObject({
      name: "Flame Projector",
      kind: "tech",
      source: "shadowdark-derived",
      derivedFromSpellId: "burning-hands",
      derivedFromSpellName: "Burning Hands",
      approval: "allowed",
      excluded: false,
      tier: 1,
      range: "Close",
      duration: "Instant",
      damage: "1d6",
      tags: expect.arrayContaining(["damage", "fire", "area"]),
    });
    expect(expectPower("force-imbue")).toMatchObject({
      name: "Force Imbue",
      kind: "force",
      source: "shadowdark-derived",
      derivedFromSpellId: "holy-weapon",
      derivedFromSpellName: "Holy Weapon",
      approval: "allowed",
      excluded: false,
      tier: 1,
      range: "Close",
      duration: "5 rounds",
    });
    expect(expectPower("energized-weapon")).toMatchObject({
      name: "Energized Weapon",
      kind: "tech",
      source: "shadowdark-derived",
      derivedFromSpellId: "holy-weapon",
      derivedFromSpellName: "Holy Weapon",
      approval: "allowed",
      excluded: false,
      tier: 1,
      range: "Close",
      duration: "5 rounds",
    });
    expect(expectPower("personal-shield")).toMatchObject({
      name: "Personal Shield",
      kind: "tech",
      source: "shadowdark-derived",
      derivedFromSpellId: "shield-of-faith",
      derivedFromSpellName: "Shield of Faith",
      approval: "allowed",
      excluded: false,
      tier: 1,
      range: "Close",
      duration: "Focus",
      focus: true,
    });
  });

  it("includes new allowed tier 2-5 spell-derived power pairs", () => {
    for (const spec of newSpellPowerPairs) {
      const expectedSharedMetadata = {
        source: "shadowdark-derived",
        derivedFromSpellId: spec.spellId,
        derivedFromSpellName: spec.spellName,
        approval: "allowed",
        excluded: false,
        tier: spec.tier,
        range: spec.range,
        duration: spec.duration,
        availability: expect.any(Array),
      };
      const forcePower = expectPower(spec.forceId);
      const techPower = expectPower(spec.techId);

      expect(forcePower).toMatchObject({
        ...expectedSharedMetadata,
        name: spec.forceName,
        kind: "force",
        availability: ["force"],
      });
      expect(techPower).toMatchObject({
        ...expectedSharedMetadata,
        name: spec.techName,
        kind: "tech",
        availability: ["tech"],
      });

      if ("focus" in spec && spec.focus) {
        expect(forcePower.focus, `${spec.forceId} should require focus`).toBe(true);
        expect(techPower.focus, `${spec.techId} should require focus`).toBe(true);
      } else {
        expect(forcePower.focus, `${spec.forceId} should not require focus`).not.toBe(true);
        expect(techPower.focus, `${spec.techId} should not require focus`).not.toBe(true);
      }

      if ("damage" in spec) {
        expect(forcePower.damage).toBe(spec.damage);
        expect(techPower.damage).toBe(spec.damage);
      }
    }

    expect(expectPower("force-wall")).toMatchObject({
      name: "Force Wall",
      derivedFromSpellId: "wall-of-force",
    });
    expect(
      starWarsShadowdarkRuleset.forcePowers.filter(
        (power) => power.derivedFromSpellId === "plane-shift",
      ),
    ).toHaveLength(2);
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
