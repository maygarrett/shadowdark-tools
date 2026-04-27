import type { Effect, Feature, TalentTable } from "../rules.schema";

function talent(
  id: string,
  name: string,
  description: string,
  effects: Effect[] = [{ type: "customText", text: description }],
): Feature {
  return {
    id,
    name,
    kind: "talent",
    description,
    effects,
  };
}

function customText(text: string): Effect {
  return { type: "customText", text };
}

function attackAndDamage(value: number, targets: string[]): Effect[] {
  return targets.flatMap((target) => [
    { type: "attackBonus", value, target },
    { type: "damageBonus", value, target },
  ]);
}

export const talentFeatures = [
  talent("talent-knight-shielded-mind", "Shielded Mind", "Gain Weapon Mastery with one additional weapon type."),
  talent("talent-knight-weapon-mastery", "Weapon Mastery", "+1 to attack and damage with lightsabers.", attackAndDamage(1, ["lightsabers"])),
  talent("talent-knight-form", "Knight Form", "+2 to Strength, Dexterity, or Constitution.", [
    { type: "abilityBonus", ability: "str", value: 2, condition: "Choose Strength, Dexterity, or Constitution." },
    customText("+2 to Strength, Dexterity, or Constitution."),
  ]),
  talent("talent-knight-bulwark-stance", "Bulwark Stance", "+1 AC while wielding a lightsaber.", [
    { type: "acBonus", value: 1, condition: "While wielding a lightsaber." },
    customText("+1 AC while wielding a lightsaber."),
  ]),
  talent("talent-knight-advancement", "Knight Advancement", "Choose 1 Talent OR +2 ability points."),

  talent("talent-guardian-shielded-mind", "Shielded Mind", "Gain one more use per round of your Defensive Mastery talent."),
  talent("talent-guardian-form", "Guardian Form", "+2 to Strength, Constitution, or Wisdom.", [
    { type: "abilityBonus", ability: "str", value: 2, condition: "Choose Strength, Constitution, or Wisdom." },
    customText("+2 to Strength, Constitution, or Wisdom."),
  ]),
  talent("talent-guardian-force-shield", "Force Shield", "+1 to Force checks on defensive or supportive powers and Force spells.", [
    { type: "powerCheckBonus", value: 1, target: { domain: "power", powerKind: "force", tags: ["defense", "supportive"] } },
    customText("+1 to Force checks on defensive or supportive powers and Force spells."),
  ]),
  talent("talent-guardian-soresu-expert", "Soresu Expert", "+1 AC with single-saber.", [
    { type: "acBonus", value: 1, condition: "With a single lightsaber." },
    customText("+1 AC with single-saber."),
  ]),
  talent("talent-guardian-advancement", "Guardian Advancement", "Choose 1 Talent OR +2 ability points."),

  talent("talent-sentinel-agile-form", "Agile Form", "+2 Dexterity.", [
    { type: "abilityBonus", ability: "dex", value: 2 },
    customText("+2 Dexterity."),
  ]),
  talent("talent-sentinel-niman-expert", "Niman Expert", "+1 to attack and damage with offhand lightsaber."),
  talent("talent-sentinel-technique", "Sentinel Technique", "+2 to Wisdom or Dexterity.", [
    { type: "abilityBonus", ability: "wis", value: 2, condition: "Choose Wisdom or Dexterity." },
    customText("+2 to Wisdom or Dexterity."),
  ]),
  talent("talent-sentinel-ally-of-the-force", "Ally of the Force", "Allies gain +2 to attack against creatures engaged by you. Stacks."),
  talent("talent-sentinel-advancement", "Sentinel Advancement", "Choose 1 Talent OR +2 ability points."),

  talent("talent-vanguard-brutal-conditioning", "Brutal Conditioning", "1/day, ignore all damage and effects from one attack."),
  talent("talent-vanguard-heavy-saber-technique", "Heavy Saber Technique", "+1 to attack and damage with heavy/two-handed sabers.", attackAndDamage(1, ["heavy", "two-handed"])),
  talent("talent-vanguard-form", "Vanguard Form", "+2 to Strength or Constitution.", [
    { type: "abilityBonus", ability: "str", value: 2, condition: "Choose Strength or Constitution." },
    customText("+2 to Strength or Constitution."),
  ]),
  talent("talent-vanguard-ataru-expert", "Ataru Expert", "Gain one additional use of Ataru talent."),
  talent("talent-vanguard-advancement", "Juggernaut Advancement", "Choose 1 Talent OR +2 ability points."),

  talent("talent-consular-expanded-insight", "Expanded Insight", "Gain advantage on casting one spell you know.", [
    { type: "advantage", target: "casting one chosen spell" },
    customText("Gain advantage on casting one spell you know."),
  ]),
  talent("talent-consular-force-attunement", "Force Attunement", "+1 to Force checks.", [
    { type: "powerCheckBonus", value: 1, target: { domain: "power", powerKind: "force" } },
    customText("+1 to Force checks."),
  ]),
  talent("talent-consular-weapon-mastery", "Weapon Mastery", "+1 to attack and damage with a weapon of choice."),
  talent("talent-consular-focused-awareness", "Focused Awareness", "+2 to Dexterity or Intelligence.", [
    { type: "abilityBonus", ability: "dex", value: 2, condition: "Choose Dexterity or Intelligence." },
    customText("+2 to Dexterity or Intelligence."),
  ]),
  talent("talent-consular-advancement", "Consular Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-sage-shii-cho-expert", "Shii-Cho Expert", "+1 to melee attacks or +1 AC."),
  talent("talent-sage-force-precision", "Force Precision", "Gain advantage on casting one spell you know.", [
    { type: "advantage", target: "casting one chosen spell" },
    customText("Gain advantage on casting one spell you know."),
  ]),
  talent("talent-sage-enlightenment", "Enlightenment", "+2 Intelligence, Dexterity, or Charisma.", [
    { type: "abilityBonus", ability: "int", value: 2, condition: "Choose Intelligence, Dexterity, or Charisma." },
    customText("+2 Intelligence, Dexterity, or Charisma."),
  ]),
  talent("talent-sage-force-prodigy", "Force Prodigy", "Learn one additional Force spell of any tier you know."),
  talent("talent-sage-advancement", "Sage Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-deacon-shien-expert", "Shien Expert", "Gain one additional use of Shien form ability per combat."),
  talent("talent-deacon-force-fueled-motion", "Force-Fueled Motion", "+2 Dexterity.", [
    { type: "abilityBonus", ability: "dex", value: 2 },
    customText("+2 Dexterity."),
  ]),
  talent("talent-deacon-acrobats-strike", "Acrobat's Strike", "+1 to attack and damage with a weapon of choice."),
  talent("talent-deacon-agile-body", "Agile Body", "+1 AC while unarmored.", [
    { type: "acBonus", value: 1, condition: "While unarmored." },
    customText("+1 AC while unarmored."),
  ]),
  talent("talent-deacon-advancement", "Deacon Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-shadow-dark-instincts", "Dark Instincts", "+2 Dexterity or +2 Charisma.", [
    { type: "abilityBonus", ability: "dex", value: 2, condition: "Choose Dexterity or Charisma." },
    customText("+2 Dexterity or +2 Charisma."),
  ]),
  talent("talent-shadow-juyo-expert", "Juyo Expert", "Deal an additional 1d4 extra damage when attacking from stealth or targeting surprised creature."),
  talent("talent-shadow-wall-walk", "Dark Instincts", "1/day, you can walk on sheer surfaces such as walls for 1d4 rounds. Reroll duplicates."),
  talent("talent-shadow-flow", "Shadow Flow", "Double distance values for Force spells. Reroll duplicates."),
  talent("talent-shadow-whirling-blades", "Whirling Blades", "+1 to attack and damage with double-bladed sabers.", attackAndDamage(1, ["lightsaber-double-blade"])),
  talent("talent-shadow-force-conceal", "Force Conceal", "Advantage on stealth checks in shadows or darkness. Reroll duplicates.", [
    { type: "advantage", target: "stealth checks in shadows or darkness" },
    customText("Advantage on stealth checks in shadows or darkness. Reroll duplicates."),
  ]),
  talent("talent-shadow-danger-sense", "Danger Sense", "You have advantage on Dexterity checks to avoid entrapment or injury. Reroll duplicates.", [
    { type: "advantage", target: "Dexterity checks to avoid entrapment or injury" },
    customText("You have advantage on Dexterity checks to avoid entrapment or injury. Reroll duplicates."),
  ]),
  talent("talent-shadow-weapon-mastery", "Weapon Mastery", "+1 to attack and damage with a weapon of choice."),
  talent("talent-shadow-withering-strike", "Withering Strike", "1/day, paralyze a target of LV 9 or less for 1d4 rounds when you damage it with a weapon."),
  talent("talent-shadow-shadow-guard", "Shadow Guard", "+1 AC with double-bladed weapons.", [
    { type: "acBonus", value: 1, condition: "With double-bladed weapons." },
    customText("+1 AC with double-bladed weapons."),
  ]),
  talent("talent-shadow-advancement", "Shadow Advancement", "Choose 1 Talent OR +2 ability points."),

  talent("talent-trooper-battlefield-conditioning", "Battlefield Conditioning", "+2 Constitution.", [
    { type: "abilityBonus", ability: "con", value: 2 },
    customText("+2 Constitution."),
  ]),
  talent("talent-trooper-boot-camp", "Boot Camp", "Learn to wield 1 melee or ranged weapon."),
  talent("talent-trooper-marksman-training", "Marksman Training", "+1 to ranged attack and damage.", attackAndDamage(1, ["pistols", "carbines", "rifles", "heavy-weapons", "explosives"])),
  talent("talent-trooper-combat-readiness", "Combat Readiness", "Gain advantage on initiative rolls. Reroll duplicates.", [
    { type: "advantage", target: "initiative rolls" },
    customText("Gain advantage on initiative rolls. Reroll duplicates."),
  ]),
  talent("talent-trooper-weapon-mastery", "Weapon Mastery", "+1 to attack and damage with a weapon of choice."),
  talent("talent-trooper-close-quarters-combat", "Close Quarters Combat", "+1 to melee attack and damage.", attackAndDamage(1, ["knives", "vibroswords", "staves", "lightsabers"])),
  talent("talent-trooper-armor-specialist", "Armor Specialist", "+1 AC in medium or heavy armor.", [
    { type: "acBonus", value: 1, condition: "In medium or heavy armor." },
    customText("+1 AC in medium or heavy armor."),
  ]),
  talent("talent-trooper-strategic-charge", "Strategic Charge", "1/day, gain advantage on melee attacks for 3 rounds."),
  talent("talent-trooper-advancement", "Trooper Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-scoundrel-street-reflexes", "Street Reflexes", "+2 Dexterity or +2 Constitution.", [
    { type: "abilityBonus", ability: "dex", value: 2, condition: "Choose Dexterity or Constitution." },
    customText("+2 Dexterity or +2 Constitution."),
  ]),
  talent("talent-scoundrel-lefty", "Lefty", "Gain an additional use of your Gunslinger ability."),
  talent("talent-scoundrel-sharpshot", "Sharpshot", "+1 to pistol/carbine attack and damage.", attackAndDamage(1, ["pistols", "carbines"])),
  talent("talent-scoundrel-favoured-weapon", "Favoured Weapon", "+1 to attack and damage with a weapon of choice."),
  talent("talent-scoundrel-puckish-rogue", "Puckish Rogue", "3/day, add your CHA bonus to any ability check. Reroll duplicates."),
  talent("talent-scoundrel-advancement", "Scoundrel Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-bounty-hunter-predator-conditioning", "Predator Conditioning", "+2 Dexterity or +2 Constitution.", [
    { type: "abilityBonus", ability: "dex", value: 2, condition: "Choose Dexterity or Constitution." },
    customText("+2 Dexterity or +2 Constitution."),
  ]),
  talent("talent-bounty-hunter-dampening-tech", "Dampening Tech", "You may use tech weapons and explosives without penalty."),
  talent("talent-bounty-hunter-force-resistance", "Force Resistance", "Hostile spells that target you have +2 DC."),
  talent("talent-bounty-hunter-weapons-expert", "Weapons Expert", "+1 to attack and damage with a weapon of choice."),
  talent("talent-bounty-hunter-reinforced-armor", "Reinforced Armor", "+1 AC in medium or heavy armor.", [
    { type: "acBonus", value: 1, condition: "In medium or heavy armor." },
    customText("+1 AC in medium or heavy armor."),
  ]),
  talent("talent-bounty-hunter-intimidating-presence", "Intimidating Presence", "1/day, force a close being to check morale, even if immune."),
  talent("talent-bounty-hunter-advancement", "Hunter Advancement", "Gain 1 Talent OR +2 ability points."),

  talent("talent-agent-operative-conditioning", "Operative Conditioning", "+2 Dexterity or +2 Intelligence.", [
    { type: "abilityBonus", ability: "dex", value: 2, condition: "Choose Dexterity or Intelligence." },
    customText("+2 Dexterity or +2 Intelligence."),
  ]),
  talent("talent-agent-snipers-patience", "Sniper's Patience", "+2 to hit on attacks from stealth.", [
    { type: "attackBonus", value: 2, condition: "From stealth." },
    customText("+2 to hit on attacks from stealth."),
  ]),
  talent("talent-agent-precision-shot", "Precision Shot", "+1 to pistol/carbine attacks and damage.", attackAndDamage(1, ["pistols", "carbines"])),
  talent("talent-agent-weapon-mastery", "Weapon Mastery", "+1 to attack and damage with a weapon of choice."),
  talent("talent-agent-shadow-defense", "Shadow Defense", "+1 AC while using tech armor.", [
    { type: "acBonus", value: 1, condition: "While using tech armor." },
    customText("+1 AC while using tech armor."),
  ]),
  talent("talent-agent-stolen-tech", "Stolen Tech", "Learn two additional tech spells of your choice from any list."),
  talent("talent-agent-advancement", "Agent Advancement", "Gain 1 Talent OR +2 ability points."),
] satisfies Feature[];

