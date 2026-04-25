import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { characterSchema } from "../../characters/character.schema";
import { serializeCharacterForExport } from "../../characters/importExport";
import { clearCharactersForTests } from "../../characters/storage";
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
  const now = new Date().toISOString();
  const character = characterSchema.parse({
    id: "imported-character",
    schemaVersion: 1,
    rulesetId: starWarsShadowdarkRuleset.id,
    rulesetVersion: starWarsShadowdarkRuleset.version,
    name: "Imported Hero",
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
  });

  return new File([serializeCharacterForExport(character)], "imported-hero.json", {
    type: "application/json",
  });
}

describe("CharacterLibraryPage imports", () => {
  beforeEach(() => {
    clearCharactersForTests();
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
});
