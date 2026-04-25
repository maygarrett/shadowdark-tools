import type { Species, SpeciesVariant } from "../rules.schema";

export const species = [
  {
    id: "human",
    name: "Human",
    description: "Adaptable people found across the galaxy.",
    variantIds: [
      "human-republican",
      "human-imperial",
      "human-outer-rim-spacer",
      "human-mandalorian",
    ],
    featureIds: ["adaptive"],
  },
  {
    id: "droid",
    name: "Droid",
    description: "Mechanical beings with specialized chassis and programming.",
    variantIds: ["droid-hk-assassin", "droid-protocol", "droid-battle"],
    featureIds: ["mechanical-body"],
  },
  {
    id: "twilek",
    name: "Twi'lek",
    description: "Graceful and perceptive humanoids with strong social instincts.",
    variantIds: [],
    featureIds: ["lekku-awareness", "adaptable-physique"],
  },
  {
    id: "wookiee",
    name: "Wookiee",
    description: "Towering warriors known for strength and fierce loyalty.",
    variantIds: [],
    featureIds: ["rage-of-kashyyyk", "thick-hide"],
  },
  {
    id: "rodian",
    name: "Rodian",
    description: "Sharp-eyed hunters with strong survival instincts.",
    variantIds: [],
    featureIds: ["hunters-instincts", "shoot-first"],
  },
  {
    id: "zabrak",
    name: "Zabrak",
    description: "Disciplined and resilient warriors marked by inner focus.",
    variantIds: [],
    featureIds: ["iron-will-endurance"],
  },
  {
    id: "togruta",
    name: "Togruta",
    description: "Pack-oriented hunters with exceptional spatial awareness.",
    variantIds: [],
    featureIds: ["montral-echo-sense", "focused-senses"],
  },
  {
    id: "duros",
    name: "Duros",
    description: "Calm navigators, pilots, and explorers.",
    variantIds: [],
    featureIds: ["voidborn-navigator", "durosian-handling"],
  },
] satisfies Species[];

export const speciesVariants = [
  {
    id: "human-republican",
    speciesId: "human",
    name: "Republican",
    description: "A human raised among Republic ideals and institutions.",
    featureIds: ["bold-opportunist"],
  },
  {
    id: "human-imperial",
    speciesId: "human",
    name: "Imperial",
    description: "A human shaped by Imperial hierarchy and discipline.",
    featureIds: ["disciplined-strike"],
  },
  {
    id: "human-outer-rim-spacer",
    speciesId: "human",
    name: "Outer Rim Spacer",
    description: "A human frontier wanderer used to grit and danger.",
    featureIds: ["frontier-toughness"],
  },
  {
    id: "human-mandalorian",
    speciesId: "human",
    name: "Mandalorian",
    description: "A human raised in Mandalorian warrior culture.",
    featureIds: ["way-of-the-warrior"],
  },
  {
    id: "droid-hk-assassin",
    speciesId: "droid",
    name: "HK Assassin",
    description: "A droid built for hunting and elimination.",
    featureIds: ["assassin-protocols"],
  },
  {
    id: "droid-protocol",
    speciesId: "droid",
    name: "Protocol",
    description: "A droid built for etiquette, diplomacy, and translation.",
    featureIds: ["cultural-database"],
  },
  {
    id: "droid-battle",
    speciesId: "droid",
    name: "Battle",
    description: "A droid combat frame designed for durability.",
    featureIds: ["reinforced-chassis"],
  },
] satisfies SpeciesVariant[];
