import type { Background } from "../rules.schema";

export const backgrounds = [
  ["outer-rim-farmer", "Outer Rim Farmer"],
  ["republic-dropout", "Republic Dropout"],
  ["jedi-service-youngling", "Jedi Service Youngling"],
  ["lost-temple-survivor", "Lost Temple Survivor"],
  ["hidden-force-sensitive", "Hidden Force-Sensitive"],
  ["cantina-performer", "Cantina Performer"],
  ["scrap-technician", "Scrap Technician"],
  ["street-urchin", "Street Urchin"],
  ["hutt-enforcer", "Hutt Enforcer"],
  ["sith-acolyte-exiled", "Sith Acolyte (Exiled)"],
  ["imperial-agent-field-ops", "Imperial Agent (Field Ops)"],
  ["smuggler-crew", "Smuggler Crew"],
  ["republic-military-lifer", "Republic Military Lifer"],
  ["mandalorian-foundling", "Mandalorian Foundling"],
  ["wilderness-scout", "Wilderness Scout"],
  ["droid-programmer", "Droid Programmer"],
  ["imperial-defector", "Imperial Defector"],
  ["war-refugee", "War Refugee"],
  ["true-sith-hidden", "True Sith (Hidden)"],
  ["black-market-trader", "Black-Market Trader"],
].map(([id, name]) => ({
  id,
  name,
  description: `${name} background from the homebrew table.`,
  featureIds: [`${id}-background-feature`],
})) satisfies Background[];
