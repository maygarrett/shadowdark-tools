import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { routes } from "../../app/routes";
import { type AbilityScores, type Character } from "../../characters/character.schema";
import {
  calculateAbilityModifier,
  calculateBasicArmorClass,
  calculateForceCheckDc,
  formatModifier,
} from "../../characters/calculations";
import {
  getCharacterExportFileName,
  serializeCharacterForExport,
} from "../../characters/importExport";
import { getCharacter, saveCharacter } from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";
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
    characterId ? getCharacter(characterId) : undefined,
  );
  const [rollHistory, setRollHistory] = useState<SheetRollHistoryEntry[]>([]);

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

  const sheet = getSheetLookups(character);
  const dexModifier = calculateAbilityModifier(character.abilities.dex);
  const armorClass = calculateBasicArmorClass(dexModifier);

  function updateCharacter(updatedCharacter: Character): void {
    const savedCharacter = {
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

    const blob = new Blob([serializeCharacterForExport(character)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = getCharacterExportFileName(character);
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

  return (
    <section>
      <header className="sheet-header">
        <div>
          <h1>{character.name}</h1>
          <p>
            {sheet.speciesName}
            {sheet.variantName ? ` - ${sheet.variantName}` : ""}{" "}
            {sheet.className}
            {sheet.subclassName ? ` (${sheet.subclassName})` : ""}, Level{" "}
            {character.level}
          </p>
        </div>
        <div className="sheet-header__meta">
          {character.playerName ? <span>Player: {character.playerName}</span> : null}
          <span>AC {armorClass}</span>
          <span>
            HP {character.hp.current}/{character.hp.max}
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
              const score = character.abilities[ability.key];
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
              <span className="muted">(10 + DEX {formatModifier(dexModifier)})</span>
            </p>
            <label>
              Current HP
              <input
                min="0"
                type="number"
                value={character.hp.current}
                onChange={(event) => {
                  const currentHp = Math.max(0, Number(event.target.value));
                  updateCharacter({
                    ...character,
                    hp: {
                      ...character.hp,
                      current: currentHp,
                    },
                  });
                }}
              />
            </label>
            <p>
              <strong>Max HP:</strong> {character.hp.max}
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
            <p><strong>Affinity:</strong> {formatAffinity(character.affinity)}</p>
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
          <h2>Known Force Powers</h2>
          {sheet.forcePowers.length > 0 ? (
            <ul className="simple-list">
              {sheet.forcePowers.map((power) => (
                <li key={power.id}>
                  <strong>{power.name}</strong>
                  <span>Tier {power.tier}, DC {calculateForceCheckDc(power.tier)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      rollExpression(
                        `${power.name} Force Check DC ${calculateForceCheckDc(power.tier)}`,
                        `1d20${formatModifier(sheet.forceCheckModifier)}`,
                      )
                    }
                  >
                    Roll Force Check {formatModifier(sheet.forceCheckModifier)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No known Force powers recorded.</p>
          )}
        </section>

        <section className="sheet-panel">
          <h2>Starting Gear</h2>
          {sheet.startingGear.length > 0 ? (
            <ul className="simple-list">
              {sheet.startingGear.map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                  {item.category === "weapon" ? (
                    <div className="roll-actions">
                      <button
                        type="button"
                        onClick={() =>
                          rollExpression(
                            `${item.name} Attack`,
                            `1d20${formatModifier(getWeaponAttackModifier(item, character))}`,
                          )
                        }
                      >
                        Roll Attack {formatModifier(getWeaponAttackModifier(item, character))}
                      </button>
                      {item.damage ? (
                        <button
                          type="button"
                          onClick={() => rollExpression(`${item.name} Damage`, item.damage!)}
                        >
                          Roll Damage {item.damage}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No starting gear stored.</p>
          )}
        </section>

        <section className="sheet-panel sheet-panel--wide">
          <h2>Notes</h2>
          <textarea
            aria-label="Character notes"
            rows={5}
            value={character.notes ?? ""}
            onChange={(event) =>
              updateCharacter({
                ...character,
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
  const startingGear = character.startingGearIds
    .map((gearId) => starWarsShadowdarkRuleset.gear.find((item) => item.id === gearId))
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
    startingGear,
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
  const forceCheckAbilityByClass: Record<string, keyof AbilityScores> = {
    knight: "wis",
    consular: "int",
    trooper: "con",
    scoundrel: "cha",
    "bounty-hunter": "wis",
    agent: "int",
  };
  const ability = forceCheckAbilityByClass[character.classId] ?? "wis";

  return calculateAbilityModifier(character.abilities[ability]);
}

function getWeaponAttackModifier(
  item: { tags: string[] },
  character: Character,
): number {
  const rangedTags = new Set([
    "pistols",
    "carbines",
    "rifles",
    "heavy-weapons",
    "tech",
    "explosives",
    "thrown",
  ]);
  const usesDexterity = item.tags.some((tag) => rangedTags.has(tag));
  const ability = usesDexterity ? "dex" : "str";

  return calculateAbilityModifier(character.abilities[ability]);
}

function formatSheetRollSummary(entry: SheetRollHistoryEntry): string {
  const diceText = entry.count === 1 ? `d${entry.sides}` : `${entry.count}d${entry.sides}`;

  return `${entry.label}: ${diceText} ${formatModifier(entry.modifier)} = ${entry.total}`;
}
