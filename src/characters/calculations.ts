export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function calculateGearSlots(strengthScore: number): number {
  return Math.max(10, strengthScore);
}

export function applyHpFloor(hitPoints: number): number {
  return Math.max(1, hitPoints);
}

export function calculateDeathTimer(
  d4Roll: number,
  constitutionModifier: number,
): number {
  return Math.max(1, d4Roll + constitutionModifier);
}

export function calculateBasicArmorClass(dexterityModifier: number): number {
  return 10 + dexterityModifier;
}

export function calculateForceCheckDc(powerTier: number): number {
  return 10 + powerTier;
}
