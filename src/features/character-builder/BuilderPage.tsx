import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "../../app/routes";
import { type AbilityScores, characterSchema } from "../../characters/character.schema";
import { saveCharacter } from "../../characters/storage";
import { applyHpFloor } from "../../characters/calculations";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";

type BuilderStepId =
  | "identity"
  | "species"
  | "class"
  | "abilities"
  | "hp"
  | "background"
  | "affinity"
  | "vice"
  | "destiny"
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
  backgroundId: string;
  customBackground: string;
  affinity: "" | "light" | "neutral" | "dark";
  viceId: string;
  customVice: string;
  destinyId: string;
  customDestiny: string;
};

const steps: Array<{ id: BuilderStepId; label: string }> = [
  { id: "identity", label: "Name" },
  { id: "species", label: "Species" },
  { id: "class", label: "Class" },
  { id: "abilities", label: "Abilities" },
  { id: "hp", label: "HP" },
  { id: "background", label: "Background" },
  { id: "affinity", label: "Affinity" },
  { id: "vice", label: "Vice" },
  { id: "destiny", label: "Destiny" },
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
  backgroundId: "",
  customBackground: "",
  affinity: "",
  viceId: "",
  customVice: "",
  destinyId: "",
  customDestiny: "",
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
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftCharacter>(initialDraft);
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

    const now = new Date().toISOString();
    const hp = applyHpFloor(Number(draft.hp));
    const character = characterSchema.parse({
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
      notes: "",
      speciesId: draft.speciesId,
      speciesVariantId: optionalTrim(draft.speciesVariantId),
      classId: draft.classId,
      subclassId: optionalTrim(draft.subclassId),
      knownForcePowerIds: [],
      startingGearIds:
        starWarsShadowdarkRuleset.classes.find(
          (characterClass) => characterClass.id === draft.classId,
        )?.startingGearIds ?? [],
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

    saveCharacter(character);
    navigate(routes.characterLibrary);
  }

  return (
    <section>
      <header className="page-header">
        <h1>New Character</h1>
        <p>Create a level 1 Star Wars Shadowdark character.</p>
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
          ) : null}

          {currentStep.id === "species" ? (
            <div className="form-grid">
              <label>
                Species
                <select
                  value={draft.speciesId}
                  onChange={(event) => {
                    updateDraft("speciesId", event.target.value);
                    updateDraft("speciesVariantId", "");
                  }}
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
                  onChange={(event) => {
                    updateDraft("classId", event.target.value);
                    updateDraft("subclassId", "");
                  }}
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
                    onChange={(event) =>
                      updateDraft("subclassId", event.target.value)
                    }
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
            <label>
              HP
              <input
                min="1"
                type="number"
                value={draft.hp}
                onChange={(event) => updateDraft("hp", event.target.value)}
              />
            </label>
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

          {isReviewStep ? (
            <div className="review-list">
              <p><strong>Name:</strong> {draft.name}</p>
              <p><strong>Species:</strong> {displaySelectedSpecies(draft)}</p>
              <p><strong>Class:</strong> {displaySelectedClass(draft)}</p>
              <p><strong>Background:</strong> {displayChoice(draft.backgroundId, draft.customBackground, starWarsShadowdarkRuleset.backgrounds)}</p>
              <p><strong>Affinity:</strong> {draft.affinity}</p>
              <p><strong>Vice:</strong> {displayChoice(draft.viceId, draft.customVice, starWarsShadowdarkRuleset.vices)}</p>
              <p><strong>Destiny:</strong> {displayChoice(draft.destinyId, draft.customDestiny, starWarsShadowdarkRuleset.destinies)}</p>
            </div>
          ) : null}

          <div className="builder-actions">
            <button disabled={isFirstStep} type="button" onClick={goBack}>
              Back
            </button>
            {isReviewStep ? (
              <button type="button" onClick={saveDraft}>
                Save Character
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
      return Number(draft.hp) >= 1 ? "" : "HP must be at least 1.";
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

function optionalTrim(value: string): string | undefined {
  const trimmedValue = value.trim();

  return trimmedValue || undefined;
}

function createCharacterId(): string {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `character-${Date.now()}`;
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
