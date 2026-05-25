import { z } from "zod";

const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const hitDieSchema = z.enum(["d4", "d6", "d8", "d10", "d12"]);
const abilitySchema = z.enum(["str", "dex", "con", "int", "wis", "cha"]);
const powerSourceSchema = z.enum(["force", "tech", "none"]);
const knownPowerProgressionSchema = z.enum([
  "knight",
  "priest",
  "half-level",
  "none",
]);
const weaponAttackAbilitySchema = z.enum(["str", "dex", "best-str-dex"]);
const weaponRangeTypeSchema = z.enum(["melee", "ranged", "thrown"]);
const armorProficiencySchema = z.enum(["none", "light", "medium", "heavy", "tech"]);
const effectTargetSchema = z.object({
  domain: z
    .enum(["attack", "damage", "ac", "check", "power", "defense", "proficiency"])
    .optional(),
  tags: z.array(z.string().min(1)).optional(),
  ids: z.array(idSchema).optional(),
  ability: abilitySchema.optional(),
  powerKind: z.enum(["force", "tech"]).optional(),
});
const effectTargetValueSchema = z.union([z.string().min(1), effectTargetSchema]);
export const effectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("customText"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("abilityBonus"),
    ability: z.enum(["str", "dex", "con", "int", "wis", "cha"]),
    value: z.number().int(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("acBonus"),
    value: z.number().int(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("hpBonus"),
    value: z.number().int(),
    perLevel: z.boolean().default(false),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("attackBonus"),
    value: z.number().int(),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("damageBonus"),
    value: z.number().int(),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("checkBonus"),
    value: z.number().int(),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("powerCheckBonus"),
    value: z.number().int(),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("dcBonus"),
    value: z.number().int(),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("damageDiceBonus"),
    dice: z.string().min(1),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("proficiencyOverride"),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("rollMode"),
    mode: z.enum(["advantage", "disadvantage"]),
    target: effectTargetValueSchema.optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("advantage"),
    target: effectTargetValueSchema,
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("grantLanguage"),
    language: z.string().min(1),
  }),
  z.object({
    type: z.literal("grantProficiency"),
    proficiency: z.string().min(1),
  }),
  z.object({
    type: z.literal("grantResource"),
    resourceId: idSchema,
  }),
  z.object({
    type: z.literal("grantKnownPower"),
    forcePowerId: idSchema,
  }),
]);

const featureChoiceOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  effects: z.array(effectSchema).default([]),
});

export const featureChoiceSchema = z.discriminatedUnion("type", [
  z.object({
    id: idSchema,
    type: z.literal("ability"),
    label: z.string().min(1),
    options: z.array(abilitySchema).min(1),
    value: z.number().int(),
    permanent: z.boolean().default(true),
  }),
  z.object({
    id: idSchema,
    type: z.literal("weaponCategory"),
    label: z.string().min(1),
    options: z.array(z.string().min(1)).min(1),
    attackBonus: z.number().int().default(0),
    damageBonus: z.number().int().default(0),
    proficiencyOverride: z.boolean().default(false),
  }),
  z.object({
    id: idSchema,
    type: z.literal("power"),
    label: z.string().min(1),
    powerKind: z.enum(["force", "tech"]).optional(),
    effect: z.enum(["advantage", "powerCheckBonus", "grantKnownPower"]).default(
      "advantage",
    ),
    value: z.number().int().optional(),
  }),
  z.object({
    id: idSchema,
    type: z.literal("talentSelectionGrant"),
    label: z.string().min(1),
    level: z.number().int().min(1),
    count: z.number().int().min(1),
  }),
  z.object({
    id: idSchema,
    type: z.literal("advancement"),
    label: z.string().min(1),
    abilityOptions: z.array(abilitySchema).min(1),
    abilityValue: z.number().int().default(2),
    talentCount: z.number().int().min(1).default(1),
  }),
  z.object({
    id: idSchema,
    type: z.literal("textOption"),
    label: z.string().min(1),
    options: z.array(featureChoiceOptionSchema).min(1),
  }),
]);

export const featureSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  kind: z.enum([
    "species",
    "class",
    "subclass",
    "background",
    "talent",
    "force",
    "gear",
    "general",
  ]),
  description: z.string().min(1),
  effects: z.array(effectSchema).default([]),
  choices: z.array(featureChoiceSchema).default([]),
});

export const speciesVariantSchema = z.object({
  id: idSchema,
  speciesId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  imagePath: z.string().min(1).optional(),
  featureIds: z.array(idSchema).default([]),
  grantedLanguageIds: z.array(idSchema).default([]),
  additionalLanguageCount: z.number().int().min(0).default(0),
  languageNotes: z.array(z.string().min(1)).default([]),
});

export const speciesSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  imagePath: z.string().min(1).optional(),
  variantIds: z.array(idSchema).default([]),
  featureIds: z.array(idSchema).default([]),
  grantedLanguageIds: z.array(idSchema).default([]),
  additionalLanguageCount: z.number().int().min(0).default(0),
  languageNotes: z.array(z.string().min(1)).default([]),
});

export const subclassSchema = z.object({
  id: idSchema,
  classId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  imagePath: z.string().min(1).optional(),
  featureIds: z.array(idSchema).default([]),
  knownPowerBonusAtLevel1: z.number().int().min(0).default(0),
});

