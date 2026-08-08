const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_VERSION =
  "atlas_population_biome_local_character_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RULES =
  Object.freeze([
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      localCharacterProfileId: "LOCAL_CHARACTER_COASTAL_SETTLEMENT_001",
      supportedDistrictTypes: Object.freeze(["coastal_natural"]),
      supportedFeatureClasses: Object.freeze(["coastal_green", "reserve", "park"]),
      characterReason: "coastal_native_buffer_character",
      defaultBlendWeights: Object.freeze({
        coastal: 0.7,
        suburban: 0.1,
        rural: 0.1,
        wetland: 0.1
      }),
      status: "approved"
    }),
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_RURAL_001",
      localCharacterProfileId: "LOCAL_CHARACTER_RURAL_EDGE_001",
      supportedDistrictTypes: Object.freeze(["recreation"]),
      supportedFeatureClasses: Object.freeze(["park", "reserve", "vegetation_area"]),
      characterReason: "rural_open_edge_character",
      defaultBlendWeights: Object.freeze({
        rural: 0.65,
        forest: 0.15,
        wetland: 0.1,
        suburban: 0.1
      }),
      status: "approved"
    }),
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_SUBURBAN_001",
      localCharacterProfileId: "LOCAL_CHARACTER_SUBURBAN_GARDEN_001",
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      characterReason: "suburban_garden_and_verge_character",
      defaultBlendWeights: Object.freeze({
        suburban: 0.7,
        coastal: 0.05,
        rural: 0.15,
        urban: 0.1
      }),
      status: "approved"
    }),
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      localCharacterProfileId: "LOCAL_CHARACTER_URBAN_MAINSTREET_001",
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use", "civic"]),
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      characterReason: "urban_frontage_and_material_character",
      defaultBlendWeights: Object.freeze({
        urban: 0.65,
        suburban: 0.15,
        coastal: 0.05,
        rural: 0.15
      }),
      status: "approved"
    }),
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_WETLAND_001",
      localCharacterProfileId: "LOCAL_CHARACTER_WETLAND_MARGIN_001",
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedFeatureClasses: Object.freeze(["reserve", "park", "coastal_green"]),
      characterReason: "wetland_margin_and_open_buffer_character",
      defaultBlendWeights: Object.freeze({
        wetland: 0.6,
        coastal: 0.2,
        rural: 0.1,
        forest: 0.1
      }),
      status: "approved"
    }),
    Object.freeze({
      biomeProfileId: "BIOME_PROFILE_FOREST_001",
      localCharacterProfileId: "LOCAL_CHARACTER_FOREST_EDGE_001",
      supportedDistrictTypes: Object.freeze(["recreation", "coastal_natural"]),
      supportedFeatureClasses: Object.freeze(["reserve", "vegetation_area", "park"]),
      characterReason: "forest_edge_and_screening_character",
      defaultBlendWeights: Object.freeze({
        forest: 0.6,
        rural: 0.2,
        wetland: 0.1,
        coastal: 0.1
      }),
      status: "approved"
    })
  ]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    biomeLocalCharacterVersion: state.biomeLocalCharacterVersion,
    registeredBiomeRuleCount: state.registeredBiomeRuleCount,
    biomeProfileId: state.biomeProfileId,
    localCharacterProfileId: state.localCharacterProfileId,
    blendWeights: deepFreeze({ ...(state.blendWeights ?? {}) }),
    characterReason: state.characterReason,
    regionalStyleSeed: state.regionalStyleSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const biomeProfileId = sanitizeString(rule.biomeProfileId);
  const localCharacterProfileId = sanitizeString(rule.localCharacterProfileId);
  if (!biomeProfileId) {
    throw Object.assign(new Error("MISSING_BIOME_PROFILE_ID"), {
      reasonCode: "MISSING_BIOME_PROFILE_ID"
    });
  }
  if (!localCharacterProfileId) {
    throw Object.assign(new Error("MISSING_LOCAL_CHARACTER_PROFILE_ID"), {
      reasonCode: "MISSING_LOCAL_CHARACTER_PROFILE_ID"
    });
  }
  return deepFreeze({
    biomeProfileId,
    localCharacterProfileId,
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    characterReason: sanitizeString(rule.characterReason),
    defaultBlendWeights: deepFreeze({ ...(rule.defaultBlendWeights ?? {}) }),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    biomeLocalCharacterVersion: version,
    registeredBiomeRuleCount: rules.length,
    biomeProfileId: null,
    localCharacterProfileId: null,
    blendWeights: null,
    characterReason: null,
    regionalStyleSeed: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, districtType, featureClass, sourceClassification) {
  if (districtType === "coastal_natural" || featureClass === "coastal_green") {
    return registry.__ruleById.get("BIOME_PROFILE_COASTAL_001");
  }
  if (sourceClassification?.startsWith("wetland:")) {
    return registry.__ruleById.get("BIOME_PROFILE_WETLAND_001");
  }
  if (districtType === "residential") {
    return registry.__ruleById.get("BIOME_PROFILE_SUBURBAN_001");
  }
  if (
    districtType === "commercial" ||
    districtType === "mixed_use" ||
    districtType === "civic"
  ) {
    return registry.__ruleById.get("BIOME_PROFILE_URBAN_001");
  }
  if (districtType === "recreation" && featureClass === "vegetation_area") {
    return registry.__ruleById.get("BIOME_PROFILE_FOREST_001");
  }
  if (districtType === "recreation") {
    return registry.__ruleById.get("BIOME_PROFILE_RURAL_001");
  }
  return registry.__rules.find(
    (rule) =>
      rule.supportedDistrictTypes.includes(districtType) &&
      rule.supportedFeatureClasses.includes(featureClass)
  ) ?? null;
}

function normalizeBlendWeights(base, adjustments = {}) {
  const merged = {
    coastal: Number(base.coastal ?? 0) + Number(adjustments.coastal ?? 0),
    rural: Number(base.rural ?? 0) + Number(adjustments.rural ?? 0),
    suburban: Number(base.suburban ?? 0) + Number(adjustments.suburban ?? 0),
    urban: Number(base.urban ?? 0) + Number(adjustments.urban ?? 0),
    wetland: Number(base.wetland ?? 0) + Number(adjustments.wetland ?? 0),
    forest: Number(base.forest ?? 0) + Number(adjustments.forest ?? 0)
  };
  const total = Object.values(merged).reduce((sum, value) => sum + value, 0) || 1;
  return deepFreeze(
    Object.fromEntries(
      Object.entries(merged).map(([key, value]) => [
        key,
        Number((value / total).toFixed(3))
      ])
    )
  );
}

function adjustBlendWeights({
  districtType,
  vergeType,
  foregroundType,
  featureClass
}) {
  const adjustments = {};
  if (vergeType === "native_verge") {
    adjustments.coastal = 0.1;
  }
  if (vergeType === "natural_edge") {
    adjustments.rural = 0.08;
  }
  if (foregroundType === "recreation_open_space") {
    adjustments.rural = 0.05;
    adjustments.forest = 0.03;
  }
  if (foregroundType === "scenic_open_frame") {
    adjustments.coastal = 0.08;
  }
  if (districtType === "civic") {
    adjustments.urban = 0.05;
  }
  if (featureClass === "reserve") {
    adjustments.wetland = 0.04;
  }
  return adjustments;
}

export function createDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.biomeProfileId, rule])),
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      biomeLocalCharacterVersion: null,
      registeredBiomeRuleCount: 0,
      biomeProfileId: null,
      localCharacterProfileId: null,
      blendWeights: {},
      characterReason: null,
      regionalStyleSeed: null,
      lastFailureReason:
        "ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationBiomeLocalCharacter(
  registry,
  {
    featureClass,
    sourceClassification,
    districtType,
    vergeType,
    foregroundType,
    selectorSeed,
    deterministicFeatureIdentity
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationBiomeLocalCharacterRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_BIOME_LOCAL_CHARACTER_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedSourceClassification = sanitizeString(sourceClassification);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedSelectorSeed = sanitizeString(selectorSeed) ?? "BIOME_SELECTOR";
  const normalizedIdentity =
    sanitizeString(deterministicFeatureIdentity) ?? "BIOME_FEATURE";

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }
  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedDistrictType,
    normalizedFeatureClass,
    normalizedSourceClassification
  );

  if (!rule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_BIOME_LOCAL_CHARACTER_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      biomeProfileId: null,
      localCharacterProfileId: null,
      blendWeights: deepFreeze({}),
      characterReason: "UNSUPPORTED_BIOME_LOCAL_CHARACTER_CONTEXT",
      regionalStyleSeed: null,
      reasonCode: "UNSUPPORTED_BIOME_LOCAL_CHARACTER_CONTEXT"
    });
  }

  const blendWeights = normalizeBlendWeights(
    rule.defaultBlendWeights,
    adjustBlendWeights({
      districtType: normalizedDistrictType,
      vergeType: sanitizeString(vergeType),
      foregroundType: sanitizeString(foregroundType),
      featureClass: normalizedFeatureClass
    })
  );
  const regionalStyleSeed = hashString(
    [
      normalizedSelectorSeed,
      normalizedIdentity,
      rule.biomeProfileId,
      rule.localCharacterProfileId
    ].join(":")
  ).slice(0, 16);

  registry.__state.biomeProfileId = rule.biomeProfileId;
  registry.__state.localCharacterProfileId = rule.localCharacterProfileId;
  registry.__state.blendWeights = blendWeights;
  registry.__state.characterReason = rule.characterReason;
  registry.__state.regionalStyleSeed = regionalStyleSeed;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    biomeProfileId: rule.biomeProfileId,
    localCharacterProfileId: rule.localCharacterProfileId,
    blendWeights,
    characterReason: rule.characterReason,
    regionalStyleSeed
  });
}
