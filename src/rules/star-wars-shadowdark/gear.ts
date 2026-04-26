import type { GearItem } from "../rules.schema";

type GearSeed = Omit<
  GearItem,
  | "armorCategory"
  | "description"
  | "equipmentSlot"
  | "equippable"
  | "notes"
  | "slotsPerItem"
> &
  Partial<
    Pick<
      GearItem,
      | "armorCategory"
      | "attackAbility"
      | "attackNotes"
      | "equipmentSlot"
      | "equippable"
      | "hands"
      | "notes"
      | "slotsPerItem"
      | "weaponCategory"
      | "weaponRangeType"
    >
  >;

const gearSeeds = [
  {
    id: "holdout-blaster",
    name: "Holdout Blaster",
    category: "weapon",
    tags: ["light"],
    attackAbility: "dex",
    damage: "1d4",
    weaponCategory: "pistols",
    weaponRangeType: "ranged",
    costCredits: 600,
  },
  {
    id: "vibroknife",
    name: "Vibroknife",
    category: "weapon",
    tags: ["light"],
    damage: "1d4",
    costCredits: 600,
  },
  {
    id: "shock-baton",
    name: "Shock Baton",
    category: "weapon",
    tags: ["light"],
    damage: "1d4",
    costCredits: 500,
  },
  {
    id: "throwing-knife",
    name: "Throwing Knife",
    category: "weapon",
    tags: ["light", "thrown"],
    damage: "1d4",
    costCredits: 300,
  },
  {
    id: "blaster-pistol",
    name: "Blaster Pistol",
    category: "weapon",
    tags: ["pistols"],
    damage: "1d6",
    costCredits: 1000,
  },
  {
    id: "heavy-blaster-pistol",
    name: "Heavy Blaster Pistol",
    category: "weapon",
    tags: ["pistols", "two-handed"],
    damage: "1d8",
    costCredits: 2000,
  },
  {
    id: "sporting-carbine",
    name: "Sporting Carbine",
    category: "weapon",
    tags: ["carbines"],
    damage: "1d6",
    costCredits: 1200,
  },
  {
    id: "hunting-carbine",
    name: "Hunting Carbine",
    category: "weapon",
    tags: ["carbines"],
    damage: "1d6",
  },
  {
    id: "military-carbine",
    name: "Military Carbine",
    category: "weapon",
    tags: ["carbines"],
    damage: "1d8",
    costCredits: 2500,
  },
  {
    id: "blaster-rifle",
    name: "Blaster Rifle",
    category: "weapon",
    tags: ["rifles"],
    damage: "1d10",
    costCredits: 3000,
  },
  {
    id: "sniper-rifle",
    name: "Sniper Rifle",
    category: "weapon",
    tags: ["rifles"],
    damage: "1d10",
    costCredits: 4000,
  },
  {
    id: "bowcaster",
    name: "Bowcaster",
    category: "weapon",
    tags: ["rifles", "two-handed"],
    damage: "1d10",
    costCredits: 3500,
  },
  {
    id: "vibroblade",
    name: "Vibroblade",
    category: "weapon",
    tags: ["knives"],
    damage: "1d6",
    costCredits: 1000,
  },
  {
    id: "vibrosword",
    name: "Vibrosword",
    category: "weapon",
    tags: ["vibroswords"],
    damage: "1d8",
    costCredits: 2000,
  },
  {
    id: "electrostaff",
    name: "Electrostaff",
    category: "weapon",
    tags: ["staves"],
    damage: "1d8",
    costCredits: 4000,
  },
  {
    id: "lightsaber-single",
    name: "Lightsaber (single)",
    category: "weapon",
    tags: ["lightsabers"],
    damage: "2d4+1",
    costText: "15000+",
  },
  {
    id: "lightsaber-crossguard",
    name: "Lightsaber (crossguard)",
    category: "weapon",
    tags: ["lightsabers", "heavy", "two-handed"],
    damage: "2d6+1",
    costText: "20000+",
  },
  {
    id: "lightsaber-double-blade",
    name: "Lightsaber (double-blade)",
    category: "weapon",
    tags: ["lightsabers", "finesse", "two-handed"],
    damage: "2d4+2",
    costText: "22000+",
  },
  {
    id: "ion-blaster",
    name: "Ion Blaster",
    category: "weapon",
    tags: ["tech"],
    damage: "1d8",
    costCredits: 2000,
  },
  {
    id: "emp-projector",
    name: "EMP Projector",
    category: "weapon",
    tags: ["tech"],
    damage: "1d10",
    costCredits: 5000,
  },
  {
    id: "thermal-detonator",
    name: "Thermal Detonator",
    category: "weapon",
    tags: ["explosives"],
    damage: "2d6",
    costCredits: 600,
  },
  {
    id: "frag-grenade",
    name: "Frag Grenade",
    category: "weapon",
    tags: ["explosives"],
    damage: "1d8",
    costCredits: 1200,
  },
  {
    id: "heavy-repeater",
    name: "Heavy Repeater",
    category: "weapon",
    tags: ["heavy-weapons"],
    damage: "1d12",
    costCredits: 8000,
  },
  {
    id: "rocket-launcher",
    name: "Rocket Launcher",
    category: "weapon",
    tags: ["heavy-weapons"],
    damage: "2d6",
    costCredits: 10000,
  },
  {
    id: "flamethrower",
    name: "Flamethrower",
    category: "weapon",
    tags: ["heavy-weapons"],
    damage: "1d10",
    costCredits: 6000,
  },
  {
    id: "clothing-civilian-wear",
    name: "Clothing / Civilian Wear",
    category: "armor",
    tags: ["none"],
    acBonus: 0,
    costCredits: 50,
  },
  {
    id: "jedi-consular-robes",
    name: "Jedi/Consular Robes",
    category: "armor",
    tags: ["none"],
    acBonus: 0,
    costCredits: 800,
  },
  {
    id: "knight-robes",
    name: "Knight Robes",
    category: "armor",
    tags: ["none"],
    acBonus: 0,
  },
  {
    id: "consular-robes",
    name: "Consular Robes",
    category: "armor",
    tags: ["none"],
    acBonus: 0,
  },
  {
    id: "spacer-jacket",
    name: "Spacer Jacket",
    category: "armor",
    tags: ["light"],
    acBonus: 1,
    costCredits: 400,
  },
  {
    id: "padded-flight-suit",
    name: "Padded Flight Suit",
    category: "armor",
    tags: ["light"],
    acBonus: 1,
    costCredits: 600,
  },
  {
    id: "scoundrel-vest",
    name: "Scoundrel Vest",
    category: "armor",
    tags: ["light"],
    acBonus: 2,
    costCredits: 1200,
  },
  {
    id: "stealth-suit",
    name: "Stealth Suit",
    category: "armor",
    tags: ["light"],
    acBonus: 2,
    costCredits: 2500,
  },
  {
    id: "light-trooper-armor",
    name: "Light Trooper Armor",
    category: "armor",
    tags: ["light"],
    acBonus: 3,
    costCredits: 3000,
  },
  {
    id: "scout-recon-armor",
    name: "Scout Recon Armor",
    category: "armor",
    tags: ["light"],
    acBonus: 3,
    costCredits: 3000,
  },
  {
    id: "mandalorian-light-plates",
    name: "Mandalorian Light Plates",
    category: "armor",
    tags: ["medium"],
    acBonus: 4,
    costCredits: 5000,
  },
  {
    id: "trooper-combat-armor",
    name: "Trooper Combat Armor",
    category: "armor",
    tags: ["medium"],
    acBonus: 4,
    costCredits: 6500,
  },
  {
    id: "jedi-battle-armor",
    name: "Jedi Battle Armor",
    category: "armor",
    tags: ["medium"],
    acBonus: 3,
    costCredits: 8000,
  },
  {
    id: "security-forces-armor",
    name: "Security Forces Armor",
    category: "armor",
    tags: ["heavy"],
    acBonus: 5,
    costCredits: 9000,
  },
  {
    id: "heavy-trooper-armor",
    name: "Heavy Trooper Armor",
    category: "armor",
    tags: ["heavy"],
    acBonus: 5,
    costCredits: 10000,
  },
  {
    id: "mandalorian-beskar-armor",
    name: "Mandalorian Beskar Armor",
    category: "armor",
    tags: ["heavy"],
    acBonus: 6,
    costText: "30000+",
  },
  {
    id: "power-armor-exosuit",
    name: "Power Armor Exosuit",
    category: "armor",
    tags: ["heavy"],
    acBonus: 6,
    costCredits: 15000,
  },
  {
    id: "tech-energy-buckler",
    name: "Tech: Energy Buckler",
    category: "armor",
    tags: ["tech"],
    acBonus: 1,
    costCredits: 1500,
  },
  {
    id: "tech-personal-shield-generator",
    name: "Tech: Personal Shield Generator",
    category: "armor",
    tags: ["tech"],
    acBonus: 1,
    costCredits: 9000,
  },
  {
    id: "tech-combat-field-generator",
    name: "Tech: Combat Field Generator",
    category: "armor",
    tags: ["tech"],
    acBonus: 1,
    costCredits: 8000,
  },
  {
    id: "tech-cloaking-field-vest",
    name: "Tech: Cloaking Field Vest",
    category: "armor",
    tags: ["tech"],
    acBonus: 0,
    costText: "25000+",
  },
  {
    id: "datapad",
    name: "Datapad",
    category: "equipment",
    tags: ["tech"],
  },
  {
    id: "basic-id-scrambler",
    name: "Basic ID Scrambler",
    category: "equipment",
    tags: ["tech"],
  },
  {
    id: "grapnel-launcher",
    name: "Grapnel Launcher",
    category: "equipment",
    tags: ["tool"],
  },
  {
    id: "micro-binoculars",
    name: "Micro-Binoculars",
    category: "equipment",
    tags: ["tool"],
  },
  {
    id: "tracking-fob-basic",
    name: "Tracking Fob (basic)",
    category: "equipment",
    tags: ["tool"],
  },
  {
    id: "basic-slicing-rig",
    name: "Basic Slicing Rig",
    category: "equipment",
    tags: ["tech", "tool"],
  },
  {
    id: "optic-scanner",
    name: "Optic Scanner",
    category: "equipment",
    tags: ["tool"],
  },
  {
    id: "medpac",
    name: "Medpac",
    category: "consumable",
    tags: ["medical"],
  },
  {
    id: "commlink",
    name: "Commlink",
    category: "equipment",
    tags: ["communication"],
  },
  {
    id: "glowrod",
    name: "Glowrod",
    category: "equipment",
    tags: ["light"],
  },
  {
    id: "rations-3-days",
    name: "Rations (3 days)",
    category: "consumable",
    tags: ["survival"],
  },
  {
    id: "water-canister",
    name: "Water Canister",
    category: "consumable",
    tags: ["survival"],
  },
] satisfies GearSeed[];

