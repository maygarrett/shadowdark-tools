import { z } from "zod";

export const abilityScoresSchema = z.object({
  str: z.number().int().min(1).max(18),
  dex: z.number().int().min(1).max(18),
  con: z.number().int().min(1).max(18),
  int: z.number().int().min(1).max(18),
  wis: z.number().int().min(1).max(18),
  cha: z.number().int().min(1).max(18),
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
export type Character = z.infer<typeof characterSchema>;
