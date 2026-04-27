import type { AbilityScores, Character, InventoryEntry } from "./character.schema";
import { calculateAbilityModifier, formatModifier } from "./calculations";
import { getTalentEffects } from "./talents";
import type { Effect, GearItem, Ruleset } from "../rules/rules.schema";

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

type ResolvedEffect = {
  effect: Effect;
  sourceName: string;
};

export function deriveWeaponAttacks(
  character: Character,
  ruleset: Ruleset,
): WeaponAttack[] {
  return character.inventory.entries.flatMap((entry) => {
    if (!entry.equipped || !entry.gearItemId) {
      return [];
    }

    const weapon = ruleset.gear.find((item) => item.id === entry.gearItemId);

    if (!weapon || weapon.category !== "weapon") {
      return [];
    }

    const attackAbility = getWeaponAttackAbility(weapon, character);
    const structuredEffects = getStructuredEffects(character, ruleset);
    const attackBonus = sumMatchingEffectBonus(structuredEffects, "attackBonus", weapon);
    const structuredDamageBonus = sumMatchingEffectBonus(
      structuredEffects,
      "damageBonus",
      weapon,
    );
    const darkSideDamageBonus = character.affinity === "dark" ? 2 : 0;
    const damageBonus = structuredDamageBonus + darkSideDamageBonus;
    const attackModifier =
      calculateAbilityModifier(character.abilities[attackAbility]) + attackBonus;
    const notes = [
      weapon.attackNotes,
      ...structuredEffects
        .filter(
          (
            resolvedEffect,
          ): resolvedEffect is ResolvedEffect & {
            effect: Extract<Effect, { type: "attackBonus" | "damageBonus" }>;
          } =>
            resolvedEffect.effect.type === "attackBonus" ||
            resolvedEffect.effect.type === "damageBonus",
        )
        .filter(({ effect }) => effectAppliesToWeapon(effect, weapon))
        .map(({ effect, sourceName }) => {
          const bonus = effect.value;
          const label = effect.type === "attackBonus" ? "attack" : "damage";

          return `${sourceName}: ${formatModifier(bonus)} ${label}`;
        }),
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
  character: Character,
): keyof AbilityScores {
  switch (weapon.attackAbility ?? inferWeaponAttackAbility(weapon)) {
    case "dex":
      return "dex";
    case "best-str-dex": {
      const strengthModifier = calculateAbilityModifier(character.abilities.str);
      const dexterityModifier = calculateAbilityModifier(character.abilities.dex);

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
  if (hasUniversalWeaponAndArmorTraining(character)) {
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

function getStructuredEffects(character: Character, ruleset: Ruleset): ResolvedEffect[] {
  const species = ruleset.species.find((option) => option.id === character.speciesId);
  const variant = ruleset.speciesVariants.find(
    (option) => option.id === character.speciesVariantId,
  );
  const characterClass = ruleset.classes.find((option) => option.id === character.classId);
  const subclass = ruleset.subclasses.find((option) => option.id === character.subclassId);
  const featureIds = [
    ...(species?.featureIds ?? []),
    ...(variant?.featureIds ?? []),
    ...(characterClass?.featureIds ?? []),
    ...(subclass?.featureIds ?? []),
  ];

  const featureEffects = featureIds.flatMap((featureId) => {
    const feature = ruleset.features.find((option) => option.id === featureId);

    if (!feature) {
      return [];
    }

    return feature.effects.map((effect) => ({
      effect,
      sourceName: feature.name,
    }));
  });

  const talentEffects = getTalentEffects(character).map((effect) => ({
    effect,
    sourceName: "Talent",
  }));

  return [...featureEffects, ...talentEffects];
}

function sumMatchingEffectBonus(
  effects: ResolvedEffect[],
  type: "attackBonus" | "damageBonus",
  weapon: GearItem,
): number {
  return effects
    .filter(({ effect }) => effect.type === type && effectAppliesToWeapon(effect, weapon))
    .reduce(
      (totalBonus, { effect }) =>
        totalBonus + (effect.type === type ? effect.value : 0),
      0,
    );
}

function effectAppliesToWeapon(
  effect: Effect,
  weapon: GearItem,
): effect is Extract<Effect, { type: "attackBonus" | "damageBonus" }> {
  if (effect.type !== "attackBonus" && effect.type !== "damageBonus") {
    return false;
  }

  if (!effect.target) {
    return true;
  }

  const target = effect.target.toLowerCase();

  return (
    target === weapon.id ||
    target === weapon.name.toLowerCase() ||
    target === weapon.weaponCategory?.toLowerCase() ||
    weapon.tags.includes(target)
  );
}

function isArmor(item: GearItem | undefined): item is GearItem {
  return item?.category === "armor";
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}
