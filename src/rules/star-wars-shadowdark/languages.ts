import type { Language } from "../rules.schema";

export const languages = [
  {
    id: "galactic-basic",
    name: "Galactic Basic",
    description: "The common tongue spoken across most civilized worlds.",
  },
  {
    id: "high-imperial",
    name: "High Imperial",
    description: "A formal, ceremonial dialect favored by the Sith Empire's elite.",
  },
  {
    id: "huttese",
    name: "Huttese",
    description:
      "Widely used in criminal circles, the Outer Rim, and underworld trade.",
  },
  {
    id: "binary",
    name: "Binary",
    description: "A rapid sequence of beeps and tones used by droids to communicate.",
  },
  {
    id: "mandoa",
    name: "Mando'a",
    description: "The proud warrior language of the Mandalorian clans.",
  },
  {
    id: "twileki",
    name: "Twi'leki",
    description:
      "Spoken and signed by Twi'leks through both words and lekku gestures.",
  },
  {
    id: "shyriiwook",
    name: "Shyriiwook",
    description: "The growled, resonant language of the Wookiees.",
  },
  {
    id: "rodese",
    name: "Rodese",
    description:
      "A sharp, high-pitched tongue spoken by Rodians and some Outer Rim traders.",
  },
  {
    id: "ancient-sith",
    name: "Ancient Sith",
    description:
      "An archaic, ritual language connected to dark temples, relics, and forbidden knowledge.",
  },
  {
    id: "durese",
    name: "Durese",
    description: "The language of the Duros, common among navigators and spacers.",
  },
] satisfies Language[];
