const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_VERSION =
  "atlas_population_contextual_world_fill_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULES =
  Object.freeze([
    Object.freeze({
      contextRuleId: "CTX_WORLD_FILL_RESIDENTIAL_001",
      worldFillCategory: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedSourcePrefixes: Object.freeze(["building:", "residential:"]),
      status: "approved"
    }),
    Object.freeze({
      contextRuleId: "CTX_WORLD_FILL_COMMERCIAL_001",
      worldFillCategory: "commercial",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedSourcePrefixes: Object.freeze([
        "shop:",
        "retail:",
        "cafe:",
        "amenity:cafe",
        "amenity:restaurant",
        "amenity:fast_food"
      ]),
      status: "approved"
    }),
    Object.freeze({
      contextRuleId: "CTX_WORLD_FILL_CIVIC_001",
      worldFillCategory: "civic",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      supportedSourcePrefixes: Object.freeze(["amenity:", "leisure:"]),
      status: "approved"
    }),
    Object.freeze({
      contextRuleId: "CTX_WORLD_FILL_PARK_001",
      worldFillCategory: "park",
      supportedFeatureClasses: Object.freeze(["park"]),
      supportedSourcePrefixes: Object.freeze(["leisure:park", "zone:park"]),
      status: "approved"
    }),
    Object.freeze({
      contextRuleId: "CTX_WORLD_FILL_COASTAL_001",
      worldFillCategory: "coastal",
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "reserve",
        "roadside_green",
        "vegetation_area"
      ]),
      supportedSourcePrefixes: Object.freeze(["green:", "leisure:", "natural:"]),
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    contextualWorldFillVersion: state.contextualWorldFillVersion,
    registeredContextRuleCount: state.registeredContextRuleCount,
    contextRuleId: state.contextRuleId,
    worldFillCategory: state.worldFillCategory,
    generatedSubRecipeCount: state.generatedSubRecipeCount,
    childPlacementCount: state.childPlacementCount,
    contextReason: state.contextReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
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

function hashFraction(seed) {
  const slice = hashString(seed).slice(0, 13);
  const numerator = Number.parseInt(slice, 16);
  const denominator = 0x1fffffffffffff;
  return denominator === 0 ? 0 : numerator / denominator;
}

function normalizeCoordinate(value, reasonCode = "INVALID_COORDINATE") {
  const latitude = Number(value?.latitude ?? value?.lat);
  const longitude = Number(value?.longitude ?? value?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function normalizeFeature(feature = {}) {
  const featureId = sanitizeString(feature.featureId);
  const featureClass = sanitizeString(feature.featureClass);
  if (!featureId) {
    throw Object.assign(new Error("MISSING_FEATURE_ID"), {
      reasonCode: "MISSING_FEATURE_ID"
    });
  }
  if (!featureClass) {
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }
  return deepFreeze({
    featureId,
    featureClass,
    coordinate: normalizeCoordinate(
      feature.coordinate ?? feature.centroid,
      "INVALID_FEATURE_COORDINATE"
    ),
    area:
      feature.area == null || !Number.isFinite(Number(feature.area))
        ? null
        : Number(feature.area),
    footprintScalars:
      feature.footprintScalars &&
      Number.isFinite(Number(feature.footprintScalars.width)) &&
      Number.isFinite(Number(feature.footprintScalars.height))
        ? deepFreeze({
            width: Number(feature.footprintScalars.width),
            height: Number(feature.footprintScalars.height)
          })
        : null,
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId,
    sourceClassification: sanitizeString(feature.sourceClassification)
  });
}

function normalizePlacement(placement = {}) {
  return deepFreeze({
    assetId: sanitizeString(placement.assetId),
    assetVersion: sanitizeString(placement.assetVersion),
    candidateIndex: Number(placement.candidateIndex ?? 0),
    coordinate: normalizeCoordinate(placement.coordinate, "INVALID_PLACEMENT_COORDINATE"),
    placementKind: sanitizeString(placement.placementKind) ?? "unknown",
    deterministicPlacementSeed:
      sanitizeString(placement.deterministicPlacementSeed) ?? sanitizeString(placement.assetId),
    orientationHintOverride:
      placement.orientationHintOverride == null ||
      !Number.isFinite(Number(placement.orientationHintOverride))
        ? null
        : Number(placement.orientationHintOverride),
    relationshipDiagnostics: placement.relationshipDiagnostics ?? null
  });
}

function validateRule(rule = {}) {
  const contextRuleId = sanitizeString(rule.contextRuleId);
  const worldFillCategory = sanitizeString(rule.worldFillCategory);
  if (!contextRuleId) {
    throw Object.assign(new Error("MISSING_CONTEXT_RULE_ID"), {
      reasonCode: "MISSING_CONTEXT_RULE_ID"
    });
  }
  if (!worldFillCategory) {
    throw Object.assign(new Error("MISSING_WORLD_FILL_CATEGORY"), {
      reasonCode: "MISSING_WORLD_FILL_CATEGORY"
    });
  }
  if (!Array.isArray(rule.supportedFeatureClasses) || rule.supportedFeatureClasses.length === 0) {
    throw Object.assign(new Error("MISSING_SUPPORTED_FEATURE_CLASSES"), {
      reasonCode: "MISSING_SUPPORTED_FEATURE_CLASSES"
    });
  }
  return deepFreeze({
    contextRuleId,
    worldFillCategory,
    supportedFeatureClasses: deepFreeze(rule.supportedFeatureClasses.map(String)),
    supportedSourcePrefixes: Array.isArray(rule.supportedSourcePrefixes)
      ? deepFreeze(rule.supportedSourcePrefixes.map(String))
      : deepFreeze([]),
    status: sanitizeString(rule.status)
  });
}

function offsetCoordinate(coordinate, angleDegrees, distanceMeters) {
  const radians = (Number(angleDegrees) * Math.PI) / 180;
  const eastMeters = Math.cos(radians) * Number(distanceMeters);
  const northMeters = Math.sin(radians) * Number(distanceMeters);
  const latitudeOffset = northMeters / 111320;
  const cosLatitude = Math.cos((coordinate.latitude * Math.PI) / 180);
  const longitudeOffset = eastMeters / (111320 * Math.max(0.2, Math.abs(cosLatitude)));
  return deepFreeze({
    latitude: Number((coordinate.latitude + latitudeOffset).toFixed(6)),
    longitude: Number((coordinate.longitude + longitudeOffset).toFixed(6))
  });
}

function ruleMatchesFeature(rule, feature) {
  if (!rule.supportedFeatureClasses.includes(feature.featureClass)) {
    return false;
  }
  if (!feature.sourceClassification) {
    return rule.worldFillCategory !== "commercial";
  }
  if (rule.worldFillCategory === "commercial") {
    return rule.supportedSourcePrefixes.some((prefix) =>
      feature.sourceClassification.startsWith(prefix)
    );
  }
  if (rule.worldFillCategory === "residential") {
    return !DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULES[1].supportedSourcePrefixes.some(
      (prefix) => feature.sourceClassification.startsWith(prefix)
    );
  }
  return true;
}

function createSubRecipeIds(rule, feature) {
  switch (rule.worldFillCategory) {
    case "residential":
      return [
        "RESIDENTIAL_FRONT_SETBACK_CONTEXT_001",
        "RESIDENTIAL_BACKYARD_GREEN_CONTEXT_001",
        "RESIDENTIAL_BOUNDARY_PLACEHOLDER_CONTEXT_001"
      ];
    case "commercial":
      return [
        "COMMERCIAL_FRONTAGE_CONTEXT_001",
        "COMMERCIAL_OPEN_SPACE_ALLOWANCE_CONTEXT_001"
      ];
    case "civic":
      return [
        "CIVIC_OPEN_SURROUND_CONTEXT_001",
        "CIVIC_VEGETATION_EDGE_CONTEXT_001"
      ];
    case "park":
      return [
        "PARK_EDGE_PLANTING_CONTEXT_001",
        "PARK_OPEN_AREA_PRESERVATION_CONTEXT_001"
      ];
    case "coastal":
      return [
        "COASTAL_SHRUB_TRANSITION_CONTEXT_001",
        "COASTAL_REDUCED_TREE_DENSITY_CONTEXT_001"
      ];
    default:
      return [`GENERIC_CONTEXT_${feature.featureClass.toUpperCase()}_001`];
  }
}

function generateResidentialChildPlacements(feature, placements, selectorSeed) {
  const orientationDecision =
    placements.find((entry) => Number.isFinite(Number(entry.orientationHintOverride)))
      ?.orientationHintOverride ?? 180;
  const backyardOffset = Math.max(
    4,
    Number(feature.footprintScalars?.height ?? 18) * 0.45
  );
  return [
    deepFreeze({
      assetId: "SHRUB_COASTAL_LOW_001",
      assetVersion: "v002",
      candidateIndex: 100,
      coordinate: offsetCoordinate(
        feature.coordinate,
        Number(orientationDecision) + 180,
        backyardOffset
      ),
      placementKind: "backyard_vegetation_context",
      deterministicPlacementSeed: `${selectorSeed}:${feature.deterministicFeatureIdentity}:residential_backyard_shrub`,
      orientationHintOverride: null,
      relationshipDiagnostics: null,
      contextualWorldFillSource: "residential_backyard"
    })
  ];
}

function generateCoastalChildPlacements(feature, placements, selectorSeed) {
  const shrubCount = placements.filter(
    (entry) => entry.assetId === "SHRUB_COASTAL_LOW_001"
  ).length;
  if (shrubCount >= 2 || Number(feature.area ?? 0) < 120) {
    return [];
  }
  return [
    deepFreeze({
      assetId: "SHRUB_COASTAL_LOW_001",
      assetVersion: "v002",
      candidateIndex: 200,
      coordinate: offsetCoordinate(
        feature.coordinate,
        hashFraction(`${selectorSeed}:${feature.deterministicFeatureIdentity}:coastal_shrub_angle`) * 360,
        4.5
      ),
      placementKind: "coastal_transition_context",
      deterministicPlacementSeed: `${selectorSeed}:${feature.deterministicFeatureIdentity}:coastal_transition_shrub`,
      orientationHintOverride: null,
      relationshipDiagnostics: null,
      contextualWorldFillSource: "coastal_transition"
    })
  ];
}

function buildContextPlacements(rule, feature, placements, selectorSeed) {
  switch (rule.worldFillCategory) {
    case "residential":
      return generateResidentialChildPlacements(feature, placements, selectorSeed);
    case "coastal":
      return generateCoastalChildPlacements(feature, placements, selectorSeed);
    default:
      return [];
  }
}

export function createDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry({
  contextualWorldFillVersion =
    DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = {
    contextualWorldFillVersion: sanitizeString(contextualWorldFillVersion),
    registeredContextRuleCount: validatedRules.length,
    contextRuleId: null,
    worldFillCategory: null,
    generatedSubRecipeCount: 0,
    childPlacementCount: 0,
    contextReason: null,
    lastFailureReason: null
  };
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry: true,
    __rules: validatedRules,
    __state: state
  });
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry ||
    !Array.isArray(registry.__rules) ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULE_REGISTRY_UNAVAILABLE"),
      { reasonCode: "ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULE_REGISTRY_UNAVAILABLE" }
    );
  }
  return registry;
}

export function resolveDeveloperOnlyAtlasPopulationContextualWorldFill(
  registry,
  { feature, selectorSeed, placements = [] } = {}
) {
  requireRegistry(registry);
  const state = registry.__state;
  const normalizedFeature = normalizeFeature(feature);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);
  const normalizedPlacements = placements.map(normalizePlacement);

  if (!normalizedSelectorSeed) {
    state.lastFailureReason = "MISSING_SELECTOR_SEED";
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }

  const matchedRule =
    registry.__rules.find((rule) => ruleMatchesFeature(rule, normalizedFeature)) ??
    null;

  if (!matchedRule) {
    state.contextRuleId = null;
    state.worldFillCategory = null;
    state.generatedSubRecipeCount = 0;
    state.childPlacementCount = 0;
    state.contextReason = "NO_CONTEXT_RULE_MATCH";
    state.lastFailureReason = null;
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      contextRuleId: null,
      worldFillCategory: null,
      generatedSubRecipeCount: 0,
      childPlacementCount: 0,
      contextReason: "NO_CONTEXT_RULE_MATCH",
      subRecipeIds: deepFreeze([]),
      placements: deepFreeze(normalizedPlacements),
      childPlacements: deepFreeze([]),
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const subRecipeIds = deepFreeze(createSubRecipeIds(matchedRule, normalizedFeature));
  const childPlacements = deepFreeze(
    buildContextPlacements(
      matchedRule,
      normalizedFeature,
      normalizedPlacements,
      normalizedSelectorSeed
    )
  );
  const combinedPlacements = deepFreeze([
    ...normalizedPlacements,
    ...childPlacements
  ]);

  let contextReason = `${matchedRule.worldFillCategory}_context_established`;
  if (matchedRule.worldFillCategory === "residential") {
    contextReason = "residential_backyard_context";
  } else if (matchedRule.worldFillCategory === "commercial") {
    contextReason = "commercial_frontage_context";
  } else if (matchedRule.worldFillCategory === "civic") {
    contextReason = "civic_open_surround_context";
  } else if (matchedRule.worldFillCategory === "park") {
    contextReason = "park_open_area_preserved";
  } else if (matchedRule.worldFillCategory === "coastal") {
    contextReason = "coastal_shrub_transition_context";
  }

  state.contextRuleId = matchedRule.contextRuleId;
  state.worldFillCategory = matchedRule.worldFillCategory;
  state.generatedSubRecipeCount = subRecipeIds.length;
  state.childPlacementCount = childPlacements.length;
  state.contextReason = contextReason;
  state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    contextRuleId: matchedRule.contextRuleId,
    worldFillCategory: matchedRule.worldFillCategory,
    generatedSubRecipeCount: subRecipeIds.length,
    childPlacementCount: childPlacements.length,
    contextReason,
    subRecipeIds,
    placements: combinedPlacements,
    childPlacements,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function getDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationContextualWorldFillRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      contextualWorldFillVersion: null,
      registeredContextRuleCount: 0,
      contextRuleId: null,
      worldFillCategory: null,
      generatedSubRecipeCount: 0,
      childPlacementCount: 0,
      contextReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_CONTEXTUAL_WORLD_FILL_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}
