const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_VERSION =
  "atlas_population_view_corridor_destination_framing_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RULES =
  Object.freeze([
    Object.freeze({
      viewCorridorId: "VIEW_CORRIDOR_LANDMARK_SIGHTLINE_001",
      approachSequenceId: "APPROACH_SEQUENCE_CIVIC_LANDMARK_001",
      destinationFrameProfileId: "DESTINATION_FRAME_CIVIC_LANDMARK_001",
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      supportedSourcePrefixes: Object.freeze([
        "amenity:community_centre",
        "historic:",
        "building:church"
      ]),
      arrivalReason: "landmark_sightline_and_civic_arrival_sequence",
      visibilityPriority: "landmark_sightline_high",
      status: "approved"
    }),
    Object.freeze({
      viewCorridorId: "VIEW_CORRIDOR_SCENIC_REVEAL_001",
      approachSequenceId: "APPROACH_SEQUENCE_SCENIC_DESTINATION_001",
      destinationFrameProfileId: "DESTINATION_FRAME_SCENIC_REVEAL_001",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park", "reserve"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedSourcePrefixes: Object.freeze(["tourist:", "green:near_coast"]),
      arrivalReason: "scenic_reveal_and_open_visibility_path",
      visibilityPriority: "scenic_reveal_high",
      status: "approved"
    }),
    Object.freeze({
      viewCorridorId: "VIEW_CORRIDOR_BEACH_DESTINATION_001",
      approachSequenceId: "APPROACH_SEQUENCE_BEACH_ARRIVAL_001",
      destinationFrameProfileId: "DESTINATION_FRAME_BEACH_GATHERING_001",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedSourcePrefixes: Object.freeze(["tourist:beach", "tourist:lookout"]),
      arrivalReason: "beach_arrival_signage_path_and_gathering_frame",
      visibilityPriority: "beach_destination_high",
      status: "approved"
    }),
    Object.freeze({
      viewCorridorId: "VIEW_CORRIDOR_SPECIAL_SITE_001",
      approachSequenceId: "APPROACH_SEQUENCE_SPECIAL_SITE_001",
      destinationFrameProfileId: "DESTINATION_FRAME_SPECIAL_SITE_001",
      supportedFeatureClasses: Object.freeze(["building_footprint", "park", "coastal_green"]),
      supportedDistrictTypes: Object.freeze(["mixed_use", "commercial", "coastal_natural"]),
      supportedSourcePrefixes: Object.freeze(["tourist:", "historic:", "amenity:"]),
      arrivalReason: "special_site_discovery_moment_and_destination_framing",
      visibilityPriority: "special_site_medium",
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
    destinationFramingVersion: state.destinationFramingVersion,
    registeredDestinationFramingRuleCount:
      state.registeredDestinationFramingRuleCount,
    viewCorridorId: state.viewCorridorId,
    approachSequenceId: state.approachSequenceId,
    destinationFrameProfileId: state.destinationFrameProfileId,
    arrivalReason: state.arrivalReason,
    visibilityPriority: state.visibilityPriority,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const viewCorridorId = sanitizeString(rule.viewCorridorId);
  const approachSequenceId = sanitizeString(rule.approachSequenceId);
  const destinationFrameProfileId = sanitizeString(
    rule.destinationFrameProfileId
  );
  const arrivalReason = sanitizeString(rule.arrivalReason);
  const visibilityPriority = sanitizeString(rule.visibilityPriority);
  if (!viewCorridorId) {
    throw Object.assign(new Error("MISSING_VIEW_CORRIDOR_ID"), {
      reasonCode: "MISSING_VIEW_CORRIDOR_ID"
    });
  }
  if (!approachSequenceId) {
    throw Object.assign(new Error("MISSING_APPROACH_SEQUENCE_ID"), {
      reasonCode: "MISSING_APPROACH_SEQUENCE_ID"
    });
  }
  if (!destinationFrameProfileId) {
    throw Object.assign(new Error("MISSING_DESTINATION_FRAME_PROFILE_ID"), {
      reasonCode: "MISSING_DESTINATION_FRAME_PROFILE_ID"
    });
  }
  if (!arrivalReason) {
    throw Object.assign(new Error("MISSING_ARRIVAL_REASON"), {
      reasonCode: "MISSING_ARRIVAL_REASON"
    });
  }
  if (!visibilityPriority) {
    throw Object.assign(new Error("MISSING_VISIBILITY_PRIORITY"), {
      reasonCode: "MISSING_VISIBILITY_PRIORITY"
    });
  }
  return deepFreeze({
    viewCorridorId,
    approachSequenceId,
    destinationFrameProfileId,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    supportedSourcePrefixes: deepFreeze((rule.supportedSourcePrefixes ?? []).map(String)),
    arrivalReason,
    visibilityPriority,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    destinationFramingVersion: version,
    registeredDestinationFramingRuleCount: rules.length,
    viewCorridorId: null,
    approachSequenceId: null,
    destinationFrameProfileId: null,
    arrivalReason: null,
    visibilityPriority: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  districtType,
  sourceClassification,
  specialSiteType
) {
  if (specialSiteType === "tourist_special_location") {
    if (sourceClassification?.startsWith("tourist:beach")) {
      return registry.__ruleById.get("VIEW_CORRIDOR_BEACH_DESTINATION_001");
    }
    return registry.__ruleById.get("VIEW_CORRIDOR_SCENIC_REVEAL_001");
  }
  if (specialSiteType === "local_landmark" || specialSiteType === "historic_building") {
    return registry.__ruleById.get("VIEW_CORRIDOR_LANDMARK_SIGHTLINE_001");
  }
  if (districtType === "coastal_natural" || featureClass === "coastal_green") {
    return registry.__ruleById.get("VIEW_CORRIDOR_SCENIC_REVEAL_001");
  }
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedDistrictTypes.includes(districtType) &&
        (rule.supportedSourcePrefixes.length === 0 ||
          rule.supportedSourcePrefixes.some((prefix) =>
            sourceClassification?.startsWith(prefix)
          ))
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.viewCorridorId, rule])),
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      destinationFramingVersion: null,
      registeredDestinationFramingRuleCount: 0,
      viewCorridorId: null,
      approachSequenceId: null,
      destinationFrameProfileId: null,
      arrivalReason: null,
      visibilityPriority: null,
      lastFailureReason:
        "ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationViewCorridorDestinationFraming(
  registry,
  {
    featureClass,
    districtType,
    sourceClassification,
    specialSiteType
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationViewCorridorDestinationFramingRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_VIEW_CORRIDOR_DESTINATION_FRAMING_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedSourceClassification = sanitizeString(sourceClassification);
  const normalizedSpecialSiteType = sanitizeString(specialSiteType);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedDistrictType,
    normalizedSourceClassification,
    normalizedSpecialSiteType
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_VIEW_CORRIDOR_DESTINATION_FRAMING_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      viewCorridorId: null,
      approachSequenceId: null,
      destinationFrameProfileId: null,
      arrivalReason:
        "UNSUPPORTED_VIEW_CORRIDOR_DESTINATION_FRAMING_CONTEXT",
      visibilityPriority: null,
      reasonCode:
        "UNSUPPORTED_VIEW_CORRIDOR_DESTINATION_FRAMING_CONTEXT"
    });
  }

  registry.__state.viewCorridorId = rule.viewCorridorId;
  registry.__state.approachSequenceId = rule.approachSequenceId;
  registry.__state.destinationFrameProfileId = rule.destinationFrameProfileId;
  registry.__state.arrivalReason = rule.arrivalReason;
  registry.__state.visibilityPriority = rule.visibilityPriority;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    viewCorridorId: rule.viewCorridorId,
    approachSequenceId: rule.approachSequenceId,
    destinationFrameProfileId: rule.destinationFrameProfileId,
    arrivalReason: rule.arrivalReason,
    visibilityPriority: rule.visibilityPriority
  });
}
