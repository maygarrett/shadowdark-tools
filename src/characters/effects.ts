import type { AbilityScores, Character } from "./character.schema";
import type {
  Effect,
  EffectTarget,
  EffectTargetValue,
  ForcePower,
  GearItem,
  Ruleset,
} from "../rules/rules.schema";
import type { RollMode } from "../shared/dice";

export type EffectSourceType =
  | "species"
  | "speciesVariant"
  | "class"
  | "subclass"
  | "talent"
  | "gear";

export type ResolvedEffect = {
  effect: Effect;
  sourceId: string;
  sourceName: string;
  sourceType: EffectSourceType;
};

export type EffectContext = {
  character: Character;
  ruleset: Ruleset;
  effects: ResolvedEffect[];
  equippedGear: GearItem[];
};

export type EffectApplication = {
  effect: Effect;
  sourceName: string;
  note: string;
};

export type WeaponEffectQuery = {
  weapon: GearItem;
};

export type ArmorClassEffectQuery = {
  includeConditional?: boolean;
};

export type CheckEffectQuery = {
  ability?: keyof AbilityScores;
  tags?: string[];
  id?: string;
};

export type PowerCheckEffectQuery = {
  power?: ForcePower;
  powerKind?: "force" | "tech";
  tags?: string[];
};

export type RollModeEffectQuery = CheckEffectQuery & PowerCheckEffectQuery;

export function createEffectContext(
  character: Character,
  ruleset: Ruleset,
): EffectContext {
  const equippedGear = character.inventory.entries
    .filter((entry) => entry.equipped && entry.gearItemId)
    .map((entry) => ruleset.gear.find((item) => item.id === entry.gearItemId))
    .filter(isDefined);

  return {
    character,
    ruleset,
    equippedGear,
    effects: collectResolvedEffects(character, ruleset, equippedGear),
  };
}

export function getAttackBonus(
  context: EffectContext,
  query: WeaponEffectQuery,
): number {
  return sumNumberEffects(context, "attackBonus", {
    domain: "attack",
    weapon: query.weapon,
  });
}

export function getDamageBonus(
  context: EffectContext,
  query: WeaponEffectQuery,
): number {
  return sumNumberEffects(context, "damageBonus", {
    domain: "damage",
    weapon: query.weapon,
  });
}

export function getDamageDiceBonuses(
  context: EffectContext,
  query: WeaponEffectQuery,
): EffectApplication[] {
  return context.effects
    .filter(
      (resolved): resolved is ResolvedEffect & {
        effect: Extract<Effect, { type: "damageDiceBonus" }>;
      } => resolved.effect.type === "damageDiceBonus",
    )
    .filter(({ effect }) =>
      effectMatchesQuery(effect, { domain: "damage", weapon: query.weapon }),
    )
    .filter(({ effect }) => isEffectConditionMet(context, effect.condition))
    .map(({ effect, sourceName }) => ({
      effect,
      sourceName,
      note: `${sourceName}: +${effect.dice} damage`,
    }));
}

export function getAppliedWeaponEffectNotes(
  context: EffectContext,
  query: WeaponEffectQuery,
): string[] {
  const flatBonusNotes = context.effects
    .filter(
      (
        resolved,
      ): resolved is ResolvedEffect & {
        effect: Extract<Effect, { type: "attackBonus" | "damageBonus" }>;
      } =>
        resolved.effect.type === "attackBonus" ||
        resolved.effect.type === "damageBonus",
    )
    .filter(({ effect }) =>
      effectMatchesQuery(effect, {
        domain: effect.type === "attackBonus" ? "attack" : "damage",
        weapon: query.weapon,
      }),
    )
    .filter(({ effect }) => isEffectConditionMet(context, effect.condition))
    .map(({ effect, sourceName }) => {
      const label = effect.type === "attackBonus" ? "attack" : "damage";

      return `${sourceName}: ${formatSigned(effect.value)} ${label}`;
    });
  const diceBonusNotes = getDamageDiceBonuses(context, query).map(({ note }) => note);

  return [...flatBonusNotes, ...diceBonusNotes];
}

export function getArmorClassEffectBonus(
  context: EffectContext,
  query: ArmorClassEffectQuery = {},
): number {
  return context.effects
    .filter(
      (resolved): resolved is ResolvedEffect & {
        effect: Extract<Effect, { type: "acBonus" }>;
      } => resolved.effect.type === "acBonus",
    )
    .filter(({ effect }) => effectMatchesQuery(effect, { domain: "ac" }))
    .filter(({ effect }) =>
      query.includeConditional
        ? isEffectConditionMet(context, effect.condition)
        : !effect.condition,
    )
    .reduce((totalBonus, { effect }) => totalBonus + effect.value, 0);
}

