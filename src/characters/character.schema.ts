import { z } from "zod";

export const abilityScoresSchema = z.object({
  str: z.number().int().min(1).max(20),
  dex: z.number().int().min(1).max(20),
  con: z.number().int().min(1).max(20),
  int: z.number().int().min(1).max(20),
  wis: z.number().int().min(1).max(20),
  cha: z.number().int().min(1).max(20),
});

export const characterSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  rulesetId: z.string().min(1),
  name: z.string().min(1),
  level: z.number().int().min(1),
  abilities: abilityScoresSchema,
});

export type AbilityScores = z.infer<typeof abilityScoresSchema>;
export type Character = z.infer<typeof characterSchema>;
