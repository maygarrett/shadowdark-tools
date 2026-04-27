import type { Feature } from "../rules.schema";

function customFeature(
  id: string,
  name: string,
  kind: Feature["kind"],
  description: string,
  effects: Feature["effects"] = [],
): Feature {
  return {
    id,
    name,
    kind,
    description,
    effects,
  };
}

export const features = [
  customFeature("adaptive", "Adaptive", "species", "Gain one extra Talent roll at 1st level.", [
    { type: "grantResource", resourceId: "adaptive-extra-talent" },
  ]),
  customFeature("bold-opportunist", "Bold Opportunist", "species", "Once per day, roll an attack, ability check, or Force/Tech check with advantage; on success, gain +2 to your next initiative check this session.", [
    { type: "customText", text: "Timing-based once-per-day advantage is not automated." },
  ]),
  customFeature("disciplined-strike", "Disciplined Strike", "species", "Once per day after seeing the result, add +1d4 to an attack roll or saving throw."),
  customFeature("frontier-toughness", "Frontier Toughness", "species", "Gain +1 HP and roll HP with advantage when leveling.", [
    { type: "hpBonus", value: 1, perLevel: false },
    { type: "customText", text: "HP rolls with advantage are handled manually." },
  ]),
  customFeature("way-of-the-warrior", "Way of the Warrior", "species", "You may wield any weapon and wear any armor regardless of class, but cannot begin play Force-sensitive.", [
    { type: "proficiencyOverride", target: { domain: "proficiency" } },
    { type: "customText", text: "Cannot begin play as a Force-sensitive class." },
  ]),
  customFeature("mechanical-body", "Mechanical Body", "species", "You are immune to poison, disease, and suffocation, cannot benefit from healing powers unless allowed, and cannot play Knight or Consular.", [
    { type: "customText", text: "Droids cannot choose Knight or Consular." },
  ]),
  customFeature("assassin-protocols", "Assassin Protocols", "species", "Once per combat, deal +1d6 damage when attacking a creature that has not acted yet.", [
    { type: "grantLanguage", language: "Binary" },
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "customText", text: "Know one additional language related to your target profile." },
  ]),
  customFeature("cultural-database", "Cultural Database", "species", "Once per day, gain advantage on a social check or on interpreting alien cultures.", [
    { type: "grantLanguage", language: "Binary" },
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "customText", text: "Know three additional languages of your choice." },
  ]),
  customFeature("reinforced-chassis", "Reinforced Chassis", "species", "Gain +1 AC and advantage on checks to resist being shoved, grappled, or knocked prone.", [
    { type: "grantLanguage", language: "Binary" },
    { type: "acBonus", value: 1 },
    { type: "advantage", target: { domain: "check", tags: ["resist-shove", "resist-grapple", "resist-prone"] } },
  ]),
  customFeature("lekku-awareness", "Lekku Awareness", "species", "Gain advantage on Perception checks; once per day, gain advantage on a social check.", [
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "grantLanguage", language: "Twi'leki" },
    { type: "advantage", target: { domain: "check", tags: ["perception"] } },
  ]),
  customFeature("adaptable-physique", "Adaptable Physique", "species", "Choose an extra dash benefit: attack after dashing, or gain +4 AC until your next turn after dashing."),
  customFeature("rage-of-kashyyyk", "Rage of Kashyyyk", "species", "Once per day for 3 rounds, gain +1 melee attack and damage, advantage on STR checks, and half damage from non-energy melee attacks.", [
    { type: "grantLanguage", language: "Shyriiwook" },
  ]),
  customFeature("thick-hide", "Thick Hide", "species", "When a failed explosives attack would cause collateral damage to you, take no damage instead."),
  customFeature("hunters-instincts", "Hunter's Instincts", "species", "Gain advantage on tracking checks; once per day, deal +1d6 damage to a creature you tracked or spotted first.", [
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "grantLanguage", language: "Rodese" },
    { type: "advantage", target: { domain: "check", tags: ["tracking"] } },
  ]),
  customFeature("shoot-first", "Shoot First", "species", "Gain advantage on initiative rolls.", [
    { type: "advantage", target: { domain: "check", tags: ["initiative"] } },
  ]),
  customFeature("iron-will-endurance", "Iron Will & Endurance", "species", "Once per day, reroll a failed saving throw against mental effects; gain +1 HP per level.", [
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "hpBonus", value: 1, perLevel: true },
    { type: "customText", text: "Know one additional language of your choice." },
  ]),
  customFeature("montral-echo-sense", "Montral Echo-Sense", "species", "Gain advantage on initiative; hidden or invisible creatures within 30 ft cannot gain advantage on attacks against you.", [
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "advantage", target: { domain: "check", tags: ["initiative"] } },
    { type: "customText", text: "Know one additional language of your choice." },
  ]),
  customFeature("focused-senses", "Focused Senses", "species", "Once per day, detect all creatures within 60 ft for 1 round."),
  customFeature("voidborn-navigator", "Voidborn Navigator", "species", "Gain advantage on piloting checks and Tech checks involving starship systems; you cannot become lost in known space.", [
    { type: "grantLanguage", language: "Galactic Basic" },
    { type: "grantLanguage", language: "Durese" },
    { type: "advantage", target: { domain: "check", tags: ["piloting", "starship-tech"] } },
  ]),
  customFeature("durosian-handling", "Durosian Handling", "species", "Once per day, grant +1d6 to an ally's piloting or navigation check."),

  customFeature("force-channel", "Force Channel", "class", "Gain +1 to Force checks when using defensive or supportive powers.", [
    { type: "powerCheckBonus", value: 1, target: { domain: "power", powerKind: "force", tags: ["defense", "supportive"] } },
  ]),
  customFeature("lightsaber-defence", "Lightsaber Defence", "class", "Once per combat as a reaction, deflect a blaster attack that would hit you and avoid all damage."),
  customFeature("knight-force-casting", "The Force", "class", "Use Wisdom for Force checks and know 1 Force power per level."),
  customFeature("force-adept", "Force Adept", "class", "Gain +2 to Force checks outside combat."),
  customFeature("saber-mastery", "Saber Mastery", "class", "Gain +1 to attack and damage with lightsabers and advantage on disarming attempts.", [
    { type: "attackBonus", value: 1, target: { domain: "attack", tags: ["lightsabers"] } },
    { type: "damageBonus", value: 1, target: { domain: "damage", tags: ["lightsabers"] } },
    { type: "advantage", target: { domain: "check", tags: ["disarm"] } },
  ]),
  customFeature("consular-force-casting", "The Force", "class", "Use Intelligence for Force checks and choose Force powers from the Force and reflavored Shadowdark spell lists."),
  customFeature("combat-drills", "Combat Drills", "class", "Gain advantage on checks involving tactics, overwatch, or cover.", [
    { type: "advantage", target: { domain: "check", tags: ["tactics", "overwatch", "cover"] } },
  ]),
  customFeature("heavy-weapons-training", "Heavy Weapons Training", "class", "Use heavy weapons and explosives without penalty.", [
    { type: "proficiencyOverride", target: { domain: "proficiency", tags: ["heavy-weapons", "explosives"] } },
  ]),
  customFeature("tech-specialist", "Tech Specialist", "class", "Gain advantage on Tech checks to operate military hardware or vehicles.", [
    { type: "advantage", target: { domain: "check", tags: ["tech", "military-hardware", "vehicles"] } },
  ]),
  customFeature("quick-draw", "Quick Draw", "class", "Draw or stow a weapon once per round for free and gain advantage on initiative checks.", [
    { type: "advantage", target: { domain: "check", tags: ["initiative"] } },
  ]),
  customFeature("gunslinger", "Gunslinger", "class", "Once per combat, deal +1d6 bonus damage with a pistol attack."),
  customFeature("tech-trickster", "Tech Trickster", "class", "Gain advantage on slicing, security bypass, or jury-rigging checks.", [
    { type: "advantage", target: { domain: "check", tags: ["slicing", "security", "jury-rigging"] } },
  ]),
  customFeature("uncanny-luck", "Uncanny Luck", "class", "Once per day, force the GM to reroll a single roll."),
  customFeature("hunters-arsenal", "Hunter's Arsenal", "class", "After each long rest, gain 1 Thermal Detonator if you are out of explosives."),
  customFeature("predator-shot", "Predator Shot", "class", "Once per combat, deal +1d8 bonus damage when you hit a target with a ranged attack."),
  customFeature("tech-upgrades", "Tech Upgrades", "class", "Modify one weapon or gadget to gain weapon mastery with it, giving +1 attack and damage with that chosen item."),
  customFeature("jet-pack", "Jet Pack", "class", "Once per day, move to a far location you can see as your movement."),
  customFeature("infiltrator", "Infiltrator", "class", "Gain advantage on stealth and disguise checks.", [
    { type: "advantage", target: { domain: "check", tags: ["stealth", "disguise"] } },
  ]),
  customFeature("precision-fire", "Precision Fire", "class", "Gain +1 to attack and damage with pistols and carbines.", [
    { type: "attackBonus", value: 1, target: { domain: "attack", tags: ["pistols", "carbines"] } },
    { type: "damageBonus", value: 1, target: { domain: "damage", tags: ["pistols", "carbines"] } },
  ]),
  customFeature("spycraft", "Spycraft", "class", "Gain advantage on slicing, surveillance, or codebreaking checks.", [
    { type: "advantage", target: { domain: "check", tags: ["slicing", "surveillance", "codebreaking"] } },
  ]),
  customFeature("operative-training", "Operative Training", "class", "Three times per day, add your INT bonus to any ability check."),
  customFeature("sniper", "Sniper", "class", "Ignore range requirements and penalties when using carbines at long range or farther."),

  customFeature("defensive-mastery", "Defensive Mastery", "subclass", "Once per round, impose disadvantage on one melee attack against you or an adjacent ally."),
  customFeature("soresu-form", "Soresu (Form III)", "subclass", "Gain +2 AC when wielding a single one-handed lightsaber and nothing in your other hand.", [
    { type: "acBonus", value: 2, condition: "With a single lightsaber." },
  ]),
  customFeature("niman-form", "Niman (Form VI)", "subclass", "You can dual-wield lightsabers; after hitting on your turn, you may make another attack that deals half damage on a hit, while critical failure can strike you."),
  customFeature("allied-combat", "Allied Combat", "subclass", "Gain +2 to hit when targeting a creature engaged by an ally."),
  customFeature("ataru-form", "Ataru (Form IV)", "subclass", "Once per combat, deal +1d8 extra damage on a single powerful lightsaber strike."),
  customFeature("reckless", "Reckless", "subclass", "You can wield oversized or heavy-style lightsabers that deal +2 damage, but your AC is reduced by 2 while wielding them."),
  customFeature("force-savant", "Force Savant", "subclass", "Gain +1 to Force checks and take -2 to melee attack rolls.", [
    { type: "powerCheckBonus", value: 1, target: { domain: "power", powerKind: "force" } },
    { type: "attackBonus", value: -2, target: { domain: "attack", tags: ["melee"] } },
  ]),
  customFeature("shii-cho-form", "Shii-Cho (Form I)", "subclass", "Choose 1 additional Force power at level 1."),
  customFeature("shien-form", "Shien (Form V)", "subclass", "Once per combat, Dash as a free action."),
  customFeature("force-agility", "Force Agility", "subclass", "Add your Wisdom modifier to AC while unarmored."),
  customFeature("double-blade-mastery", "Double-Blade Mastery", "subclass", "Gain +1 to attack and damage with double-bladed lightsabers.", [
    { type: "attackBonus", value: 1, target: { domain: "attack", ids: ["lightsaber-double-blade"] } },
    { type: "damageBonus", value: 1, target: { domain: "damage", ids: ["lightsaber-double-blade"] } },
  ]),
  customFeature("juyo-form", "Juyo (Form VII)", "subclass", "When attacking from stealth or targeting a surprised creature, deal +1d4 extra damage.", [
    { type: "damageDiceBonus", dice: "1d4", target: { domain: "damage" }, condition: "Attacking from stealth or targeting a surprised creature." },
  ]),

  customFeature("outer-rim-farmer-background-feature", "Outer Rim Farmer Talent", "background", "Gain advantage on checks to identify plants, animals, or terrain features.", [
    { type: "advantage", target: { domain: "check", tags: ["plants", "animals", "terrain"] } },
  ]),
  customFeature("republic-dropout-background-feature", "Republic Dropout Talent", "background", "Once per day, reroll a CHA check with Republic officials."),
  customFeature("jedi-service-youngling-background-feature", "Jedi Service Youngling Talent", "background", "After meditating for 1 minute, become immune to fear for 10 minutes."),
  customFeature("lost-temple-survivor-background-feature", "Lost Temple Survivor Talent", "background", "Gain advantage on Perception checks to detect hidden passages or relics.", [
    { type: "advantage", target: { domain: "check", tags: ["perception", "hidden-passages", "relics"] } },
  ]),
  customFeature("hidden-force-sensitive-background-feature", "Hidden Force-Sensitive Talent", "background", "Gain advantage on checks to sense emotions or unseen danger.", [
    { type: "advantage", target: { domain: "check", tags: ["sense-emotions", "danger-sense"] } },
  ]),
  customFeature("cantina-performer-background-feature", "Cantina Performer Talent", "background", "Gain advantage on Persuasion checks when performing or entertaining."),
  customFeature("scrap-technician-background-feature", "Scrap Technician Talent", "background", "Repair broken non-combat tech twice as fast."),
  customFeature("street-urchin-background-feature", "Street Urchin Talent", "background", "Gain advantage on checks to hide in urban environments."),
  customFeature("hutt-enforcer-background-feature", "Hutt Enforcer Talent", "background", "Once per day, gain +3 on an Intimidation check."),
  customFeature("sith-acolyte-exiled-background-feature", "Sith Acolyte Talent", "background", "Gain advantage on Lore checks about Sith rituals, relics, or history.", [
    { type: "advantage", target: { domain: "check", tags: ["sith-lore", "rituals", "relics"] } },
  ]),
  customFeature("imperial-agent-field-ops-background-feature", "Imperial Agent Talent", "background", "Once per day, gain advantage on a Deception or Insight check."),
  customFeature("smuggler-crew-background-feature", "Smuggler Crew Talent", "background", "Once per day, gain advantage on a Deception check involving contraband."),
  customFeature("republic-military-lifer-background-feature", "Republic Military Lifer Talent", "background", "Gain advantage on checks to recall military procedures or rank structures.", [
    { type: "advantage", target: { domain: "check", tags: ["military-procedures", "military-ranks"] } },
  ]),
  customFeature("mandalorian-foundling-background-feature", "Mandalorian Foundling Talent", "background", "Once per day, resist fear for 1 round without rolling."),
  customFeature("wilderness-scout-background-feature", "Wilderness Scout Talent", "background", "Gain advantage on Survival checks in natural environments.", [
    { type: "advantage", target: { domain: "check", tags: ["survival", "wilderness"] } },
  ]),
  customFeature("droid-programmer-background-feature", "Droid Programmer Talent", "background", "Once per day, bypass a minor droid restriction or command automatically."),
  customFeature("imperial-defector-background-feature", "Imperial Defector Talent", "background", "Once per day, gain advantage on Stealth or Deception checks against Imperials."),
  customFeature("war-refugee-background-feature", "War Refugee Talent", "background", "Once per day, gain advantage on a saving throw against fear or despair."),
  customFeature("true-sith-hidden-background-feature", "True Sith Talent", "background", "Gain advantage on Intimidation checks when invoking your lineage or power."),
  customFeature("black-market-trader-background-feature", "Black-Market Trader Talent", "background", "Once per day, gain advantage on Negotiation checks about prices or deals."),
] satisfies Feature[];