export function getAbilityBonus(
  context: EffectContext,
  ability: keyof AbilityScores,
): number {
  return context.effects
    .filter(
      (resolved): resolved is ResolvedEffect & {
        effect: Extract<Effect, { type: "abilityBonus" }>;
      } => resolved.effect.type === "abilityBonus",
    )
    .filter(({ effect }) => effect.ability === ability)
    .filter(({ effect }) => isEffectConditionMet(context, effect.condition))
    .reduce((totalBonus, { effect }) => totalBonus + effect.value, 0);
}

export function getEffectiveAbilityScore(
  context: EffectContext,
  ability: keyof AbilityScores,
): number {
  return context.character.abilities[ability] + getAbilityBonus(context, ability);
}

export function getCheckBonus(
  context: EffectContext,
  query: CheckEffectQuery = {},
): number {
  return sumNumberEffects(context, "checkBonus", {
    domain: "check",
    ability: query.ability,
    id: query.id,
    tags: query.tags,
  });
}

export function getPowerCheckBonus(
  context: EffectContext,
  query: PowerCheckEffectQuery = {},
): number {
  return sumNumberEffects(context, "powerCheckBonus", {
    domain: "power",
    power: query.power,
    powerKind: query.power?.kind ?? query.powerKind,
    tags: query.power?.tags ?? query.tags,
  });
}

export function getDcBonus(
  context: EffectContext,
  query: CheckEffectQuery & PowerCheckEffectQuery = {},
): number {
  return sumNumberEffects(context, "dcBonus", {
    domain: "defense",
    ability: query.ability,
    id: query.id,
    power: query.power,
    powerKind: query.power?.kind ?? query.powerKind,
    tags: query.power?.tags ?? query.tags,
  });
}

export function getRollMode(
  context: EffectContext,
  query: RollModeEffectQuery = {},
): RollMode {
  const matches = context.effects.filter(({ effect }) => {
    if (effect.type !== "advantage" && effect.type !== "rollMode") {
      return false;
    }

    return (
      effectMatchesQuery(effect, {
        domain: query.power || query.powerKind ? "power" : "check",
        ability: query.ability,
        id: query.id,
        power: query.power,
        powerKind: query.power?.kind ?? query.powerKind,
        tags: query.power?.tags ?? query.tags,
      }) && isEffectConditionMet(context, effect.condition)
    );
  });
  const hasAdvantage = matches.some(
    ({ effect }) =>
      effect.type === "advantage" ||
      (effect.type === "rollMode" && effect.mode === "advantage"),
  );
  const hasDisadvantage = matches.some(
    ({ effect }) => effect.type === "rollMode" && effect.mode === "disadvantage",
  );

  if (hasAdvantage && !hasDisadvantage) {
    return "advantage";
  }

  if (hasDisadvantage && !hasAdvantage) {
    return "disadvantage";
  }

  return "normal";
}

export function getUnresolvedConditionalEffects(
  context: EffectContext,
  query: {
    domain?: EffectTarget["domain"];
    weapon?: GearItem;
    ability?: keyof AbilityScores;
    power?: ForcePower;
    powerKind?: "force" | "tech";
    tags?: string[];
    types?: Effect["type"][];
  } = {},
): EffectApplication[] {
  return context.effects
    .filter(({ effect }) => !query.types || query.types.includes(effect.type))
    .filter(({ effect }) =>
      effectMatchesQuery(effect, {
        domain: query.domain,
        weapon: query.weapon,
        ability: query.ability,
        power: query.power,
        powerKind: query.power?.kind ?? query.powerKind,
        tags: query.power?.tags ?? query.tags,
      }),
    )
    .filter(({ effect }) => getEffectCondition(effect))
    .filter(({ effect }) => !isEffectConditionMet(context, getEffectCondition(effect)))
    .map(({ effect, sourceName }) => ({
      effect,
      sourceName,
      note: `${sourceName}: ${describeEffect(effect)}`,
    }));
}

export function hasProficiencyOverride(
  context: EffectContext,
  query: { weapon?: GearItem; armor?: GearItem; tags?: string[] } = {},
): boolean {
  return context.effects.some(({ effect }) => {
    if (effect.type !== "proficiencyOverride") {
      return false;
    }

    return (
      effectMatchesQuery(effect, {
        domain: "proficiency",
        weapon: query.weapon,
        armor: query.armor,
        tags: query.tags,
      }) && isEffectConditionMet(context, effect.condition)
    );
  });
}

