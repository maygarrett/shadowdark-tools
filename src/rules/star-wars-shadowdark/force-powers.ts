import type { ForcePower } from "../rules.schema";

const forcePowerSeeds = [
  ["force-push", "Force Push", 1],
  ["force-pull", "Force Pull", 1],
  ["force-speed", "Force Speed", 1],
  ["force-jump", "Force Jump", 2],
  ["telekinesis", "Telekinesis", 2],
  ["mind-trick", "Mind Trick", 2],
  ["force-lightning", "Force Lightning", 3],
  ["force-choke", "Force Choke", 4],
  ["lightsaber-throw", "Lightsaber Throw", 5],
] as const;

export const forcePowers = forcePowerSeeds.map(([id, name, tier]) => ({
  id,
  name,
  tier,
  description: `${name} force power from the homebrew force powers list.`,
  featureIds: [],
})) satisfies ForcePower[];
