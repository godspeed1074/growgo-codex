const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_VERSION =
  "atlas_population_open_space_landmark_framing_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RULES =
  Object.freeze([
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_CIVIC_FOREGROUND_001",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      supportedDistrictTypes: Object.freeze(["civic"]),
      foregroundType: "civic_entry_foreground",
      approachDirection: "entry_axis",
      openSpaceRatio: 0.6,
      visibilityReason: "civic_open_foreground_and_access",
      status: "approved"
    }),
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_SCHOOL_FOREGROUND_001",
      supportedFeatureClasses: Object.freeze(["civic_site"]),
      supportedSourcePrefixes: Object.freeze(["amenity:school", "building:school"]),
      supportedDistrictTypes: Object.freeze(["civic"]),
      foregroundType: "school_entry_foreground",
      approachDirection: "street_approach",
      openSpaceRatio: 0.55,
      visibilityReason: "school_forecourt_and_safe_open_edge",
      status: "approved"
    }),
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_CHURCH_FOREGROUND_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedSourcePrefixes: Object.freeze(["building:church", "amenity:place_of_worship"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      foregroundType: "church_forecourt",
      approachDirection: "ceremonial_approach",
      openSpaceRatio: 0.5,
      visibilityReason: "landmark_building_sightline_preservation",
      status: "approved"
    }),
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_RECREATION_OPEN_SPACE_001",
      supportedFeatureClasses: Object.freeze(["sports_ground", "park"]),
      supportedDistrictTypes: Object.freeze(["recreation", "civic"]),
      foregroundType: "recreation_open_space",
      approachDirection: "path_approach",
      openSpaceRatio: 0.72,
      visibilityReason: "usable_field_and_gathering_space_preserved",
      status: "approved"
    }),
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_SCENIC_POINT_001",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park", "reserve"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      foregroundType: "scenic_open_frame",
      approachDirection: "view_approach",
      openSpaceRatio: 0.78,
      visibilityReason: "open_sightline_and_supporting_landscape",
      status: "approved"
    }),
    Object.freeze({
      landmarkFramingRuleId: "LANDMARK_FRAMING_SPECIAL_LOCATION_001",
      supportedFeatureClasses: Object.freeze(["building_footprint", "park", "coastal_green"]),
      supportedDistrictTypes: Object.freeze(["mixed_use", "commercial", "coastal_natural"]),
      foregroundType: "landmark_supporting_landscape",
      approachDirection: "primary_frontage_approach",
      openSpaceRatio: 0.42,
      visibilityReason: "special_location_visibility_and_supporting_context",
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
    openSpaceLandmarkFramingVersion: state.openSpaceLandmarkFramingVersion,
    registeredLandmarkFramingRuleCount: state.registeredLandmarkFramingRuleCount,
    landmarkFramingRuleId: state.landmarkFramingRuleId,
    foregroundType: state.foregroundType,
    approachDirection: state.approachDirection,
    openSpaceRatio: state.openSpaceRatio,
    visibilityReason: state.visibilityReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const landmarkFramingRuleId = sanitizeString(rule.landmarkFramingRuleId);
  if (!landmarkFramingRuleId) {
    throw Object.assign(new Error("MISSING_LANDMARK_FRAMING_RULE_ID"), {
      reasonCode: "MISSING_LANDMARK_FRAMING_RULE_ID"
    });
  }
  return deepFreeze({
    landmarkFramingRuleId,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedSourcePrefixes: deepFreeze((rule.supportedSourcePrefixes ?? []).map(String)),
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    foregroundType: sanitizeString(rule.foregroundType),
    approachDirection: sanitizeString(rule.approachDirection),
    openSpaceRatio: Number(rule.openSpaceRatio ?? 0),
    visibilityReason: sanitizeString(rule.visibilityReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    openSpaceLandmarkFramingVersion: version,
    registeredLandmarkFramingRuleCount: rules.length,
    landmarkFramingRuleId: null,
    foregroundType: null,
    approachDirection: null,
    openSpaceRatio: null,
    visibilityReason: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, featureClass, sourceClassification, districtType, parcelPatternId) {
  if (sourceClassification?.startsWith("amenity:school") || sourceClassification?.startsWith("building:school")) {
    return registry.__ruleById.get("LANDMARK_FRAMING_SCHOOL_FOREGROUND_001");
  }
  if (sourceClassification?.startsWith("building:church") || sourceClassification?.startsWith("amenity:place_of_worship")) {
    return registry.__ruleById.get("LANDMARK_FRAMING_CHURCH_FOREGROUND_001");
  }
  if (districtType === "civic" && (featureClass === "civic_site" || featureClass === "sports_ground")) {
    return registry.__ruleById.get("LANDMARK_FRAMING_CIVIC_FOREGROUND_001");
  }
  if (featureClass === "sports_ground" || featureClass === "park") {
    return registry.__ruleById.get("LANDMARK_FRAMING_RECREATION_OPEN_SPACE_001");
  }
  if (districtType === "coastal_natural" || featureClass === "coastal_green") {
    return registry.__ruleById.get("LANDMARK_FRAMING_SCENIC_POINT_001");
  }
  if (parcelPatternId === "PARCEL_PATTERN_CIVIC_FORECOURT_001") {
    return registry.__ruleById.get("LANDMARK_FRAMING_CIVIC_FOREGROUND_001");
  }
  return registry.__rules.find(
    (rule) =>
      rule.supportedFeatureClasses.includes(featureClass) &&
      (rule.supportedDistrictTypes.length === 0 ||
        rule.supportedDistrictTypes.includes(districtType))
  ) ?? null;
}

export function createDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.landmarkFramingRuleId, rule])),
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistryStatus(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      openSpaceLandmarkFramingVersion: null,
      registeredLandmarkFramingRuleCount: 0,
      landmarkFramingRuleId: null,
      foregroundType: null,
      approachDirection: null,
      openSpaceRatio: null,
      visibilityReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFraming(
  registry,
  { featureClass, sourceClassification, districtType, parcelPatternId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationOpenSpaceLandmarkFramingRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_OPEN_SPACE_LANDMARK_FRAMING_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedSourceClassification = sanitizeString(sourceClassification);
  const normalizedParcelPatternId = sanitizeString(parcelPatternId);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedSourceClassification,
    normalizedDistrictType,
    normalizedParcelPatternId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_OPEN_SPACE_LANDMARK_FRAMING_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      landmarkFramingRuleId: null,
      foregroundType: null,
      approachDirection: null,
      openSpaceRatio: null,
      visibilityReason: "UNSUPPORTED_OPEN_SPACE_LANDMARK_FRAMING_CONTEXT",
      reasonCode: "UNSUPPORTED_OPEN_SPACE_LANDMARK_FRAMING_CONTEXT"
    });
  }

  registry.__state.landmarkFramingRuleId = rule.landmarkFramingRuleId;
  registry.__state.foregroundType = rule.foregroundType;
  registry.__state.approachDirection = rule.approachDirection;
  registry.__state.openSpaceRatio = rule.openSpaceRatio;
  registry.__state.visibilityReason = rule.visibilityReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    landmarkFramingRuleId: rule.landmarkFramingRuleId,
    foregroundType: rule.foregroundType,
    approachDirection: rule.approachDirection,
    openSpaceRatio: rule.openSpaceRatio,
    visibilityReason: rule.visibilityReason
  });
}
