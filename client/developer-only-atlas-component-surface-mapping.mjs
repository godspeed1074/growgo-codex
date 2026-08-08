const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_VERSION =
  "atlas_component_surface_mapping_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_RULES =
  Object.freeze([
    Object.freeze({
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_COASTAL_VEGETATION_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_A_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_COASTAL_VEGETATION_001",
      resolvedAnchorCount: 3,
      mappedComponentCount: 1,
      surfaceMappingReason:
        "coastal_vegetation_recipe_maps vegetation anchor sockets deterministically",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_COASTAL_TREE_B_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_COASTAL_VEGETATION_COMPACT_001",
      resolvedAnchorCount: 3,
      mappedComponentCount: 1,
      surfaceMappingReason:
        "compact_coastal_vegetation_recipe maps vegetation anchor sockets deterministically",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_A_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_001",
      resolvedAnchorCount: 9,
      mappedComponentCount: 6,
      surfaceMappingReason:
        "heritage_civic_recipe maps wall roof window door and fence anchors",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_HERITAGE_CIVIC_B_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_COMPACT_001",
      resolvedAnchorCount: 9,
      mappedComponentCount: 6,
      surfaceMappingReason:
        "compact_heritage_civic_recipe maps wall roof window door and fence anchors",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_URBAN_COMMERCIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_URBAN_COMMERCIAL_A_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_URBAN_COMMERCIAL_001",
      resolvedAnchorCount: 8,
      mappedComponentCount: 5,
      surfaceMappingReason:
        "urban_frontage_recipe maps facade glazing entry and roofline anchors",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_RURAL_RESIDENTIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_SUBURBAN_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_SUBURBAN_RESIDENTIAL_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_RURAL_RESIDENTIAL_A_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_RURAL_RESIDENTIAL_001",
      resolvedAnchorCount: 8,
      mappedComponentCount: 6,
      surfaceMappingReason:
        "rural_residential_recipe maps envelope entry fence and vegetation anchors",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_A_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_001",
      resolvedAnchorCount: 4,
      mappedComponentCount: 2,
      surfaceMappingReason:
        "industrial_edge_recipe maps hardscape trim and fence attachment anchors",
      status: "approved"
    }),
    Object.freeze({
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001",
      materialSlotSetId: "MATERIAL_SLOT_SET_INDUSTRIAL_FURNITURE_B_001",
      slotCompatibilityStatus: "valid",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_COMPACT_001",
      resolvedAnchorCount: 4,
      mappedComponentCount: 2,
      surfaceMappingReason:
        "compact_industrial_edge_recipe maps hardscape trim and fence attachment anchors",
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
    atlasComponentSurfaceMappingVersion:
      state.atlasComponentSurfaceMappingVersion,
    registeredComponentSurfaceMappingRuleCount:
      state.registeredComponentSurfaceMappingRuleCount,
    surfaceMappingProfileId: state.surfaceMappingProfileId,
    componentAnchorSetId: state.componentAnchorSetId,
    resolvedAnchorCount: state.resolvedAnchorCount,
    mappedComponentCount: state.mappedComponentCount,
    surfaceMappingReason: state.surfaceMappingReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const surfaceMappingProfileId = sanitizeString(rule.surfaceMappingProfileId);
  const componentRecipeId = sanitizeString(rule.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(rule.assetAssemblyProfileId);
  const materialSlotSetId = sanitizeString(rule.materialSlotSetId);
  const slotCompatibilityStatus = sanitizeString(rule.slotCompatibilityStatus);
  const componentAnchorSetId = sanitizeString(rule.componentAnchorSetId);
  const resolvedAnchorCount = Number(rule.resolvedAnchorCount ?? 0);
  const mappedComponentCount = Number(rule.mappedComponentCount ?? 0);
  if (
    !surfaceMappingProfileId ||
    !componentRecipeId ||
    !assetAssemblyProfileId ||
    !materialSlotSetId ||
    !slotCompatibilityStatus ||
    !componentAnchorSetId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_COMPONENT_SURFACE_MAPPING_RULE"),
      { reasonCode: "INCOMPLETE_COMPONENT_SURFACE_MAPPING_RULE" }
    );
  }
  return deepFreeze({
    surfaceMappingProfileId,
    componentRecipeId,
    assetAssemblyProfileId,
    materialSlotSetId,
    slotCompatibilityStatus,
    componentAnchorSetId,
    resolvedAnchorCount,
    mappedComponentCount,
    surfaceMappingReason: sanitizeString(rule.surfaceMappingReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasComponentSurfaceMappingVersion: version,
    registeredComponentSurfaceMappingRuleCount: rules.length,
    surfaceMappingProfileId: null,
    componentAnchorSetId: null,
    resolvedAnchorCount: 0,
    mappedComponentCount: 0,
    surfaceMappingReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasComponentSurfaceMapping) {
    throw Object.assign(
      new Error("ATLAS_COMPONENT_SURFACE_MAPPING_UNAVAILABLE"),
      { reasonCode: "ATLAS_COMPONENT_SURFACE_MAPPING_UNAVAILABLE" }
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
    surfaceMappingProfileId: null,
    componentAnchorSetId: null,
    resolvedAnchorCount: 0,
    mappedComponentCount: 0,
    surfaceMappingReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    surfaceMappingProfileId: null,
    componentAnchorSetId: null,
    resolvedAnchorCount: 0,
    mappedComponentCount: 0,
    surfaceMappingReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasComponentSurfaceMapping({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_SURFACE_MAPPING_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasComponentSurfaceMapping: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasComponentSurfaceMappingStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasComponentSurfaceMapping) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasComponentSurfaceMapping(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const componentRecipeId = sanitizeString(input.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(input.assetAssemblyProfileId);
  const materialSlotSetId = sanitizeString(input.materialSlotSetId);
  const slotCompatibilityStatus = sanitizeString(input.slotCompatibilityStatus);
  const recipeMatches = registry.__rules.filter(
    (candidate) => candidate.componentRecipeId === componentRecipeId
  );
  if (recipeMatches.length === 0) {
    return fail(registry, "COMPONENT_SURFACE_MAPPING_RULE_NOT_FOUND");
  }
  const assemblyMatches = recipeMatches.filter(
    (candidate) => candidate.assetAssemblyProfileId === assetAssemblyProfileId
  );
  if (assemblyMatches.length === 0) {
    return fail(
      registry,
      "COMPONENT_SURFACE_MAPPING_ASSEMBLY_PROFILE_INCOMPATIBLE"
    );
  }
  const materialSlotMatches = assemblyMatches.filter(
    (candidate) => candidate.materialSlotSetId === materialSlotSetId
  );
  if (materialSlotMatches.length === 0) {
    return fail(
      registry,
      "COMPONENT_SURFACE_MAPPING_MATERIAL_SLOT_INCOMPATIBLE"
    );
  }

  const rule = materialSlotMatches.find(
    (candidate) => candidate.slotCompatibilityStatus === slotCompatibilityStatus
  );
  if (!rule) {
    return fail(
      registry,
      "COMPONENT_SURFACE_MAPPING_SLOT_STATUS_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    surfaceMappingProfileId: rule.surfaceMappingProfileId,
    componentAnchorSetId: rule.componentAnchorSetId,
    resolvedAnchorCount: rule.resolvedAnchorCount,
    mappedComponentCount: rule.mappedComponentCount,
    surfaceMappingReason: rule.surfaceMappingReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    surfaceMappingProfileId: rule.surfaceMappingProfileId,
    componentAnchorSetId: rule.componentAnchorSetId,
    resolvedAnchorCount: rule.resolvedAnchorCount,
    mappedComponentCount: rule.mappedComponentCount,
    surfaceMappingReason: rule.surfaceMappingReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
