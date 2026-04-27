import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";
import { characterSchema, type Character } from "../../characters/character.schema";
import {
  clearCharactersForTests,
  getCharacter,
  listCharacters,
  saveCharacter,
} from "../../characters/storage";
import { starWarsShadowdarkRuleset } from "../../rules/star-wars-shadowdark";

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

function renderEditBuilder(characterId: string) {
  render(
    <MemoryRouter
      initialEntries={[`/characters/${characterId}/edit`]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <App />
    </MemoryRouter>,
  );
}

function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
}

function choose(label: string, value: string, index = 0) {
  fireEvent.change(screen.getAllByLabelText(label)[index], {
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

function mockDieRolls(sides: number, rolls: number[]) {
  const randomValues = rolls.map((roll) => (roll - 1) / sides);

  vi.spyOn(Math, "random").mockImplementation(() => {
    const value = randomValues.shift();

    return value ?? 0;
  });
}

function choosePower(name: string) {
  fireEvent.click(screen.getByLabelText(new RegExp(name, "i")));
}

function chooseTalent(name: string, index = 0) {
  fireEvent.click(screen.getAllByLabelText(new RegExp(name, "i"))[index]);
}

function chooseChoice(label: string, value: string, index = 0) {
  fireEvent.change(screen.getAllByLabelText(label)[index], {
    target: { value },
  });
}

function saveExistingCharacter(overrides: Partial<Character> = {}): Character {
  const character = characterSchema.parse({
    id: "existing-character",
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
      current: 3,
    },
    notes: "Original backstory",
    speciesId: "human",
    speciesVariantId: "human-republican",
    classId: "knight",
    subclassId: "guardian",
    knownForcePowerIds: ["force-push"],
    startingGearIds: ["shock-baton", "knight-robes"],
    inventory: {
      credits: 25,
      entries: [
        {
          id: "shock-baton-entry",
          gearItemId: "shock-baton",
          quantity: 1,
          slotsPerItem: 1,
          carried: true,
          equipped: true,
        },
      ],
    },
    resources: [
      {
        id: "lightsaber-defence",
        label: "Lightsaber Defence",
        maxUses: 1,
        usedUses: 1,
        resetType: "combat",
        source: "class",
      },
    ],
    talentHistory: [
      {
        id: "existing-level-1-talent",
        levelGained: 1,
        tableSource: "class",
        tableId: "knight-talents",
        selectionMode: "manual",
        talentId: "talent-knight-weapon-mastery-3-6",
        talent: {
          featureId: "talent-knight-weapon-mastery",
          name: "Weapon Mastery",
          description: "+1 to attack and damage with lightsabers.",
          effects: [],
          choiceSelections: [],
        },
      },
      {
        id: "existing-level-1-talent-2",
        levelGained: 1,
        tableSource: "class",
        tableId: "knight-talents",
        selectionMode: "manual",
        talentId: "talent-knight-bulwark-stance-10-11",
        talent: {
          featureId: "talent-knight-bulwark-stance",
          name: "Bulwark Stance",
          description: "+1 AC.",
          effects: [],
          choiceSelections: [],
        },
      },
    ],
    hpGainHistory: [],
    backgroundId: "outer-rim-farmer",
    affinity: "light",
    viceId: "attachment",
    destinyId: "light-save-defined-threat",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  saveCharacter(character);

  return character;
}

function advanceToReview() {
  for (let index = 0; index < 12; index += 1) {
    clickNext();
  }
}

describe("CharacterBuilderPage", () => {
  beforeEach(() => {
    clearCharactersForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    expect(screen.getByRole("heading", { name: /talent/i })).toBeInTheDocument();
    expect(screen.getByText(/choose or roll 2 level 1 talents/i)).toBeInTheDocument();
    chooseTalent("3-6.*Weapon Mastery");
    chooseTalent("10-11.*Bulwark Stance", 1);
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
    expect(
      screen.getByText(/Raised on a remote world tending crops or livestock/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/advantage on checks to identify plants, animals, or terrain/i),
    ).toBeInTheDocument();
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
    expect(listCharacters()[0].hp.max).toBe(8);
    expect(listCharacters()[0].talentHistory[0]).toMatchObject({
      levelGained: 1,
      tableSource: "class",
      selectionMode: "manual",
      talent: {
        name: "Weapon Mastery",
      },
    });
    expect(listCharacters()[0].talentHistory).toHaveLength(2);
    expect(listCharacters()[0].id).toBeTruthy();
  });

  it("requires and saves one level 1 talent for non-human characters", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "One Talent Hero" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();

    expect(screen.getByText(/choose or roll 1 level 1 talent/i)).toBeInTheDocument();
    chooseTalent("Marksman Training");
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

    expect(listCharacters()[0].talentHistory).toHaveLength(1);
  });

  it("rolls ability scores as 3d6 in STR, DEX, CON, INT, WIS, CHA order", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Rolled Abilities" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    chooseTalent("Marksman Training");
    clickNext();
    mockDieRolls(6, [
      1, 2, 3,
      4, 5, 6,
      2, 2, 2,
      3, 3, 3,
      6, 6, 6,
      1, 1, 1,
    ]);

    fireEvent.click(screen.getByRole("button", { name: /roll 3d6 in order/i }));

    expect(screen.getByLabelText("Strength")).toHaveValue(6);
    expect(screen.getByLabelText("Dexterity")).toHaveValue(15);
    expect(screen.getByLabelText("Constitution")).toHaveValue(6);
    expect(screen.getByLabelText("Intelligence")).toHaveValue(9);
    expect(screen.getByLabelText("Wisdom")).toHaveValue(18);
    expect(screen.getByLabelText("Charisma")).toHaveValue(3);
    expect(screen.getByText(/STR 1 \+ 2 \+ 3 = 6/i)).toBeInTheDocument();
    expect(screen.getByText(/CHA 1 \+ 1 \+ 1 = 3/i)).toBeInTheDocument();
  });

  it("rolls starting HP from class hit die plus CON modifier with a minimum of 1", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Rolled HP" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    chooseTalent("Marksman Training");
    clickNext();
    fillAbilityScores();
    fireEvent.change(screen.getByLabelText("Constitution"), {
      target: { value: "3" },
    });
    clickNext();
    mockDieRolls(10, [1]);

    fireEvent.click(screen.getByRole("button", { name: /roll hp/i }));

    expect(screen.getByLabelText("HP")).toHaveValue(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      /rolled 1d10-4: \[1\], total -3, starting hp 1/i,
    );
  });

  it("requires a level 1 talent before continuing", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Talent Gate" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    clickNext();

    expect(screen.getByRole("alert")).toHaveTextContent(/level 1 talent/i);
    expect(screen.getByRole("heading", { name: /talent/i })).toBeInTheDocument();
  });

  it("blocks droid characters from Force-sensitive classes", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Unit HK" },
    });
    clickNext();
    choose("Species", "droid");
    choose("Variant / designation", "droid-hk-assassin");
    clickNext();
    choose("Class", "knight");
    choose("Subclass", "guardian");
    clickNext();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /droids cannot play knight or consular/i,
    );
  });

  it("blocks Mandalorian characters from beginning as Force-sensitive classes", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Varda Clan" },
    });
    clickNext();
    choose("Species", "human");
    choose("Variant / designation", "human-mandalorian");
    clickNext();
    choose("Class", "consular");
    choose("Subclass", "sage");
    clickNext();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /mandalorians cannot begin play force-sensitive/i,
    );
  });

  it("saves rolled level 1 talent details", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Rolled Talent" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /roll 2d6/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/rolled 4 \+ 4 = 8/i);
    chooseChoice("Choose weapon category", "rifles");
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

    expect(listCharacters()[0].talentHistory[0]).toMatchObject({
      selectionMode: "rolled",
      roll: {
        expression: "2d6",
        rolls: [4, 4],
        total: 8,
      },
    });
    expect(listCharacters()[0].talentHistory[0].talent.choiceSelections).toEqual([
      expect.objectContaining({ value: "rifles" }),
    ]);
    expect(listCharacters()[0].talentHistory[0].talent.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "attackBonus", target: "rifles" }),
        expect.objectContaining({ type: "damageBonus", target: "rifles" }),
      ]),
    );
  });

  it("applies ability choice talents to saved base ability scores", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Strong Form" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "knight");
    choose("Subclass", "guardian");
    clickNext();
    choose("Talent table", "guardian-talents");
    chooseTalent("Guardian Form");
    chooseChoice("Choose ability", "str");
    clickNext();
    fillAbilityScores();
    clickNext();
    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "8" },
    });
    clickNext();
    choosePower("Force Push");
    clickNext();
    choose("Background", "outer-rim-farmer");
    clickNext();
    choose("Affinity", "light");
    clickNext();
    choose("Vice", "attachment");
    clickNext();
    choose("Destiny", "light-save-defined-threat");
    clickNext();
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    const savedCharacter = listCharacters()[0];
    expect(savedCharacter.abilities.str).toBe(12);
    expect(savedCharacter.talentHistory[0].talent.choiceSelections).toEqual([
      expect.objectContaining({ value: "str", label: "Strength" }),
    ]);
  });

  it("applies both Human Adaptive level 1 choice talents and recalculates displayed modifiers", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Adaptive Choices" },
    });
    clickNext();
    choose("Species", "human");
    choose("Variant / designation", "human-republican");
    clickNext();
    choose("Class", "knight");
    choose("Subclass", "guardian");
    clickNext();
    chooseTalent("Knight Form");
    chooseChoice("Choose ability", "dex");
    chooseTalent("Shielded Mind", 1);
    chooseChoice("Choose weapon category", "lightsabers");
    clickNext();
    fillAbilityScores();
    clickNext();
    fireEvent.change(screen.getByLabelText("HP"), {
      target: { value: "8" },
    });
    clickNext();
    choosePower("Force Push");
    clickNext();
    choose("Background", "outer-rim-farmer");
    clickNext();
    choose("Affinity", "light");
    clickNext();
    choose("Vice", "attachment");
    clickNext();
    choose("Destiny", "light-save-defined-threat");
    clickNext();
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save character/i }));

    const savedCharacter = listCharacters()[0];
    expect(savedCharacter.abilities.dex).toBe(12);
    expect(savedCharacter.talentHistory).toHaveLength(2);
    expect(savedCharacter.talentHistory[1].talent.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "attackBonus", target: "lightsabers" }),
        expect.objectContaining({ type: "damageBonus", target: "lightsabers" }),
      ]),
    );

    fireEvent.click(screen.getByRole("link", { name: /Adaptive Choices/i }));

    expect(screen.getByText("DEX +1")).toBeInTheDocument();
    expect(screen.getByText("Dexterity: 12")).toBeInTheDocument();
  });

  it("turns an advancement talent's extra Talent option into another level 1 talent slot", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Extra Talent" },
    });
    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    chooseTalent("12.*Trooper Advancement");
    chooseChoice("Choose advancement benefit", "talent");

    expect(screen.getByText(/choose or roll 2 level 1 talents/i)).toBeInTheDocument();
    chooseTalent("Marksman Training", 1);
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

    const savedCharacter = listCharacters()[0];
    expect(savedCharacter.talentHistory).toHaveLength(2);
    expect(savedCharacter.talentHistory.map((talent) => talent.talent.name)).toEqual([
      "Trooper Advancement",
      "Marksman Training",
    ]);
    expect(savedCharacter.talentHistory[0].talent.choiceSelections).toEqual([
      expect.objectContaining({ value: "talent", label: "Gain 1 Talent" }),
    ]);
  });

  it("clears invalid talent selection when subclass changes", () => {
    renderBuilder();

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Changing Talent" },
    });
    clickNext();
    choose("Species", "human");
    choose("Variant / designation", "human-republican");
    clickNext();
    choose("Class", "knight");
    choose("Subclass", "guardian");
    clickNext();
    choose("Talent table", "guardian-talents");
    choose("Talent table", "guardian-talents", 1);
    chooseTalent("Force Shield");
    chooseTalent("Guardian Form", 1);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    choose("Subclass", "sentinel");
    clickNext();
    clickNext();

    expect(screen.getByRole("alert")).toHaveTextContent(/level 1 talent/i);
  });

  it("loads an existing character into edit mode", () => {
    saveExistingCharacter();
    renderEditBuilder("existing-character");

    expect(screen.getByRole("heading", { name: "Edit Character" })).toBeInTheDocument();
    expect(screen.getByLabelText(/character name/i)).toHaveValue("Vexa Sol");
    expect(screen.getByLabelText(/player name/i)).toHaveValue("Garrett");
    expect(screen.getByLabelText(/notes \/ backstory/i)).toHaveValue(
      "Original backstory",
    );
  });

  it("saves edits to the same character and preserves play-state", () => {
    const originalCharacter = saveExistingCharacter();
    renderEditBuilder("existing-character");

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Vexa Renamed" },
    });
    advanceToReview();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("heading", { name: "Vexa Renamed" })).toBeInTheDocument();

    const characters = listCharacters();
    const savedCharacter = getCharacter("existing-character");

    expect(characters).toHaveLength(1);
    expect(savedCharacter?.id).toBe(originalCharacter.id);
    expect(savedCharacter?.name).toBe("Vexa Renamed");
    expect(savedCharacter?.hp.current).toBe(3);
    expect(savedCharacter?.resources[0].usedUses).toBe(1);
    expect(savedCharacter?.inventory.entries[0]).toMatchObject({
      id: "shock-baton-entry",
      gearItemId: "shock-baton",
      equipped: true,
    });
    expect(savedCharacter?.notes).toBe("Original backstory");
    expect(savedCharacter?.createdAt).toBe(originalCharacter.createdAt);
    expect(savedCharacter?.updatedAt).not.toBe(originalCharacter.updatedAt);
  });

  it("saves edit-mode changes immediately with Save All Now", () => {
    saveExistingCharacter();
    renderEditBuilder("existing-character");

    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Vexa Quick Save" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save all now/i }));

    expect(screen.getByRole("heading", { name: "Vexa Quick Save" })).toBeInTheDocument();
    expect(getCharacter("existing-character")?.name).toBe("Vexa Quick Save");
  });

  it("jumps directly to selected builder steps in edit mode", () => {
    saveExistingCharacter();
    renderEditBuilder("existing-character");

    fireEvent.click(screen.getByRole("button", { name: /6\. hp/i }));

    expect(screen.getByRole("heading", { name: "HP" })).toBeInTheDocument();
    expect(screen.getByLabelText("HP")).toHaveValue(8);

    fireEvent.click(screen.getByRole("button", { name: /5\. abilities/i }));

    expect(screen.getByRole("heading", { name: "Abilities" })).toBeInTheDocument();
    expect(screen.getByLabelText("Strength")).toHaveValue(14);
  });

  it("applies newly selected edit-mode ability choices exactly once", () => {
    saveExistingCharacter({
      speciesId: "duros",
      speciesVariantId: undefined,
      abilities: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      talentHistory: [
        {
          id: "existing-level-1-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-weapon-mastery-3-6",
          talent: {
            featureId: "talent-knight-weapon-mastery",
            name: "Weapon Mastery",
            description: "+1 to attack and damage with lightsabers.",
            effects: [],
            choiceSelections: [],
          },
        },
      ],
    });
    renderEditBuilder("existing-character");

    clickNext();
    clickNext();
    clickNext();
    chooseTalent("Knight Form");
    chooseChoice("Choose ability", "dex");
    for (let index = 0; index < 9; index += 1) {
      clickNext();
    }
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    const savedCharacter = getCharacter("existing-character");

    expect(savedCharacter?.abilities.dex).toBe(12);
    expect(screen.getByText("DEX +1")).toBeInTheDocument();
    expect(screen.getByText("Dexterity: 12")).toBeInTheDocument();
  });

  it("does not double-apply already saved edit-mode ability choices", () => {
    saveExistingCharacter({
      abilities: {
        str: 10,
        dex: 12,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      talentHistory: [
        {
          id: "existing-level-1-talent",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-form-7-9",
          talent: {
            featureId: "talent-knight-form",
            name: "Knight Form",
            description: "+2 to Strength, Dexterity, or Constitution.",
            effects: [],
            choiceSelections: [
              {
                choiceId: "ability",
                type: "ability",
                value: "dex",
                label: "Dexterity",
              },
            ],
          },
        },
        {
          id: "existing-level-1-talent-2",
          levelGained: 1,
          tableSource: "class",
          tableId: "knight-talents",
          selectionMode: "manual",
          talentId: "talent-knight-bulwark-stance-10-11",
          talent: {
            featureId: "talent-knight-bulwark-stance",
            name: "Bulwark Stance",
            description: "+1 AC.",
            effects: [],
            choiceSelections: [],
          },
        },
      ],
    });
    renderEditBuilder("existing-character");

    advanceToReview();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    const savedCharacter = getCharacter("existing-character");

    expect(savedCharacter?.abilities.dex).toBe(12);
    expect(screen.getByText("DEX +1")).toBeInTheDocument();
    expect(screen.getByText("Dexterity: 12")).toBeInTheDocument();
  });

  it("edits species and class, clears invalid variant/subclass, and keeps inventory", () => {
    saveExistingCharacter();
    renderEditBuilder("existing-character");

    clickNext();
    choose("Species", "duros");
    clickNext();
    choose("Class", "trooper");
    clickNext();
    chooseTalent("Marksman Training");
    clickNext();
    clickNext();
    clickNext();
    expect(screen.getByText(/no starting powers at level 1/i)).toBeInTheDocument();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    expect(screen.getByText("Shock Baton")).toBeInTheDocument();
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByText("Duros")).toBeInTheDocument();
    expect(screen.getByText("Trooper")).toBeInTheDocument();

    const savedCharacter = getCharacter("existing-character");

    expect(savedCharacter?.speciesId).toBe("duros");
    expect(savedCharacter?.speciesVariantId).toBeUndefined();
    expect(savedCharacter?.classId).toBe("trooper");
    expect(savedCharacter?.subclassId).toBeUndefined();
    expect(savedCharacter?.knownForcePowerIds).toEqual([]);
    expect(savedCharacter?.inventory.entries[0].id).toBe("shock-baton-entry");
  });

  it("recalculates known power requirements when class and subclass change", () => {
    saveExistingCharacter();
    renderEditBuilder("existing-character");

    clickNext();
    clickNext();
    choose("Class", "consular");
    choose("Subclass", "sage");
    clickNext();
    chooseTalent("Force Attunement");
    chooseTalent("Consular Advancement", 1);
    chooseChoice("Choose advancement benefit", "ability:int");
    clickNext();
    clickNext();
    clickNext();

    expect(screen.getByLabelText(/power selection count/i)).toHaveTextContent(
      "Selected 0 / 3",
    );
    clickNext();
    expect(screen.getByRole("alert")).toHaveTextContent(/choose exactly 3 powers/i);
  });

  it("does not count hidden invalid saved powers toward edit-mode power selection", () => {
    saveExistingCharacter({
      knownForcePowerIds: ["force-push", "force-jump", "force-lightning"],
    });
    renderEditBuilder("existing-character");

    clickNext();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    clickNext();

    expect(screen.getByLabelText(/power selection count/i)).toHaveTextContent(
      "Selected 1 / 1",
    );
    expect(screen.getByLabelText(/unavailable saved powers/i)).toHaveTextContent(
      "Force Jump",
    );
    clickNext();

    expect(screen.getByRole("heading", { name: /background/i })).toBeInTheDocument();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    clickNext();
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(getCharacter("existing-character")?.knownForcePowerIds).toEqual([
      "force-push",
    ]);
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
    chooseTalent("Marksman Training");
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
    chooseTalent("Marksman Training");
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
    chooseTalent("Force Attunement");
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
