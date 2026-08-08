const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_VERSION =
  "atlas_population_micro_cluster_adjacency_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "MICRO_CLUSTER_RULE_RESIDENTIAL_001",
      clusterType: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001",
        "ASSET_FAMILY_RESIDENTIAL_RURAL_001"
      ]),
      childAssetTemplates: Object.freeze([
        "CHILD_FENCE_PLACEHOLDER_001",
        "CHILD_GARDEN_VEGETATION_CLUSTER_001",
        "CHILD_FRONTAGE_PATH_PLACEHOLDER_001"
      ]),
      adjacencyReason: "residential_building_frontage_and_boundary_cluster",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MICRO_CLUSTER_RULE_COASTAL_001",
      clusterType: "coastal",
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "building_footprint"
      ]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "mixed_use"]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001",
        "ASSET_FAMILY_RESIDENTIAL_RURAL_001"
      ]),
      childAssetTemplates: Object.freeze([
        "CHILD_NATIVE_PLANTING_CLUSTER_001",
        "CHILD_COASTAL_BUFFER_EDGE_001",
        "CHILD_WIND_SHELTER_VEGETATION_001"
      ]),
      adjacencyReason: "coastal_buffer_and_native_planting_cluster",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MICRO_CLUSTER_RULE_COMMERCIAL_001",
      clusterType: "commercial",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use"]),
      supportedAssetFamilyIds: Object.freeze(["ASSET_FAMILY_COMMERCIAL_URBAN_001"]),
      childAssetTemplates: Object.freeze([
        "CHILD_FRONTAGE_PLANTER_PLACEHOLDER_001",
        "CHILD_ENTRY_MARKER_PLACEHOLDER_001"
      ]),
      adjacencyReason: "commercial_frontage_and_entry_cluster",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MICRO_CLUSTER_RULE_CIVIC_001",
      clusterType: "civic",
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_CIVIC_HERITAGE_001"
      ]),
      childAssetTemplates: Object.freeze([
        "CHILD_FOREGROUND_LANDSCAPE_CLUSTER_001",
        "CHILD_APPROACH_OPEN_SPACE_EDGE_001",
        "CHILD_CIVIC_ENTRY_MARKER_001"
      ]),
      adjacencyReason: "civic_foreground_and_landscape_cluster",
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

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
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
    microClusterAdjacencyVersion: state.microClusterAdjacencyVersion,
    registeredMicroClusterRuleCount: state.registeredMicroClusterRuleCount,
    microClusterId: state.microClusterId,
    clusterType: state.clusterType,
    childAssetCount: state.childAssetCount,
    adjacencyReason: state.adjacencyReason,
    variationSeed: state.variationSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const clusterType = sanitizeString(rule.clusterType);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_MICRO_CLUSTER_RULE_ID"), {
      reasonCode: "MISSING_MICRO_CLUSTER_RULE_ID"
    });
  }
  if (!clusterType) {
    throw Object.assign(new Error("MISSING_CLUSTER_TYPE"), {
      reasonCode: "MISSING_CLUSTER_TYPE"
    });
  }
  return deepFreeze({
    ruleId,
    clusterType,
    supportedFeatureClasses: deepFreeze(
      (rule.supportedFeatureClasses ?? []).map(String)
    ),
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    supportedAssetFamilyIds: deepFreeze(
      (rule.supportedAssetFamilyIds ?? []).map(String)
    ),
    childAssetTemplates: deepFreeze((rule.childAssetTemplates ?? []).map(String)),
    adjacencyReason: sanitizeString(rule.adjacencyReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    microClusterAdjacencyVersion: version,
    registeredMicroClusterRuleCount: rules.length,
    microClusterId: null,
    clusterType: null,
    childAssetCount: 0,
    adjacencyReason: null,
    variationSeed: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, featureClass, districtType, assetFamilyId) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedDistrictTypes.includes(districtType) &&
        rule.supportedAssetFamilyIds.includes(assetFamilyId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      microClusterAdjacencyVersion: null,
      registeredMicroClusterRuleCount: 0,
      microClusterId: null,
      clusterType: null,
      childAssetCount: 0,
      adjacencyReason: null,
      variationSeed: null,
      lastFailureReason:
        "ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationMicroClusterAdjacency(
  registry,
  {
    featureClass,
    districtType,
    assetFamilyId,
    selectedAssetId,
    selectorSeed,
    deterministicFeatureIdentity,
    coordinate,
    candidateIndex = 0,
    budgetRemaining = 0
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationMicroClusterAdjacencyRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_MICRO_CLUSTER_ADJACENCY_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedAssetFamilyId = sanitizeString(assetFamilyId);
  const normalizedSelectedAssetId = sanitizeString(selectedAssetId);

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
  if (!normalizedAssetFamilyId) {
    registry.__state.lastFailureReason = "MISSING_ASSET_FAMILY_ID";
    throw Object.assign(new Error("MISSING_ASSET_FAMILY_ID"), {
      reasonCode: "MISSING_ASSET_FAMILY_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedDistrictType,
    normalizedAssetFamilyId
  );

  if (!rule) {
    registry.__state.lastFailureReason = "INCOMPATIBLE_MICRO_CLUSTER_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      microClusterId: null,
      clusterType: null,
      childAssetCount: 0,
      adjacencyReason: "INCOMPATIBLE_MICRO_CLUSTER_CONTEXT",
      variationSeed: null,
      childAssetIds: deepFreeze([]),
      reasonCode: "INCOMPATIBLE_MICRO_CLUSTER_CONTEXT"
    });
  }

  const variationSeed = `MICRO_CLUSTER_${hashString(
    stableSerialize({
      featureClass: normalizedFeatureClass,
      districtType: normalizedDistrictType,
      assetFamilyId: normalizedAssetFamilyId,
      selectedAssetId: normalizedSelectedAssetId,
      selectorSeed: sanitizeString(selectorSeed),
      deterministicFeatureIdentity: sanitizeString(deterministicFeatureIdentity),
      coordinate,
      candidateIndex
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  const budgetCap = Math.max(0, Number(budgetRemaining || 0));
  const rawChildren = [...rule.childAssetTemplates];
  const childAssetIds = deepFreeze(
    rawChildren
      .slice(0, Math.min(rawChildren.length, budgetCap > 0 ? budgetCap : rawChildren.length))
      .map((childId, index) =>
        `${childId}:${hashString(
          stableSerialize({
            selectedAssetId: normalizedSelectedAssetId,
            variationSeed,
            index
          })
        )
          .slice(0, 8)
          .toUpperCase()}`
      )
  );

  const microClusterId = `MICRO_CLUSTER_${hashString(
    stableSerialize({
      clusterType: rule.clusterType,
      selectedAssetId: normalizedSelectedAssetId,
      variationSeed
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  registry.__state.microClusterId = microClusterId;
  registry.__state.clusterType = rule.clusterType;
  registry.__state.childAssetCount = childAssetIds.length;
  registry.__state.adjacencyReason = rule.adjacencyReason;
  registry.__state.variationSeed = variationSeed;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    microClusterId,
    clusterType: rule.clusterType,
    childAssetCount: childAssetIds.length,
    adjacencyReason: rule.adjacencyReason,
    variationSeed,
    childAssetIds
  });
}
