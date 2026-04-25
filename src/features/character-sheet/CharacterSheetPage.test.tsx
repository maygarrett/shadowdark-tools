import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { characterSchema } from "../../characters/character.schema";
import { clearCharactersForTests, getCharacter, saveCharacter } from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";

function renderSheet(characterId: string) {
  render(
    <MemoryRouter
      initialEntries={[`/characters/${characterId}`]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App />
    </MemoryRouter>,
  );
}

function saveTestCharacter() {
  const now = new Date().toISOString();
  const character = characterSchema.parse({
    id: "test-character",
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: "Vexa Sol",
    playerName: "Garrett",
    level: 1,
    abilities: {
      str: 14,
      dex: 8,
      con: 12,
      int: 10,
      wis: 16,
      cha: 9,
    },
    hp: {
      max: 8,
      current: 5,
    },
    notes: "Original note",
    speciesId: "human",
    speciesVariantId: "human-republican",
    classId: "knight",
    subclassId: "guardian",
    knownForcePowerIds: ["force-push"],
    startingGearIds: ["shock-baton", "knight-robes"],
    backgroundId: "outer-rim-farmer",
    affinity: "light",
    viceId: "attachment",
    destinyId: "light-save-defined-threat",
    createdAt: now,
    updatedAt: now,
  });

  saveCharacter(character);
}

describe("CharacterSheetPage", () => {
  beforeEach(() => {
    clearCharactersForTests();
  });

  it("loads a saved character by ID", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByRole("heading", { name: "Vexa Sol" })).toBeInTheDocument();
    expect(screen.getByText(/Player: Garrett/i)).toBeInTheDocument();
  });

  it("displays ability modifiers clearly", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByText("STR +2")).toBeInTheDocument();
    expect(screen.getByText("DEX -1")).toBeInTheDocument();
    expect(screen.getByText("WIS +3")).toBeInTheDocument();
    expect(screen.getByText(/\(10 \+ DEX -1\)/)).toBeInTheDocument();
  });

  it("displays origin, class, subclass, background, affinity, vice, and destiny", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByText(/Species:/i)).toBeInTheDocument();
    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("Republican")).toBeInTheDocument();
    expect(screen.getByText("Knight")).toBeInTheDocument();
    expect(screen.getByText("Guardian")).toBeInTheDocument();
    expect(screen.getByText("Outer Rim Farmer")).toBeInTheDocument();
    expect(screen.getByText("Light Side")).toBeInTheDocument();
    expect(screen.getByText("Attachment")).toBeInTheDocument();
    expect(
      screen.getByText("Save a person, community, or group from a defined threat"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bold Opportunist")).toBeInTheDocument();
    expect(screen.getByText("Force Push")).toBeInTheDocument();
    expect(screen.getByText("Shock Baton")).toBeInTheDocument();
  });

  it("allows editing current HP and notes", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.change(screen.getByLabelText(/current hp/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/character notes/i), {
      target: { value: "Updated note" },
    });

    const savedCharacter = getCharacter("test-character");

    expect(savedCharacter?.hp.current).toBe(3);
    expect(savedCharacter?.notes).toBe("Updated note");
  });

  it("shows a friendly not-found state for a missing character ID", () => {
    renderSheet("missing-character");

    expect(
      screen.getByRole("heading", { name: /character not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No saved character exists/i)).toBeInTheDocument();
  });
});
