import type { Background } from "../rules.schema";

export const backgrounds = [
  background(
    "outer-rim-farmer",
    "Outer Rim Farmer",
    "Raised on a remote world tending crops or livestock; tough and self-reliant.",
  ),
  background(
    "republic-dropout",
    "Republic Dropout",
    "Trained in a Republic academy but left before graduation.",
  ),
  background(
    "jedi-service-youngling",
    "Jedi Service Youngling",
    "Raised in the Jedi Temple from childhood with discipline and calm.",
  ),
  background(
    "lost-temple-survivor",
    "Lost Temple Survivor",
    "Escaped the fall or ruin of a forgotten Jedi or Sith enclave.",
  ),
  background(
    "hidden-force-sensitive",
    "Hidden Force-Sensitive",
    "Grew up sensing something strange within you, though untrained.",
  ),
  background(
    "cantina-performer",
    "Cantina Performer",
    "Worked in clubs or bars as a musician, dancer, or entertainer.",
  ),
  background(
    "scrap-technician",
    "Scrap Technician",
    "Repaired junked tech, droids, and starship parts on the cheap.",
  ),
  background(
    "street-urchin",
    "Street Urchin",
    "Survived through stealth and instinct in crowded city streets.",
  ),
  background(
    "hutt-enforcer",
    "Hutt Enforcer",
    "Collected debts and handled problems for a Hutt crime lord.",
  ),
  background(
    "sith-acolyte-exiled",
    "Sith Acolyte (Exiled)",
    "Once trained by Sith instructors before escaping or being cast out.",
  ),
  background(
    "imperial-agent-field-ops",
    "Imperial Agent (Field Ops)",
    "Served in Imperial Intelligence as a spy, analyst, or operative.",
  ),
  background(
    "smuggler-crew",
    "Smuggler Crew",
    "Served aboard a smuggling vessel running contraband and dodging patrols.",
  ),
  background(
    "republic-military-lifer",
    "Republic Military Lifer",
    "Served in the Republic Armed Forces for many years.",
  ),
  background(
    "mandalorian-foundling",
    "Mandalorian Foundling",
    "Raised under Mandalorian creed, discipline, and clan culture.",
  ),
  background(
    "wilderness-scout",
    "Wilderness Scout",
    "Lived by tracking beasts and navigating wild terrain on the frontier.",
  ),
  background(
    "droid-programmer",
    "Droid Programmer",
    "Specialized in coding, modifying, or reconditioning droids.",
  ),
  background(
    "imperial-defector",
    "Imperial Defector",
    "Formerly loyal to the Empire before fleeing after a moral crisis.",
  ),
  background(
    "war-refugee",
    "War Refugee",
    "War devastated your home or family, forging resilience and grit.",
  ),
  background(
    "true-sith-hidden",
    "True Sith (Hidden)",
    "Descended from ancient Sith bloodlines kept secret from most.",
  ),
  background(
    "black-market-trader",
    "Black-Market Trader",
    "Grew up buying, selling, and negotiating in shady markets.",
  ),
] satisfies Background[];

function background(id: string, name: string, description: string): Background {
  return {
    id,
    name,
    description,
    featureIds: [`${id}-background-feature`],
  };
}
