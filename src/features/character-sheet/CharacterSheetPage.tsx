import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { routes } from "../../app/routes";
import {
  type AbilityScores,
  type Character,
  type CharacterResource,
  type CharacterTalent,
  type CharacterTalentRoll,
  type HpGain,
  type InventoryEntry,
} from "../../characters/character.schema";
import { currentCharacterSchemaVersion } from "../../characters/migrations";
import {
  calculateAbilityModifier,
  calculateForceCheckDc,
  formatModifier,
} from "../../characters/calculations";
import {
  deriveArmorProficiencyWarnings,
  deriveWeaponAttacks,
  type WeaponAttack,
} from "../../characters/attacks";
import {
  calculateArmorClass,
  calculateCharacterGearSlots,
  calculateRemainingInventorySlots,
  calculateUsedInventorySlots,
  createCustomInventoryEntry,
  createInventoryEntryFromGear,
  getInventoryEntryName,
  populateLegacyStartingGearInventory,
} from "../../characters/inventory";
import {
  classRequiresForcePointToCast,
  getAvailablePowersForClass,
  getCastingAbility,
  getKnownPowerLimit,
  getPowerCheckLabel,
  getPowerDisplayLabel,
  getPowerSource,
} from "../../characters/powers";
import {
  createTalentHistoryEntry,
  getAvailableTalentTables,
  getRollRangeLabel,
  getTalentFeature,
  getTalentTableEntryForRoll,
  getTalentTableSourceLabel,
} from "../../characters/talents";
import {
  getCharacterExportFileName,
  serializeCharacterForExport,
} from "../../characters/importExport";
import { getCharacter, saveCharacter } from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";
import type { ForcePower, GearItem, TalentTable } from "../../rules/rules.schema";
import { evaluateDiceExpression, type DiceRollResult } from "../../shared/dice";

type SheetRollHistoryEntry = DiceRollResult & {
  id: string;
  label: string;
  rolledAt: Date;
};

type LevelUpStepId = "hp" | "talent" | "powers" | "review";

type LevelUpDraft = {
  stepIndex: number;
  hpGain: HpGain | undefined;
  talentSelection: LevelUpTalentSelection | undefined;
  newPowerIds: string[];
  error: string;
};

type LevelUpTalentSelection = {
  tableId: string;
  talentFeatureId: string;
  selectionMode: "rolled" | "manual";
  roll?: CharacterTalentRoll;
};

const abilityDisplay: Array<{ key: keyof AbilityScores; label: string; short: string }> = [
  { key: "str", label: "Strength", short: "STR" },
  { key: "dex", label: "Dexterity", short: "DEX" },
  { key: "con", label: "Constitution", short: "CON" },
  { key: "int", label: "Intelligence", short: "INT" },
  { key: "wis", label: "Wisdom", short: "WIS" },
  { key: "cha", label: "Charisma", short: "CHA" },
];

