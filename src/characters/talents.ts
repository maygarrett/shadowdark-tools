import type {
  Character,
  CharacterTalent,
  CharacterTalentRoll,
} from "./character.schema";
import type { Effect, Feature, Ruleset, TalentTable, TalentTableEntry } from "../rules/rules.schema";

export type TalentSelection = {
  tableId: string;
  talentId: string;
  selectionMode: "rolled" | "manual";
  roll?: CharacterTalentRoll;
};

export function getAvailableTalentTables(
  classId: string,
  subclassId: string | undefined,
  ruleset: Ruleset,
): TalentTable[] {
  return ruleset.talentTables.filter((table) => {
    if (table.source.type === "class") {
      return table.source.classId === classId;
    }

    return table.source.classId === classId && table.source.subclassId === subclassId;
  });
}

export function getTalentTableEntryForRoll(
  table: TalentTable,
  total: number,
): TalentTableEntry | undefined {
  return table.entries.find((entry) => total >= entry.min && total <= entry.max);
}

export function getTalentFeature(
  featureId: string,
  ruleset: Ruleset,
): Feature | undefined {
  return ruleset.features.find(
    (feature) => feature.id === featureId && feature.kind === "talent",
  );
}

export function createTalentHistoryEntry(
  levelGained: number,
  selection: TalentSelection,
  ruleset: Ruleset,
): CharacterTalent | undefined {
  const table = ruleset.talentTables.find((option) => option.id === selection.tableId);
  const tableEntry = table?.entries.find((entry) => entry.featureId === selection.talentId);
  const feature = getTalentFeature(selection.talentId, ruleset);

  if (!table || !tableEntry || !feature) {
    return undefined;
  }

  return {
    id: createTalentHistoryId(levelGained, selection.talentId),
    levelGained,
    tableSource: table.source.type,
    tableId: table.id,
    selectionMode: selection.selectionMode,
    roll: selection.roll,
    talentId: tableEntry.id,
    talent: {
      featureId: feature.id,
      name: feature.name,
      description: feature.description,
      effects: feature.effects,
    },
  };
}

export function getTalentEffects(character: Character): Effect[] {
  return character.talentHistory.flatMap((talent) => talent.talent.effects);
}

export function getTalentTableSourceLabel(table: TalentTable): string {
  return table.source.type === "class" ? "Class" : "Subclass";
}

export function getRollRangeLabel(entry: TalentTableEntry): string {
  return entry.min === entry.max ? `${entry.min}` : `${entry.min}-${entry.max}`;
}

export function validateTalentTables(ruleset: Ruleset): string[] {
  const errors: string[] = [];
  const tableIds = new Set<string>();
  const talentIds = new Set<string>();
  const featureIds = new Set(ruleset.features.map((feature) => feature.id));

  for (const table of ruleset.talentTables) {
    if (tableIds.has(table.id)) {
      errors.push(`Duplicate talent table ID: ${table.id}`);
    }
    tableIds.add(table.id);

    const coveredRolls = new Map<number, string>();

    for (const entry of table.entries) {
      if (entry.min > entry.max) {
        errors.push(`${table.id} has inverted range ${entry.min}-${entry.max}`);
      }

      if (!featureIds.has(entry.featureId)) {
        errors.push(`${table.id} references missing talent ${entry.featureId}`);
      }

      const scopedTalentId = `${table.id}:${entry.id}`;
      if (talentIds.has(scopedTalentId)) {
        errors.push(`Duplicate talent ID: ${scopedTalentId}`);
      }
      talentIds.add(scopedTalentId);

      for (let roll = entry.min; roll <= entry.max; roll += 1) {
        const previousEntryId = coveredRolls.get(roll);

        if (previousEntryId) {
          errors.push(
            `${table.id} overlaps roll ${roll}: ${previousEntryId} and ${entry.id}`,
          );
        }

        coveredRolls.set(roll, entry.id);
      }
    }

    for (let roll = 2; roll <= 12; roll += 1) {
      if (!coveredRolls.has(roll)) {
        errors.push(`${table.id} is missing roll ${roll}`);
      }
    }
  }

  return errors;
}

function createTalentHistoryId(levelGained: number, talentId: string): string {
  return `talent-${levelGained}-${talentId}-${Date.now()}-${Math.floor(
    Math.random() * 100000,
  )}`;
}
