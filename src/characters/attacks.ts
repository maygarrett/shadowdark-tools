import type { AbilityScores, Character, InventoryEntry } from "./character.schema";
import { calculateAbilityModifier, formatModifier } from "./calculations";
import {
  createEffectContext,
  type EffectContext,
  getAppliedWeaponEffectNotes,
  getAttackBonus,
  getDamageBonus,
  getEffectiveAbilityScore,
  getUnresolvedConditionalEffects,
  hasProficiencyOverride,
} from "./effects";
import type { GearItem, Ruleset } from "../rules/rules.schema";

export type WeaponAttack = {
  id: string;
  inventoryEntryId: string;
  gearItemId: string;
  name: string;
  attackAbility: keyof AbilityScores;
  attackAbilityLabel: string;
  attackModifier: number;
  attackExpression: string;
  baseDamageExpression?: string;
  damageBonus: number;
  damageExpression?: string;
  weaponCategory?: string;
  tags: string[];
  notes: string[];
  warnings: string[];
};

export function deriveWeaponAttacks(
  character: Character,
  ruleset: Ruleset,
): WeaponAttack[] {
  const effectContext = createEffectContext(character, ruleset);

  return character.inventory.entries.flatMap((entry) => {
    if (!entry.equipped || !entry.gearItemId) {
      return [];
    }

    const weapon = ruleset.gear.find((item) => item.id === entry.gearItemId);

    if (!weapon || weapon.category !== "weapon") {
      return [];
    }

    const attackAbility = getWeaponAttackAbility(weapon, effectContext);
    const attackBonus = getAttackBonus(effectContext, { weapon });
    const structuredDamageBonus = getDamageBonus(effectContext, { weapon });
    const darkSideDamageBonus = character.affinity === "dark" ? 2 : 0;
    const damageBonus = structuredDamageBonus + darkSideDamageBonus;
    const attackModifier =
      calculateAbilityModifier(getEffectiveAbilityScore(effectContext, attackAbility)) +
      attackBonus;
    const notes = [
      weapon.attackNotes,
      ...getAppliedWeaponEffectNotes(effectContext, { weapon }),
      ...getUnresolvedConditionalEffects(effectContext, {
        domain: "attack",
        weapon,
        types: ["attackBonus", "damageBonus", "damageDiceBonus", "rollMode", "advantage"],
      }).map(({ note }) => note),
      darkSideDamageBonus ? "Dark Side affinity: +2 damage" : "",
    ].filter(isNonEmptyString);

    return [
      {
        id: `${entry.id}-${weapon.id}`,
        inventoryEntryId: entry.id,
        gearItemId: weapon.id,
        name: weapon.name,
        attackAbility,
        attackAbilityLabel: attackAbility.toUpperCase(),
        attackModifier,
        attackExpression: `1d20${formatModifier(attackModifier)}`,
        baseDamageExpression: weapon.damage,
        damageBonus,
        damageExpression: weapon.damage
          ? addDamageBonus(weapon.damage, damageBonus)
          : undefined,
        weaponCategory: weapon.weaponCategory,
        tags: weapon.tags,
        notes,
        warnings: getWeaponWarnings(character, weapon, ruleset),
      },
    ];
  });
}

export function deriveArmorProficiencyWarnings(
  character: Character,
  ruleset: Ruleset,
): string[] {
  const effectContext = createEffectContext(character, ruleset);

  if (hasUniversalWeaponAndArmorTraining(character)) {
    return [];
  }

  const characterClass = ruleset.classes.find((option) => option.id === character.classId);

  if (!characterClass) {
    return [];
  }

  return character.inventory.entries
    .filter((entry) => entry.equipped && entry.gearItemId)
    .map((entry) => ruleset.gear.find((item) => item.id === entry.gearItemId))
    .filter(isArmor)
    .filter(
      (armor) =>
        armor.armorCategory &&
        armor.armorCategory !== "none" &&
        !hasProficiencyOverride(effectContext, { armor }) &&
        !characterClass.armorProficiencyCategories.includes(armor.armorCategory),
    )
    .map((armor) => `${armor.name}: ${armor.armorCategory} armor is outside class proficiency.`);
}

export function addDamageBonus(expression: string, bonus: number): string {
  if (bonus === 0) {
    return expression;
  }

  const match = /^(\d+d\d+)([+-]\d+)?$/i.exec(expression.replace(/\s+/g, ""));

  if (!match) {
    return bonus > 0 ? `${expression}+${bonus}` : `${expression}${bonus}`;
  }

  const baseExpression = match[1];
  const existingModifier = match[2] ? Number(match[2]) : 0;
  const nextModifier = existingModifier + bonus;

  return nextModifier === 0
    ? baseExpression
    : `${baseExpression}${formatModifier(nextModifier)}`;
}

function getWeaponAttackAbility(
  weapon: GearItem,
  effectContext: EffectContext,
): keyof AbilityScores {
  switch (weapon.attackAbility ?? inferWeaponAttackAbility(weapon)) {
    case "dex":
      return "dex";
    case "best-str-dex": {
      const strengthModifier = calculateAbilityModifier(
        getEffectiveAbilityScore(effectContext, "str"),
      );
      const dexterityModifier = calculateAbilityModifier(
        getEffectiveAbilityScore(effectContext, "dex"),
      );

      return dexterityModifier > strengthModifier ? "dex" : "str";
    }
    case "str":
    default:
      return "str";
  }
}

function inferWeaponAttackAbility(weapon: GearItem): "str" | "dex" | "best-str-dex" {
  const rangedTags = new Set([
    "pistols",
    "carbines",
    "rifles",
    "heavy-weapons",
    "tech",
    "explosives",
  ]);

  if (weapon.tags.some((tag) => rangedTags.has(tag))) {
    return "dex";
  }

  if (
    weapon.tags.some((tag) =>
      ["light", "knives", "finesse", "thrown"].includes(tag),
    )
  ) {
    return "best-str-dex";
  }

  return "str";
}

function getWeaponWarnings(
  character: Character,
  weapon: GearItem,
  ruleset: Ruleset,
): string[] {
  const effectContext = createEffectContext(character, ruleset);

  if (
    hasUniversalWeaponAndArmorTraining(character) ||
    hasProficiencyOverride(effectContext, { weapon })
  ) {
    return [];
  }

  const characterClass = ruleset.classes.find((option) => option.id === character.classId);

  if (!characterClass || isWeaponProficient(weapon, characterClass.weaponProficiencyTags)) {
    return [];
  }

  return [`${weapon.name} is outside class weapon proficiency.`];
}

function isWeaponProficient(weapon: GearItem, proficiencyTags: string[]): boolean {
  if (proficiencyTags.length === 0) {
    return false;
  }

  return (
    weapon.tags.some((tag) => proficiencyTags.includes(tag)) ||
    (weapon.weaponCategory ? proficiencyTags.includes(weapon.weaponCategory) : false)
  );
}

function hasUniversalWeaponAndArmorTraining(character: Character): boolean {
  return character.speciesId === "human" && character.speciesVariantId === "human-mandalorian";
}

function isArmor(item: GearItem | undefined): item is GearItem {
  return item?.category === "armor";
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}