export const gear = gearSeeds.map((item) => ({
  ...item,
  ...getGearMetadata(item),
  description: `${item.name} from the homebrew gear list.`,
})) satisfies GearItem[];

function getGearMetadata(item: GearSeed): Pick<
  GearItem,
  | "armorCategory"
  | "attackAbility"
  | "attackNotes"
  | "equipmentSlot"
  | "equippable"
  | "hands"
  | "notes"
  | "slotsPerItem"
  | "weaponCategory"
  | "weaponRangeType"
> {
  if (item.category === "weapon") {
    const slotsPerItem =
      item.slotsPerItem ??
      (item.tags.includes("two-handed") ||
      item.tags.includes("heavy") ||
      item.tags.includes("heavy-weapons")
        ? 2
        : 1);

    return {
      armorCategory: item.armorCategory,
      attackAbility: item.attackAbility ?? getWeaponAttackAbility(item),
      attackNotes: item.attackNotes,
      equipmentSlot: item.equipmentSlot ?? "weapon",
      equippable: item.equippable ?? true,
      hands: item.hands ?? getWeaponHands(item),
      notes: item.notes,
      slotsPerItem,
      weaponCategory: item.weaponCategory ?? getWeaponCategory(item),
      weaponRangeType: item.weaponRangeType ?? getWeaponRangeType(item),
    };
  }

  if (item.category === "armor") {
    const armorCategory = item.armorCategory ?? getArmorCategory(item);

    return {
      armorCategory,
      attackAbility: item.attackAbility,
      attackNotes: item.attackNotes,
      equipmentSlot: item.equipmentSlot ?? "armor",
      equippable: item.equippable ?? true,
      hands: item.hands,
      notes: item.notes ?? getArmorNotes(item, armorCategory),
      slotsPerItem: item.slotsPerItem ?? getArmorSlots(armorCategory),
      weaponCategory: item.weaponCategory,
      weaponRangeType: item.weaponRangeType,
    };
  }

  return {
    armorCategory: item.armorCategory,
    attackAbility: item.attackAbility,
    attackNotes: item.attackNotes,
    equipmentSlot: item.equipmentSlot ?? "other",
    equippable: item.equippable ?? false,
    hands: item.hands,
    notes: item.notes ?? getEquipmentNotes(item),
    slotsPerItem: item.slotsPerItem ?? getEquipmentSlots(item),
    weaponCategory: item.weaponCategory,
    weaponRangeType: item.weaponRangeType,
  };
}

