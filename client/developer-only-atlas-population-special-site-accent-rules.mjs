const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_VERSION =
  "atlas_population_special_site_accent_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "SPECIAL_SITE_RULE_CORNER_LOT_001",
      specialSiteType: "corner_lot",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedDistrictTypes: Object.freeze(["residential", "mixed_use"]),
      requiredLotTypes: Object.freeze(["corner_lot"]),
      landmarkAccentProfileId: "LANDMARK_ACCENT_PROFILE_CORNER_LOT_001",
      cornerLotAccentId: "CORNER_LOT_ACCENT_DUAL_FRONTAGE_001",
      visibilityPriority: "dual_frontage_high",
      specialSiteReason: "corner_lot_dual_frontage_and_visibility_accent",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SPECIAL_SITE_RULE_LOCAL_LANDMARK_001",
      specialSiteType: "local_landmark",
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      requiredLotTypes: Object.freeze([]),
      landmarkAccentProfileId: "LANDMARK_ACCENT_PROFILE_LOCAL_ICON_001",
      cornerLotAccentId: "CORNER_LOT_ACCENT_NONE_001",
      visibilityPriority: "approach_framing_high",
      specialSiteReason: "local_landmark_framing_and_supporting_composition",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SPECIAL_SITE_RULE_SCENIC_LOOKOUT_001",
      specialSiteType: "tourist_special_location",
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "reserve",
        "park",
        "civic_site"
      ]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      requiredLotTypes: Object.freeze([]),
      landmarkAccentProfileId: "LANDMARK_ACCENT_PROFILE_SCENIC_LOOKOUT_001",
      cornerLotAccentId: "CORNER_LOT_ACCENT_NONE_001",
      visibilityPriority: "scenic_priority_high",
      specialSiteReason: "tourist_lookout_signage_path_and_gathering_accent",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "SPECIAL_SITE_RULE_HISTORIC_BUILDING_001",
      specialSiteType: "historic_building",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use", "commercial"]),
      requiredLotTypes: Object.freeze([]),
      landmarkAccentProfileId: "LANDMARK_ACCENT_PROFILE_HISTORIC_BUILDING_001",
      cornerLotAccentId: "CORNER_LOT_ACCENT_NONE_001",
      visibilityPriority: "heritage_visibility_medium",
      specialSiteReason: "historic_building_entry_and_material_accent",
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
    specialSiteAccentVersion: state.specialSiteAccentVersion,
    registeredSpecialSiteAccentRuleCount:
      state.registeredSpecialSiteAccentRuleCount,
    specialSiteType: state.specialSiteType,
    landmarkAccentProfileId: state.landmarkAccentProfileId,
    cornerLotAccentId: state.cornerLotAccentId,
    visibilityPriority: state.visibilityPriority,
    specialSiteReason: state.specialSiteReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const specialSiteType = sanitizeString(rule.specialSiteType);
  const landmarkAccentProfileId = sanitizeString(rule.landmarkAccentProfileId);
  const cornerLotAccentId = sanitizeString(rule.cornerLotAccentId);
  const visibilityPriority = sanitizeString(rule.visibilityPriority);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_SPECIAL_SITE_RULE_ID"), {
      reasonCode: "MISSING_SPECIAL_SITE_RULE_ID"
    });
  }
  if (!specialSiteType) {
    throw Object.assign(new Error("MISSING_SPECIAL_SITE_TYPE"), {
      reasonCode: "MISSING_SPECIAL_SITE_TYPE"
    });
  }
  if (!landmarkAccentProfileId) {
    throw Object.assign(new Error("MISSING_LANDMARK_ACCENT_PROFILE_ID"), {
      reasonCode: "MISSING_LANDMARK_ACCENT_PROFILE_ID"
    });
  }
  if (!cornerLotAccentId) {
    throw Object.assign(new Error("MISSING_CORNER_LOT_ACCENT_ID"), {
      reasonCode: "MISSING_CORNER_LOT_ACCENT_ID"
    });
  }
  if (!visibilityPriority) {
    throw Object.assign(new Error("MISSING_VISIBILITY_PRIORITY"), {
      reasonCode: "MISSING_VISIBILITY_PRIORITY"
    });
  }
  return deepFreeze({
    ruleId,
    specialSiteType,
    supportedFeatureClasses: deepFreeze(
      (rule.supportedFeatureClasses ?? []).map(String)
    ),
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    requiredLotTypes: deepFreeze((rule.requiredLotTypes ?? []).map(String)),
    landmarkAccentProfileId,
    cornerLotAccentId,
    visibilityPriority,
    specialSiteReason: sanitizeString(rule.specialSiteReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    specialSiteAccentVersion: version,
    registeredSpecialSiteAccentRuleCount: rules.length,
    specialSiteType: null,
    landmarkAccentProfileId: null,
    cornerLotAccentId: null,
    visibilityPriority: null,
    specialSiteReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  districtType,
  lotType,
  sourceClassification
) {
  if (lotType === "corner_lot") {
    return registry.__rules.find(
      (rule) => rule.specialSiteType === "corner_lot"
    ) ?? null;
  }

  if (
    sourceClassification &&
    /historic|heritage|church|school|community|lookout|waterfall|beach|tourist/i.test(
      sourceClassification
    )
  ) {
    return (
      registry.__rules.find(
        (rule) =>
          rule.supportedFeatureClasses.includes(featureClass) &&
          rule.supportedDistrictTypes.includes(districtType) &&
          (rule.specialSiteType === "local_landmark" ||
            rule.specialSiteType === "tourist_special_location" ||
            rule.specialSiteType === "historic_building")
      ) ?? null
    );
  }

  return registry.__rules.find(
    (rule) =>
      rule.supportedFeatureClasses.includes(featureClass) &&
      rule.supportedDistrictTypes.includes(districtType) &&
      (rule.requiredLotTypes.length === 0 || rule.requiredLotTypes.includes(lotType))
  ) ?? null;
}

export function createDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      specialSiteAccentVersion: null,
      registeredSpecialSiteAccentRuleCount: 0,
      specialSiteType: null,
      landmarkAccentProfileId: null,
      cornerLotAccentId: null,
      visibilityPriority: null,
      specialSiteReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSpecialSiteAccent(
  registry,
  {
    featureClass,
    districtType,
    lotType,
    sourceClassification
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSpecialSiteAccentRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_SPECIAL_SITE_ACCENT_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedLotType = sanitizeString(lotType);
  const normalizedSourceClassification = sanitizeString(sourceClassification);

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
    normalizedFeatureClass,
    normalizedDistrictType,
    normalizedLotType,
    normalizedSourceClassification
  );

  if (!rule) {
    registry.__state.lastFailureReason = "INCOMPATIBLE_SPECIAL_SITE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      specialSiteType: null,
      landmarkAccentProfileId: null,
      cornerLotAccentId: null,
      visibilityPriority: null,
      specialSiteReason: "INCOMPATIBLE_SPECIAL_SITE_CONTEXT",
      reasonCode: "INCOMPATIBLE_SPECIAL_SITE_CONTEXT"
    });
  }

  registry.__state.specialSiteType = rule.specialSiteType;
  registry.__state.landmarkAccentProfileId = rule.landmarkAccentProfileId;
  registry.__state.cornerLotAccentId = rule.cornerLotAccentId;
  registry.__state.visibilityPriority = rule.visibilityPriority;
  registry.__state.specialSiteReason = rule.specialSiteReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    specialSiteType: rule.specialSiteType,
    landmarkAccentProfileId: rule.landmarkAccentProfileId,
    cornerLotAccentId: rule.cornerLotAccentId,
    visibilityPriority: rule.visibilityPriority,
    specialSiteReason: rule.specialSiteReason
  });
}