export function describeEffect(effect: Effect): string {
  switch (effect.type) {
    case "attackBonus":
      return `${formatSigned(effect.value)} attack${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "damageBonus":
      return `${formatSigned(effect.value)} damage${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "damageDiceBonus":
      return `+${effect.dice} damage${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "acBonus":
      return `${formatSigned(effect.value)} AC${formatCondition(effect.condition)}`;
    case "checkBonus":
      return `${formatSigned(effect.value)} check${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "powerCheckBonus":
      return `${formatSigned(effect.value)} power check${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "dcBonus":
      return `${formatSigned(effect.value)} DC${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "abilityBonus":
      return `${effect.ability.toUpperCase()} ${formatSigned(effect.value)}${formatCondition(effect.condition)}`;
    case "advantage":
      return `Advantage${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "rollMode":
      return `${capitalize(effect.mode)}${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "proficiencyOverride":
      return `Proficiency override${formatTarget(effect.target)}${formatCondition(effect.condition)}`;
    case "customText":
      return effect.text;
    case "hpBonus":
      return `${formatSigned(effect.value)} HP${effect.perLevel ? " per level" : ""}${formatCondition(effect.condition)}`;
    case "grantLanguage":
      return `Language: ${effect.language}`;
    case "grantProficiency":
      return `Proficiency: ${effect.proficiency}`;
    case "grantResource":
      return `Resource: ${effect.resourceId}`;
    case "grantKnownPower":
      return `Known power: ${effect.forcePowerId}`;
  }
}

function collectResolvedEffects(
  character: Character,
  ruleset: Ruleset,
  equippedGear: GearItem[],
): ResolvedEffect[] {
  const species = ruleset.species.find((option) => option.id === character.speciesId);
  const variant = ruleset.speciesVariants.find(
    (option) => option.id === character.speciesVariantId,
  );
  const characterClass = ruleset.classes.find((option) => option.id === character.classId);
  const subclass = ruleset.subclasses.find((option) => option.id === character.subclassId);
  const featureSources = [
    ...(species?.featureIds ?? []).map((featureId) => ({
      featureId,
      sourceId: species?.id ?? featureId,
      sourceType: "species" as const,
    })),
    ...(variant?.featureIds ?? []).map((featureId) => ({
      featureId,
      sourceId: variant?.id ?? featureId,
      sourceType: "speciesVariant" as const,
    })),
    ...(characterClass?.featureIds ?? []).map((featureId) => ({
      featureId,
      sourceId: characterClass?.id ?? featureId,
      sourceType: "class" as const,
    })),
    ...(subclass?.featureIds ?? []).map((featureId) => ({
      featureId,
      sourceId: subclass?.id ?? featureId,
      sourceType: "subclass" as const,
    })),
  ];
  const featureEffects = featureSources.flatMap(({ featureId, sourceId, sourceType }) => {
    const feature = ruleset.features.find((option) => option.id === featureId);

    return feature
      ? feature.effects.map((effect) => ({
          effect,
          sourceId,
          sourceName: feature.name,
          sourceType,
        }))
      : [];
  });
  const talentEffects = character.talentHistory.flatMap((talent) =>
    talent.talent.effects.map((effect) => ({
      effect,
      sourceId: talent.talent.featureId,
      sourceName: talent.talent.name,
      sourceType: "talent" as const,
    })),
  );
  const gearEffects = equippedGear.flatMap((gearItem) =>
    (gearItem.effects ?? []).map((effect) => ({
      effect,
      sourceId: gearItem.id,
      sourceName: gearItem.name,
      sourceType: "gear" as const,
    })),
  );

  return [...featureEffects, ...talentEffects, ...gearEffects];
}

function sumNumberEffects<Type extends Effect["type"]>(
  context: EffectContext,
  type: Type,
  query: EffectMatchQuery,
): number {
  return context.effects
    .filter(({ effect }) => effect.type === type)
    .filter(({ effect }) => effectMatchesQuery(effect, query))
    .filter(({ effect }) => isEffectConditionMet(context, getEffectCondition(effect)))
    .reduce((totalBonus, { effect }) => {
      if ("value" in effect && typeof effect.value === "number") {
        return totalBonus + effect.value;
      }

      return totalBonus;
    }, 0);
}

type EffectMatchQuery = {
  domain?: EffectTarget["domain"];
  weapon?: GearItem;
  armor?: GearItem;
  ability?: keyof AbilityScores;
  id?: string;
  power?: ForcePower;
  powerKind?: "force" | "tech";
  tags?: string[];
};

function effectMatchesQuery(effect: Effect, query: EffectMatchQuery): boolean {
  if (!("target" in effect) || !effect.target) {
    return true;
  }

  return targetMatchesQuery(effect.target, query);
}

function targetMatchesQuery(
  target: EffectTargetValue,
  query: EffectMatchQuery,
): boolean {
  if (typeof target === "string") {
    return stringTargetMatchesQuery(target, query);
  }

  if (target.domain && query.domain && target.domain !== query.domain) {
    return false;
  }

  if (target.ability && query.ability && target.ability !== query.ability) {
    return false;
  }

  if (target.powerKind && query.powerKind && target.powerKind !== query.powerKind) {
    return false;
  }

  const ids = target.ids ?? [];
  if (
    ids.length > 0 &&
    !ids.some((id) =>
      [query.id, query.weapon?.id, query.armor?.id, query.power?.id].includes(id),
    )
  ) {
    return false;
  }

  const queryTags = getQueryTags(query);
  const tags = target.tags ?? [];
  if (tags.length > 0 && !tags.some((tag) => queryTags.includes(tag))) {
    return false;
  }

  return true;
}

function stringTargetMatchesQuery(target: string, query: EffectMatchQuery): boolean {
  const normalizedTarget = normalize(target);
  const queryValues = [
    query.id,
    query.ability,
    query.powerKind,
    query.weapon?.id,
    query.weapon?.name,
    query.weapon?.weaponCategory,
    query.weapon?.weaponRangeType,
    query.armor?.id,
    query.armor?.name,
    query.armor?.armorCategory,
    query.power?.id,
    query.power?.name,
    query.power?.kind,
    ...(query.tags ?? []),
    ...(query.weapon?.tags ?? []),
    ...(query.armor?.tags ?? []),
    ...(query.power?.tags ?? []),
  ]
    .filter(isDefined)
    .map(normalize);

  return queryValues.includes(normalizedTarget);
}

function getQueryTags(query: EffectMatchQuery): string[] {
  return [
    ...(query.tags ?? []),
    ...(query.weapon?.tags ?? []),
    ...(query.armor?.tags ?? []),
    ...(query.power?.tags ?? []),
    query.weapon?.weaponCategory,
    query.weapon?.weaponRangeType,
    query.armor?.armorCategory,
    query.power?.kind,
  ]
    .filter(isDefined)
    .map(normalize);
}

function isEffectConditionMet(
  context: EffectContext,
  condition: string | undefined,
): boolean {
  if (!condition) {
    return true;
  }

  const normalizedCondition = normalize(condition);
  const equippedWeapons = context.equippedGear.filter(
    (gearItem) => gearItem.category === "weapon",
  );
  const equippedArmor = context.equippedGear.filter(
    (gearItem) => gearItem.category === "armor",
  );

  if (normalizedCondition.includes("unarmored")) {
    return !equippedArmor.some(
      (armor) =>
        armor.armorCategory !== "none" &&
        armor.armorCategory !== "tech" &&
        (armor.acBonus ?? 0) > 0,
    );
  }

  if (
    normalizedCondition.includes("wielding a lightsaber") ||
    normalizedCondition.includes("equipped with a lightsaber")
  ) {
    return equippedWeapons.some((weapon) => weapon.tags.includes("lightsabers"));
  }

  if (
    normalizedCondition.includes("single lightsaber") ||
    normalizedCondition.includes("single-saber")
  ) {
    return equippedWeapons.some(
      (weapon) => weapon.tags.includes("lightsabers") && (weapon.hands ?? 1) <= 1,
    );
  }

  if (
    normalizedCondition.includes("double-bladed") ||
    normalizedCondition.includes("double-blade")
  ) {
    return equippedWeapons.some(
      (weapon) =>
        weapon.id.includes("double-blade") ||
        normalize(weapon.name).includes("double-blade"),
    );
  }

  if (
    normalizedCondition.includes("medium or heavy armor") ||
    normalizedCondition.includes("heavy or medium armor")
  ) {
    return equippedArmor.some((armor) =>
      ["medium", "heavy"].includes(armor.armorCategory ?? "none"),
    );
  }

  if (
    normalizedCondition.includes("tech armor") ||
    normalizedCondition.includes("using tech armor")
  ) {
    return equippedArmor.some((armor) => armor.armorCategory === "tech");
  }

  return false;
}

function getEffectCondition(effect: Effect): string | undefined {
  return "condition" in effect ? effect.condition : undefined;
}

function formatTarget(target: EffectTargetValue | undefined): string {
  if (!target) {
    return "";
  }

  if (typeof target === "string") {
    return ` (${target})`;
  }

  const parts = [
    target.domain,
    target.ability?.toUpperCase(),
    target.powerKind,
    ...(target.ids ?? []),
    ...(target.tags ?? []),
  ].filter(isDefined);

  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

function formatCondition(condition: string | undefined): string {
  if (!condition) {
    return "";
  }

  const trimmedCondition = condition.replace(/\.$/, "");

  return /^while\b/i.test(trimmedCondition)
    ? ` ${trimmedCondition}`
    : ` while ${trimmedCondition}`;
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}