export const talentTables = [
  table("knight-talents", "Knight Talent Table", { type: "class", classId: "knight" }, [
    entry(2, 2, "talent-knight-shielded-mind"),
    entry(3, 6, "talent-knight-weapon-mastery"),
    entry(7, 9, "talent-knight-form"),
    entry(10, 11, "talent-knight-bulwark-stance"),
    entry(12, 12, "talent-knight-advancement"),
  ]),
  table("guardian-talents", "Guardian Talent Table", { type: "subclass", classId: "knight", subclassId: "guardian" }, [
    entry(2, 2, "talent-guardian-shielded-mind"),
    entry(3, 6, "talent-guardian-form"),
    entry(7, 9, "talent-guardian-force-shield"),
    entry(10, 11, "talent-guardian-soresu-expert"),
    entry(12, 12, "talent-guardian-advancement"),
  ]),
  table("sentinel-talents", "Sentinel Talent Table", { type: "subclass", classId: "knight", subclassId: "sentinel" }, [
    entry(2, 2, "talent-sentinel-agile-form"),
    entry(3, 6, "talent-sentinel-niman-expert"),
    entry(7, 9, "talent-sentinel-technique"),
    entry(10, 11, "talent-sentinel-ally-of-the-force"),
    entry(12, 12, "talent-sentinel-advancement"),
  ]),
  table("vanguard-talents", "Vanguard Talent Table", { type: "subclass", classId: "knight", subclassId: "vanguard" }, [
    entry(2, 2, "talent-vanguard-brutal-conditioning"),
    entry(3, 6, "talent-vanguard-heavy-saber-technique"),
    entry(7, 9, "talent-vanguard-form"),
    entry(10, 11, "talent-vanguard-ataru-expert"),
    entry(12, 12, "talent-vanguard-advancement"),
  ]),
  table("consular-talents", "Consular Talent Table", { type: "class", classId: "consular" }, [
    entry(2, 2, "talent-consular-expanded-insight"),
    entry(3, 6, "talent-consular-force-attunement"),
    entry(7, 9, "talent-consular-weapon-mastery"),
    entry(10, 11, "talent-consular-focused-awareness"),
    entry(12, 12, "talent-consular-advancement"),
  ]),
  table("sage-talents", "Sage Talent Table", { type: "subclass", classId: "consular", subclassId: "sage" }, [
    entry(2, 2, "talent-sage-shii-cho-expert"),
    entry(3, 6, "talent-sage-force-precision"),
    entry(7, 9, "talent-sage-enlightenment"),
    entry(10, 11, "talent-sage-force-prodigy"),
    entry(12, 12, "talent-sage-advancement"),
  ]),
  table("deacon-talents", "Deacon Talent Table", { type: "subclass", classId: "consular", subclassId: "deacon" }, [
    entry(2, 2, "talent-deacon-shien-expert"),
    entry(3, 6, "talent-deacon-force-fueled-motion"),
    entry(7, 9, "talent-deacon-acrobats-strike"),
    entry(10, 11, "talent-deacon-agile-body"),
    entry(12, 12, "talent-deacon-advancement"),
  ]),
  table("shadow-talents", "Shadow Talent Table", { type: "subclass", classId: "consular", subclassId: "shadow" }, [
    entry(2, 2, "talent-shadow-dark-instincts"),
    entry(3, 3, "talent-shadow-juyo-expert"),
    entry(4, 4, "talent-shadow-wall-walk"),
    entry(5, 5, "talent-shadow-flow"),
    entry(6, 6, "talent-shadow-whirling-blades"),
    entry(7, 7, "talent-shadow-force-conceal"),
    entry(8, 8, "talent-shadow-danger-sense"),
    entry(9, 9, "talent-shadow-weapon-mastery"),
    entry(10, 10, "talent-shadow-withering-strike"),
    entry(11, 11, "talent-shadow-shadow-guard"),
    entry(12, 12, "talent-shadow-advancement"),
  ]),
  table("trooper-talents", "Trooper Talent Table", { type: "class", classId: "trooper" }, [
    entry(2, 2, "talent-trooper-battlefield-conditioning"),
    entry(3, 3, "talent-trooper-boot-camp"),
    entry(4, 6, "talent-trooper-marksman-training"),
    entry(7, 7, "talent-trooper-combat-readiness"),
    entry(8, 8, "talent-trooper-weapon-mastery"),
    entry(9, 9, "talent-trooper-close-quarters-combat"),
    entry(10, 10, "talent-trooper-armor-specialist"),
    entry(11, 11, "talent-trooper-strategic-charge"),
    entry(12, 12, "talent-trooper-advancement"),
  ]),
  table("scoundrel-talents", "Scoundrel Talent Table", { type: "class", classId: "scoundrel" }, [
    entry(2, 2, "talent-scoundrel-street-reflexes"),
    entry(3, 3, "talent-scoundrel-lefty"),
    entry(4, 6, "talent-scoundrel-sharpshot"),
    entry(7, 9, "talent-scoundrel-favoured-weapon"),
    entry(10, 11, "talent-scoundrel-puckish-rogue"),
    entry(12, 12, "talent-scoundrel-advancement"),
  ]),
  table("bounty-hunter-talents", "Bounty Hunter Talent Table", { type: "class", classId: "bounty-hunter" }, [
    entry(2, 2, "talent-bounty-hunter-predator-conditioning"),
    entry(3, 3, "talent-bounty-hunter-dampening-tech"),
    entry(4, 6, "talent-bounty-hunter-force-resistance"),
    entry(7, 9, "talent-bounty-hunter-weapons-expert"),
    entry(10, 10, "talent-bounty-hunter-reinforced-armor"),
    entry(11, 11, "talent-bounty-hunter-intimidating-presence"),
    entry(12, 12, "talent-bounty-hunter-advancement"),
  ]),
  table("agent-talents", "Agent Talent Table", { type: "class", classId: "agent" }, [
    entry(2, 2, "talent-agent-operative-conditioning"),
    entry(3, 3, "talent-agent-snipers-patience"),
    // Source ambiguity: the homebrew doc lists Sniper's Patience at 3 and Precision Shot at 3-6.
    // To preserve a complete, non-overlapping 2d6 table, Precision Shot is treated as 4-6.
    entry(4, 6, "talent-agent-precision-shot"),
    entry(7, 9, "talent-agent-weapon-mastery"),
    entry(10, 10, "talent-agent-shadow-defense"),
    entry(11, 11, "talent-agent-stolen-tech"),
    entry(12, 12, "talent-agent-advancement"),
  ]),
] satisfies TalentTable[];

function table(
  id: string,
  name: string,
  source: TalentTable["source"],
  entries: TalentTable["entries"],
): TalentTable {
  return {
    id,
    name,
    source,
    rollExpression: "2d6",
    entries,
  };
}

function entry(min: number, max: number, featureId: string): TalentTable["entries"][number] {
  return {
    id: `${featureId}-${min}-${max}`,
    min,
    max,
    featureId,
  };
}
