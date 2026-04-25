import type { Vice } from "../rules.schema";

export const vices = [
  ["attachment", "Attachment"],
  ["ambition", "Ambition"],
  ["duty", "Duty"],
  ["guilt", "Guilt"],
  ["kinship", "Kinship"],
  ["justice", "Justice"],
  ["pride", "Pride"],
  ["compassion", "Compassion"],
  ["fear", "Fear"],
  ["recklessness", "Recklessness"],
].map(([id, name]) => ({
  id,
  name,
  description: `${name} vice from the homebrew vice table.`,
})) satisfies Vice[];