function getWeaponAttackAbility(item: GearSeed): GearItem["attackAbility"] {
  if (
    item.tags.includes("pistols") ||
    item.tags.includes("carbines") ||
    item.tags.includes("rifles") ||
    item.tags.includes("heavy-weapons") ||
    item.tags.includes("tech") ||
    item.tags.includes("explosives")
  ) {
    return "dex";
  }

  if (
    item.tags.includes("light") ||
    item.tags.includes("knives") ||
    item.tags.includes("finesse") ||
    item.tags.includes("thrown")
  ) {
    return "best-str-dex";
  }

  return "str";
}

function getWeaponCategory(item: GearSeed): string {
  const weaponTags = [
    "lightsabers",
    "vibroswords",
    "staves",
    "pistols",
    "carbines",
    "rifles",
    "knives",
    "heavy-weapons",
    "explosives",
    "tech",
    "light",
  ];

  return item.tags.find((tag) => weaponTags.includes(tag)) ?? "weapon";
}

function getWeaponRangeType(item: GearSeed): GearItem["weaponRangeType"] {
  if (item.tags.includes("thrown")) {
    return "thrown";
  }

  if (
    item.tags.includes("pistols") ||
    item.tags.includes("carbines") ||
    item.tags.includes("rifles") ||
    item.tags.includes("heavy-weapons") ||
    item.tags.includes("tech") ||
    item.tags.includes("explosives")
  ) {
    return "ranged";
  }

  return "melee";
}

