import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { characterSchema, type Character } from "../../characters/character.schema";
import { serializeCharacterForExport } from "../../characters/importExport";
import {
  clearCharactersForTests,
  listCharacters,
  saveCharacter,
} from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";

function renderLibrary() {
  render(
    <MemoryRouter
      initialEntries={["/characters"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App />
    </MemoryRouter>,
  );
}

function makeImportFile(): File {
  const character = makeCharacter({
    id: "imported-character",
    name: "Imported Hero",
  });

  return new File([serializeCharacterForExport(character)], "imported-hero.json", {
    type: "application/json",
  });
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const now = new Date().toISOString();

  return characterSchema.parse({
    id: "saved-character",
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: "Saved Hero",
    level: 1,
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    hp: {
      max: 6,
      current: 6,
    },
    speciesId: "duros",
    classId: "trooper",
    knownForcePowerIds: [],
    startingGearIds: [],
    backgroundId: "war-refugee",
    affinity: "neutral",
    viceId: "duty",
    destinyId: "light-mentor-major-goal",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe("CharacterLibraryPage imports", () => {
  beforeEach(() => {
    clearCharactersForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates the library after importing a valid character file", async () => {
    renderLibrary();

    fireEvent.change(screen.getByLabelText(/import character json/i), {
      target: {
        files: [makeImportFile()],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Imported Imported Hero/i);
    });

    expect(
      screen.getByRole("link", { name: /Imported Hero/i }),
    ).toBeInTheDocument();
  });

  it("deletes one character after confirmation", () => {
    saveCharacter(makeCharacter({ id: "first-character", name: "First Hero" }));
    saveCharacter(makeCharacter({ id: "second-character", name: "Second Hero" }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderLibrary();

    fireEvent.click(screen.getByRole("button", { name: /delete first hero/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete First Hero? This cannot be undone.",
    );
    expect(screen.queryByRole("link", { name: /first hero/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /second hero/i })).toBeInTheDocument();
    expect(listCharacters().map((character) => character.id)).toEqual([
      "second-character",
    ]);
  });

  it("keeps a character when delete confirmation is canceled", () => {
    saveCharacter(makeCharacter({ id: "saved-character", name: "Saved Hero" }));
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderLibrary();

    fireEvent.click(screen.getByRole("button", { name: /delete saved hero/i }));

    expect(screen.getByRole("link", { name: /saved hero/i })).toBeInTheDocument();
    expect(listCharacters()).toHaveLength(1);
  });
});
