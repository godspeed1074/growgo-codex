const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_VERSION =
  "atlas_material_slot_resolution_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_RULES =
  Object.freeze([
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_A_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_COASTAL_001",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_COASTAL_NATURAL_001",
      assignedSlots: Object.freeze({
        walls: null,
        roofs: null,
        trims: null,
        windows: null,
        doors: null,
        fences: null,
        vegetation: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_001"
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "coastal_tree_variant_assigns vegetation slot only within natural bundle",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_B_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_COASTAL_001",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_COASTAL_NATURAL_001",
      assignedSlots: Object.freeze({
        walls: null,
        roofs: null,
        trims: null,
        windows: null,
        doors: null,
        fences: null,
        vegetation: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_COMPACT_001"
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "compact_coastal_tree_variant assigns compact vegetation slot within natural bundle",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_B_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_COASTAL_COMPACT_001",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_COASTAL_NATURAL_001",
      assignedSlots: Object.freeze({
        walls: null,
        roofs: null,
        trims: null,
        windows: null,
        doors: null,
        fences: null,
        vegetation: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_COMPACT_001"
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "compact_coastal_tree_variant assigns compact vegetation slot within compact natural bundle",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_HERITAGE_001",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_HERITAGE_AGED_001",
      assignedSlots: Object.freeze({
        walls: "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_001",
        roofs: "MATERIAL_SLOT_ROOF_HERITAGE_SLATE_001",
        trims: "MATERIAL_SLOT_TRIM_HERITAGE_PAINT_001",
        windows: "MATERIAL_SLOT_WINDOW_HERITAGE_TIMBER_001",
        doors: "MATERIAL_SLOT_DOOR_HERITAGE_ENTRY_001",
        fences: "MATERIAL_SLOT_FENCE_HERITAGE_IRON_001",
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "heritage_civic_variant assigns masonry envelope with aged civic detail slots",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_B_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_B_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_HERITAGE_001",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_HERITAGE_AGED_001",
      assignedSlots: Object.freeze({
        walls: "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_COMPACT_001",
        roofs: "MATERIAL_SLOT_ROOF_HERITAGE_SLATE_001",
        trims: "MATERIAL_SLOT_TRIM_HERITAGE_PAINT_001",
        windows: "MATERIAL_SLOT_WINDOW_HERITAGE_TIMBER_001",
        doors: "MATERIAL_SLOT_DOOR_HERITAGE_ENTRY_001",
        fences: "MATERIAL_SLOT_FENCE_HERITAGE_IRON_001",
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "compact_heritage_civic_variant assigns compact masonry envelope with aged civic detail slots",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_B_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_B_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_HERITAGE_COMPACT_001",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_HERITAGE_AGED_001",
      assignedSlots: Object.freeze({
        walls: "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_COMPACT_001",
        roofs: "MATERIAL_SLOT_ROOF_HERITAGE_SLATE_001",
        trims: "MATERIAL_SLOT_TRIM_HERITAGE_PAINT_001",
        windows: "MATERIAL_SLOT_WINDOW_HERITAGE_TIMBER_001",
        doors: "MATERIAL_SLOT_DOOR_HERITAGE_ENTRY_001",
        fences: "MATERIAL_SLOT_FENCE_HERITAGE_IRON_001",
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "compact_heritage_civic_variant assigns compact masonry envelope with aged civic detail slots inside compact heritage bundle",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_URBAN_COMMERCIAL_A_001",
      assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_URBAN_001",
      finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_URBAN_MODERN_001",
      assignedSlots: Object.freeze({
        walls: "MATERIAL_SLOT_WALL_URBAN_PANEL_001",
        roofs: "MATERIAL_SLOT_ROOF_URBAN_FLAT_001",
        trims: "RESOLVED_MATERIAL_PROFILE_URBAN_COMMERCIAL_MIXED_001",
        windows: "MATERIAL_SLOT_WINDOW_URBAN_GLAZING_001",
        doors: "MATERIAL_SLOT_DOOR_URBAN_STORE_ENTRY_001",
        fences: null,
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "urban_commercial_variant assigns mixed frontage slots with modern glazing set",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_RURAL_RESIDENTIAL_A_001",
      assetVariantId: "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_A_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_RURAL_001",
      finishProfileId: "FINISH_PROFILE_WEATHERED_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_RURAL_WEATHERED_001",
      assignedSlots: Object.freeze({
        walls: "MATERIAL_SLOT_WALL_RURAL_WEATHERBOARD_001",
        roofs: "RESOLVED_MATERIAL_PROFILE_SUBURBAN_GARDEN_ROOF_001",
        trims: "MATERIAL_SLOT_TRIM_RURAL_TIMBER_001",
        windows: "MATERIAL_SLOT_WINDOW_RURAL_PAINTED_001",
        doors: "MATERIAL_SLOT_DOOR_RURAL_ENTRY_001",
        fences: "MATERIAL_SLOT_FENCE_RURAL_POST_RAIL_001",
        vegetation: "MATERIAL_SLOT_VEGETATION_RURAL_GARDEN_001"
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "rural_residential_variant assigns weathered roof fence and garden support slots",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_A_001",
      assetVariantId: "VARIANT_INDUSTRIAL_STREET_FURNITURE_A_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_INDUSTRIAL_001",
      finishProfileId: "FINISH_PROFILE_INDUSTRIAL_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_INDUSTRIAL_HARDWEAR_001",
      assignedSlots: Object.freeze({
        walls: null,
        roofs: null,
        trims: "MATERIAL_SLOT_TRIM_INDUSTRIAL_GALV_001",
        windows: null,
        doors: null,
        fences: "MATERIAL_SLOT_FENCE_INDUSTRIAL_EDGE_001",
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "industrial_edge_variant assigns hardware trim and fence slots only",
      status: "approved"
    }),
    Object.freeze({
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_B_001",
      assetVariantId: "VARIANT_INDUSTRIAL_STREET_FURNITURE_B_001",
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_INDUSTRIAL_001",
      finishProfileId: "FINISH_PROFILE_INDUSTRIAL_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_INDUSTRIAL_HARDWEAR_001",
      assignedSlots: Object.freeze({
        walls: null,
        roofs: null,
        trims: "MATERIAL_SLOT_TRIM_INDUSTRIAL_GALV_001",
        windows: null,
        doors: null,
        fences: "MATERIAL_SLOT_FENCE_INDUSTRIAL_EDGE_001",
        vegetation: null
      }),
      slotCompatibilityStatus: "valid",
      slotResolutionReason:
        "compact_industrial_edge_variant assigns compact hardware trim and fence slots only",
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
    atlasMaterialSlotResolutionVersion: state.atlasMaterialSlotResolutionVersion,
    registeredMaterialSlotRuleCount: state.registeredMaterialSlotRuleCount,
    materialSlotSetId: state.materialSlotSetId,
    resolvedSlotCount: state.resolvedSlotCount,
    assignedMaterialCount: state.assignedMaterialCount,
    slotCompatibilityStatus: state.slotCompatibilityStatus,
    slotResolutionReason: state.slotResolutionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateAssignedSlots(assignedSlots = {}) {
  const normalized = {
    walls: sanitizeString(assignedSlots.walls),
    roofs: sanitizeString(assignedSlots.roofs),
    trims: sanitizeString(assignedSlots.trims),
    windows: sanitizeString(assignedSlots.windows),
    doors: sanitizeString(assignedSlots.doors),
    fences: sanitizeString(assignedSlots.fences),
    vegetation: sanitizeString(assignedSlots.vegetation)
  };
  return deepFreeze(normalized);
}

function countAssignedSlots(assignedSlots) {
  return Object.values(assignedSlots).filter(Boolean).length;
}

function validateRule(rule = {}) {
  const materialSlotSetId = sanitizeString(rule.materialSlotSetId);
  const assetVariantId = sanitizeString(rule.assetVariantId);
  const materialThemeBundleId = sanitizeString(rule.materialThemeBundleId);
  const finishProfileId = sanitizeString(rule.finishProfileId);
  const resolvedFinishSetId = sanitizeString(rule.resolvedFinishSetId);
  if (
    !materialSlotSetId ||
    !assetVariantId ||
    !materialThemeBundleId ||
    !finishProfileId ||
    !resolvedFinishSetId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_MATERIAL_SLOT_RESOLUTION_RULE"),
      { reasonCode: "INCOMPLETE_MATERIAL_SLOT_RESOLUTION_RULE" }
    );
  }
  const assignedSlots = validateAssignedSlots(rule.assignedSlots);
  return deepFreeze({
    materialSlotSetId,
    assetVariantId,
    materialThemeBundleId,
    finishProfileId,
    resolvedFinishSetId,
    assignedSlots,
    resolvedSlotCount: 7,
    assignedMaterialCount: countAssignedSlots(assignedSlots),
    slotCompatibilityStatus: sanitizeString(rule.slotCompatibilityStatus),
    slotResolutionReason: sanitizeString(rule.slotResolutionReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasMaterialSlotResolutionVersion: version,
    registeredMaterialSlotRuleCount: rules.length,
    materialSlotSetId: null,
    resolvedSlotCount: 0,
    assignedMaterialCount: 0,
    slotCompatibilityStatus: null,
    slotResolutionReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasMaterialSlotResolution) {
    throw Object.assign(
      new Error("ATLAS_MATERIAL_SLOT_RESOLUTION_UNAVAILABLE"),
      { reasonCode: "ATLAS_MATERIAL_SLOT_RESOLUTION_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode) {
  updateState(registry, {
    materialSlotSetId: null,
    resolvedSlotCount: 0,
    assignedMaterialCount: 0,
    slotCompatibilityStatus: "blocked",
    slotResolutionReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    materialSlotSetId: null,
    resolvedSlotCount: 0,
    assignedMaterialCount: 0,
    slotCompatibilityStatus: "blocked",
    slotResolutionReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasMaterialSlotResolution({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_SLOT_RESOLUTION_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasMaterialSlotResolution: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasMaterialSlotResolutionStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasMaterialSlotResolution) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasMaterialSlotSet(registry, input = {}) {
  requireRegistry(registry);

  const assetVariantId = sanitizeString(input.assetVariantId);
  const materialThemeBundleId = sanitizeString(input.materialThemeBundleId);
  const finishProfileId = sanitizeString(input.finishProfileId);
  const resolvedFinishSetId = sanitizeString(input.resolvedFinishSetId);

  const variantMatches = registry.__rules.filter(
    (candidate) => candidate.assetVariantId === assetVariantId
  );
  if (variantMatches.length === 0) {
    return fail(registry, "MATERIAL_SLOT_RULE_NOT_FOUND");
  }
  const bundleMatches = variantMatches.filter(
    (candidate) => candidate.materialThemeBundleId === materialThemeBundleId
  );
  if (bundleMatches.length === 0) {
    return fail(registry, "MATERIAL_SLOT_THEME_BUNDLE_INCOMPATIBLE");
  }
  const finishMatches = bundleMatches.filter(
    (candidate) => candidate.finishProfileId === finishProfileId
  );
  if (finishMatches.length === 0) {
    return fail(registry, "MATERIAL_SLOT_FINISH_INCOMPATIBLE");
  }
  const rule = finishMatches.find(
    (candidate) => candidate.resolvedFinishSetId === resolvedFinishSetId
  );
  if (!rule) {
    return fail(registry, "MATERIAL_SLOT_FINISH_SET_INCOMPATIBLE");
  }

  updateState(registry, {
    materialSlotSetId: rule.materialSlotSetId,
    resolvedSlotCount: rule.resolvedSlotCount,
    assignedMaterialCount: rule.assignedMaterialCount,
    slotCompatibilityStatus: rule.slotCompatibilityStatus,
    slotResolutionReason: rule.slotResolutionReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    materialSlotSetId: rule.materialSlotSetId,
    resolvedSlotCount: rule.resolvedSlotCount,
    assignedMaterialCount: rule.assignedMaterialCount,
    slotCompatibilityStatus: rule.slotCompatibilityStatus,
    slotResolutionReason: rule.slotResolutionReason,
    assignedSlots: rule.assignedSlots,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
