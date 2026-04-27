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

function saveTestCharacter(overrides = {}) {
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
        {
          id: "knight-robes-entry",
          gearItemId: "knight-robes",
          quantity: 1,
          slotsPerItem: 0,
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
    talentHistory: [
      {
        id: "level-1-talent",
        levelGained: 1,
        tableSource: "class",
        tableId: "knight-talents",
        selectionMode: "manual",
        talentId: "talent-knight-weapon-mastery-3-6",
        talent: {
          featureId: "talent-knight-weapon-mastery",
          name: "Weapon Mastery",
          description: "+1 to attack and damage with lightsabers.",
          effects: [
            { type: "attackBonus", value: 1, target: "lightsabers" },
            { type: "damageBonus", value: 1, target: "lightsabers" },
          ],
        },
      },
    ],
    hpGainHistory: [],
    backgroundId: "outer-rim-farmer",
    affinity: "light",
    viceId: "attachment",
    destinyId: "light-save-defined-threat",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  saveCharacter(character);
}

function addEquipmentFromList(
  gearItemId: string,
  searchText: string,
  quantity = "1",
): void {
  fireEvent.change(screen.getByLabelText("Equipment search"), {
    target: { value: searchText },
  });
  fireEvent.change(screen.getByLabelText("Equipment item"), {
    target: { value: gearItemId },
  });
  fireEvent.change(screen.getByLabelText("Equipment quantity"), {
    target: { value: quantity },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Equipment" }));
}

function testTalent(levelGained: number, id = `talent-${levelGained}`) {
  return {
    id,
    levelGained,
    tableSource: "class" as const,
    tableId: "trooper-talents",
    selectionMode: "manual" as const,
    talentId: "talent-trooper-marksman-training-4-6",
    talent: {
      featureId: "talent-trooper-marksman-training",
      name: "Marksman Training",
      description: "+1 to ranged attack and damage.",
    },
  };
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

  it("links to edit the current character", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByRole("link", { name: "Edit Character" })).toHaveAttribute(
      "href",
      "/characters/test-character/edit",
    );
  });

  it("displays ability modifiers clearly", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByText("STR +2")).toBeInTheDocument();
    expect(screen.getByText("DEX -1")).toBeInTheDocument();
    expect(screen.getByText("WIS +3")).toBeInTheDocument();
    expect(screen.getByText(/\(10 \+ DEX -1 \+ equipped armor\)/)).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "Force Powers" })).toBeInTheDocument();
    expect(screen.getByText("Force Check: WIS +3")).toBeInTheDocument();
    expect(screen.getByText("Tier 1, DC 11")).toBeInTheDocument();
    expect(screen.getAllByText("Shock Baton").length).toBeGreaterThanOrEqual(1);
  });

  it("displays talent history", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByRole("heading", { name: "Talent History" })).toBeInTheDocument();
    expect(screen.getByText("Level 1: Weapon Mastery")).toBeInTheDocument();
    expect(screen.getByText("Manual selection")).toBeInTheDocument();
    expect(screen.getByText(/Attack \+1 lightsabers/)).toBeInTheDocument();
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

  it("displays inventory and slot totals", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getByLabelText("Credits")).toHaveValue(25);
    expect(screen.getByLabelText(/inventory slots/i)).toHaveTextContent("Used 1");
    expect(screen.getByText("Equipped Weapons")).toBeInTheDocument();
    expect(screen.getByText("Equipped Armor")).toBeInTheDocument();
    expect(screen.getAllByText("Shock Baton").length).toBeGreaterThanOrEqual(1);
  });

  it("adds rules-defined gear as an inventory entry", () => {
    saveTestCharacter();
    renderSheet("test-character");

    addEquipmentFromList("blaster-rifle", "Blaster Rifle", "2");

    const savedCharacter = getCharacter("test-character");
    const addedEntry = savedCharacter?.inventory.entries.find(
      (entry) => entry.gearItemId === "blaster-rifle",
    );

    expect(addedEntry).toMatchObject({
      gearItemId: "blaster-rifle",
      quantity: 2,
      carried: true,
      equipped: false,
    });
    expect(addedEntry).not.toHaveProperty("customName");
  });

  it("persists rules-defined gear after refresh", () => {
    saveTestCharacter();
    const { unmount } = render(
      <MemoryRouter
        initialEntries={["/characters/test-character"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    addEquipmentFromList("blaster-rifle", "Blaster Rifle");
    unmount();
    renderSheet("test-character");

    expect(screen.getAllByText("Blaster Rifle").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Blaster Rifle equipped")).not.toBeChecked();
  });

  it("creates a weapon attack card when added rules gear is equipped", () => {
    saveTestCharacter();
    renderSheet("test-character");

    addEquipmentFromList("blaster-rifle", "Blaster Rifle");
    fireEvent.click(screen.getByLabelText("Blaster Rifle equipped"));

    expect(screen.getByText("Attack: DEX -1 (1d20-1)")).toBeInTheDocument();
    expect(screen.getByText("Damage: 1d10")).toBeInTheDocument();
  });

  it("updates AC when added rules armor is equipped", () => {
    saveTestCharacter();
    renderSheet("test-character");

    addEquipmentFromList("light-trooper-armor", "Light Trooper Armor");
    fireEvent.click(screen.getByLabelText("Light Trooper Armor equipped"));

    expect(screen.getByText("AC 12")).toBeInTheDocument();
    expect(screen.getByText(/Armor Class:/i).parentElement).toHaveTextContent("12");
  });

  it("filters equipment choices to valid matching gear", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.change(screen.getByLabelText("Equipment search"), {
      target: { value: "Blaster Rifle" },
    });

    const equipmentSelect = screen.getByLabelText(
      "Equipment item",
    ) as HTMLSelectElement;
    const optionValues = Array.from(equipmentSelect.options)
      .map((option) => option.value)
      .filter(Boolean);

    expect(optionValues).toEqual(["blaster-rifle"]);

    fireEvent.change(screen.getByLabelText("Equipment search"), {
      target: { value: "no-such-gear" },
    });

    expect(screen.getByText("No matching equipment.")).toBeInTheDocument();
  });

  it("displays equipped weapon attack cards", () => {
    saveTestCharacter();
    renderSheet("test-character");

    expect(screen.getByRole("heading", { name: "Weapon Attacks" })).toBeInTheDocument();
    expect(screen.getAllByText("Shock Baton").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Attack: STR +2 (1d20+2)")).toBeInTheDocument();
    expect(screen.getByText("Damage: 1d4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Attack +2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Damage 1d4" }),
    ).toBeInTheDocument();
  });

  it("rolls equipped weapon attack and damage expressions", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.click(screen.getByRole("button", { name: "Roll Attack +2" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll Damage 1d4" }));

    expect(screen.getByText("Shock Baton Attack: d20 +2 = 13")).toBeInTheDocument();
    expect(screen.getByText("Shock Baton Damage: d4 +0 = 3")).toBeInTheDocument();
  });

  it("levels up by one level, adds minimum HP, and appends one talent", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    saveTestCharacter({
      level: 2,
      classId: "trooper",
      subclassId: undefined,
      abilities: {
        str: 10,
        dex: 10,
        con: 1,
        int: 10,
        wis: 10,
        cha: 10,
      },
      hp: {
        max: 10,
        current: 4,
      },
      knownForcePowerIds: ["perimeter-sensor"],
      talentHistory: [testTalent(1), testTalent(2)],
      hpGainHistory: [
        {
          id: "hp-2",
          levelGained: 2,
          hitDie: "d10",
          constitutionModifier: 0,
          roll: {
            expression: "1d10+0",
            rolls: [5],
            total: 5,
          },
          gain: 5,
        },
      ],
    });
    renderSheet("test-character");

    fireEvent.click(screen.getByRole("button", { name: "Level Up" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll HP Gain" }));
    expect(screen.getByRole("status")).toHaveTextContent(/HP gain \+1/i);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll 2d6" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Level Up" }));

    const savedCharacter = getCharacter("test-character");

    expect(savedCharacter?.level).toBe(3);
    expect(savedCharacter?.hp.max).toBe(11);
    expect(savedCharacter?.hp.current).toBe(5);
    expect(savedCharacter?.hpGainHistory).toHaveLength(2);
    expect(savedCharacter?.talentHistory).toHaveLength(3);
  });

  it("prompts for new powers only when known power limit increases", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    saveTestCharacter({
      classId: "trooper",
      subclassId: undefined,
      knownForcePowerIds: [],
      talentHistory: [testTalent(1)],
    });
    renderSheet("test-character");

    fireEvent.click(screen.getByRole("button", { name: "Level Up" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll HP Gain" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Roll 2d6" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByLabelText("Level up power selection count")).toHaveTextContent(
      "Selected 0 / 1",
    );
  });

  it("persists adding, editing, and removing custom inventory after refresh", () => {
    saveTestCharacter();
    const { unmount } = render(
      <MemoryRouter
        initialEntries={["/characters/test-character"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Custom Item" }));
    fireEvent.change(screen.getByLabelText("Custom item name"), {
      target: { value: "Lucky Hydrospanner" },
    });
    fireEvent.change(screen.getByLabelText("Lucky Hydrospanner quantity"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Lucky Hydrospanner slots each"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Lucky Hydrospanner notes"), {
      target: { value: "Makes noise at bad times" },
    });
    fireEvent.click(screen.getByLabelText("Lucky Hydrospanner carried"));
    unmount();
    renderSheet("test-character");

    expect(screen.getByText("Lucky Hydrospanner")).toBeInTheDocument();
    expect(screen.getByLabelText("Lucky Hydrospanner quantity")).toHaveValue(2);
    expect(screen.getByLabelText("Lucky Hydrospanner slots each")).toHaveValue(3);
    expect(screen.getByLabelText("Lucky Hydrospanner notes")).toHaveValue(
      "Makes noise at bad times",
    );
    expect(screen.getByLabelText("Lucky Hydrospanner carried")).not.toBeChecked();

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[removeButtons.length - 1]);

    const savedCharacter = getCharacter("test-character");
    expect(
      savedCharacter?.inventory.entries.some(
        (entry) => entry.customName === "Lucky Hydrospanner",
      ),
    ).toBe(false);
  });

  it("warns when inventory exceeds gear slots", () => {
    saveTestCharacter();
    renderSheet("test-character");

    fireEvent.change(screen.getByLabelText("Shock Baton quantity"), {
      target: { value: "20" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/over gear slots/i);
  });

  it("updates displayed AC from equipped armor", () => {
    saveTestCharacter();
    const character = getCharacter("test-character");

    if (!character) {
      throw new Error("Expected test character to be saved.");
    }

    saveCharacter({
      ...character,
      inventory: {
        ...character.inventory,
        entries: [
          ...character.inventory.entries,
          {
            id: "light-armor-entry",
            gearItemId: "light-trooper-armor",
            quantity: 1,
            slotsPerItem: 1,
            carried: true,
            equipped: true,
          },
        ],
      },
    });
    renderSheet("test-character");

    expect(screen.getByText("AC 12")).toBeInTheDocument();
    expect(screen.getByText(/Armor Class:/i).parentElement).toHaveTextContent("12");
  });

  it("loads a legacy saved character without inventory", () => {
    const now = new Date().toISOString();

    localStorage.setItem(
      "shadowdark-tools.characters.v1",
      JSON.stringify([
        {
          id: "legacy-character",
          schemaVersion: 1,
          rulesetId: starWarsShadowdarkRuleset.id,
          rulesetVersion: starWarsShadowdarkRuleset.version,
          name: "Legacy Hero",
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
          startingGearIds: ["sporting-carbine"],
          resources: [],
          backgroundId: "war-refugee",
          affinity: "neutral",
          viceId: "duty",
          destinyId: "light-mentor-major-goal",
          createdAt: now,
          updatedAt: now,
        },
      ]),
    );

    renderSheet("legacy-character");

    expect(screen.getByRole("heading", { name: "Legacy Hero" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.getAllByText("Sporting Carbine").length).toBeGreaterThanOrEqual(1);
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
  });

  it("displays resolver power check bonuses on the character sheet", () => {
    saveTestCharacter({
      id: "force-bonus-character",
      talentHistory: [
        {
          id: "force-attunement",
          levelGained: 1,
          tableSource: "class",
          tableId: "consular-talents",
          selectionMode: "manual",
          talentId: "talent-consular-force-attunement-3-6",
          talent: {
            featureId: "talent-consular-force-attunement",
            name: "Force Attunement",
            description: "+1 to Force checks.",
            effects: [
              {
                type: "powerCheckBonus",
                value: 1,
                target: { domain: "power", powerKind: "force" },
              },
            ],
          },
        },
      ],
    });
    renderSheet("force-bonus-character");

    expect(screen.getByText("Force Check: WIS +4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Roll Force Check +4" }),
    ).toBeInTheDocument();
  });

  it("shows tech caster power rules for reduced casters", () => {
    const now = new Date().toISOString();
    const character = characterSchema.parse({
      id: "tech-caster",
      schemaVersion: 1,
      rulesetId: starWarsShadowdarkRuleset.id,
      rulesetVersion: starWarsShadowdarkRuleset.version,
      name: "Tech Caster",
      level: 1,
      abilities: {
        str: 10,
        dex: 10,
        con: 14,
        int: 10,
        wis: 10,
        cha: 10,
      },
      hp: {
        max: 8,
        current: 8,
      },
      speciesId: "duros",
      classId: "trooper",
      knownForcePowerIds: [],
      startingGearIds: [],
      inventory: {
        credits: 0,
        entries: [],
      },
      resources: [],
      backgroundId: "war-refugee",
      affinity: "neutral",
      viceId: "duty",
      destinyId: "light-mentor-major-goal",
      createdAt: now,
      updatedAt: now,
    });

    saveCharacter(character);
    renderSheet("tech-caster");

    expect(screen.getByRole("heading", { name: "Tech Powers" })).toBeInTheDocument();
    expect(screen.getByText("Tech Check: CON +2")).toBeInTheDocument();
    expect(screen.getByText("Requires Force Point to cast.")).toBeInTheDocument();
  });

  it("displays derived power source, original spell, range, duration, and DC", () => {
    saveTestCharacter();
    const character = getCharacter("test-character");

    if (!character) {
      throw new Error("Expected test character to be saved.");
    }

    saveCharacter({
      ...character,
      knownForcePowerIds: ["force-vigil"],
    });
    renderSheet("test-character");

    expect(screen.getByText("Force Vigil")).toBeInTheDocument();
    expect(screen.getByText("Shadowdark-derived")).toBeInTheDocument();
    expect(screen.getByText("Based on: Alarm")).toBeInTheDocument();
    expect(screen.getByText("Tier 1, DC 11")).toBeInTheDocument();
    expect(screen.getByText(/Range: Near/)).toBeInTheDocument();
    expect(screen.getByText(/Duration: 1 hour/)).toBeInTheDocument();
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