function getWeaponHands(item: GearSeed): number {
  return item.tags.includes("two-handed") || item.tags.includes("heavy-weapons")
    ? 2
    : 1;
}

function getArmorCategory(item: GearSeed): GearItem["armorCategory"] {
  if (item.tags.includes("tech")) {
    return "tech";
  }

  if (item.tags.includes("heavy")) {
    return "heavy";
  }

  if (item.tags.includes("medium")) {
    return "medium";
  }

  if (item.tags.includes("light")) {
    return "light";
  }

  return "none";
}

function getArmorSlots(armorCategory: GearItem["armorCategory"]): number {
  switch (armorCategory) {
    case "heavy":
      return 3;
    case "medium":
      return 2;
    case "light":
    case "tech":
      return 1;
    case "none":
    default:
      return 0;
  }
}

function getArmorNotes(
  item: GearSeed,
  armorCategory: GearItem["armorCategory"],
): string | undefined {
  if (armorCategory === "tech" && (item.acBonus ?? 0) > 0) {
    return "Tech armor; stacks with normal armor.";
  }

  return undefined;
}

function getEquipmentSlots(item: GearSeed): number {
  if (item.id === "rations-3-days") {
    return 1 / 3;
  }

  return 1;
}

function getEquipmentNotes(item: GearSeed): string | undefined {
  if (item.id === "rations-3-days") {
    return "Track one ration per day; three rations use one gear slot.";
  }

  return item.notes;
}