export function CharacterSheetPage() {
  const { characterId } = useParams();
  const [character, setCharacter] = useState<Character | undefined>(() =>
    characterId
      ? maybePopulateLegacyInventory(getCharacter(characterId))
      : undefined,
  );
  const [rollHistory, setRollHistory] = useState<SheetRollHistoryEntry[]>([]);
  const [customResourceDraft, setCustomResourceDraft] = useState({
    label: "",
    maxUses: "1",
    resetType: "manual" as CharacterResource["resetType"],
  });
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [selectedGearItemId, setSelectedGearItemId] = useState("");
  const [selectedGearQuantity, setSelectedGearQuantity] = useState("1");
  const [levelUpDraft, setLevelUpDraft] = useState<LevelUpDraft | undefined>();

  if (!characterId || !character) {
    return (
      <section>
        <header className="page-header">
          <h1>Character Not Found</h1>
          <p>No saved character exists for this link.</p>
        </header>
        <div className="placeholder-panel">
          <Link className="text-link" to={routes.characterLibrary}>
            Back to Character Library
          </Link>
        </div>
      </section>
    );
  }

  const activeCharacter = character;
  const sheet = getSheetLookups(activeCharacter);
  const dexModifier = calculateAbilityModifier(activeCharacter.abilities.dex);
  const armorClass = calculateArmorClass(activeCharacter, starWarsShadowdarkRuleset);
  const usedGearSlots = calculateUsedInventorySlots(activeCharacter.inventory.entries);
  const maxGearSlots = calculateCharacterGearSlots(activeCharacter);
  const remainingGearSlots = calculateRemainingInventorySlots(activeCharacter);
  const equippedWeapons = getInventoryGearByCategory(activeCharacter, "weapon");
  const equippedArmor = getInventoryGearByCategory(activeCharacter, "armor");
  const addableGearItems = getAddableGearItems(equipmentSearch);
  const selectedGearItem = starWarsShadowdarkRuleset.gear.find(
    (item) => item.id === selectedGearItemId,
  );
  const weaponAttacks = deriveWeaponAttacks(activeCharacter, starWarsShadowdarkRuleset);
  const armorProficiencyWarnings = deriveArmorProficiencyWarnings(
    activeCharacter,
    starWarsShadowdarkRuleset,
  );
  const powerSource = getPowerSource(activeCharacter.classId, starWarsShadowdarkRuleset);
  const powerHeading = getPowerDisplayLabel(powerSource);
  const powerCheckLabel = getPowerCheckLabel(powerSource);
  const castingAbility = getCastingAbility(
    activeCharacter.classId,
    starWarsShadowdarkRuleset,
  );
  const requiresForcePointToCast = classRequiresForcePointToCast(
    activeCharacter.classId,
    starWarsShadowdarkRuleset,
  );
  const nextLevel = activeCharacter.level + 1;
  const levelUpSteps = getLevelUpSteps(activeCharacter);
  const levelUpStep = levelUpDraft
    ? levelUpSteps[levelUpDraft.stepIndex] ?? "review"
    : undefined;

  function updateCharacter(updatedCharacter: Character): void {
    const savedCharacter: Character = {
      ...updatedCharacter,
      updatedAt: new Date().toISOString(),
    };

    setCharacter(savedCharacter);
    saveCharacter(savedCharacter);
  }

  function exportCharacter(): void {
    if (!character) {
      return;
    }

    const blob = new Blob([serializeCharacterForExport(activeCharacter)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = getCharacterExportFileName(activeCharacter);
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  function rollExpression(label: string, expression: string): void {
    const result = evaluateDiceExpression(expression);

    setRollHistory((currentHistory) => [
      {
        ...result,
        id: `${Date.now()}-${currentHistory.length}`,
        label,
        rolledAt: new Date(),
      },
      ...currentHistory,
    ]);
  }

  function updateResourceUsedUses(resourceId: string, nextUsedUses: number): void {
    updateCharacter({
      ...activeCharacter,
      resources: activeCharacter.resources.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              usedUses: clamp(nextUsedUses, 0, resource.maxUses),
            }
          : resource,
      ),
    });
  }

  function resetResources(resetTypes: CharacterResource["resetType"][]): void {
    updateCharacter({
      ...activeCharacter,
      resources: activeCharacter.resources.map((resource) =>
        resetTypes.includes(resource.resetType)
          ? { ...resource, usedUses: 0 }
          : resource,
      ),
    });
  }

  function resetAllResources(): void {
    if (!window.confirm("Reset all limited-use resources?")) {
      return;
    }

    updateCharacter({
      ...activeCharacter,
      resources: activeCharacter.resources.map((resource) => ({
        ...resource,
        usedUses: 0,
      })),
    });
  }

  function addCustomResource(): void {
    const label = customResourceDraft.label.trim();
    const maxUses = Number(customResourceDraft.maxUses);

    if (!label || !Number.isInteger(maxUses) || maxUses < 1) {
      return;
    }

    updateCharacter({
      ...activeCharacter,
      resources: [
        ...activeCharacter.resources,
        {
          id: `custom-resource-${Date.now()}`,
          label,
          maxUses,
          usedUses: 0,
          resetType: customResourceDraft.resetType,
          source: "custom",
        },
      ],
    });
    setCustomResourceDraft({
      label: "",
      maxUses: "1",
      resetType: "manual",
    });
  }

  function updateInventoryCredits(nextCredits: number): void {
    updateCharacter({
      ...activeCharacter,
      inventory: {
        ...activeCharacter.inventory,
        credits: Math.max(0, nextCredits),
      },
    });
  }

  function updateInventoryEntry(
    entryId: string,
    updates: Partial<InventoryEntry>,
  ): void {
    updateCharacter({
      ...activeCharacter,
      inventory: {
        ...activeCharacter.inventory,
        entries: activeCharacter.inventory.entries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                ...updates,
                carried: updates.equipped ? true : updates.carried ?? entry.carried,
              }
            : entry,
        ),
      },
    });
  }

  function removeInventoryEntry(entryId: string): void {
    updateCharacter({
      ...activeCharacter,
      inventory: {
        ...activeCharacter.inventory,
        entries: activeCharacter.inventory.entries.filter(
          (entry) => entry.id !== entryId,
        ),
      },
    });
  }

  function addCustomInventoryEntry(): void {
    updateCharacter({
      ...activeCharacter,
      inventory: {
        ...activeCharacter.inventory,
        entries: [
          ...activeCharacter.inventory.entries,
          createCustomInventoryEntry("Custom item"),
        ],
      },
    });
  }

  function addRulesGearInventoryEntry(): void {
    const gearItem = starWarsShadowdarkRuleset.gear.find(
      (item) => item.id === selectedGearItemId,
    );
    const quantity = Number(selectedGearQuantity);

    if (!gearItem || !Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    updateCharacter({
      ...activeCharacter,
      inventory: {
        ...activeCharacter.inventory,
        entries: [
          ...activeCharacter.inventory.entries,
          createInventoryEntryFromGear(gearItem, {
            quantity,
            carried: true,
            equipped: false,
          }),
        ],
      },
    });
    setSelectedGearItemId("");
    setSelectedGearQuantity("1");
  }

  function startLevelUp(): void {
    setLevelUpDraft({
      stepIndex: 0,
      hpGain: undefined,
      talentSelection: undefined,
      newPowerIds: [],
      error: "",
    });
  }

  function rollLevelUpHp(): void {
    const characterClass = starWarsShadowdarkRuleset.classes.find(
      (option) => option.id === activeCharacter.classId,
    );

    if (!characterClass) {
      return;
    }

    const constitutionModifier = calculateAbilityModifier(activeCharacter.abilities.con);
    const expression = `1${characterClass.hitDie}${formatModifier(constitutionModifier)}`;
    const result = evaluateDiceExpression(expression);
    const gain = Math.max(1, result.total);

    setLevelUpDraft((draft) =>
      draft
        ? {
            ...draft,
            error: "",
            hpGain: {
              id: `hp-${nextLevel}-${Date.now()}`,
              levelGained: nextLevel,
              hitDie: characterClass.hitDie,
              constitutionModifier,
              roll: {
                expression: result.expression,
                rolls: result.rolls,
                total: result.total,
              },
              gain,
            },
          }
        : draft,
    );
  }

  function updateLevelUpTalent(
    talentSelection: LevelUpTalentSelection | undefined,
  ): void {
    setLevelUpDraft((draft) =>
      draft ? { ...draft, talentSelection, error: "" } : draft,
    );
  }

  function toggleLevelUpPower(powerId: string): void {
    setLevelUpDraft((draft) => {
      if (!draft) {
        return draft;
      }

      const isSelected = draft.newPowerIds.includes(powerId);

      return {
        ...draft,
        error: "",
        newPowerIds: isSelected
          ? draft.newPowerIds.filter((selectedPowerId) => selectedPowerId !== powerId)
          : [...draft.newPowerIds, powerId],
      };
    });
  }

  function goNextLevelUpStep(): void {
    if (!levelUpDraft || !levelUpStep) {
      return;
    }

    const validationError = validateLevelUpStep(
      levelUpStep,
      levelUpDraft,
      activeCharacter,
    );

    if (validationError) {
      setLevelUpDraft({ ...levelUpDraft, error: validationError });
      return;
    }

    setLevelUpDraft({
      ...levelUpDraft,
      error: "",
      stepIndex: Math.min(levelUpDraft.stepIndex + 1, levelUpSteps.length - 1),
    });
  }

  function goBackLevelUpStep(): void {
    setLevelUpDraft((draft) =>
      draft
        ? {
            ...draft,
            error: "",
            stepIndex: Math.max(0, draft.stepIndex - 1),
          }
        : draft,
    );
  }

  function confirmLevelUp(): void {
    if (!levelUpDraft) {
      return;
    }

    const validationError = validateAllLevelUpSteps(levelUpDraft, activeCharacter);

    if (validationError) {
      setLevelUpDraft({ ...levelUpDraft, error: validationError });
      return;
    }

    const talentEntry = createLevelUpTalentEntry(nextLevel, levelUpDraft.talentSelection);

    if (!levelUpDraft.hpGain || !talentEntry) {
      setLevelUpDraft({
        ...levelUpDraft,
        error: "Complete HP and talent choices before confirming.",
      });
      return;
    }

    updateCharacter({
      ...activeCharacter,
      schemaVersion: currentCharacterSchemaVersion,
      level: nextLevel,
      hp: {
        max: activeCharacter.hp.max + levelUpDraft.hpGain.gain,
        current: activeCharacter.hp.current + levelUpDraft.hpGain.gain,
      },
      hpGainHistory: [...activeCharacter.hpGainHistory, levelUpDraft.hpGain],
      talentHistory: [...activeCharacter.talentHistory, talentEntry],
      knownForcePowerIds: [
        ...activeCharacter.knownForcePowerIds,
        ...levelUpDraft.newPowerIds,
      ],
    });
    setLevelUpDraft(undefined);
  }

  return (
    <section>
      <header className="sheet-header">
        <div>
          <h1>{activeCharacter.name}</h1>
          <p>
            {sheet.speciesName}
            {sheet.variantName ? ` - ${sheet.variantName}` : ""}{" "}
            {sheet.className}
            {sheet.subclassName ? ` (${sheet.subclassName})` : ""}, Level{" "}
            {activeCharacter.level}
          </p>
        </div>
        <div className="sheet-header__meta">
          {activeCharacter.playerName ? <span>Player: {activeCharacter.playerName}</span> : null}
          <span>AC {armorClass}</span>
          <span>
            HP {activeCharacter.hp.current}/{activeCharacter.hp.max}
          </span>
          <button type="button" onClick={startLevelUp}>
            Level Up
          </button>
          <Link className="secondary-button" to={routes.editCharacter(activeCharacter.id)}>
            Edit Character
          </Link>
          <button type="button" onClick={exportCharacter}>
            Export
          </button>
        </div>
      </header>

      {levelUpDraft && levelUpStep ? (
        <LevelUpPanel
          availablePowers={getLevelUpAvailablePowers(activeCharacter)}
          character={activeCharacter}
          draft={levelUpDraft}
          powerDelta={getPowerSelectionDelta(activeCharacter)}
          step={levelUpStep}
          steps={levelUpSteps}
          onBack={goBackLevelUpStep}
          onCancel={() => setLevelUpDraft(undefined)}
          onConfirm={confirmLevelUp}
          onNext={goNextLevelUpStep}
          onRollHp={rollLevelUpHp}
          onTalentChange={updateLevelUpTalent}
          onTogglePower={toggleLevelUpPower}
        />
      ) : null}

      <div className="sheet-grid">
        <section className="sheet-panel">
          <h2>Abilities</h2>
          <div className="ability-score-list">
            {abilityDisplay.map((ability) => {
              const score = activeCharacter.abilities[ability.key];
              const modifier = calculateAbilityModifier(score);

              return (
                <div className="ability-score" key={ability.key}>
                  <strong>
                    {ability.short} {formatModifier(modifier)}
                  </strong>
                  <small>
                    {ability.label}: {score}
                  </small>
                  <button
                    type="button"
                    onClick={() =>
                      rollExpression(
                        `${ability.short} Check`,
                        `1d20${formatModifier(modifier)}`,
                      )
                    }
                  >
                    Roll {ability.short} {formatModifier(modifier)}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="sheet-panel">
          <h2>Combat</h2>
          <div className="stat-list">
            <p>
              <strong>Armor Class:</strong> {armorClass}{" "}
              <span className="muted">
                (10 + DEX {formatModifier(dexModifier)} + equipped armor)
              </span>
            </p>
            <label>
              Current HP
              <input
                min="0"
                type="number"
                value={activeCharacter.hp.current}
                onChange={(event) => {
                  const currentHp = Math.max(0, Number(event.target.value));
                  updateCharacter({
                    ...activeCharacter,
                    hp: {
                      ...activeCharacter.hp,
                      current: currentHp,
                    },
                  });
                }}
              />
            </label>
            <p>
              <strong>Max HP:</strong> {activeCharacter.hp.max}
            </p>
            {armorProficiencyWarnings.length > 0 ? (
              <div className="warning-list" aria-label="Armor proficiency warnings">
                {armorProficiencyWarnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Weapon Attacks</h2>
          {weaponAttacks.length > 0 ? (
            <div className="attack-list">
              {weaponAttacks.map((attack) => (
                <WeaponAttackCard
                  attack={attack}
                  key={attack.id}
                  onRoll={rollExpression}
                />
              ))}
            </div>
          ) : (
            <p className="muted">No equipped weapons.</p>
          )}
        </section>

        <section className="sheet-panel">
          <h2>Identity</h2>
          <div className="stat-list">
            <p><strong>Species:</strong> {sheet.speciesName}</p>
            {sheet.variantName ? <p><strong>Variant:</strong> {sheet.variantName}</p> : null}
            <p><strong>Class:</strong> {sheet.className}</p>
            {sheet.subclassName ? <p><strong>Subclass:</strong> {sheet.subclassName}</p> : null}
            <p><strong>Background:</strong> {sheet.backgroundName}</p>
            <p><strong>Affinity:</strong> {formatAffinity(activeCharacter.affinity)}</p>
            <p><strong>Vice:</strong> {sheet.viceName}</p>
            <p><strong>Destiny:</strong> {sheet.destinyName}</p>
          </div>
        </section>

        <section className="sheet-panel">
          <h2>Species Traits</h2>
          <FeatureList featureIds={sheet.speciesFeatureIds} />
        </section>

        <section className="sheet-panel">
          <h2>Class Features</h2>
          <FeatureList featureIds={sheet.classFeatureIds} />
        </section>

        <section className="sheet-panel">
          <h2>Subclass Features</h2>
          {sheet.subclassFeatureIds.length > 0 ? (
            <FeatureList featureIds={sheet.subclassFeatureIds} />
          ) : (
            <p className="muted">No subclass features.</p>
          )}
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Talent History</h2>
          {activeCharacter.talentHistory.length < activeCharacter.level ? (
            <p className="form-warning" role="alert">
              This character has fewer recorded talents than their level.
            </p>
          ) : null}
          <TalentHistoryList talentHistory={activeCharacter.talentHistory} />
        </section>

        <section className="sheet-panel">
          <h2>{powerHeading}</h2>
          {castingAbility ? (
            <p className="muted">
              {powerCheckLabel}: {castingAbility.toUpperCase()}{" "}
              {formatModifier(sheet.forceCheckModifier)}
            </p>
          ) : null}
          {requiresForcePointToCast ? (
            <p className="muted">Requires Force Point to cast.</p>
          ) : null}
          {sheet.forcePowers.length > 0 ? (
            <ul className="simple-list">
              {sheet.forcePowers.map((power) => (
                <li key={power.id}>
                  <strong>{power.name}</strong>
                  <span>{formatPowerSource(power)}</span>
                  {power.derivedFromSpellName ? (
                    <span>Based on: {power.derivedFromSpellName}</span>
                  ) : null}
                  <span>Tier {power.tier}, DC {calculateForceCheckDc(power.tier)}</span>
                  <PowerMetadata power={power} />
                  <button
                    type="button"
                    onClick={() =>
                      rollExpression(
                        `${power.name} ${powerCheckLabel} DC ${calculateForceCheckDc(power.tier)}`,
                        `1d20${formatModifier(sheet.forceCheckModifier)}`,
                      )
                    }
                  >
                    Roll {powerCheckLabel} {formatModifier(sheet.forceCheckModifier)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No known powers recorded.</p>
          )}
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Inventory</h2>
          <div className="inventory-summary" aria-label="Inventory slots">
            <span>Used {formatSlotCount(usedGearSlots)}</span>
            <span>Max {formatSlotCount(maxGearSlots)}</span>
            <span>Remaining {formatSlotCount(remainingGearSlots)}</span>
          </div>
          {remainingGearSlots < 0 ? (
            <p className="form-warning" role="alert">
              Inventory is over gear slots by {formatSlotCount(Math.abs(remainingGearSlots))}.
            </p>
          ) : null}

          <div className="inventory-overview">
            <label>
              Credits
              <input
                min="0"
                type="number"
                value={activeCharacter.inventory.credits}
                onChange={(event) =>
                  updateInventoryCredits(Number(event.target.value))
                }
              />
            </label>
            <InventorySummaryList
              emptyText="No equipped weapons."
              items={equippedWeapons}
              title="Equipped Weapons"
            />
            <InventorySummaryList
              emptyText="No equipped armor."
              items={equippedArmor}
              title="Equipped Armor"
            />
            <InventorySummaryList
              emptyText="No carried items."
              items={activeCharacter.inventory.entries.filter(
                (entry) => entry.carried || entry.equipped,
              )}
              title="Carried Items"
            />
          </div>

          <div className="inventory-list">
            {activeCharacter.inventory.entries.length > 0 ? (
              activeCharacter.inventory.entries.map((entry) => (
                <SheetInventoryEntryEditor
                  entry={entry}
                  key={entry.id}
                  onRemoveEntry={removeInventoryEntry}
                  onUpdateEntry={updateInventoryEntry}
                />
              ))
            ) : (
              <p className="muted">No inventory recorded.</p>
            )}
          </div>

          <div className="inventory-add-panel">
            <h3>Add from equipment list</h3>
            <div className="inventory-add-panel__controls">
              <label>
                Equipment search
                <input
                  aria-label="Equipment search"
                  value={equipmentSearch}
                  onChange={(event) => setEquipmentSearch(event.target.value)}
                />
              </label>
              <label>
                Equipment item
                <select
                  aria-label="Equipment item"
                  value={selectedGearItemId}
                  onChange={(event) => setSelectedGearItemId(event.target.value)}
                >
                  <option value="">Select equipment</option>
                  {addableGearItems.map((gearItem) => (
                    <option key={gearItem.id} value={gearItem.id}>
                      {gearItem.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Equipment quantity
                <input
                  aria-label="Equipment quantity"
                  min="1"
                  type="number"
                  value={selectedGearQuantity}
                  onChange={(event) => setSelectedGearQuantity(event.target.value)}
                />
              </label>
              <button
                className="secondary-button"
                disabled={!selectedGearItem}
                type="button"
                onClick={addRulesGearInventoryEntry}
              >
                Add Equipment
              </button>
            </div>
            {addableGearItems.length === 0 ? (
              <p className="muted">No matching equipment.</p>
            ) : null}
            {selectedGearItem ? <GearItemPreview gearItem={selectedGearItem} /> : null}
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={addCustomInventoryEntry}
          >
            Add Custom Item
          </button>
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Limited Uses</h2>
          {activeCharacter.resources.length > 0 ? (
            <div className="resource-list">
              {activeCharacter.resources.map((resource) => (
                <div className="resource-row" key={resource.id}>
                  <div>
                    <strong>{resource.label}</strong>
                    <span>
                      {resource.source}, resets: {resource.resetType}
                    </span>
                  </div>
                  <div className="resource-controls">
                    <button
                      aria-label={`Decrease ${resource.label}`}
                      type="button"
                      onClick={() =>
                        updateResourceUsedUses(resource.id, resource.usedUses - 1)
                      }
                    >
                      -
                    </button>
                    <span>
                      Used {resource.usedUses}/{resource.maxUses}
                    </span>
                    <button
                      aria-label={`Increase ${resource.label}`}
                      type="button"
                      onClick={() =>
                        updateResourceUsedUses(resource.id, resource.usedUses + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No limited-use resources tracked.</p>
          )}

          <div className="resource-reset-actions">
            <button type="button" onClick={() => resetResources(["combat"])}>
              Reset Combat
            </button>
            <button type="button" onClick={() => resetResources(["rest", "day"])}>
              Reset Rest/Day
            </button>
            <button type="button" onClick={resetAllResources}>
              Reset All
            </button>
          </div>

          <div className="custom-resource-form">
            <label>
              Resource label
              <input
                value={customResourceDraft.label}
                onChange={(event) =>
                  setCustomResourceDraft((draft) => ({
                    ...draft,
                    label: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Max uses
              <input
                min="1"
                type="number"
                value={customResourceDraft.maxUses}
                onChange={(event) =>
                  setCustomResourceDraft((draft) => ({
                    ...draft,
                    maxUses: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Reset type
              <select
                value={customResourceDraft.resetType}
                onChange={(event) =>
                  setCustomResourceDraft((draft) => ({
                    ...draft,
                    resetType: event.target.value as CharacterResource["resetType"],
                  }))
                }
              >
                <option value="combat">Combat</option>
                <option value="rest">Rest</option>
                <option value="day">Day</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <button type="button" onClick={addCustomResource}>
              Add Resource
            </button>
          </div>
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Notes</h2>
          <textarea
            aria-label="Character notes"
            rows={5}
            value={activeCharacter.notes ?? ""}
            onChange={(event) =>
              updateCharacter({
                ...activeCharacter,
                notes: event.target.value,
              })
            }
          />
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Roll History</h2>
          {rollHistory.length > 0 ? (
            <ul className="roll-history-list" aria-label="Roll history">
              {rollHistory.map((entry) => (
                <li key={entry.id}>
                  <strong>{formatSheetRollSummary(entry)}</strong>
                  <span>
                    Dice: [{entry.rolls.join(", ")}]
                    {entry.mode !== "normal" ? `, kept ${entry.keptRolls[0]}` : ""}
                    {entry.modifier
                      ? `, modifier ${formatModifier(entry.modifier)}`
                      : ""}
                  </span>
                  <time dateTime={entry.rolledAt.toISOString()}>
                    {entry.rolledAt.toLocaleTimeString()}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No rolls yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}

function FeatureList({ featureIds }: { featureIds: string[] }) {
  const features = featureIds
    .map((featureId) =>
      starWarsShadowdarkRuleset.features.find((feature) => feature.id === featureId),
    )
    .filter(isDefined);

  if (features.length === 0) {
    return <p className="muted">No features recorded.</p>;
  }

  return (
    <ul className="feature-list">
      {features.map((feature) => (
        <li key={feature.id}>
          <strong>{feature.name}</strong>
          <p>{feature.description}</p>
          {feature.effects.map((effect, index) =>
            effect.type === "customText" ? (
              <p className="effect-text" key={`${feature.id}-${index}`}>
                {effect.text}
              </p>
            ) : null,
          )}
        </li>
      ))}
    </ul>
  );
}

function TalentHistoryList({ talentHistory }: { talentHistory: CharacterTalent[] }) {
  if (talentHistory.length === 0) {
    return <p className="muted">No talents recorded.</p>;
  }

  return (
    <ul className="simple-list" aria-label="Talent history">
      {[...talentHistory]
        .sort((left, right) => left.levelGained - right.levelGained)
        .map((talent) => {
          const table = starWarsShadowdarkRuleset.talentTables.find(
            (option) => option.id === talent.tableId,
          );

          return (
            <li key={talent.id}>
              <strong>
                Level {talent.levelGained}: {talent.talent.name}
              </strong>
              <span>
                {talent.tableSource === "class" ? "Class" : "Subclass"}
                {table ? ` - ${table.name}` : ""}
              </span>
              {talent.roll ? (
                <span>
                  Rolled {talent.roll.rolls.join(" + ")} = {talent.roll.total}
                </span>
              ) : (
                <span>Manual selection</span>
              )}
              <span>{talent.talent.description}</span>
              <TalentEffectBadges effects={talent.talent.effects} />
            </li>
          );
        })}
    </ul>
  );
}

function LevelUpPanel({
  availablePowers,
  character,
  draft,
  powerDelta,
  step,
  steps,
  onBack,
  onCancel,
  onConfirm,
  onNext,
  onRollHp,
  onTalentChange,
  onTogglePower,
}: {
  availablePowers: ForcePower[];
  character: Character;
  draft: LevelUpDraft;
  powerDelta: number;
  step: LevelUpStepId;
  steps: LevelUpStepId[];
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onNext: () => void;
  onRollHp: () => void;
  onTalentChange: (selection: LevelUpTalentSelection | undefined) => void;
  onTogglePower: (powerId: string) => void;
}) {
  const nextLevel = character.level + 1;
  const isReviewStep = step === "review";

  return (
    <section className="level-up-panel" aria-label="Level up workflow">
      <div className="level-up-panel__header">
        <div>
          <h2>Level Up to {nextLevel}</h2>
          <p className="muted">
            Step {draft.stepIndex + 1} of {steps.length}: {formatLevelUpStep(step)}
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {draft.error ? <p className="form-error" role="alert">{draft.error}</p> : null}

      {step === "hp" ? (
        <div className="stat-list">
          <p>
            Roll class hit die plus CON modifier. Minimum gain is +1 HP, and both
            current and max HP increase by the gain.
          </p>
          <button className="secondary-button" type="button" onClick={onRollHp}>
            Roll HP Gain
          </button>
          {draft.hpGain ? (
            <p role="status">
              Rolled {draft.hpGain.roll.expression}: [{draft.hpGain.roll.rolls.join(", ")}],
              total {draft.hpGain.roll.total}, HP gain +{draft.hpGain.gain}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "talent" ? (
        <LevelUpTalentSelector
          character={character}
          selection={draft.talentSelection}
          onSelectionChange={onTalentChange}
        />
      ) : null}

      {step === "powers" ? (
        <div className="power-selector">
          <div className="inventory-summary" aria-label="Level up power selection count">
            <span>
              Selected {draft.newPowerIds.length} / {powerDelta}
            </span>
          </div>
          <ul className="power-choice-list" aria-label="Level up power choices">
            {availablePowers.map((power) => (
              <li key={power.id}>
                <label className="checkbox-label">
                  <input
                    checked={draft.newPowerIds.includes(power.id)}
                    type="checkbox"
                    onChange={() => onTogglePower(power.id)}
                  />
                  <span>
                    <strong>{power.name}</strong>
                    <small>Tier {power.tier}, DC {calculateForceCheckDc(power.tier)}</small>
                    <span>{power.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isReviewStep ? (
        <div className="review-list">
          <p><strong>New level:</strong> {nextLevel}</p>
          <p><strong>HP gain:</strong> {draft.hpGain ? `+${draft.hpGain.gain}` : "None"}</p>
          <p><strong>Talent:</strong> {displayLevelUpTalent(draft.talentSelection)}</p>
          <p><strong>New powers:</strong> {displayPowerNames(draft.newPowerIds)}</p>
        </div>
      ) : null}

      <div className="builder-actions">
        <button disabled={draft.stepIndex === 0} type="button" onClick={onBack}>
          Back
        </button>
        {isReviewStep ? (
          <button type="button" onClick={onConfirm}>
            Confirm Level Up
          </button>
        ) : (
          <button type="button" onClick={onNext}>
            Next
          </button>
        )}
      </div>
    </section>
  );
}

function LevelUpTalentSelector({
  character,
  selection,
  onSelectionChange,
}: {
  character: Character;
  selection: LevelUpTalentSelection | undefined;
  onSelectionChange: (selection: LevelUpTalentSelection | undefined) => void;
}) {
  const availableTables = getAvailableTalentTables(
    character.classId,
    character.subclassId,
    starWarsShadowdarkRuleset,
  );
  const selectedTable =
    availableTables.find((table) => table.id === selection?.tableId) ??
    availableTables[0];

  if (!selectedTable) {
    return <p className="muted">No talent table available for this class.</p>;
  }

  function rollTalent(): void {
    const result = evaluateDiceExpression("2d6");
    const entry = getTalentTableEntryForRoll(selectedTable, result.total);

    if (!entry) {
      return;
    }

    onSelectionChange({
      tableId: selectedTable.id,
      talentFeatureId: entry.featureId,
      selectionMode: "rolled",
      roll: {
        expression: "2d6",
        rolls: result.rolls as [number, number],
        total: result.total,
      },
    });
  }

  return (
    <div className="talent-selector">
      <div className="form-grid">
        <label>
          Talent table
          <select
            aria-label="Level up talent table"
            value={selectedTable.id}
            onChange={(event) =>
              onSelectionChange({
                tableId: event.target.value,
                talentFeatureId: "",
                selectionMode: "manual",
              })
            }
          >
            {availableTables.map((table) => (
              <option key={table.id} value={table.id}>
                {getTalentTableSourceLabel(table)}: {table.name}
              </option>
            ))}
          </select>
        </label>
        <div className="talent-roll-controls">
          <button type="button" onClick={rollTalent}>
            Roll 2d6
          </button>
          {selection?.selectionMode === "rolled" && selection.roll ? (
            <p role="status">
              Rolled {selection.roll.rolls.join(" + ")} = {selection.roll.total}
            </p>
          ) : (
            <p className="muted">Roll or manually select one talent.</p>
          )}
        </div>
      </div>
      <ul className="power-choice-list" aria-label="Level up talent choices">
        {selectedTable.entries.map((entry) => {
          const feature = getTalentFeature(entry.featureId, starWarsShadowdarkRuleset);

          if (!feature) {
            return null;
          }

          const isSelected =
            selection?.tableId === selectedTable.id &&
            selection.talentFeatureId === feature.id;

          return (
            <li key={entry.id}>
              <label className="checkbox-label">
                <input
                  checked={isSelected}
                  name="level-up-talent-choice"
                  type="radio"
                  onChange={() =>
                    onSelectionChange({
                      tableId: selectedTable.id,
                      talentFeatureId: feature.id,
                      selectionMode: "manual",
                    })
                  }
                />
                <span>
                  <strong>
                    {getRollRangeLabel(entry)}: {feature.name}
                  </strong>
                  <small>{feature.description}</small>
                  <TalentEffectBadges effects={feature.effects} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TalentEffectBadges({ effects }: { effects: CharacterTalent["talent"]["effects"] }) {
  const badges = effects
    .map((effect) => {
      switch (effect.type) {
        case "attackBonus":
          return `Attack ${formatModifier(effect.value)}${effect.target ? ` ${effect.target}` : ""}`;
        case "damageBonus":
          return `Damage ${formatModifier(effect.value)}${effect.target ? ` ${effect.target}` : ""}`;
        case "acBonus":
          return `AC ${formatModifier(effect.value)}${effect.condition ? ` (${effect.condition})` : ""}`;
        case "advantage":
          return `Advantage: ${effect.target}`;
        case "abilityBonus":
          return `${effect.ability.toUpperCase()} ${formatModifier(effect.value)}${effect.condition ? ` (${effect.condition})` : ""}`;
        default:
          return "";
      }
    })
    .filter(Boolean);

  if (badges.length === 0) {
    return null;
  }

  return (
    <span className="effect-badge-list">
      {badges.map((badge) => (
        <small className="effect-badge" key={badge}>
          {badge}
        </small>
      ))}
    </span>
  );
}

function GearItemPreview({ gearItem }: { gearItem: GearItem }) {
  const detailRows = [
    ["Category", gearItem.category],
    ["Slots", formatSlotCount(gearItem.slotsPerItem)],
    ["Damage", gearItem.damage ?? ""],
    ["AC bonus", typeof gearItem.acBonus === "number" ? `+${gearItem.acBonus}` : ""],
  ].filter(([, value]) => value);

  return (
    <div className="gear-preview" aria-label="Selected equipment details">
      <strong>{gearItem.name}</strong>
      <dl>
        {detailRows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {gearItem.notes || gearItem.description ? (
        <p>{gearItem.notes ?? gearItem.description}</p>
      ) : null}
    </div>
  );
}

function PowerMetadata({ power }: { power: ForcePower }) {
  const metadata = [
    power.range ? `Range: ${power.range}` : "",
    power.duration ? `Duration: ${power.duration}` : "",
    typeof power.focus === "boolean" ? `Focus: ${power.focus ? "Yes" : "No"}` : "",
    power.damage ? `Damage: ${power.damage}` : "",
    power.mechanics ? `Mechanics: ${power.mechanics}` : "",
  ].filter(Boolean);

  if (metadata.length === 0) {
    return null;
  }

  return <span>{metadata.join(" | ")}</span>;
}

function WeaponAttackCard({
  attack,
  onRoll,
}: {
  attack: WeaponAttack;
  onRoll: (label: string, expression: string) => void;
}) {
  return (
    <div className="attack-card">
      <div>
        <strong>{attack.name}</strong>
        <span>
          Attack: {attack.attackAbilityLabel} {formatModifier(attack.attackModifier)} (
          {attack.attackExpression})
        </span>
        {attack.damageExpression ? (
          <span>Damage: {attack.damageExpression}</span>
        ) : (
          <span className="muted">No damage expression.</span>
        )}
        <span className="muted">
          {[attack.weaponCategory, ...attack.tags].filter(Boolean).join(", ")}
        </span>
      </div>
      {attack.notes.length > 0 ? (
        <div className="note-list">
          {attack.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      ) : null}
      {attack.warnings.length > 0 ? (
        <div className="warning-list" aria-label={`${attack.name} warnings`}>
          {attack.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
      <div className="roll-actions">
        <button
          type="button"
          onClick={() => onRoll(`${attack.name} Attack`, attack.attackExpression)}
        >
          Roll Attack {formatModifier(attack.attackModifier)}
        </button>
        {attack.damageExpression ? (
          <button
            type="button"
            onClick={() => onRoll(`${attack.name} Damage`, attack.damageExpression!)}
          >
            Roll Damage {attack.damageExpression}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function InventorySummaryList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: InventoryEntry[];
  title: string;
}) {
  return (
    <div className="inventory-summary-list">
      <strong>{title}</strong>
      {items.length > 0 ? (
        <ul>
          {items.map((entry) => (
            <li key={entry.id}>
              {getInventoryEntryName(entry, starWarsShadowdarkRuleset)}
              {entry.quantity > 1 ? ` x${entry.quantity}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{emptyText}</p>
      )}
    </div>
  );
}

function SheetInventoryEntryEditor({
  entry,
  onRemoveEntry,
  onUpdateEntry,
}: {
  entry: InventoryEntry;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<InventoryEntry>) => void;
}) {
  const gearItem = entry.gearItemId
    ? starWarsShadowdarkRuleset.gear.find((item) => item.id === entry.gearItemId)
    : undefined;
  const name = getInventoryEntryName(entry, starWarsShadowdarkRuleset);

  return (
    <div className="inventory-row">
      <div className="inventory-row__heading">
        <strong>{name}</strong>
        <button type="button" onClick={() => onRemoveEntry(entry.id)}>
          Remove
        </button>
      </div>
      <div className="inventory-row__fields">
        {entry.gearItemId ? (
          <p className="muted">
            {gearItem?.category ?? "gear"}
            {gearItem?.damage ? `, damage ${gearItem.damage}` : ""}
            {typeof gearItem?.acBonus === "number" ? `, AC +${gearItem.acBonus}` : ""}
          </p>
        ) : (
          <label>
            Item name
            <input
              aria-label={`${name} name`}
              value={entry.customName ?? ""}
              onChange={(event) =>
                onUpdateEntry(entry.id, {
                  customName: event.target.value,
                })
              }
            />
          </label>
        )}
        <label>
          Quantity
          <input
            aria-label={`${name} quantity`}
            min="1"
            type="number"
            value={entry.quantity}
            onChange={(event) =>
              onUpdateEntry(entry.id, {
                quantity: Math.max(1, Number(event.target.value)),
              })
            }
          />
        </label>
        <label>
          Slots each
          <input
            aria-label={`${name} slots each`}
            min="0"
            step="0.01"
            type="number"
            value={entry.slotsPerItem}
            onChange={(event) =>
              onUpdateEntry(entry.id, {
                slotsPerItem: Math.max(0, Number(event.target.value)),
              })
            }
          />
        </label>
        <label className="checkbox-label">
          <input
            aria-label={`${name} carried`}
            checked={entry.carried}
            type="checkbox"
            onChange={(event) =>
              onUpdateEntry(entry.id, {
                carried: event.target.checked,
                equipped: event.target.checked ? entry.equipped : false,
              })
            }
          />
          Carried
        </label>
        <label className="checkbox-label">
          <input
            aria-label={`${name} equipped`}
            checked={entry.equipped}
            type="checkbox"
            onChange={(event) =>
              onUpdateEntry(entry.id, {
                equipped: event.target.checked,
              })
            }
          />
          Equipped
        </label>
        <label className="inventory-row__notes">
          Notes
          <input
            aria-label={`${name} notes`}
            value={entry.notes ?? ""}
            onChange={(event) =>
              onUpdateEntry(entry.id, {
                notes: event.target.value,
              })
            }
          />
        </label>
      </div>
    </div>
  );
}

function getSheetLookups(character: Character) {
  const species = starWarsShadowdarkRuleset.species.find(
    (option) => option.id === character.speciesId,
  );
  const variant = starWarsShadowdarkRuleset.speciesVariants.find(
    (option) => option.id === character.speciesVariantId,
  );
  const characterClass = starWarsShadowdarkRuleset.classes.find(
    (option) => option.id === character.classId,
  );
  const subclass = starWarsShadowdarkRuleset.subclasses.find(
    (option) => option.id === character.subclassId,
  );
  const background = starWarsShadowdarkRuleset.backgrounds.find(
    (option) => option.id === character.backgroundId,
  );
  const vice = starWarsShadowdarkRuleset.vices.find(
    (option) => option.id === character.viceId,
  );
  const destiny = starWarsShadowdarkRuleset.destinies.find(
    (option) => option.id === character.destinyId,
  );
  const forcePowers = character.knownForcePowerIds
    .map((forcePowerId) =>
      starWarsShadowdarkRuleset.forcePowers.find((power) => power.id === forcePowerId),
    )
    .filter(isDefined);

  return {
    speciesName: species?.name ?? character.speciesId,
    variantName: variant?.name,
    className: characterClass?.name ?? character.classId,
    subclassName: subclass?.name,
    backgroundName: character.customBackground || background?.name || "None recorded",
    viceName: character.customVice || vice?.name || "None recorded",
    destinyName: character.customDestiny || destiny?.name || "None recorded",
    speciesFeatureIds: [
      ...(species?.featureIds ?? []),
      ...(variant?.featureIds ?? []),
    ],
    classFeatureIds: characterClass?.featureIds ?? [],
    subclassFeatureIds: subclass?.featureIds ?? [],
    forcePowers,
    forceCheckModifier: getForceCheckModifier(character),
  };
}

function formatAffinity(affinity: Character["affinity"]): string {
  if (affinity === "light") {
    return "Light Side";
  }

  if (affinity === "dark") {
    return "Dark Side";
  }

  return "Neutral";
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}

function getForceCheckModifier(character: Character): number {
  const ability =
    getCastingAbility(character.classId, starWarsShadowdarkRuleset) ?? "wis";

  return calculateAbilityModifier(character.abilities[ability]);
}

function formatPowerSource(power: ForcePower): string {
  return power.source === "shadowdark-derived"
    ? "Shadowdark-derived"
    : "Homebrew";
}

function getInventoryGearByCategory(
  character: Character,
  category: "armor" | "weapon",
): InventoryEntry[] {
  return character.inventory.entries.filter((entry) => {
    if (!entry.equipped || !entry.gearItemId) {
      return false;
    }

    return (
      starWarsShadowdarkRuleset.gear.find((item) => item.id === entry.gearItemId)
        ?.category === category
    );
  });
}

function getAddableGearItems(searchText: string): GearItem[] {
  const normalizedSearch = searchText.trim().toLowerCase();

  return starWarsShadowdarkRuleset.gear
    .filter(
      (gearItem) =>
        Boolean(gearItem.id) &&
        Boolean(gearItem.name) &&
        Boolean(gearItem.category) &&
        Number.isFinite(gearItem.slotsPerItem),
    )
    .filter((gearItem) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        gearItem.name,
        gearItem.category,
        gearItem.weaponCategory,
        gearItem.armorCategory,
        ...gearItem.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function maybePopulateLegacyInventory(character: Character | undefined): Character | undefined {
  return character
    ? populateLegacyStartingGearInventory(character, starWarsShadowdarkRuleset)
    : undefined;
}

function formatSheetRollSummary(entry: SheetRollHistoryEntry): string {
  const diceText = entry.count === 1 ? `d${entry.sides}` : `${entry.count}d${entry.sides}`;

  return `${entry.label}: ${diceText} ${formatModifier(entry.modifier)} = ${entry.total}`;
}

function getLevelUpSteps(character: Character): LevelUpStepId[] {
  return getPowerSelectionDelta(character) > 0
    ? ["hp", "talent", "powers", "review"]
    : ["hp", "talent", "review"];
}

function getPowerSelectionDelta(character: Character): number {
  const oldLimit = getKnownPowerLimit(
    character.level,
    character.classId,
    character.subclassId,
    starWarsShadowdarkRuleset,
  );
  const newLimit = getKnownPowerLimit(
    character.level + 1,
    character.classId,
    character.subclassId,
    starWarsShadowdarkRuleset,
  );

  return Math.max(0, newLimit - oldLimit);
}

function getLevelUpAvailablePowers(character: Character): ForcePower[] {
  const knownPowerIds = new Set(character.knownForcePowerIds);

  return getAvailablePowersForClass(character.classId, starWarsShadowdarkRuleset, {
    level: character.level + 1,
  }).filter((power) => !knownPowerIds.has(power.id));
}

function validateLevelUpStep(
  step: LevelUpStepId,
  draft: LevelUpDraft,
  character: Character,
): string {
  switch (step) {
    case "hp":
      return draft.hpGain ? "" : "Roll HP gain before continuing.";
    case "talent":
      return isValidLevelUpTalentSelection(draft.talentSelection, character)
        ? ""
        : "Choose or roll one talent.";
    case "powers": {
      const powerDelta = getPowerSelectionDelta(character);
      const availablePowerIds = new Set(
        getLevelUpAvailablePowers(character).map((power) => power.id),
      );
      const validSelectedPowerIds = draft.newPowerIds.filter((powerId) =>
        availablePowerIds.has(powerId),
      );

      return validSelectedPowerIds.length === powerDelta
        ? ""
        : `Choose exactly ${powerDelta} new ${powerDelta === 1 ? "power" : "powers"}.`;
    }
    case "review":
      return "";
  }
}

function validateAllLevelUpSteps(draft: LevelUpDraft, character: Character): string {
  for (const step of getLevelUpSteps(character)) {
    const error = validateLevelUpStep(step, draft, character);

    if (error) {
      return error;
    }
  }

  return "";
}

function isValidLevelUpTalentSelection(
  selection: LevelUpTalentSelection | undefined,
  character: Character,
): boolean {
  if (!selection) {
    return false;
  }

  return getAvailableTalentTables(
    character.classId,
    character.subclassId,
    starWarsShadowdarkRuleset,
  )
    .find((table) => table.id === selection.tableId)
    ?.entries.some((entry) => entry.featureId === selection.talentFeatureId) ?? false;
}

function createLevelUpTalentEntry(
  levelGained: number,
  selection: LevelUpTalentSelection | undefined,
): CharacterTalent | undefined {
  return selection
    ? createTalentHistoryEntry(
        levelGained,
        {
          tableId: selection.tableId,
          talentId: selection.talentFeatureId,
          selectionMode: selection.selectionMode,
          roll: selection.roll,
        },
        starWarsShadowdarkRuleset,
      )
    : undefined;
}

function displayLevelUpTalent(
  selection: LevelUpTalentSelection | undefined,
): string {
  if (!selection) {
    return "None";
  }

  const table = starWarsShadowdarkRuleset.talentTables.find(
    (option) => option.id === selection.tableId,
  );
  const feature = getTalentFeature(selection.talentFeatureId, starWarsShadowdarkRuleset);
  const rollText =
    selection.selectionMode === "rolled" && selection.roll
      ? `, rolled ${selection.roll.total}`
      : "";

  return [table?.name, feature?.name].filter(Boolean).join(" - ") + rollText;
}

function displayPowerNames(powerIds: string[]): string {
  if (powerIds.length === 0) {
    return "None";
  }

  return powerIds
    .map(
      (powerId) =>
        starWarsShadowdarkRuleset.forcePowers.find((power) => power.id === powerId)
          ?.name ?? powerId,
    )
    .join(", ");
}

function formatLevelUpStep(step: LevelUpStepId): string {
  switch (step) {
    case "hp":
      return "HP gain";
    case "talent":
      return "Talent gain";
    case "powers":
      return "Power additions";
    case "review":
      return "Review";
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatSlotCount(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
