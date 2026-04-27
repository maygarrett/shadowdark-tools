import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { routes } from "../../app/routes";
import {
  type AbilityScores,
  type Character,
  characterSchema,
  type InventoryEntry,
} from "../../characters/character.schema";
import { createCharacterId, getCharacter, saveCharacter } from "../../characters/storage";
import {
  applyHpFloor,
  calculateAbilityModifier,
  formatModifier,
} from "../../characters/calculations";
import {
  calculateUsedInventorySlots,
  createCustomInventoryEntry,
  createStartingInventoryEntries,
  getInventoryEntryName,
} from "../../characters/inventory";
import {
  getAvailablePowersForClass,
  getCastingAbility,
  getKnownPowerLimit,
  getPowerCheckLabel,
  getPowerDisplayLabel,
  getPowerSource,
} from "../../characters/powers";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";
import type { ForcePower } from "../../rules/rules.schema";

type BuilderStepId =
  | "identity"
  | "species"
  | "class"
  | "abilities"
  | "hp"
  | "powers"
  | "background"
  | "affinity"
  | "vice"
  | "destiny"
  | "inventory"
  | "review";

type DraftCharacter = {
  name: string;
  playerName: string;
  speciesId: string;
  speciesVariantId: string;
  classId: string;
  subclassId: string;
  abilities: Record<keyof AbilityScores, string>;
  hp: string;
  currentHp: string;
  knownForcePowerIds: string[];
  backgroundId: string;
  customBackground: string;
  affinity: "" | "light" | "neutral" | "dark";
  viceId: string;
  customVice: string;
  destinyId: string;
  customDestiny: string;
  inventoryCredits: string;
  inventoryEntries: InventoryEntry[];
  notes: string;
};

const steps: Array<{ id: BuilderStepId; label: string }> = [
  { id: "identity", label: "Name" },
  { id: "species", label: "Species" },
  { id: "class", label: "Class" },
  { id: "abilities", label: "Abilities" },
  { id: "hp", label: "HP" },
  { id: "powers", label: "Powers" },
  { id: "background", label: "Background" },
  { id: "affinity", label: "Affinity" },
  { id: "vice", label: "Vice" },
  { id: "destiny", label: "Destiny" },
  { id: "inventory", label: "Gear" },
  { id: "review", label: "Review" },
];

const initialDraft: DraftCharacter = {
  name: "",
  playerName: "",
  speciesId: "",
  speciesVariantId: "",
  classId: "",
  subclassId: "",
  abilities: {
    str: "",
    dex: "",
    con: "",
    int: "",
    wis: "",
    cha: "",
  },
  hp: "",
  currentHp: "",
  knownForcePowerIds: [],
  backgroundId: "",
  customBackground: "",
  affinity: "",
  viceId: "",
  customVice: "",
  destinyId: "",
  customDestiny: "",
  inventoryCredits: "0",
  inventoryEntries: [],
  notes: "",
};

