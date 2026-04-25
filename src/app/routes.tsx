export const routes = {
  characterLibrary: "/characters",
  newCharacter: "/characters/new",
  characterSheet: (characterId: string) => `/characters/${characterId}`,
  diceRoller: "/dice",
} as const;
