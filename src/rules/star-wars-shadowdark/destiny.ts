import type { Destiny } from "../rules.schema";

const destinySeeds = [
  {
    id: "light-save-defined-threat",
    name: "Save a person, community, or group from a defined threat",
    side: "light",
  },
  {
    id: "light-redeem-fallen",
    name: "Redeem someone who is falling or has fallen",
    side: "light",
  },
  {
    id: "light-broker-peace",
    name: "Broker peace between named factions or families",
    side: "light",
  },
  {
    id: "light-recover-lost-truth",
    name: "Recover a lost artifact or truth for those in need",
    side: "light",
  },
  {
    id: "light-overthrow-without-lethal-force",
    name: "Overthrow corruption without lethal force",
    side: "light",
  },
  {
    id: "light-mentor-major-goal",
    name: "Mentor someone to achieve a major goal",
    side: "light",
  },
  {
    id: "light-repair-relationship",
    name: "Repair a broken relationship",
    side: "light",
  },
  {
    id: "light-protect-sacred-vulnerable",
    name: "Protect something sacred or vulnerable",
    side: "light",
  },
  {
    id: "light-expose-injustice",
    name: "Expose a harmful lie, conspiracy, or injustice",
    side: "light",
  },
  {
    id: "light-endure-vice-trial",
    name: "Endure a Vice trial and choose mercy or restraint",
    side: "light",
  },
  {
    id: "dark-eliminate-past-weakness",
    name: "Eliminate someone who represents past weakness",
    side: "dark",
  },
  {
    id: "dark-seize-control-through-fear",
    name: "Seize control through fear or dominance",
    side: "dark",
  },
  {
    id: "dark-corrupt-trusting-person",
    name: "Corrupt someone who trusts you",
    side: "dark",
  },
  {
    id: "dark-unleash-forbidden-power",
    name: "Unleash a dangerous artifact or forbidden secret",
    side: "dark",
  },
  {
    id: "dark-betray-party",
    name: "Betray the party to advance your ambition",
    side: "dark",
  },
  {
    id: "dark-destroy-past-meaning",
    name: "Destroy something meaningful from your past",
    side: "dark",
  },
  {
    id: "dark-ensure-downfall",
    name: "Ensure the downfall of someone you once cared for",
    side: "dark",
  },
  {
    id: "dark-sacrifice-for-power",
    name: "Sacrifice something irreplaceable for power",
    side: "dark",
  },
  {
    id: "dark-escalate-conflict",
    name: "Trigger or escalate a harmful conflict",
    side: "dark",
  },
  {
    id: "dark-die-terrible-victory",
    name: "Die achieving a terrible victory",
    side: "dark",
  },
] as const;

export const destinies = destinySeeds.map((destiny) => ({
  ...destiny,
  description: `${destiny.name} destiny from the homebrew table.`,
})) satisfies Destiny[];
