const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_VERSION =
  "atlas_population_corridor_connectivity_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RULES =
  Object.freeze([
    Object.freeze({
      corridorId: "CORRIDOR_ARTERIAL_001",
      corridorType: "arterial",
      primaryDistrictTypes: Object.freeze(["residential", "commercial", "mixed_use"]),
      movementPriority: "high",
      connectivityReason: "residential_to_commercial_spine",
      status: "approved"
    }),
    Object.freeze({
      corridorId: "CORRIDOR_COLLECTOR_001",
      corridorType: "collector",
      primaryDistrictTypes: Object.freeze(["residential", "civic", "mixed_use"]),
      movementPriority: "medium_high",
      connectivityReason: "district_collector_connection",
      status: "approved"
    }),
    Object.freeze({
      corridorId: "CORRIDOR_LOCAL_001",
      corridorType: "local",
      primaryDistrictTypes: Object.freeze(["residential", "mixed_use"]),
      movementPriority: "medium",
      connectivityReason: "local_block_access",
      status: "approved"
    }),
    Object.freeze({
      corridorId: "CORRIDOR_PEDESTRIAN_001",
      corridorType: "pedestrian",
      primaryDistrictTypes: Object.freeze(["commercial", "recreation", "civic"]),
      movementPriority: "medium",
      connectivityReason: "pedestrian_link_transition",
      status: "approved"
    }),
    Object.freeze({
      corridorId: "CORRIDOR_GREEN_001",
      corridorType: "green_corridor",
      primaryDistrictTypes: Object.freeze(["recreation", "coastal_natural", "residential"]),
      movementPriority: "low_medium",
      connectivityReason: "green_space_transition_link",
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
    corridorConnectivityVersion: state.corridorConnectivityVersion,
    registeredCorridorRuleCount: state.registeredCorridorRuleCount,
    corridorId: state.corridorId,
    corridorType: state.corridorType,
    connectedDistrictIds: deepFreeze([...(state.connectedDistrictIds ?? [])]),
    connectivityReason: state.connectivityReason,
    movementPriority: state.movementPriority,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const corridorId = sanitizeString(rule.corridorId);
  const corridorType = sanitizeString(rule.corridorType);
  if (!corridorId) {
    throw Object.assign(new Error("MISSING_CORRIDOR_ID"), {
      reasonCode: "MISSING_CORRIDOR_ID"
    });
  }
  if (!corridorType) {
    throw Object.assign(new Error("MISSING_CORRIDOR_TYPE"), {
      reasonCode: "MISSING_CORRIDOR_TYPE"
    });
  }
  return deepFreeze({
    corridorId,
    corridorType,
    primaryDistrictTypes: deepFreeze((rule.primaryDistrictTypes ?? []).map(String)),
    movementPriority: sanitizeString(rule.movementPriority),
    connectivityReason: sanitizeString(rule.connectivityReason),
    status: sanitizeString(rule.status)
  });
}

function normalizeFeature(feature = {}) {
  const featureId = sanitizeString(feature.featureId);
  if (!featureId) {
    throw Object.assign(new Error("MISSING_FEATURE_ID"), {
      reasonCode: "MISSING_FEATURE_ID"
    });
  }
  return deepFreeze({
    featureId,
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId
  });
}

function createState(version, rules) {
  return {
    corridorConnectivityVersion: version,
    registeredCorridorRuleCount: rules.length,
    corridorId: null,
    corridorType: null,
    connectedDistrictIds: [],
    connectivityReason: null,
    movementPriority: null,
    lastFailureReason: null
  };
}

function chooseCorridorRule(ruleById, districtType, worldFillCategory, relationshipRoadCount) {
  if (districtType === "coastal_natural") {
    return ruleById.get("CORRIDOR_GREEN_001");
  }
  if (districtType === "recreation") {
    return ruleById.get("CORRIDOR_GREEN_001");
  }
  if (districtType === "civic") {
    return ruleById.get("CORRIDOR_COLLECTOR_001");
  }
  if (districtType === "mixed_use") {
    return ruleById.get("CORRIDOR_ARTERIAL_001");
  }
  if (districtType === "commercial") {
    return worldFillCategory === "commercial"
      ? ruleById.get("CORRIDOR_PEDESTRIAN_001")
      : ruleById.get("CORRIDOR_ARTERIAL_001");
  }
  if (districtType === "residential") {
    if (relationshipRoadCount <= 0) {
      return ruleById.get("CORRIDOR_LOCAL_001");
    }
    return relationshipRoadCount >= 2
      ? ruleById.get("CORRIDOR_COLLECTOR_001")
      : ruleById.get("CORRIDOR_LOCAL_001");
  }
  return null;
}

function buildConnectedDistrictIds({
  districtId,
  districtType,
  districtTransitionReason
}) {
  const connected = [districtId];
  if (districtTransitionReason === "residential_to_commercial") {
    connected.push("DISTRICT_COMMERCIAL_001");
  } else if (districtTransitionReason === "residential_to_park") {
    connected.push("DISTRICT_RECREATION_001");
  } else if (districtTransitionReason === "coastal_to_settlement_edge") {
    connected.push("DISTRICT_RESIDENTIAL_001");
  } else if (districtType === "mixed_use") {
    connected.push("DISTRICT_RESIDENTIAL_001", "DISTRICT_COMMERCIAL_001");
  } else if (districtType === "civic") {
    connected.push("DISTRICT_RECREATION_001");
  }
  return Array.from(new Set(connected));
}

export function createDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = createState(version, validatedRules);
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.corridorId, rule])),
    __state: state
  });
}

