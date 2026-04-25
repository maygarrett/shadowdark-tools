import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    resources: [
      {
        id: "lightsaber-defence",
        label: "Lightsaber Defence",
        maxUses: 1,
        usedUses: 0,
        resetType: "combat",
        source: "class",
      },
      {
        id: "bold-opportunist",
        label: "Bold Opportunist",
        maxUses: 1,
        usedUses: 1,
        resetType: "day",
        source: "species",
      },
      {
        id: "manual-counter",
        label: "Manual Counter",
        maxUses: 3,
        usedUses: 2,
        resetType: "manual",
        source: "custom",
      },
    ],
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

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(screen.getAllByText("Bold Opportunist").length).toBeGreaterThanOrEqual(1);
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

  it("displays roll buttons with correct modifiers", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(
      screen.getByRole("button", { name: "Roll STR +2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll DEX -1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Force Check +3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Attack +2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Damage 1d4" }),
    ).toBeInTheDocument();
  });

  it("adds a roll history entry after clicking a stat roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByRole("button", { name: "Roll STR +2" }));

    expect(screen.getByText("STR Check: d20 +2 = 13")).toBeInTheDocument();
    expect(screen.getByText(/Dice: \[11\], modifier \+2/)).toBeInTheDocument();
  });

  it("increments and decrements resource use", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByLabelText("Increase Lightsaber Defence"));
    expect(screen.getAllByText("Used 1/1").length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByLabelText("Decrease Lightsaber Defence"));
    expect(screen.getByText("Used 0/1")).toBeInTheDocument();

    const savedCharacter = getCharacter("test-character");
    expect(
      savedCharacter?.resources.find((resource) => resource.id === "lightsaber-defence")
        ?.usedUses,
    ).toBe(0);
  });

  it("enforces resource use limits", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByLabelText("Decrease Lightsaber Defence"));
    fireEvent.click(screen.getByLabelText("Increase Bold Opportunist"));

    const savedCharacter = getCharacter("test-character");

    expect(
      savedCharacter?.resources.find((resource) => resource.id === "lightsaber-defence")
        ?.usedUses,
    ).toBe(0);
    expect(
      savedCharacter?.resources.find((resource) => resource.id === "bold-opportunist")
        ?.usedUses,
    ).toBe(1);
  });

  it("persists resource changes after refresh", () => {
    saveTestCharacter();
    const { unmount } = render(
      <MemoryRouter
        initialEntries={["/characters/test-character"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("Increase Lightsaber Defence"));
    unmount();
    renderSheet("test-character");

    expect(screen.getAllByText("Used 1/1").length).toBeGreaterThanOrEqual(2);
  });

  it("reset combat only resets combat resources", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByLabelText("Increase Lightsaber Defence"));
    fireEvent.click(screen.getByRole("button", { name: "Reset Combat" }));

    const savedCharacter = getCharacter("test-character");

    expect(
      savedCharacter?.resources.find((resource) => resource.id === "lightsaber-defence")
        ?.usedUses,
    ).toBe(0);
    expect(
      savedCharacter?.resources.find((resource) => resource.id === "bold-opportunist")
        ?.usedUses,
    ).toBe(1);
    expect(
      savedCharacter?.resources.find((resource) => resource.id === "manual-counter")
        ?.usedUses,
    ).toBe(2);
  });

  it("reset all resets all resources after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByRole("button", { name: "Reset All" }));

    const savedCharacter = getCharacter("test-character");

    expect(savedCharacter?.resources.every((resource) => resource.usedUses === 0)).toBe(
      true,
    );
  });

  it("adds a custom tracked resource", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.change(screen.getByLabelText("Resource label"), {
      target: { value: "Jetpack Burst" },
    });
    fireEvent.change(screen.getByLabelText("Max uses"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Reset type"), {
      target: { value: "rest" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Resource" }));

    expect(screen.getByText("Jetpack Burst")).toBeInTheDocument();
    expect(screen.getByText("Used 0/2")).toBeInTheDocument();
  });

  it("shows a friendly not-found state for a missing character ID", () => {
    renderSheet("missing-character");

    expect(
      screen.getByRole("heading", { name: /character not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No saved character exists/i)).toBeInTheDocument();
  });
});
