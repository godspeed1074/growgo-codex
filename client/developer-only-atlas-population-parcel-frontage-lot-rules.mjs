const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_VERSION =
  "atlas_population_parcel_frontage_lot_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RULES =
  Object.freeze([
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_STANDALONE_LOT_001",
      lotType: "standalone_lot",
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      setbackDistance: 8,
      boundaryPattern: "future_fence_or_hedge_edge",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_CORNER_LOT_001",
      lotType: "corner_lot",
      supportedDistrictTypes: Object.freeze(["residential", "mixed_use"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      setbackDistance: 6,
      boundaryPattern: "future_corner_gate_and_hedge",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_TOWNHOUSE_ROW_001",
      lotType: "townhouse_row",
      supportedDistrictTypes: Object.freeze(["residential", "mixed_use"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      setbackDistance: 4,
      boundaryPattern: "future_shared_wall_and_fence",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_ATTACHED_TERRACED_001",
      lotType: "attached_terraced_lot",
      supportedDistrictTypes: Object.freeze(["mixed_use", "commercial"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      setbackDistance: 2,
      boundaryPattern: "future_terraced_wall_and_service_lane",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_RURAL_BLOCK_001",
      lotType: "rural_block",
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "reserve",
        "park"
      ]),
      setbackDistance: 12,
      boundaryPattern: "future_gate_and_hedge_buffer",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_COMMERCIAL_FRONTAGE_001",
      lotType: "shopfront_lot",
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      setbackDistance: 1,
      boundaryPattern: "future_service_edge_and_rear_wall",
      status: "approved"
    }),
    Object.freeze({
      parcelPatternId: "PARCEL_PATTERN_CIVIC_FORECOURT_001",
      lotType: "civic_forecourt_lot",
      supportedDistrictTypes: Object.freeze(["civic"]),
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      setbackDistance: 10,
      boundaryPattern: "future_open_entry_and_forecourt_edge",
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
    parcelFrontageLotVersion: state.parcelFrontageLotVersion,
    registeredParcelRuleCount: state.registeredParcelRuleCount,
    parcelPatternId: state.parcelPatternId,
    lotType: state.lotType,
    frontageDirection: state.frontageDirection,
    frontageRoadId: state.frontageRoadId,
    setbackDistance: state.setbackDistance,
    boundaryPattern: state.boundaryPattern,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
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
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId,
    sourceClassification: sanitizeString(feature.sourceClassification),
    coordinate: feature.coordinate
      ? deepFreeze({
          latitude: Number(feature.coordinate.latitude),
          longitude: Number(feature.coordinate.longitude)
        })
      : null
  });
}

function validateRule(rule = {}) {
  const parcelPatternId = sanitizeString(rule.parcelPatternId);
  const lotType = sanitizeString(rule.lotType);
  if (!parcelPatternId) {
    throw Object.assign(new Error("MISSING_PARCEL_PATTERN_ID"), {
      reasonCode: "MISSING_PARCEL_PATTERN_ID"
    });
  }
  if (!lotType) {
    throw Object.assign(new Error("MISSING_LOT_TYPE"), {
      reasonCode: "MISSING_LOT_TYPE"
    });
  }
  return deepFreeze({
    parcelPatternId,
    lotType,
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    setbackDistance: Number(rule.setbackDistance ?? 0),
    boundaryPattern: sanitizeString(rule.boundaryPattern),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    parcelFrontageLotVersion: version,
    registeredParcelRuleCount: rules.length,
    parcelPatternId: null,
    lotType: null,
    frontageDirection: null,
    frontageRoadId: null,
    setbackDistance: null,
    boundaryPattern: null,
    lastFailureReason: null
  };
}

function determineFrontageDirection({
  sourceClassification,
  lotType,
  corridorType,
  orientationHint
}) {
  if (sourceClassification?.startsWith("shop:") || lotType === "shopfront_lot") {
    return "road_facing";
  }
  if (lotType === "civic_forecourt_lot") {
    return "entry_forecourt";
  }
  if (corridorType === "green_corridor") {
    return "green_edge";
  }
  if (orientationHint == null) {
    return "street_facing";
  }
  return Number(orientationHint) % 180 === 0 ? "north_south" : "east_west";
}

function chooseRule(registry, feature, districtType, neighborhoodPatternId, sourceClassification) {
  if (neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_TOWNHOUSE_ROW_001") {
    return registry.__ruleById.get("PARCEL_PATTERN_TOWNHOUSE_ROW_001");
  }
  if (districtType === "civic") {
    return registry.__ruleById.get("PARCEL_PATTERN_CIVIC_FORECOURT_001");
  }
  if (districtType === "commercial" || sourceClassification?.startsWith("shop:") || sourceClassification?.startsWith("cafe:")) {
    return registry.__ruleById.get("PARCEL_PATTERN_COMMERCIAL_FRONTAGE_001");
  }
  if (districtType === "coastal_natural" || districtType === "recreation") {
    return registry.__ruleById.get("PARCEL_PATTERN_RURAL_BLOCK_001");
  }
  if (sourceClassification?.startsWith("building:terrace")) {
    return registry.__ruleById.get("PARCEL_PATTERN_ATTACHED_TERRACED_001");
  }
  return registry.__rules.find(
    (rule) =>
      rule.supportedDistrictTypes.includes(districtType) &&
      rule.supportedFeatureClasses.includes(feature.featureClass)
  ) ?? null;
}

function chooseFrontageRoadId(relationshipDiagnostics = {}, corridorType) {
  if (relationshipDiagnostics?.nearestRoadId) {
    return relationshipDiagnostics.nearestRoadId;
  }
  if (corridorType) {
    return `FRONTAGE_${String(corridorType).toUpperCase()}_001`;
  }
  return null;
}

export function createDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = createState(version, validatedRules);
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.parcelPatternId, rule])),
    __state: state
  });
}

