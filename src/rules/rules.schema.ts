import { z } from "zod";

export const rulesetSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  name: z.string().min(1),
});

export type Ruleset = z.infer<typeof rulesetSchema>;
