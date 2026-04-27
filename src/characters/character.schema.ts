import { z } from "zod";
import { effectSchema } from "../rules/rules.schema";

export const abilityScoresSchema = z.object({
  str: z.number().int().min(1).max(18),
  dex: z.number().int().min(1).max(18),
  con: z.number().int().min(1).max(18),
  int: z.number().int().min(1).max(18),
  wis: z.number().int().min(1).max(18),
  cha: z.number().int().min(1).max(18),
});

export const resourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  maxUses: z.number().int().min(1),
  usedUses: z.number().int().min(0),
  resetType: z.enum(["combat", "rest", "day", "manual"]),
  source: z.enum(["species", "class", "subclass", "talent", "custom"]),
});

export const inventoryEntrySchema = z.object({
  id: z.string().min(1),
  gearItemId: z.string().min(1).optional(),
  customName: z.string().min(1).optional(),
  quantity: z.number().int().min(1),
  slotsPerItem: z.number().min(0),
  carried: z.boolean(),
  equipped: z.boolean(),
  notes: z.string().optional(),
});

export const inventorySchema = z.object({
  credits: z.number().int().min(0).default(0),
  entries: z.array(inventoryEntrySchema).default([]),
});

export const talentRollSchema = z.object({
  expression: z.literal("2d6"),
  rolls: z.array(z.number().int().min(1).max(6)).length(2),
  total: z.number().int().min(2).max(12),
});

export const choiceSelectionSchema = z.object({
  choiceId: z.string().min(1),
  type: z.enum([
    "ability",
    "weaponCategory",
    "power",
    "talentSelectionGrant",
    "advancement",
    "textOption",
  ]),
  value: z.string().min(1),
  label: z.string().min(1),
});

export const talentSnapshotSchema = z.object({
  featureId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  effects: z.array(effectSchema).default([]),
  choiceSelections: z.array(choiceSelectionSchema).default([]),
});

export const characterTalentSchema = z.object({
  id: z.string().min(1),
  levelGained: z.number().int().min(1),
  tableSource: z.enum(["class", "subclass"]),
  tableId: z.string().min(1),
  selectionMode: z.enum(["rolled", "manual"]),
  roll: talentRollSchema.optional(),
  talentId: z.string().min(1),
  talent: talentSnapshotSchema,
});

export const hpGainSchema = z.object({
  id: z.string().min(1),
  levelGained: z.number().int().min(2),
  hitDie: z.enum(["d4", "d6", "d8", "d10", "d12"]),
  constitutionModifier: z.number().int(),
  roll: z.object({
    expression: z.string().min(1),
    rolls: z.array(z.number().int().min(1)),
    total: z.number().int(),
  }),
  gain: z.number().int().min(1),
});

export const characterSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  rulesetId: z.string().min(1),
  rulesetVersion: z.string().min(1),
  name: z.string().min(1),
  playerName: z.string().optional(),
  level: z.number().int().min(1),
  abilities: abilityScoresSchema,
  hp: z.object({
    max: z.number().int().min(1),
    current: z.number().int().min(0),
  }),
  notes: z.string().optional(),
  speciesId: z.string().min(1),
  speciesVariantId: z.string().optional(),
  classId: z.string().min(1),
  subclassId: z.string().optional(),
  knownForcePowerIds: z.array(z.string().min(1)).default([]),
  startingGearIds: z.array(z.string().min(1)).default([]),
  inventory: inventorySchema.default({
    credits: 0,
    entries: [],
  }),
  resources: z.array(resourceSchema).default([]),
  talentHistory: z.array(characterTalentSchema).default([]),
  hpGainHistory: z.array(hpGainSchema).default([]),
  backgroundId: z.string().optional(),
  customBackground: z.string().optional(),
  affinity: z.enum(["light", "neutral", "dark"]),
  viceId: z.string().optional(),
  customVice: z.string().optional(),
  destinyId: z.string().optional(),
  customDestiny: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type AbilityScores = z.infer<typeof abilityScoresSchema>;
export type CharacterResource = z.infer<typeof resourceSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type InventoryEntry = z.infer<typeof inventoryEntrySchema>;
export type ChoiceSelection = z.infer<typeof choiceSelectionSchema>;
export type CharacterTalent = z.infer<typeof characterTalentSchema>;
export type CharacterTalentRoll = z.infer<typeof talentRollSchema>;
export type HpGain = z.infer<typeof hpGainSchema>;
export type Character = z.infer<typeof characterSchema>;
