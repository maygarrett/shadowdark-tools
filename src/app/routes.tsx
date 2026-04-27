export const routes = {
  characterLibrary: "/characters",
  newCharacter: "/characters/new",
  editCharacter: (characterId: string) => `/characters/${characterId}/edit`,
  characterSheet: (characterId: string) => `/characters/${characterId}`,
  diceRoller: "/dice",
} as const;
