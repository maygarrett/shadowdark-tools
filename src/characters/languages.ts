import type { Character } from "./character.schema";
import type { Language, Ruleset } from "../rules/rules.schema";

export type CharacterLanguageProfile = {
  grantedLanguageIds: string[];
  additionalLanguageCount: number;
  languageNotes: string[];
};

export function getCharacterLanguageProfile(
  character: Pick<Character, "speciesId" | "speciesVariantId">,
  ruleset: Ruleset,
): CharacterLanguageProfile {
  const species = ruleset.species.find((option) => option.id === character.speciesId);
  const variant = ruleset.speciesVariants.find(
    (option) => option.id === character.speciesVariantId,
  );

  return {
    grantedLanguageIds: uniqueIds([
      ...(species?.grantedLanguageIds ?? []),
      ...(variant?.grantedLanguageIds ?? []),
    ]),
    additionalLanguageCount:
      (species?.additionalLanguageCount ?? 0) +
      (variant?.additionalLanguageCount ?? 0),
    languageNotes: [
      ...(species?.languageNotes ?? []),
      ...(variant?.languageNotes ?? []),
    ],
  };
}

export function getKnownLanguages(
  character: Pick<
    Character,
    "speciesId" | "speciesVariantId" | "additionalLanguageIds"
  >,
  ruleset: Ruleset,
): Language[] {
  const profile = getCharacterLanguageProfile(character, ruleset);
  const languageIds = uniqueIds([
    ...profile.grantedLanguageIds,
    ...character.additionalLanguageIds,
  ]);

  return languageIds
    .map((languageId) =>
      ruleset.languages.find((language) => language.id === languageId),
    )
    .filter(isDefined);
}

export function formatKnownLanguages(
  character: Pick<
    Character,
    "speciesId" | "speciesVariantId" | "additionalLanguageIds"
  >,
  ruleset: Ruleset,
): string {
  const profile = getCharacterLanguageProfile(character, ruleset);
  const languageNames = getKnownLanguages(character, ruleset).map(
    (language) => language.name,
  );
  const entries = [...languageNames, ...profile.languageNotes];

  return entries.length > 0 ? entries.join(", ") : "None recorded";
}

export function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}