const abilityLabels: Record<keyof AbilityScores, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export function CharacterBuilderPage() {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [editingCharacter] = useState<Character | undefined>(() =>
    characterId ? getCharacter(characterId) : undefined,
  );
  const isEditMode = Boolean(characterId);
  const [draft, setDraft] = useState<DraftCharacter>(() =>
    editingCharacter ? characterToDraft(editingCharacter) : initialDraft,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");

  const currentStep = steps[stepIndex];
  const selectedSpecies = starWarsShadowdarkRuleset.species.find(
    (species) => species.id === draft.speciesId,
  );
  const speciesVariants = useMemo(
    () =>
      starWarsShadowdarkRuleset.speciesVariants.filter(
        (variant) => variant.speciesId === draft.speciesId,
      ),
    [draft.speciesId],
  );
  const selectedClass = starWarsShadowdarkRuleset.classes.find(
    (characterClass) => characterClass.id === draft.classId,
  );
  const classSubclasses = useMemo(
    () =>
      starWarsShadowdarkRuleset.subclasses.filter(
        (subclass) => subclass.classId === draft.classId,
      ),
    [draft.classId],
  );
  const isFirstStep = stepIndex === 0;
  const isReviewStep = currentStep.id === "review";
  const parsedStrength = Number(draft.abilities.str);
  const maxGearSlots =
    Number.isInteger(parsedStrength) && parsedStrength >= 1
      ? Math.max(10, parsedStrength)
      : 10;
  const usedGearSlots = calculateUsedInventorySlots(draft.inventoryEntries);
  const remainingGearSlots = maxGearSlots - usedGearSlots;
  const knownPowerLimit = getKnownPowerLimit(
    1,
    draft.classId,
    optionalTrim(draft.subclassId),
    starWarsShadowdarkRuleset,
  );
  const powerSource = getPowerSource(draft.classId, starWarsShadowdarkRuleset);
  const castingAbility = getCastingAbility(draft.classId, starWarsShadowdarkRuleset);
  const castingAbilityModifier = castingAbility
    ? calculateDraftAbilityModifier(draft.abilities[castingAbility])
    : 0;
  const availablePowers = getAvailablePowersForClass(
    draft.classId,
    starWarsShadowdarkRuleset,
    { level: 1 },
  );
  const validKnownPowerIds = getValidKnownPowerIds(draft);

  if (isEditMode && !editingCharacter) {
    return (
      <section>
        <header className="page-header">
          <h1>Character Not Found</h1>
          <p>No saved character exists for this edit link.</p>
        </header>
        <div className="placeholder-panel">
          <Link className="text-link" to={routes.characterLibrary}>
            Back to Character Library
          </Link>
        </div>
      </section>
    );
  }

  function updateDraft<Field extends keyof DraftCharacter>(
    field: Field,
    value: DraftCharacter[Field],
  ): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function updateAbility(ability: keyof AbilityScores, value: string): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      abilities: {
        ...currentDraft.abilities,
        [ability]: value,
      },
    }));
  }

  function selectSpecies(speciesId: string): void {
    setDraft((currentDraft) => {
      const currentVariantIsValid = starWarsShadowdarkRuleset.speciesVariants.some(
        (variant) =>
          variant.id === currentDraft.speciesVariantId &&
          variant.speciesId === speciesId,
      );

      return {
        ...currentDraft,
        speciesId,
        speciesVariantId: currentVariantIsValid ? currentDraft.speciesVariantId : "",
      };
    });
  }

  function selectClass(classId: string): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      classId,
      subclassId: starWarsShadowdarkRuleset.subclasses.some(
        (subclass) =>
          subclass.id === currentDraft.subclassId && subclass.classId === classId,
      )
        ? currentDraft.subclassId
        : "",
      knownForcePowerIds:
        classId === currentDraft.classId ? currentDraft.knownForcePowerIds : [],
      inventoryEntries: isEditMode
        ? currentDraft.inventoryEntries
        : createStartingInventoryEntries(classId, starWarsShadowdarkRuleset),
    }));
  }

  function updateInventoryEntry(
    entryId: string,
    updates: Partial<InventoryEntry>,
  ): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      inventoryEntries: currentDraft.inventoryEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              ...updates,
              carried: updates.equipped ? true : updates.carried ?? entry.carried,
            }
          : entry,
      ),
    }));
  }

  function removeInventoryEntry(entryId: string): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      inventoryEntries: currentDraft.inventoryEntries.filter(
        (entry) => entry.id !== entryId,
      ),
    }));
  }

  function addCustomInventoryEntry(): void {
    setDraft((currentDraft) => ({
      ...currentDraft,
      inventoryEntries: [
        ...currentDraft.inventoryEntries,
        createCustomInventoryEntry("Custom item"),
      ],
    }));
  }

  function toggleKnownPower(powerId: string): void {
    setDraft((currentDraft) => {
      const isSelected = currentDraft.knownForcePowerIds.includes(powerId);

      return {
        ...currentDraft,
        knownForcePowerIds: isSelected
          ? currentDraft.knownForcePowerIds.filter(
              (knownPowerId) => knownPowerId !== powerId,
            )
          : [...currentDraft.knownForcePowerIds, powerId],
      };
    });
  }

  function goNext(): void {
    const validationError = validateStep(currentStep.id, draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStepIndex((currentIndex) => Math.min(currentIndex + 1, steps.length - 1));
  }

  function goBack(): void {
    setError("");
    setStepIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }

  function saveDraft(): void {
    const validationError = validateAll(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    const character =
      isEditMode && editingCharacter
        ? mergeDraftIntoExistingCharacter(editingCharacter, draft)
        : draftToNewCharacter(draft);

    saveCharacter(character);
    navigate(
      isEditMode ? routes.characterSheet(character.id) : routes.characterLibrary,
    );
  }

  return (
    <section>
      <header className="page-header">
        <h1>{isEditMode ? "Edit Character" : "New Character"}</h1>
        <p>
          {isEditMode
            ? "Update character details without resetting play-state."
            : "Create a level 1 Star Wars Shadowdark character."}
        </p>
      </header>

      <div className="builder-layout">
        <ol className="builder-steps" aria-label="Character creation steps">
          {steps.map((step, index) => (
            <li
              className={index === stepIndex ? "builder-steps__item--active" : ""}
              key={step.id}
            >
              {index + 1}. {step.label}
            </li>
          ))}
        </ol>

        <div className="form-panel">
          <h2>{currentStep.label}</h2>
          {error ? <p className="form-error" role="alert">{error}</p> : null}

          {currentStep.id === "identity" ? (
            <>
              <div className="form-grid">
                <label>
                  Character name
                  <input
                    value={draft.name}
                    onChange={(event) => updateDraft("name", event.target.value)}
                  />
                </label>
                <label>
                  Player name
                  <input
                    value={draft.playerName}
                    onChange={(event) =>
                      updateDraft("playerName", event.target.value)
                    }
                  />
                </label>
              </div>
              <label>
                Notes / backstory
                <textarea
                  aria-label="Notes / backstory"
                  rows={4}
                  value={draft.notes}
                  onChange={(event) => updateDraft("notes", event.target.value)}
                />
              </label>
            </>
          ) : null}

          {currentStep.id === "species" ? (
            <div className="form-grid">
              <label>
                Species
                <select
                  value={draft.speciesId}
                  onChange={(event) => selectSpecies(event.target.value)}
                >
                  <option value="">Choose species</option>
                  {starWarsShadowdarkRuleset.species.map((species) => (
                    <option key={species.id} value={species.id}>
                      {species.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedSpecies && speciesVariants.length > 0 ? (
                <label>
                  Variant / designation
                  <select
                    value={draft.speciesVariantId}
                    onChange={(event) =>
                      updateDraft("speciesVariantId", event.target.value)
                    }
                  >
                    <option value="">Choose variant</option>
                    {speciesVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          {currentStep.id === "class" ? (
            <div className="form-grid">
              <label>
                Class
                <select
                  value={draft.classId}
                  onChange={(event) => selectClass(event.target.value)}
                >
                  <option value="">Choose class</option>
                  {starWarsShadowdarkRuleset.classes.map((characterClass) => (
                    <option key={characterClass.id} value={characterClass.id}>
                      {characterClass.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedClass && classSubclasses.length > 0 ? (
                <label>
                  Subclass
                  <select
                    value={draft.subclassId}
                    onChange={(event) => {
                      updateDraft("subclassId", event.target.value);
                      updateDraft("knownForcePowerIds", []);
                    }}
                  >
                    <option value="">Choose subclass</option>
                    {classSubclasses.map((subclass) => (
                      <option key={subclass.id} value={subclass.id}>
                        {subclass.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          {currentStep.id === "abilities" ? (
            <div className="ability-grid">
              {(Object.keys(abilityLabels) as Array<keyof AbilityScores>).map(
                (ability) => (
                  <label key={ability}>
                    {abilityLabels[ability]}
                    <input
                      min="1"
                      max="18"
                      type="number"
                      value={draft.abilities[ability]}
                      onChange={(event) =>
                        updateAbility(ability, event.target.value)
                      }
                    />
                  </label>
                ),
              )}
            </div>
          ) : null}

          {currentStep.id === "hp" ? (
            <div className="form-grid">
              <label>
                HP
                <input
                  min="1"
                  type="number"
                  value={draft.hp}
                  onChange={(event) => updateDraft("hp", event.target.value)}
                />
              </label>
              {isEditMode ? (
                <label>
                  Current HP
                  <input
                    min="0"
                    type="number"
                    value={draft.currentHp}
                    onChange={(event) =>
                      updateDraft("currentHp", event.target.value)
                    }
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {currentStep.id === "powers" ? (
            <PowerSelector
              availablePowers={availablePowers}
              castingAbility={castingAbility}
              castingAbilityModifier={castingAbilityModifier}
              knownPowerLimit={knownPowerLimit}
              powerSource={powerSource}
              selectedPowerIds={draft.knownForcePowerIds}
              validSelectedPowerIds={validKnownPowerIds}
              onTogglePower={toggleKnownPower}
            />
          ) : null}

          {currentStep.id === "background" ? (
            <div className="form-grid">
              <label>
                Background
                <select
                  value={draft.backgroundId}
                  onChange={(event) =>
                    updateDraft("backgroundId", event.target.value)
                  }
                >
                  <option value="">Choose background</option>
                  {starWarsShadowdarkRuleset.backgrounds.map((background) => (
                    <option key={background.id} value={background.id}>
                      {background.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Custom background
                <input
                  value={draft.customBackground}
                  onChange={(event) =>
                    updateDraft("customBackground", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          {currentStep.id === "affinity" ? (
            <label>
              Affinity
              <select
                value={draft.affinity}
                onChange={(event) =>
                  updateDraft(
                    "affinity",
                    event.target.value as DraftCharacter["affinity"],
                  )
                }
              >
                <option value="">Choose affinity</option>
                <option value="light">Light Side</option>
                <option value="neutral">Neutral</option>
                <option value="dark">Dark Side</option>
              </select>
            </label>
          ) : null}

          {currentStep.id === "vice" ? (
            <div className="form-grid">
              <label>
                Vice
                <select
                  value={draft.viceId}
                  onChange={(event) => updateDraft("viceId", event.target.value)}
                >
                  <option value="">Choose vice</option>
                  {starWarsShadowdarkRuleset.vices.map((vice) => (
                    <option key={vice.id} value={vice.id}>
                      {vice.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Custom vice
                <input
                  value={draft.customVice}
                  onChange={(event) =>
                    updateDraft("customVice", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          {currentStep.id === "destiny" ? (
            <div className="form-grid">
              <label>
                Destiny
                <select
                  value={draft.destinyId}
                  onChange={(event) =>
                    updateDraft("destinyId", event.target.value)
                  }
                >
                  <option value="">Choose destiny</option>
                  {starWarsShadowdarkRuleset.destinies.map((destiny) => (
                    <option key={destiny.id} value={destiny.id}>
                      {destiny.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Custom destiny
                <input
                  value={draft.customDestiny}
                  onChange={(event) =>
                    updateDraft("customDestiny", event.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          {currentStep.id === "inventory" ? (
            <InventoryEditor
              credits={draft.inventoryCredits}
              entries={draft.inventoryEntries}
              maxGearSlots={maxGearSlots}
              remainingGearSlots={remainingGearSlots}
              usedGearSlots={usedGearSlots}
              onAddCustomItem={addCustomInventoryEntry}
              onCreditsChange={(value) => updateDraft("inventoryCredits", value)}
              onRemoveEntry={removeInventoryEntry}
              onUpdateEntry={updateInventoryEntry}
            />
          ) : null}

          {isReviewStep ? (
            <div className="review-list">
              <p><strong>Name:</strong> {draft.name}</p>
              <p><strong>Species:</strong> {displaySelectedSpecies(draft)}</p>
              <p><strong>Class:</strong> {displaySelectedClass(draft)}</p>
              <p>
                <strong>{getPowerDisplayLabel(powerSource)}:</strong>{" "}
                {displaySelectedPowers(validKnownPowerIds)}
              </p>
              <p><strong>Background:</strong> {displayChoice(draft.backgroundId, draft.customBackground, starWarsShadowdarkRuleset.backgrounds)}</p>
              <p><strong>Affinity:</strong> {draft.affinity}</p>
              <p><strong>Vice:</strong> {displayChoice(draft.viceId, draft.customVice, starWarsShadowdarkRuleset.vices)}</p>
              <p><strong>Destiny:</strong> {displayChoice(draft.destinyId, draft.customDestiny, starWarsShadowdarkRuleset.destinies)}</p>
              <p>
                <strong>Inventory:</strong> {draft.inventoryEntries.length} item entries,{" "}
                {formatSlotCount(usedGearSlots)}/{formatSlotCount(maxGearSlots)} slots used
              </p>
              {remainingGearSlots < 0 ? (
                <p className="form-warning" role="alert">
                  Inventory is over gear slots by {formatSlotCount(Math.abs(remainingGearSlots))}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="builder-actions">
            <button disabled={isFirstStep} type="button" onClick={goBack}>
              Back
            </button>
            {isReviewStep ? (
              <button type="button" onClick={saveDraft}>
                {isEditMode ? "Save Changes" : "Save Character"}
              </button>
            ) : (
              <button type="button" onClick={goNext}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function validateStep(stepId: BuilderStepId, draft: DraftCharacter): string {
  switch (stepId) {
    case "identity":
      return draft.name.trim() ? "" : "Character name is required.";
    case "species": {
      if (!draft.speciesId) {
        return "Species is required.";
      }

      const variants = starWarsShadowdarkRuleset.speciesVariants.filter(
        (variant) => variant.speciesId === draft.speciesId,
      );

      return variants.length > 0 && !draft.speciesVariantId
        ? "Variant / designation is required for this species."
        : "";
    }
    case "class": {
      if (!draft.classId) {
        return "Class is required.";
      }

      const subclasses = starWarsShadowdarkRuleset.subclasses.filter(
        (subclass) => subclass.classId === draft.classId,
      );

      return subclasses.length > 0 && !draft.subclassId
        ? "Subclass is required for this class."
        : "";
    }
    case "abilities":
      return validateAbilities(draft.abilities);
    case "hp":
      return validateHp(draft);
    case "powers":
      return validatePowers(draft);
    case "background":
      return draft.backgroundId || draft.customBackground.trim()
        ? ""
        : "Choose a background or enter a custom background.";
    case "affinity":
      return draft.affinity ? "" : "Affinity is required.";
    case "vice":
      return draft.viceId || draft.customVice.trim()
        ? ""
        : "Choose a vice or enter a custom vice.";
    case "destiny":
      return draft.destinyId || draft.customDestiny.trim()
        ? ""
        : "Choose a destiny or enter a custom destiny.";
    case "inventory":
      return validateInventory(draft);
    case "review":
      return "";
  }
}

function validateAll(draft: DraftCharacter): string {
  for (const step of steps) {
    const validationError = validateStep(step.id, draft);

    if (validationError) {
      return validationError;
    }
  }

  return "";
}

function validateAbilities(abilities: DraftCharacter["abilities"]): string {
  for (const [ability, value] of Object.entries(abilities)) {
    const score = Number(value);

    if (!Number.isInteger(score) || score < 1 || score > 18) {
      return `${ability.toUpperCase()} must be between 1 and 18.`;
    }
  }

  return "";
}

function validateHp(draft: DraftCharacter): string {
  if (Number(draft.hp) < 1) {
    return "HP must be at least 1.";
  }

  if (
    draft.currentHp &&
    (!Number.isInteger(Number(draft.currentHp)) || Number(draft.currentHp) < 0)
  ) {
    return "Current HP must be zero or greater.";
  }

  return "";
}

function parseAbilities(abilities: DraftCharacter["abilities"]): AbilityScores {
  return {
    str: Number(abilities.str),
    dex: Number(abilities.dex),
    con: Number(abilities.con),
    int: Number(abilities.int),
    wis: Number(abilities.wis),
    cha: Number(abilities.cha),
  };
}

function characterToDraft(character: Character): DraftCharacter {
  return {
    name: character.name,
    playerName: character.playerName ?? "",
    speciesId: character.speciesId,
    speciesVariantId: character.speciesVariantId ?? "",
    classId: character.classId,
    subclassId: character.subclassId ?? "",
    abilities: {
      str: String(character.abilities.str),
      dex: String(character.abilities.dex),
      con: String(character.abilities.con),
      int: String(character.abilities.int),
      wis: String(character.abilities.wis),
      cha: String(character.abilities.cha),
    },
    hp: String(character.hp.max),
    currentHp: String(character.hp.current),
    knownForcePowerIds: [...character.knownForcePowerIds],
    backgroundId: character.backgroundId ?? "",
    customBackground: character.customBackground ?? "",
    affinity: character.affinity,
    viceId: character.viceId ?? "",
    customVice: character.customVice ?? "",
    destinyId: character.destinyId ?? "",
    customDestiny: character.customDestiny ?? "",
    inventoryCredits: String(character.inventory.credits),
    inventoryEntries: character.inventory.entries.map((entry) => ({ ...entry })),
    notes: character.notes ?? "",
  };
}

function draftToNewCharacter(draft: DraftCharacter): Character {
  const now = new Date().toISOString();
  const hp = applyHpFloor(Number(draft.hp));

  return characterSchema.parse({
    id: createCharacterId(),
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: draft.name.trim(),
    playerName: optionalTrim(draft.playerName),
    level: 1,
    abilities: parseAbilities(draft.abilities),
    hp: {
      max: hp,
      current: hp,
    },
    notes: draft.notes,
    speciesId: draft.speciesId,
    speciesVariantId: optionalTrim(draft.speciesVariantId),
    classId: draft.classId,
    subclassId: optionalTrim(draft.subclassId),
    knownForcePowerIds: getValidKnownPowerIds(draft),
    startingGearIds:
      starWarsShadowdarkRuleset.classes.find(
        (characterClass) => characterClass.id === draft.classId,
      )?.startingGearIds ?? [],
    inventory: {
      credits: Math.max(0, Number(draft.inventoryCredits) || 0),
      entries: draft.inventoryEntries,
    },
    resources: [],
    backgroundId: optionalTrim(draft.backgroundId),
    customBackground: optionalTrim(draft.customBackground),
    affinity: draft.affinity,
    viceId: optionalTrim(draft.viceId),
    customVice: optionalTrim(draft.customVice),
    destinyId: optionalTrim(draft.destinyId),
    customDestiny: optionalTrim(draft.customDestiny),
    createdAt: now,
    updatedAt: now,
  });
}

function mergeDraftIntoExistingCharacter(
  existingCharacter: Character,
  draft: DraftCharacter,
): Character {
  const maxHp = applyHpFloor(Number(draft.hp));
  const currentHp = Number.isInteger(Number(draft.currentHp))
    ? Math.max(0, Number(draft.currentHp))
    : existingCharacter.hp.current;

  return characterSchema.parse({
    ...existingCharacter,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: draft.name.trim(),
    playerName: optionalTrim(draft.playerName),
    abilities: parseAbilities(draft.abilities),
    hp: {
      max: maxHp,
      current: currentHp,
    },
    notes: draft.notes,
    speciesId: draft.speciesId,
    speciesVariantId: optionalTrim(draft.speciesVariantId),
    classId: draft.classId,
    subclassId: optionalTrim(draft.subclassId),
    knownForcePowerIds: getValidKnownPowerIds(draft),
    inventory: {
      credits: Math.max(0, Number(draft.inventoryCredits) || 0),
      entries: draft.inventoryEntries,
    },
    backgroundId: optionalTrim(draft.backgroundId),
    customBackground: optionalTrim(draft.customBackground),
    affinity: draft.affinity,
    viceId: optionalTrim(draft.viceId),
    customVice: optionalTrim(draft.customVice),
    destinyId: optionalTrim(draft.destinyId),
    customDestiny: optionalTrim(draft.customDestiny),
    updatedAt: new Date().toISOString(),
  });
}

function optionalTrim(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

function validateInventory(draft: DraftCharacter): string {
  const credits = Number(draft.inventoryCredits);

  if (!Number.isInteger(credits) || credits < 0) {
    return "Credits must be zero or greater.";
  }

  for (const entry of draft.inventoryEntries) {
    if (!entry.gearItemId && !entry.customName?.trim()) {
      return "Custom inventory items need a name.";
    }

    if (!Number.isInteger(entry.quantity) || entry.quantity < 1) {
      return "Inventory item quantity must be at least 1.";
    }

    if (entry.slotsPerItem < 0) {
      return "Inventory item slots cannot be negative.";
    }
  }

  return "";
}

function validatePowers(draft: DraftCharacter): string {
  const knownPowerLimit = getKnownPowerLimit(
    1,
    draft.classId,
    optionalTrim(draft.subclassId),
    starWarsShadowdarkRuleset,
  );
  const validKnownPowerIds = getValidKnownPowerIds(draft);

  if (knownPowerLimit === 0) {
    return "";
  }

  return validKnownPowerIds.length === knownPowerLimit
    ? ""
    : `Choose exactly ${knownPowerLimit} ${knownPowerLimit === 1 ? "power" : "powers"}.`;
}

function getValidKnownPowerIds(draft: DraftCharacter): string[] {
  const availablePowerIds = new Set(
    getAvailablePowersForClass(draft.classId, starWarsShadowdarkRuleset, {
      level: 1,
    }).map((power) => power.id),
  );

  return draft.knownForcePowerIds.filter((powerId) => availablePowerIds.has(powerId));
}

function PowerSelector({
  availablePowers,
  castingAbility,
  castingAbilityModifier,
  knownPowerLimit,
  powerSource,
  selectedPowerIds,
  validSelectedPowerIds,
  onTogglePower,
}: {
  availablePowers: ForcePower[];
  castingAbility: keyof AbilityScores | undefined;
  castingAbilityModifier: number;
  knownPowerLimit: number;
  powerSource: "force" | "tech" | "none";
  selectedPowerIds: string[];
  validSelectedPowerIds: string[];
  onTogglePower: (powerId: string) => void;
}) {
  const checkLabel = getPowerCheckLabel(powerSource);
  const powerLabel = getPowerDisplayLabel(powerSource);
  const availablePowerIds = new Set(availablePowers.map((power) => power.id));
  const unavailableSelectedPowerIds = selectedPowerIds.filter(
    (powerId) => !availablePowerIds.has(powerId),
  );

  if (knownPowerLimit === 0) {
    return (
      <div className="power-selector">
        <p className="muted">No starting powers at level 1.</p>
        <UnavailableSelectedPowers
          powerIds={unavailableSelectedPowerIds}
          onTogglePower={onTogglePower}
        />
      </div>
    );
  }

  return (
    <div className="power-selector">
      <div className="inventory-summary" aria-label="Power selection count">
        <span>
          Selected {validSelectedPowerIds.length} / {knownPowerLimit}
        </span>
        {castingAbility ? (
          <span>
            {checkLabel}: {castingAbility.toUpperCase()}{" "}
            {formatModifier(castingAbilityModifier)}
          </span>
        ) : null}
      </div>
      <ul className="power-choice-list" aria-label={powerLabel}>
        {availablePowers.map((power) => (
          <li key={power.id}>
            <label className="checkbox-label">
              <input
                checked={selectedPowerIds.includes(power.id)}
                type="checkbox"
                onChange={() => onTogglePower(power.id)}
              />
              <span>
                <strong>{power.name}</strong>
                <small>{formatPowerSource(power)}</small>
                <small>
                  Tier {power.tier}, DC {10 + power.tier}
                </small>
                {power.derivedFromSpellName ? (
                  <small>Based on: {power.derivedFromSpellName}</small>
                ) : null}
                <PowerMetadata power={power} />
                <span>{power.description}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <UnavailableSelectedPowers
        powerIds={unavailableSelectedPowerIds}
        onTogglePower={onTogglePower}
      />
    </div>
  );
}

function UnavailableSelectedPowers({
  powerIds,
  onTogglePower,
}: {
  powerIds: string[];
  onTogglePower: (powerId: string) => void;
}) {
  if (powerIds.length === 0) {
    return null;
  }

  return (
    <div className="form-warning" role="status">
      <p>
        These saved powers are not selectable for the current class at level 1 and
        will not be saved unless they become valid again.
      </p>
      <ul className="power-choice-list" aria-label="Unavailable saved powers">
        {powerIds.map((powerId) => {
          const power = starWarsShadowdarkRuleset.forcePowers.find(
            (option) => option.id === powerId,
          );
          const powerName = power?.name ?? powerId;

          return (
            <li key={powerId}>
              <label className="checkbox-label">
                <input
                  checked
                  type="checkbox"
                  onChange={() => onTogglePower(powerId)}
                />
                <span>
                  <strong>{powerName}</strong>
                  <small>Unavailable</small>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
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

  return <small>{metadata.join(" | ")}</small>;
}

function InventoryEditor({
  credits,
  entries,
  maxGearSlots,
  remainingGearSlots,
  usedGearSlots,
  onAddCustomItem,
  onCreditsChange,
  onRemoveEntry,
  onUpdateEntry,
}: {
  credits: string;
  entries: InventoryEntry[];
  maxGearSlots: number;
  remainingGearSlots: number;
  usedGearSlots: number;
  onAddCustomItem: () => void;
  onCreditsChange: (value: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<InventoryEntry>) => void;
}) {
  return (
    <div className="inventory-editor">
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

      <label>
        Credits
        <input
          min="0"
          type="number"
          value={credits}
          onChange={(event) => onCreditsChange(event.target.value)}
        />
      </label>

      <div className="inventory-list">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <InventoryEntryEditor
              entry={entry}
              key={entry.id}
              onRemoveEntry={onRemoveEntry}
              onUpdateEntry={onUpdateEntry}
            />
          ))
        ) : (
          <p className="muted">No starting gear selected.</p>
        )}
      </div>

      <button className="secondary-button" type="button" onClick={onAddCustomItem}>
        Add Custom Item
      </button>
    </div>
  );
}

function InventoryEntryEditor({
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

function displayChoice(
  id: string,
  customValue: string,
  options: ReadonlyArray<{ id: string; name: string }>,
): string {
  return customValue.trim() || options.find((option) => option.id === id)?.name || "";
}

function displaySelectedSpecies(draft: DraftCharacter): string {
  const species = starWarsShadowdarkRuleset.species.find(
    (option) => option.id === draft.speciesId,
  )?.name;
  const variant = starWarsShadowdarkRuleset.speciesVariants.find(
    (option) => option.id === draft.speciesVariantId,
  )?.name;

  return [species, variant].filter(Boolean).join(" - ");
}

function displaySelectedClass(draft: DraftCharacter): string {
  const characterClass = starWarsShadowdarkRuleset.classes.find(
    (option) => option.id === draft.classId,
  )?.name;
  const subclass = starWarsShadowdarkRuleset.subclasses.find(
    (option) => option.id === draft.subclassId,
  )?.name;

  return [characterClass, subclass].filter(Boolean).join(" - ");
}

function displaySelectedPowers(powerIds: string[]): string {
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

function formatPowerSource(power: ForcePower): string {
  return power.source === "shadowdark-derived"
    ? "Shadowdark-derived"
    : "Homebrew";
}

function calculateDraftAbilityModifier(value: string): number {
  const score = Number(value);

  return Number.isInteger(score) ? calculateAbilityModifier(score) : 0;
}

function formatSlotCount(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}
