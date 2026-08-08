const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_VERSION =
  "atlas_population_streetscape_verge_edge_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RULES =
  Object.freeze([
    Object.freeze({
      streetscapeProfileId: "STREETSCAPE_PROFILE_SUBURBAN_001",
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedCorridorTypes: Object.freeze(["local", "collector"]),
      vergeType: "grass_verge",
      edgeConditionType: "fence_placeholder",
      streetFurnitureProfile: "suburban_placeholder_furniture_band",
      streetscapeReason: "suburban_front_garden_character",
      status: "approved"
    }),
    Object.freeze({
      streetscapeProfileId: "STREETSCAPE_PROFILE_RURAL_001",
      supportedDistrictTypes: Object.freeze(["recreation"]),
      supportedCorridorTypes: Object.freeze(["local", "green_corridor"]),
      vergeType: "natural_edge",
      edgeConditionType: "open_boundary",
      streetFurnitureProfile: "rural_placeholder_edge_markers",
      streetscapeReason: "rural_open_verge_transition",
      status: "approved"
    }),
    Object.freeze({
      streetscapeProfileId: "STREETSCAPE_PROFILE_COASTAL_001",
      supportedDistrictTypes: Object.freeze(["coastal_natural"]),
      supportedCorridorTypes: Object.freeze(["green_corridor"]),
      vergeType: "native_verge",
      edgeConditionType: "hedge_placeholder",
      streetFurnitureProfile: "coastal_placeholder_buffer_markers",
      streetscapeReason: "coastal_buffer_and_native_edge",
      status: "approved"
    }),
    Object.freeze({
      streetscapeProfileId: "STREETSCAPE_PROFILE_TOWN_CENTER_001",
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use"]),
      supportedCorridorTypes: Object.freeze(["arterial", "pedestrian"]),
      vergeType: "urban_footpath_edge",
      edgeConditionType: "wall_placeholder",
      streetFurnitureProfile: "town_center_placeholder_furniture_line",
      streetscapeReason: "shopfront_alignment_and_pedestrian_edge",
      status: "approved"
    }),
    Object.freeze({
      streetscapeProfileId: "STREETSCAPE_PROFILE_INDUSTRIAL_001",
      supportedDistrictTypes: Object.freeze(["civic"]),
      supportedCorridorTypes: Object.freeze(["collector", "arterial"]),
      vergeType: "grass_verge",
      edgeConditionType: "open_boundary",
      streetFurnitureProfile: "civic_service_placeholder_zone",
      streetscapeReason: "civic_forecourt_and_service_edge",
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
    streetscapeVersion: state.streetscapeVersion,
    registeredStreetscapeRuleCount: state.registeredStreetscapeRuleCount,
    streetscapeProfileId: state.streetscapeProfileId,
    vergeType: state.vergeType,
    edgeConditionType: state.edgeConditionType,
    streetFurnitureProfile: state.streetFurnitureProfile,
    streetscapeReason: state.streetscapeReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const streetscapeProfileId = sanitizeString(rule.streetscapeProfileId);
  if (!streetscapeProfileId) {
    throw Object.assign(new Error("MISSING_STREETSCAPE_PROFILE_ID"), {
      reasonCode: "MISSING_STREETSCAPE_PROFILE_ID"
    });
  }
  return deepFreeze({
    streetscapeProfileId,
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    supportedCorridorTypes: deepFreeze((rule.supportedCorridorTypes ?? []).map(String)),
    vergeType: sanitizeString(rule.vergeType),
    edgeConditionType: sanitizeString(rule.edgeConditionType),
    streetFurnitureProfile: sanitizeString(rule.streetFurnitureProfile),
    streetscapeReason: sanitizeString(rule.streetscapeReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    streetscapeVersion: version,
    registeredStreetscapeRuleCount: rules.length,
    streetscapeProfileId: null,
    vergeType: null,
    edgeConditionType: null,
    streetFurnitureProfile: null,
    streetscapeReason: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, districtType, corridorType, parcelPatternId) {
  if (districtType === "coastal_natural") {
    return registry.__ruleById.get("STREETSCAPE_PROFILE_COASTAL_001");
  }
  if (parcelPatternId === "PARCEL_PATTERN_RURAL_BLOCK_001") {
    return registry.__ruleById.get("STREETSCAPE_PROFILE_RURAL_001");
  }
  if (districtType === "commercial" || districtType === "mixed_use") {
    return registry.__ruleById.get("STREETSCAPE_PROFILE_TOWN_CENTER_001");
  }
  if (districtType === "civic") {
    return registry.__ruleById.get("STREETSCAPE_PROFILE_INDUSTRIAL_001");
  }
  return registry.__rules.find(
    (rule) =>
      rule.supportedDistrictTypes.includes(districtType) &&
      rule.supportedCorridorTypes.includes(corridorType)
  ) ?? null;
}

export function createDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = createState(version, validatedRules);
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(
      validatedRules.map((rule) => [rule.streetscapeProfileId, rule])
    ),
    __state: state
  });
}

export function getDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      streetscapeVersion: null,
      registeredStreetscapeRuleCount: 0,
      streetscapeProfileId: null,
      vergeType: null,
      edgeConditionType: null,
      streetFurnitureProfile: null,
      streetscapeReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationStreetscapeVergeEdge(
  registry,
  { districtType, corridorType, parcelPatternId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationStreetscapeVergeEdgeRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_STREETSCAPE_VERGE_EDGE_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedCorridorType = sanitizeString(corridorType);
  const normalizedParcelPatternId = sanitizeString(parcelPatternId);

  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }
  if (!normalizedCorridorType) {
    registry.__state.lastFailureReason = "MISSING_CORRIDOR_TYPE";
    throw Object.assign(new Error("MISSING_CORRIDOR_TYPE"), {
      reasonCode: "MISSING_CORRIDOR_TYPE"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedDistrictType,
    normalizedCorridorType,
    normalizedParcelPatternId
  );

  if (!rule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_STREETSCAPE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      streetscapeProfileId: null,
      vergeType: null,
      edgeConditionType: null,
      streetFurnitureProfile: null,
      streetscapeReason: "UNSUPPORTED_STREETSCAPE_CONTEXT",
      reasonCode: "UNSUPPORTED_STREETSCAPE_CONTEXT"
    });
  }

  registry.__state.streetscapeProfileId = rule.streetscapeProfileId;
  registry.__state.vergeType = rule.vergeType;
  registry.__state.edgeConditionType = rule.edgeConditionType;
  registry.__state.streetFurnitureProfile = rule.streetFurnitureProfile;
  registry.__state.streetscapeReason = rule.streetscapeReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    streetscapeProfileId: rule.streetscapeProfileId,
    vergeType: rule.vergeType,
    edgeConditionType: rule.edgeConditionType,
    streetFurnitureProfile: rule.streetFurnitureProfile,
    streetscapeReason: rule.streetscapeReason
  });
}
