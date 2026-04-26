import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { routes } from "../../app/routes";
import {
  type AbilityScores,
  type Character,
  type CharacterResource,
  type InventoryEntry,
} from "../../characters/character.schema";
import {
  calculateAbilityModifier,
  calculateForceCheckDc,
  formatModifier,
} from "../../characters/calculations";
import {
  calculateArmorClass,
  calculateCharacterGearSlots,
  calculateRemainingInventorySlots,
  calculateUsedInventorySlots,
  createCustomInventoryEntry,
  getInventoryEntryName,
  populateLegacyStartingGearInventory,
} from "../../characters/inventory";
import {
  classRequiresForcePointToCast,
  getCastingAbility,
  getPowerCheckLabel,
  getPowerDisplayLabel,
  getPowerSource,
} from "../../characters/powers";
import {
  getCharacterExportFileName,
  serializeCharacterForExport,
} from "../../characters/importExport";
import { getCharacter, saveCharacter } from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";
import type { ForcePower } from "../../rules/rules.schema";
import { evaluateDiceExpression, type DiceRollResult } from "../../shared/dice";

type SheetRollHistoryEntry = DiceRollResult & {
  id: string;
  label: string;
  rolledAt: Date;
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
          <button type="button" onClick={exportCharacter}>
            Export
          </button>
        </div>
      </header>

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
          </div>
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

function maybePopulateLegacyInventory(character: Character | undefined): Character | undefined {
  return character
    ? populateLegacyStartingGearInventory(character, starWarsShadowdarkRuleset)
    : undefined;
}

function formatSheetRollSummary(entry: SheetRollHistoryEntry): string {
  const diceText = entry.count === 1 ? `d${entry.sides}` : `${entry.count}d${entry.sides}`;

  return `${entry.label}: ${diceText} ${formatModifier(entry.modifier)} = ${entry.total}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatSlotCount(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
