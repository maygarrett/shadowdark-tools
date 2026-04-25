import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { clearCharactersForTests } from "../../characters/storage";

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

    choose("Background", "outer-rim-farmer");
    clickNext();

    choose("Affinity", "light");
    clickNext();

    choose("Vice", "attachment");
    clickNext();

    choose("Destiny", "light-save-defined-threat");
    clickNext();

    expect(screen.getByText(/Vexa Sol/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    expect(
      screen.getByRole("heading", { name: /character library/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Vexa Sol/i })).toBeInTheDocument();
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
    choose("Background", "war-refugee");
    clickNext();
    choose("Affinity", "neutral");
    clickNext();
    choose("Vice", "duty");
    clickNext();
    choose("Destiny", "light-mentor-major-goal");
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    const characterLink = screen.getByRole("link", { name: /Taro Venn/i });

    expect(characterLink).toBeInTheDocument();

    fireEvent.click(characterLink);

    expect(
      screen.getByRole("heading", { name: /Taro Venn/i }),
    ).toBeInTheDocument();
  });
});
