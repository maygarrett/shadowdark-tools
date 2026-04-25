import { z } from "zod";

const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const hitDieSchema = z.enum(["d4", "d6", "d8", "d10", "d12"]);

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
    target: z.string().optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("damageBonus"),
    value: z.number().int(),
    target: z.string().optional(),
    condition: z.string().optional(),
  }),
  z.object({
    type: z.literal("advantage"),
    target: z.string().min(1),
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
});

export const speciesVariantSchema = z.object({
  id: idSchema,
  speciesId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  featureIds: z.array(idSchema).default([]),
});

export const speciesSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  variantIds: z.array(idSchema).default([]),
  featureIds: z.array(idSchema).default([]),
});

export const subclassSchema = z.object({
  id: idSchema,
  classId: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  featureIds: z.array(idSchema).default([]),
});

export const classSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  hitDie: hitDieSchema,
  subclassIds: z.array(idSchema).default([]),
  featureIds: z.array(idSchema).default([]),
  startingGearIds: z.array(idSchema).default([]),
});

export const backgroundSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  featureIds: z.array(idSchema).default([]),
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
  tier: z.number().int().min(1).max(5),
  description: z.string().min(1),
  featureIds: z.array(idSchema).default([]),
});

export const gearItemSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  category: z.enum(["weapon", "armor", "equipment", "consumable"]),
  tags: z.array(z.string().min(1)).default([]),
  damage: z.string().optional(),
  acBonus: z.number().int().optional(),
  costCredits: z.number().int().nonnegative().optional(),
  costText: z.string().optional(),
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
  vices: z.array(viceSchema).default([]),
  destinies: z.array(destinySchema).default([]),
  forcePowers: z.array(forcePowerSchema).default([]),
  gear: z.array(gearItemSchema).default([]),
  features: z.array(featureSchema).default([]),
});

export type Effect = z.infer<typeof effectSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type Species = z.infer<typeof speciesSchema>;
export type SpeciesVariant = z.infer<typeof speciesVariantSchema>;
export type CharacterClass = z.infer<typeof classSchema>;
export type Subclass = z.infer<typeof subclassSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Vice = z.infer<typeof viceSchema>;
export type Destiny = z.infer<typeof destinySchema>;
export type ForcePower = z.infer<typeof forcePowerSchema>;
export type GearItem = z.infer<typeof gearItemSchema>;
export type Ruleset = z.infer<typeof rulesetSchema>;
