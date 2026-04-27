import { backgrounds } from "./backgrounds";
import { classes, subclasses } from "./classes";
import { destinies } from "./destiny";
import { features } from "./features";
import { forcePowers } from "./force-powers";
import { gear } from "./gear";
import { species, speciesVariants } from "./species";
import { talentFeatures, talentTables } from "./talents";
import { vices } from "./vice";
import type { Ruleset } from "../rules.schema";

const allFeatures = [...features, ...talentFeatures];

export const starWarsShadowdarkRuleset = {
  id: "star-wars-shadowdark",
  version: "0.1.0",
  name: "Star Wars Shadowdark",
  species,
  speciesVariants,
  classes,
  subclasses,
  backgrounds,
  vices,
  destinies,
  forcePowers,
  gear,
  features: allFeatures,
  talentTables,
} satisfies Ruleset;

export { backgrounds } from "./backgrounds";
export { classes, subclasses } from "./classes";
export { destinies } from "./destiny";
export { features } from "./features";
export { forcePowers } from "./force-powers";
export { gear } from "./gear";
export { species, speciesVariants } from "./species";
export { talentFeatures, talentTables } from "./talents";
export { vices } from "./vice";
