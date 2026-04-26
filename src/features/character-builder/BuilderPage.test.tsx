import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { clearCharactersForTests, listCharacters } from "../../characters/storage";

function renderBuilder() {
  render(
    <MemoryRouter
      initialEntries={["/characters/new"]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App />
    </MemoryRouter>,
  );
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
}

function choose(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
}

function fillAbilityScores() {
  for (const label of [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma",
  ]) {
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: "10" },
    });
  }
}

function choosePower(name: string) {
  fireEvent.click(screen.getByLabelText(new RegExp(name, "i")));
}

describe("CharacterBuilderPage", () => {
  beforeEach(() => {
    clearCharactersForTests();
  });

  it("blocks the next step when required fields are missing", () => {
    renderBuilder();

    clickNext();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /character name is required/i,
    );
    expect(
      screen.getByRole("heading", { name: /name/i }),
    ).toBeInTheDocument();
  });

  it("creates a valid character through the builder", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Vexa Sol" },
    });
    fireEvent.change(screen.getByLabelText(/player name/i), {
      target: { value: "Garrett" },
    });
    clickNext();

    choose("Species", "human");
    choose("Variant / designation", "human-republican");
    clickNext();

    choose("Class", "knight");
    choose("Subclass", "guardian");
    clickNext();

    fillAbilityScores();
    clickNext();

    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "8" },
    });
    clickNext();

    expect(screen.getByRole("heading", { name: /powers/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/power selection count/i)).toHaveTextContent(
      "Selected 0 / 1",
    );
    clickNext();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose exactly 1 power/i);
    expect(screen.getAllByText("Shadowdark-derived").length).toBeGreaterThan(0);
    choosePower("Force Vigil");
    clickNext();

    choose("Background", "outer-rim-farmer");
    clickNext();

    choose("Affinity", "light");
    clickNext();

    choose("Vice", "attachment");
    clickNext();

    choose("Destiny", "light-save-defined-threat");
    clickNext();

    expect(screen.getByRole("heading", { name: /gear/i })).toBeInTheDocument();
    expect(screen.getByText("Shock Baton")).toBeInTheDocument();
    expect(screen.getByLabelText(/inventory slots/i)).toHaveTextContent("Max 10");
    clickNext();

    expect(screen.getByText(/Vexa Sol/)).toBeInTheDocument();
    expect(screen.getByText(/Force Vigil/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    expect(
      screen.getByRole("heading", { name: /character library/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vexa Sol/i })).toBeInTheDocument();
    expect(listCharacters()[0].inventory.entries.length).toBeGreaterThan(0);
    expect(listCharacters()[0].knownForcePowerIds).toEqual(["force-vigil"]);
  });

  it("shows saved characters in the library", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Taro Venn" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    fillAbilityScores();
    clickNext();
    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "6" },
    });
    clickNext();
    clickNext();
    choose("Background", "war-refugee");
    clickNext();
    choose("Affinity", "neutral");
    clickNext();
    choose("Vice", "duty");
    clickNext();
    choose("Destiny", "light-mentor-major-goal");
    clickNext();
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    const characterLink = screen.getByRole("link", { name: /Taro Venn/i });

    expect(characterLink).toBeInTheDocument();

    fireEvent.click(characterLink);

    expect(
      screen.getByRole("heading", { name: /Taro Venn/i }),
    ).toBeInTheDocument();
  });

  it("warns when starting inventory exceeds gear slots", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Packed Hero" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    fillAbilityScores();
    clickNext();
    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "6" },
    });
    clickNext();
    expect(screen.getByText(/no starting powers at level 1/i)).toBeInTheDocument();
    clickNext();
    choose("Background", "war-refugee");
    clickNext();
    choose("Affinity", "neutral");
    clickNext();
    choose("Vice", "duty");
    clickNext();
    choose("Destiny", "light-mentor-major-goal");
    clickNext();

    fireEvent.change(screen.getAllByLabelText("Slots each")[0], {
      target: { value: "20" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/over gear slots/i);
  });

  it("blocks Consular and Sage until the correct number of powers are selected", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Vora Tal" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "consular");
    choose("Subclass", "sage");
    clickNext();
    fillAbilityScores();
    clickNext();
    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "5" },
    });
    clickNext();

    expect(screen.getByLabelText(/power selection count/i)).toHaveTextContent(
      "Selected 0 / 3",
    );
    choosePower("Force Push");
    choosePower("Force Pull");
    clickNext();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose exactly 3 powers/i);
    choosePower("Force Speed");
    clickNext();

    expect(screen.getByRole("heading", { name: /background/i })).toBeInTheDocument();
  });
});
