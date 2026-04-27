import type { Character, InventoryEntry } from "./character.schema";
import { calculateAbilityModifier, calculateBasicArmorClass, calculateGearSlots } from "./calculations";
import {
  createEffectContext,
  getArmorClassEffectBonus,
  getEffectiveAbilityScore,
} from "./effects";
import type { GearItem, Ruleset } from "../rules/rules.schema";

export function calculateUsedInventorySlots(entries: InventoryEntry[]): number {
  return entries
    .filter((entry) => entry.carried || entry.equipped)
    .reduce(
      (totalSlots, entry) => totalSlots + entry.quantity * entry.slotsPerItem,
      0,
    );
}

export function calculateCharacterGearSlots(character: Character): number {
  return calculateGearSlots(character.abilities.str);
}

export function calculateRemainingInventorySlots(character: Character): number {
  return (
    calculateCharacterGearSlots(character) -
    calculateUsedInventorySlots(character.inventory.entries)
  );
}

export function createInventoryEntryFromGear(
  gearItem: GearItem,
  options: {
    id?: string;
    quantity?: number;
    carried?: boolean;
    equipped?: boolean;
    notes?: string;
  } = {},
): InventoryEntry {
  return {
    id: options.id ?? createInventoryEntryId(gearItem.id),
    gearItemId: gearItem.id,
    quantity: options.quantity ?? 1,
    slotsPerItem: gearItem.slotsPerItem ?? 1,
    carried: options.carried ?? true,
    equipped: options.equipped ?? gearItem.equippable,
    notes: options.notes,
  };
}

export function createStartingInventoryEntries(
  classId: string,
  ruleset: Ruleset,
): InventoryEntry[] {
  const characterClass = ruleset.classes.find((option) => option.id === classId);

  return (characterClass?.startingGearIds ?? [])
    .map((gearItemId, index) => {
      const gearItem = ruleset.gear.find((item) => item.id === gearItemId);

      return gearItem
        ? createInventoryEntryFromGear(gearItem, {
            id: `${classId}-starting-gear-${index}-${gearItem.id}`,
            quantity: getStartingGearQuantity(gearItem.id),
          })
        : undefined;
    })
    .filter(isDefined);
}

export function populateLegacyStartingGearInventory(
  character: Character,
  ruleset: Ruleset,
): Character {
  if (character.inventory.entries.length > 0 || character.startingGearIds.length === 0) {
    return character;
  }

  return {
    ...character,
    inventory: {
      ...character.inventory,
      entries: character.startingGearIds
        .map((gearItemId, index) => {
          const gearItem = ruleset.gear.find((item) => item.id === gearItemId);

          return gearItem
            ? createInventoryEntryFromGear(gearItem, {
                id: `legacy-starting-gear-${index}-${gearItem.id}`,
                quantity: getStartingGearQuantity(gearItem.id),
              })
            : undefined;
        })
        .filter(isDefined),
    },
  };
}

export function createCustomInventoryEntry(
  customName: string,
  options: {
    id?: string;
    quantity?: number;
    slotsPerItem?: number;
    carried?: boolean;
    equipped?: boolean;
    notes?: string;
  } = {},
): InventoryEntry {
  return {
    id: options.id ?? createInventoryEntryId("custom"),
    customName,
    quantity: options.quantity ?? 1,
    slotsPerItem: options.slotsPerItem ?? 1,
    carried: options.carried ?? true,
    equipped: options.equipped ?? false,
    notes: options.notes,
  };
}

export function calculateArmorClass(character: Character, ruleset: Ruleset): number {
  const effectContext = createEffectContext(character, ruleset);
  const dexterityModifier = calculateAbilityModifier(
    getEffectiveAbilityScore(effectContext, "dex"),
  );
  const baseArmorClass = calculateBasicArmorClass(dexterityModifier);
  const equippedArmor = character.inventory.entries
    .filter((entry) => entry.equipped && entry.gearItemId)
    .map((entry) => ruleset.gear.find((item) => item.id === entry.gearItemId))
    .filter(isArmorWithBonus);

  const normalArmorBonus = Math.max(
    0,
    ...equippedArmor
      .filter((item) => item.armorCategory !== "tech")
      .map((item) => item.acBonus),
  );
  const stackingTechBonus = equippedArmor
    .filter((item) => item.armorCategory === "tech" && /stacks/i.test(item.notes ?? ""))
    .reduce((totalBonus, item) => totalBonus + item.acBonus, 0);
  const resolvedArmorBonus = getArmorClassEffectBonus(effectContext, {
    includeConditional: true,
  });

  return baseArmorClass + normalArmorBonus + stackingTechBonus + resolvedArmorBonus;
}

export function getInventoryEntryName(entry: InventoryEntry, ruleset: Ruleset): string {
  if (entry.gearItemId) {
    return (
      ruleset.gear.find((item) => item.id === entry.gearItemId)?.name ??
      entry.gearItemId
    );
  }

  return entry.customName ?? "Custom item";
}

export function createInventoryEntryId(prefix = "inventory-entry"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function isArmorWithBonus(item: GearItem | undefined): item is GearItem & { acBonus: number } {
  return item?.category === "armor" && typeof item.acBonus === "number";
}

function getStartingGearQuantity(gearItemId: string): number {
  if (gearItemId === "rations-3-days") {
    return 3;
  }

  return 1;
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}
