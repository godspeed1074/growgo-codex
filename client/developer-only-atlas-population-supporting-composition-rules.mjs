const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_VERSION =
  "atlas_population_supporting_composition_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "SUPPORTING_COMPOSITION_RULE_RESIDENTIAL_001",
      supportedDistrictTypes: Object.freeze(["residential"]),
      supportedClusterTypes: Object.freeze(["residential"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportingPropProfileId: "SUPPORTING_PROP_PROFILE_RESIDENTIAL_001",
      boundaryCompositionId: "BOUNDARY_COMPOSITION_RESIDENTIAL_001",
      entryCompositionId: "ENTRY_COMPOSITION_RESIDENTIAL_001",
      propDensityTier: "residential_medium",
      compositionReason: "residential_boundary_entry_and_mailbox_profile",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SUPPORTING_COMPOSITION_RULE_COMMERCIAL_001",
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use"]),
      supportedClusterTypes: Object.freeze(["commercial"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportingPropProfileId: "SUPPORTING_PROP_PROFILE_COMMERCIAL_001",
      boundaryCompositionId: "BOUNDARY_COMPOSITION_COMMERCIAL_001",
      entryCompositionId: "ENTRY_COMPOSITION_COMMERCIAL_001",
      propDensityTier: "commercial_high",
      compositionReason: "commercial_frontage_benches_planters_and_signs",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SUPPORTING_COMPOSITION_RULE_CIVIC_001",
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      supportedClusterTypes: Object.freeze(["civic"]),
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      supportingPropProfileId: "SUPPORTING_PROP_PROFILE_CIVIC_001",
      boundaryCompositionId: "BOUNDARY_COMPOSITION_CIVIC_001",
      entryCompositionId: "ENTRY_COMPOSITION_CIVIC_001",
      propDensityTier: "civic_medium",
      compositionReason: "civic_forecourt_lamps_paths_and_boundary_profile",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SUPPORTING_COMPOSITION_RULE_PEDESTRIAN_001",
      supportedDistrictTypes: Object.freeze(["commercial", "civic", "mixed_use"]),
      supportedClusterTypes: Object.freeze(["commercial", "civic"]),
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      supportingPropProfileId: "SUPPORTING_PROP_PROFILE_PEDESTRIAN_001",
      boundaryCompositionId: "BOUNDARY_COMPOSITION_OPEN_EDGE_001",
      entryCompositionId: "ENTRY_COMPOSITION_PEDESTRIAN_001",
      propDensityTier: "pedestrian_high",
      compositionReason: "pedestrian_priority_sign_bench_planter_profile",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SUPPORTING_COMPOSITION_RULE_COASTAL_001",
      supportedDistrictTypes: Object.freeze(["coastal_natural", "mixed_use"]),
      supportedClusterTypes: Object.freeze(["coastal"]),
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "building_footprint"
      ]),
      supportingPropProfileId: "SUPPORTING_PROP_PROFILE_COASTAL_001",
      boundaryCompositionId: "BOUNDARY_COMPOSITION_COASTAL_001",
      entryCompositionId: "ENTRY_COMPOSITION_COASTAL_001",
      propDensityTier: "coastal_low",
      compositionReason: "coastal_buffer_fence_gate_and_path_profile",
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
    supportingCompositionVersion: state.supportingCompositionVersion,
    registeredSupportingCompositionRuleCount:
      state.registeredSupportingCompositionRuleCount,
    supportingPropProfileId: state.supportingPropProfileId,
    boundaryCompositionId: state.boundaryCompositionId,
    entryCompositionId: state.entryCompositionId,
    propDensityTier: state.propDensityTier,
    compositionReason: state.compositionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const supportingPropProfileId = sanitizeString(rule.supportingPropProfileId);
  const boundaryCompositionId = sanitizeString(rule.boundaryCompositionId);
  const entryCompositionId = sanitizeString(rule.entryCompositionId);
  const propDensityTier = sanitizeString(rule.propDensityTier);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_SUPPORTING_COMPOSITION_RULE_ID"), {
      reasonCode: "MISSING_SUPPORTING_COMPOSITION_RULE_ID"
    });
  }
  if (!supportingPropProfileId) {
    throw Object.assign(new Error("MISSING_SUPPORTING_PROP_PROFILE_ID"), {
      reasonCode: "MISSING_SUPPORTING_PROP_PROFILE_ID"
    });
  }
  if (!boundaryCompositionId) {
    throw Object.assign(new Error("MISSING_BOUNDARY_COMPOSITION_ID"), {
      reasonCode: "MISSING_BOUNDARY_COMPOSITION_ID"
    });
  }
  if (!entryCompositionId) {
    throw Object.assign(new Error("MISSING_ENTRY_COMPOSITION_ID"), {
      reasonCode: "MISSING_ENTRY_COMPOSITION_ID"
    });
  }
  if (!propDensityTier) {
    throw Object.assign(new Error("MISSING_PROP_DENSITY_TIER"), {
      reasonCode: "MISSING_PROP_DENSITY_TIER"
    });
  }
  return deepFreeze({
    ruleId,
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    supportedClusterTypes: deepFreeze(
      (rule.supportedClusterTypes ?? []).map(String)
    ),
    supportedFeatureClasses: deepFreeze(
      (rule.supportedFeatureClasses ?? []).map(String)
    ),
    supportingPropProfileId,
    boundaryCompositionId,
    entryCompositionId,
    propDensityTier,
    compositionReason: sanitizeString(rule.compositionReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    supportingCompositionVersion: version,
    registeredSupportingCompositionRuleCount: rules.length,
    supportingPropProfileId: null,
    boundaryCompositionId: null,
    entryCompositionId: null,
    propDensityTier: null,
    compositionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, districtType, clusterType, featureClass) {
  const matches = registry.__rules.filter(
    (rule) =>
      rule.supportedDistrictTypes.includes(districtType) &&
      rule.supportedClusterTypes.includes(clusterType) &&
      rule.supportedFeatureClasses.includes(featureClass)
  );

  if (matches.length === 0) {
    return null;
  }

  return (
    matches.sort((left, right) => {
      const leftPedestrianPriority =
        districtType === "mixed_use" && left.propDensityTier === "pedestrian_high"
          ? 1
          : 0;
      const rightPedestrianPriority =
        districtType === "mixed_use" && right.propDensityTier === "pedestrian_high"
          ? 1
          : 0;
      return rightPedestrianPriority - leftPedestrianPriority;
    })[0] ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SUPPORTING_COMPOSITION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      supportingCompositionVersion: null,
      registeredSupportingCompositionRuleCount: 0,
      supportingPropProfileId: null,
      boundaryCompositionId: null,
      entryCompositionId: null,
      propDensityTier: null,
      compositionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_SUPPORTING_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSupportingComposition(
  registry,
  {
    districtType,
    clusterType,
    featureClass
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSupportingCompositionRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_SUPPORTING_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_SUPPORTING_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedClusterType = sanitizeString(clusterType);
  const normalizedFeatureClass = sanitizeString(featureClass);

  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }
  if (!normalizedClusterType) {
    registry.__state.lastFailureReason = "MISSING_CLUSTER_TYPE";
    throw Object.assign(new Error("MISSING_CLUSTER_TYPE"), {
      reasonCode: "MISSING_CLUSTER_TYPE"
    });
  }
  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedDistrictType,
    normalizedClusterType,
    normalizedFeatureClass
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "INCOMPATIBLE_SUPPORTING_COMPOSITION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      supportingPropProfileId: null,
      boundaryCompositionId: null,
      entryCompositionId: null,
      propDensityTier: null,
      compositionReason: "INCOMPATIBLE_SUPPORTING_COMPOSITION_CONTEXT",
      reasonCode: "INCOMPATIBLE_SUPPORTING_COMPOSITION_CONTEXT"
    });
  }

  registry.__state.supportingPropProfileId = rule.supportingPropProfileId;
  registry.__state.boundaryCompositionId = rule.boundaryCompositionId;
  registry.__state.entryCompositionId = rule.entryCompositionId;
  registry.__state.propDensityTier = rule.propDensityTier;
  registry.__state.compositionReason = rule.compositionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    supportingPropProfileId: rule.supportingPropProfileId,
    boundaryCompositionId: rule.boundaryCompositionId,
    entryCompositionId: rule.entryCompositionId,
    propDensityTier: rule.propDensityTier,
    compositionReason: rule.compositionReason
  });
}