export function getDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      corridorConnectivityVersion: null,
      registeredCorridorRuleCount: 0,
      corridorId: null,
      corridorType: null,
      connectedDistrictIds: [],
      connectivityReason: null,
      movementPriority: null,
      lastFailureReason:
        "ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationCorridorConnectivity(
  registry,
  {
    feature,
    selectorSeed,
    districtId,
    districtType,
    districtTransitionReason,
    worldFillCategory,
    relationshipContext
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationCorridorConnectivityRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_CORRIDOR_CONNECTIVITY_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeature = normalizeFeature(feature);
  const normalizedDistrictId = sanitizeString(districtId);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedTransitionReason = sanitizeString(districtTransitionReason);
  const normalizedWorldFillCategory = sanitizeString(worldFillCategory);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);

  if (!normalizedDistrictId) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_ID";
    throw Object.assign(new Error("MISSING_DISTRICT_ID"), {
      reasonCode: "MISSING_DISTRICT_ID"
    });
  }
  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }

  const roadWays = Array.isArray(relationshipContext?.roadWays)
    ? relationshipContext.roadWays
    : [];
  const corridorRule = chooseCorridorRule(
    registry.__ruleById,
    normalizedDistrictType,
    normalizedWorldFillCategory,
    roadWays.length
  );

  if (!corridorRule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_CORRIDOR_CONNECTIVITY_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      corridorId: null,
      corridorType: null,
      connectedDistrictIds: deepFreeze([]),
      connectivityReason: "UNSUPPORTED_CORRIDOR_CONNECTIVITY_CONTEXT",
      movementPriority: null,
      reasonCode: "UNSUPPORTED_CORRIDOR_CONNECTIVITY_CONTEXT"
    });
  }

  const connectedDistrictIds = buildConnectedDistrictIds({
    districtId: normalizedDistrictId,
    districtType: normalizedDistrictType,
    districtTransitionReason: normalizedTransitionReason
  });
  const connectivitySeed = hashString(
    [
      normalizedSelectorSeed ?? "CORRIDOR_SELECTOR",
      normalizedFeature.deterministicFeatureIdentity,
      normalizedDistrictId,
      corridorRule.corridorId
    ].join(":")
  ).slice(0, 16);
  const connectivityReason =
    normalizedTransitionReason || corridorRule.connectivityReason;

  registry.__state.corridorId = corridorRule.corridorId;
  registry.__state.corridorType = corridorRule.corridorType;
  registry.__state.connectedDistrictIds = connectedDistrictIds;
  registry.__state.connectivityReason = connectivityReason;
  registry.__state.movementPriority = corridorRule.movementPriority;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    corridorId: corridorRule.corridorId,
    corridorType: corridorRule.corridorType,
    connectedDistrictIds: deepFreeze(connectedDistrictIds),
    connectivityReason,
    movementPriority: corridorRule.movementPriority,
    connectivitySeed
  });
}
