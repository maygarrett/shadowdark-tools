import type { AbilityScores } from "./character.schema";
import type { ForcePower, Ruleset } from "../rules/rules.schema";

export type PowerSource = "force" | "tech" | "none";

const priestKnownPowersByLevel: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 9,
  8: 10,
  9: 11,
  10: 12,
};

export function getKnownPowerLimit(
  level: number,
  classId: string,
  subclassId: string | undefined,
  ruleset: Ruleset,
): number {
  const characterClass = ruleset.classes.find((option) => option.id === classId);

  if (!characterClass) {
    return 0;
  }

  const baseKnownPowers = getBaseKnownPowerLimit(
    level,
    characterClass.knownPowerProgression,
  );
  const subclass = ruleset.subclasses.find((option) => option.id === subclassId);
  const subclassBonus =
    level === 1 && subclass?.classId === classId
      ? subclass.knownPowerBonusAtLevel1
      : 0;

  return baseKnownPowers + subclassBonus;
}

export function getCastingAbility(
  classId: string,
  ruleset: Ruleset,
): keyof AbilityScores | undefined {
  return ruleset.classes.find((option) => option.id === classId)?.castingAbility;
}

export function getPowerSource(classId: string, ruleset: Ruleset): PowerSource {
  return ruleset.classes.find((option) => option.id === classId)?.powerSource ?? "none";
}

export function getAvailablePowersForClass(
  classId: string,
  ruleset: Ruleset,
  options: {
    includeGmApproval?: boolean;
    level?: number;
  } = {},
): ForcePower[] {
  const powerSource = getPowerSource(classId, ruleset);

  if (powerSource === "none") {
    return [];
  }

  return ruleset.forcePowers.filter((power) => {
    if (power.excluded) {
      return false;
    }

    if (power.approval === "gm-approval" && !options.includeGmApproval) {
      return false;
    }

    if (options.level && power.tier > getMaxPowerTierForLevel(options.level)) {
      return false;
    }

    return power.availability.includes(powerSource);
  });
}

export function getMaxPowerTierForLevel(level: number): number {
  if (level >= 9) {
    return 5;
  }

  if (level >= 7) {
    return 4;
  }

  if (level >= 5) {
    return 3;
  }

  if (level >= 3) {
    return 2;
  }

  return 1;
}

export function getPowerDisplayLabel(powerSource: PowerSource): string {
  switch (powerSource) {
    case "force":
      return "Force Powers";
    case "tech":
      return "Tech Powers";
    case "none":
    default:
      return "Powers";
  }
}

export function getPowerCheckLabel(powerSource: PowerSource): string {
  switch (powerSource) {
    case "tech":
      return "Tech Check";
    case "force":
    case "none":
    default:
      return "Force Check";
  }
}

export function classRequiresForcePointToCast(
  classId: string,
  ruleset: Ruleset,
): boolean {
  return (
    ruleset.classes.find((option) => option.id === classId)
      ?.requiresForcePointToCast ?? false
  );
}

function getBaseKnownPowerLimit(
  level: number,
  progression: "knight" | "priest" | "half-level" | "none",
): number {
  switch (progression) {
    case "knight":
      return level;
    case "priest":
      return priestKnownPowersByLevel[level] ?? 0;
    case "half-level":
      return Math.floor(level / 2);
    case "none":
    default:
      return 0;
  }
}
