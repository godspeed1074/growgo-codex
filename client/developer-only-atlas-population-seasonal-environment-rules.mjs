const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_VERSION =
  "atlas_population_seasonal_environment_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RULES =
  Object.freeze([
    Object.freeze({
      seasonProfileId: "SEASON_PROFILE_SPRING_001",
      supportedSeasonKeys: Object.freeze(["spring"]),
      defaultSeasonalBlendWeights: Object.freeze({
        spring: 0.7,
        summer: 0.15,
        autumn: 0.1,
        winter: 0.05
      }),
      status: "approved"
    }),
    Object.freeze({
      seasonProfileId: "SEASON_PROFILE_SUMMER_001",
      supportedSeasonKeys: Object.freeze(["summer"]),
      defaultSeasonalBlendWeights: Object.freeze({
        spring: 0.1,
        summer: 0.75,
        autumn: 0.1,
        winter: 0.05
      }),
      status: "approved"
    }),
    Object.freeze({
      seasonProfileId: "SEASON_PROFILE_AUTUMN_001",
      supportedSeasonKeys: Object.freeze(["autumn"]),
      defaultSeasonalBlendWeights: Object.freeze({
        spring: 0.05,
        summer: 0.15,
        autumn: 0.7,
        winter: 0.1
      }),
      status: "approved"
    }),
    Object.freeze({
      seasonProfileId: "SEASON_PROFILE_WINTER_001",
      supportedSeasonKeys: Object.freeze(["winter"]),
      defaultSeasonalBlendWeights: Object.freeze({
        spring: 0.05,
        summer: 0.05,
        autumn: 0.15,
        winter: 0.75
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
    seasonalEnvironmentVersion: state.seasonalEnvironmentVersion,
    registeredSeasonRuleCount: state.registeredSeasonRuleCount,
    seasonProfileId: state.seasonProfileId,
    environmentStateId: state.environmentStateId,
    seasonalBlendWeights: deepFreeze({ ...(state.seasonalBlendWeights ?? {}) }),
    environmentReason: state.environmentReason,
    seasonSeed: state.seasonSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const seasonProfileId = sanitizeString(rule.seasonProfileId);
  if (!seasonProfileId) {
    throw Object.assign(new Error("MISSING_SEASON_PROFILE_ID"), {
      reasonCode: "MISSING_SEASON_PROFILE_ID"
    });
  }
  return deepFreeze({
    seasonProfileId,
    supportedSeasonKeys: deepFreeze((rule.supportedSeasonKeys ?? []).map(String)),
    defaultSeasonalBlendWeights: deepFreeze({
      ...(rule.defaultSeasonalBlendWeights ?? {})
    }),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    seasonalEnvironmentVersion: version,
    registeredSeasonRuleCount: rules.length,
    seasonProfileId: null,
    environmentStateId: null,
    seasonalBlendWeights: null,
    environmentReason: null,
    seasonSeed: null,
    lastFailureReason: null
  };
}

function resolveSeasonKey(seasonKey) {
  const normalized = sanitizeString(seasonKey)?.toLowerCase() ?? "summer";
  if (["spring", "summer", "autumn", "winter"].includes(normalized)) {
    return normalized;
  }
  return "summer";
}

function chooseEnvironmentState({
  biomeProfileId,
  featureClass,
  districtType,
  blendWeights
}) {
  if (biomeProfileId === "BIOME_PROFILE_COASTAL_001") {
    return {
      environmentStateId: "ENVIRONMENT_STATE_COASTAL_EXPOSURE_001",
      environmentReason: "coastal_exposure_and_salt_edge_response"
    };
  }
  if (biomeProfileId === "BIOME_PROFILE_WETLAND_001") {
    return {
      environmentStateId: "ENVIRONMENT_STATE_WETLAND_CONDITION_001",
      environmentReason: "wetland_moisture_and_margin_response"
    };
  }
  if (districtType === "recreation" || biomeProfileId === "BIOME_PROFILE_RURAL_001") {
    return {
      environmentStateId: "ENVIRONMENT_STATE_RURAL_SEASONAL_CHANGE_001",
      environmentReason: "rural_open_land_seasonal_response"
    };
  }
  if (districtType === "commercial" || districtType === "mixed_use" || districtType === "civic") {
    return {
      environmentStateId: "ENVIRONMENT_STATE_URBAN_SEASONAL_CHANGE_001",
      environmentReason: "urban_edge_and_material_seasonal_response"
    };
  }
  if (featureClass === "reserve" && Number(blendWeights.wetland ?? 0) >= 0.2) {
    return {
      environmentStateId: "ENVIRONMENT_STATE_WETLAND_CONDITION_001",
      environmentReason: "reserve_wetland_transition_response"
    };
  }
  return {
    environmentStateId: "ENVIRONMENT_STATE_GENERAL_SEASONAL_RESPONSE_001",
    environmentReason: "general_local_seasonal_response"
  };
}

function normalizeSeasonalBlendWeights(base, adjustments = {}) {
  const merged = {
    spring: Number(base.spring ?? 0) + Number(adjustments.spring ?? 0),
    summer: Number(base.summer ?? 0) + Number(adjustments.summer ?? 0),
    autumn: Number(base.autumn ?? 0) + Number(adjustments.autumn ?? 0),
    winter: Number(base.winter ?? 0) + Number(adjustments.winter ?? 0)
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

function adjustmentForEnvironment({
  seasonKey,
  biomeProfileId,
  environmentStateId
}) {
  const adjustments = {};
  if (seasonKey === "summer" && biomeProfileId === "BIOME_PROFILE_COASTAL_001") {
    adjustments.summer = 0.05;
  }
  if (seasonKey === "winter" && environmentStateId === "ENVIRONMENT_STATE_WETLAND_CONDITION_001") {
    adjustments.winter = 0.08;
  }
  if (seasonKey === "autumn" && environmentStateId === "ENVIRONMENT_STATE_RURAL_SEASONAL_CHANGE_001") {
    adjustments.autumn = 0.05;
  }
  if (seasonKey === "spring" && environmentStateId === "ENVIRONMENT_STATE_GENERAL_SEASONAL_RESPONSE_001") {
    adjustments.spring = 0.04;
  }
  return adjustments;
}

export function createDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleBySeasonKey: new Map(
      validatedRules.flatMap((rule) =>
        rule.supportedSeasonKeys.map((season) => [season, rule])
      )
    ),
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      seasonalEnvironmentVersion: null,
      registeredSeasonRuleCount: 0,
      seasonProfileId: null,
      environmentStateId: null,
      seasonalBlendWeights: {},
      environmentReason: null,
      seasonSeed: null,
      lastFailureReason:
        "ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSeasonalEnvironment(
  registry,
  {
    seasonKey,
    biomeProfileId,
    blendWeights,
    districtType,
    featureClass,
    selectorSeed,
    deterministicFeatureIdentity
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSeasonalEnvironmentRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_SEASONAL_ENVIRONMENT_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSeasonKey = resolveSeasonKey(seasonKey);
  const normalizedBiomeProfileId = sanitizeString(biomeProfileId);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedSelectorSeed = sanitizeString(selectorSeed) ?? "SEASON_SELECTOR";
  const normalizedIdentity =
    sanitizeString(deterministicFeatureIdentity) ?? "SEASON_FEATURE";

  if (!normalizedBiomeProfileId) {
    registry.__state.lastFailureReason = "MISSING_BIOME_PROFILE_ID";
    throw Object.assign(new Error("MISSING_BIOME_PROFILE_ID"), {
      reasonCode: "MISSING_BIOME_PROFILE_ID"
    });
  }

  const seasonRule = registry.__ruleBySeasonKey.get(normalizedSeasonKey);
  if (!seasonRule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_SEASON_KEY";
    throw Object.assign(new Error("UNSUPPORTED_SEASON_KEY"), {
      reasonCode: "UNSUPPORTED_SEASON_KEY"
    });
  }

  const environment = chooseEnvironmentState({
    biomeProfileId: normalizedBiomeProfileId,
    featureClass: normalizedFeatureClass,
    districtType: normalizedDistrictType,
    blendWeights: blendWeights ?? {}
  });
  const seasonalBlendWeights = normalizeSeasonalBlendWeights(
    seasonRule.defaultSeasonalBlendWeights,
    adjustmentForEnvironment({
      seasonKey: normalizedSeasonKey,
      biomeProfileId: normalizedBiomeProfileId,
      environmentStateId: environment.environmentStateId
    })
  );
  const seasonSeed = hashString(
    [
      normalizedSelectorSeed,
      normalizedIdentity,
      normalizedSeasonKey,
      normalizedBiomeProfileId,
      environment.environmentStateId
    ].join(":")
  ).slice(0, 16);

  registry.__state.seasonProfileId = seasonRule.seasonProfileId;
  registry.__state.environmentStateId = environment.environmentStateId;
  registry.__state.seasonalBlendWeights = seasonalBlendWeights;
  registry.__state.environmentReason = environment.environmentReason;
  registry.__state.seasonSeed = seasonSeed;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    seasonProfileId: seasonRule.seasonProfileId,
    environmentStateId: environment.environmentStateId,
    seasonalBlendWeights,
    environmentReason: environment.environmentReason,
    seasonSeed
  });
}