export const talentTableEntrySchema = z.object({
  id: idSchema,
  min: z.number().int().min(2).max(12),
  max: z.number().int().min(2).max(12),
  featureId: idSchema,
});

export const talentTableSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  source: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("class"),
      classId: idSchema,
    }),
    z.object({
      type: z.literal("subclass"),
      classId: idSchema,
      subclassId: idSchema,
    }),
  ]),
  rollExpression: z.literal("2d6").default("2d6"),
  entries: z.array(talentTableEntrySchema).min(1),
});

export const classSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  imagePath: z.string().min(1).optional(),
  hitDie: hitDieSchema,
  subclassIds: z.array(idSchema).default([]),
  featureIds: z.array(idSchema).default([]),
  startingGearIds: z.array(idSchema).default([]),
  powerSource: powerSourceSchema.default("none"),
  castingAbility: abilitySchema.optional(),
  knownPowerProgression: knownPowerProgressionSchema.default("none"),
  requiresForcePointToCast: z.boolean().default(false),
  weaponProficiencyTags: z.array(z.string().min(1)).default([]),
  armorProficiencyCategories: z.array(armorProficiencySchema).default([]),
});

export const backgroundSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  featureIds: z.array(idSchema).default([]),
});

export const languageSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
});

export const viceSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
});

export const destinySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  side: z.enum(["light", "dark"]),
  description: z.string().min(1),
});

export const forcePowerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  kind: z.enum(["force", "tech"]).default("force"),
  source: z.enum(["star-wars-homebrew", "shadowdark-derived"]).default(
    "star-wars-homebrew",
  ),
  availability: z.array(z.enum(["force", "tech"])).default(["force"]),
  derivedFromSpellId: idSchema.optional(),
  derivedFromSpellName: z.string().min(1).optional(),
  approval: z.enum(["allowed", "gm-approval"]).default("allowed"),
  excluded: z.boolean().default(false),
  exclusionReason: z
    .enum(["healing", "too-fantasy", "divine-specific", "duplicate", "other"])
    .optional(),
  tier: z.number().int().min(1).max(5),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  notes: z.string().optional(),
  range: z.string().min(1).optional(),
  duration: z.string().min(1).optional(),
  focus: z.boolean().optional(),
  damage: z.string().min(1).optional(),
  mechanics: z.string().min(1).optional(),
  featureIds: z.array(idSchema).default([]),
});

export const gearItemSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  category: z.enum(["weapon", "armor", "equipment", "consumable"]),
  tags: z.array(z.string().min(1)).default([]),
  slotsPerItem: z.number().min(0).default(1),
  equippable: z.boolean().default(false),
  equipmentSlot: z.enum(["weapon", "armor", "other"]).optional(),
  attackAbility: weaponAttackAbilitySchema.optional(),
  weaponRangeType: weaponRangeTypeSchema.optional(),
  weaponCategory: z.string().min(1).optional(),
  hands: z.number().int().min(0).max(2).optional(),
  attackNotes: z.string().optional(),
  damage: z.string().optional(),
  acBonus: z.number().int().optional(),
  armorCategory: z.enum(["none", "light", "medium", "heavy", "tech"]).optional(),
  effects: z.array(effectSchema).optional(),
  costCredits: z.number().int().nonnegative().optional(),
  costText: z.string().optional(),
  notes: z.string().optional(),
  description: z.string().min(1),
});

export const rulesetSchema = z.object({
  id: idSchema,
  version: z.string().min(1),
  name: z.string().min(1),
  species: z.array(speciesSchema).default([]),
  speciesVariants: z.array(speciesVariantSchema).default([]),
  classes: z.array(classSchema).default([]),
  subclasses: z.array(subclassSchema).default([]),
  backgrounds: z.array(backgroundSchema).default([]),
  languages: z.array(languageSchema).default([]),
  vices: z.array(viceSchema).default([]),
  destinies: z.array(destinySchema).default([]),
  forcePowers: z.array(forcePowerSchema).default([]),
  gear: z.array(gearItemSchema).default([]),
  features: z.array(featureSchema).default([]),
  talentTables: z.array(talentTableSchema).default([]),
});

export type Effect = z.infer<typeof effectSchema>;
export type EffectTarget = z.infer<typeof effectTargetSchema>;
export type EffectTargetValue = z.infer<typeof effectTargetValueSchema>;
export type FeatureChoice = z.infer<typeof featureChoiceSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type TalentTable = z.infer<typeof talentTableSchema>;
export type TalentTableEntry = z.infer<typeof talentTableEntrySchema>;
export type Species = z.infer<typeof speciesSchema>;
export type SpeciesVariant = z.infer<typeof speciesVariantSchema>;
export type CharacterClass = z.infer<typeof classSchema>;
export type Subclass = z.infer<typeof subclassSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Vice = z.infer<typeof viceSchema>;
export type Destiny = z.infer<typeof destinySchema>;
export type ForcePower = z.infer<typeof forcePowerSchema>;
export type GearItem = z.infer<typeof gearItemSchema>;
export type Ruleset = z.infer<typeof rulesetSchema>;