export function getDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      parcelFrontageLotVersion: null,
      registeredParcelRuleCount: 0,
      parcelPatternId: null,
      lotType: null,
      frontageDirection: null,
      frontageRoadId: null,
      setbackDistance: null,
      boundaryPattern: null,
      lastFailureReason:
        "ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationParcelFrontageLot(
  registry,
  {
    feature,
    districtType,
    neighborhoodPatternId,
    corridorType,
    relationshipDiagnostics,
    orientationHint
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationParcelFrontageLotRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_PARCEL_FRONTAGE_LOT_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeature = normalizeFeature(feature);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedNeighborhoodPatternId = sanitizeString(neighborhoodPatternId);
  const sourceClassification = normalizedFeature.sourceClassification ?? "";

  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeature,
    normalizedDistrictType,
    normalizedNeighborhoodPatternId,
    sourceClassification
  );

  if (!rule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_PARCEL_LOT_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      parcelPatternId: null,
      lotType: null,
      frontageDirection: null,
      frontageRoadId: null,
      setbackDistance: null,
      boundaryPattern: null,
      reasonCode: "UNSUPPORTED_PARCEL_LOT_CONTEXT"
    });
  }

  const cornerLot = Array.isArray(relationshipDiagnostics?.connectedDistrictIds) &&
    relationshipDiagnostics.connectedDistrictIds.length >= 2 &&
    normalizedDistrictType !== "coastal_natural";
  const selectedRule = cornerLot &&
    rule.lotType === "standalone_lot"
    ? registry.__ruleById.get("PARCEL_PATTERN_CORNER_LOT_001") ?? rule
    : rule;

  const frontageDirection = determineFrontageDirection({
    sourceClassification,
    lotType: selectedRule.lotType,
    corridorType: sanitizeString(corridorType),
    orientationHint
  });
  const frontageRoadId = chooseFrontageRoadId(
    relationshipDiagnostics,
    sanitizeString(corridorType)
  );

  registry.__state.parcelPatternId = selectedRule.parcelPatternId;
  registry.__state.lotType = selectedRule.lotType;
  registry.__state.frontageDirection = frontageDirection;
  registry.__state.frontageRoadId = frontageRoadId;
  registry.__state.setbackDistance = selectedRule.setbackDistance;
  registry.__state.boundaryPattern = selectedRule.boundaryPattern;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    parcelPatternId: selectedRule.parcelPatternId,
    lotType: selectedRule.lotType,
    frontageDirection,
    frontageRoadId,
    setbackDistance: selectedRule.setbackDistance,
    boundaryPattern: selectedRule.boundaryPattern
  });
}
