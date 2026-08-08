const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_VERSION =
  "atlas_attachment_metadata_glb_preparation_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_RULES =
  Object.freeze([
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_COASTAL_VEGETATION_001",
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_COASTAL_VEGETATION_001",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_COASTAL_VEGETATION_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      socketMetadataCount: 3,
      componentMetadataCount: 1,
      attachmentMetadataReason:
        "coastal vegetation sockets map to reusable GLB vegetation anchor metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_COASTAL_VEGETATION_COMPACT_001",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_COASTAL_VEGETATION_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      socketMetadataCount: 3,
      componentMetadataCount: 1,
      attachmentMetadataReason:
        "compact coastal vegetation sockets map to lightweight GLB vegetation metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_001",
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_001",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      socketMetadataCount: 9,
      componentMetadataCount: 6,
      attachmentMetadataReason:
        "heritage civic sockets map to reusable wall roof window door and fence GLB metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      socketMetadataCount: 9,
      componentMetadataCount: 6,
      attachmentMetadataReason:
        "compact heritage civic sockets map to compact GLB envelope metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_URBAN_COMMERCIAL_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_URBAN_COMMERCIAL_001",
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_URBAN_COMMERCIAL_001",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_URBAN_COMMERCIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
      socketMetadataCount: 8,
      componentMetadataCount: 5,
      attachmentMetadataReason:
        "urban frontage sockets map facade glazing entry and roofline GLB metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_RURAL_RESIDENTIAL_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_RURAL_RESIDENTIAL_001",
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_RURAL_RESIDENTIAL_001",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_RURAL_RESIDENTIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_SUBURBAN_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_SUBURBAN_RESIDENTIAL_001",
      socketMetadataCount: 8,
      componentMetadataCount: 6,
      attachmentMetadataReason:
        "rural residential sockets map envelope entry fence and vegetation GLB metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_001",
      glbPreparationProfileId: "GLB_PREPARATION_PROFILE_INDUSTRIAL_EDGE_001",
      surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_001",
      componentAnchorSetId: "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId: "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001",
      socketMetadataCount: 4,
      componentMetadataCount: 2,
      attachmentMetadataReason:
        "industrial edge sockets map hardscape trim and fence GLB metadata",
      status: "approved"
    }),
    Object.freeze({
      attachmentMetadataProfileId:
        "ATTACHMENT_METADATA_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      glbPreparationProfileId:
        "GLB_PREPARATION_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      surfaceMappingProfileId:
        "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      componentAnchorSetId:
        "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_COMPACT_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId: "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001",
      socketMetadataCount: 4,
      componentMetadataCount: 2,
      attachmentMetadataReason:
        "compact industrial edge sockets map compact trim and fence GLB metadata",
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
    atlasAttachmentMetadataGlbPreparationVersion:
      state.atlasAttachmentMetadataGlbPreparationVersion,
    registeredAttachmentMetadataRuleCount:
      state.registeredAttachmentMetadataRuleCount,
    attachmentMetadataProfileId: state.attachmentMetadataProfileId,
    glbPreparationProfileId: state.glbPreparationProfileId,
    socketMetadataCount: state.socketMetadataCount,
    componentMetadataCount: state.componentMetadataCount,
    attachmentMetadataReason: state.attachmentMetadataReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const attachmentMetadataProfileId = sanitizeString(
    rule.attachmentMetadataProfileId
  );
  const glbPreparationProfileId = sanitizeString(rule.glbPreparationProfileId);
  const surfaceMappingProfileId = sanitizeString(rule.surfaceMappingProfileId);
  const componentAnchorSetId = sanitizeString(rule.componentAnchorSetId);
  const componentRecipeId = sanitizeString(rule.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(rule.assetAssemblyProfileId);
  const socketMetadataCount = Number(rule.socketMetadataCount ?? 0);
  const componentMetadataCount = Number(rule.componentMetadataCount ?? 0);
  if (
    !attachmentMetadataProfileId ||
    !glbPreparationProfileId ||
    !surfaceMappingProfileId ||
    !componentAnchorSetId ||
    !componentRecipeId ||
    !assetAssemblyProfileId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_ATTACHMENT_METADATA_RULE"),
      { reasonCode: "INCOMPLETE_ATTACHMENT_METADATA_RULE" }
    );
  }
  return deepFreeze({
    attachmentMetadataProfileId,
    glbPreparationProfileId,
    surfaceMappingProfileId,
    componentAnchorSetId,
    componentRecipeId,
    assetAssemblyProfileId,
    socketMetadataCount,
    componentMetadataCount,
    attachmentMetadataReason: sanitizeString(rule.attachmentMetadataReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasAttachmentMetadataGlbPreparationVersion: version,
    registeredAttachmentMetadataRuleCount: rules.length,
    attachmentMetadataProfileId: null,
    glbPreparationProfileId: null,
    socketMetadataCount: 0,
    componentMetadataCount: 0,
    attachmentMetadataReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAttachmentMetadataGlbPreparation) {
    throw Object.assign(
      new Error("ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_UNAVAILABLE"),
      { reasonCode: "ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_UNAVAILABLE" }
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
    attachmentMetadataProfileId: null,
    glbPreparationProfileId: null,
    socketMetadataCount: 0,
    componentMetadataCount: 0,
    attachmentMetadataReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    attachmentMetadataProfileId: null,
    glbPreparationProfileId: null,
    socketMetadataCount: 0,
    componentMetadataCount: 0,
    attachmentMetadataReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ATTACHMENT_METADATA_GLB_PREPARATION_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasAttachmentMetadataGlbPreparation: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasAttachmentMetadataGlbPreparationStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasAttachmentMetadataGlbPreparation) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const surfaceMappingProfileId = sanitizeString(input.surfaceMappingProfileId);
  const componentAnchorSetId = sanitizeString(input.componentAnchorSetId);
  const componentRecipeId = sanitizeString(input.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(input.assetAssemblyProfileId);

  const surfaceMatches = registry.__rules.filter(
    (candidate) => candidate.surfaceMappingProfileId === surfaceMappingProfileId
  );
  if (surfaceMatches.length === 0) {
    return fail(registry, "ATTACHMENT_METADATA_SURFACE_MAPPING_NOT_FOUND");
  }
  const anchorMatches = surfaceMatches.filter(
    (candidate) => candidate.componentAnchorSetId === componentAnchorSetId
  );
  if (anchorMatches.length === 0) {
    return fail(registry, "ATTACHMENT_METADATA_ANCHOR_SET_INCOMPATIBLE");
  }
  const recipeMatches = anchorMatches.filter(
    (candidate) => candidate.componentRecipeId === componentRecipeId
  );
  if (recipeMatches.length === 0) {
    return fail(registry, "ATTACHMENT_METADATA_COMPONENT_RECIPE_INCOMPATIBLE");
  }
  const rule = recipeMatches.find(
    (candidate) =>
      candidate.assetAssemblyProfileId === assetAssemblyProfileId
  );
  if (!rule) {
    return fail(
      registry,
      "ATTACHMENT_METADATA_ASSEMBLY_PROFILE_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    attachmentMetadataProfileId: rule.attachmentMetadataProfileId,
    glbPreparationProfileId: rule.glbPreparationProfileId,
    socketMetadataCount: rule.socketMetadataCount,
    componentMetadataCount: rule.componentMetadataCount,
    attachmentMetadataReason: rule.attachmentMetadataReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    attachmentMetadataProfileId: rule.attachmentMetadataProfileId,
    glbPreparationProfileId: rule.glbPreparationProfileId,
    socketMetadataCount: rule.socketMetadataCount,
    componentMetadataCount: rule.componentMetadataCount,
    attachmentMetadataReason: rule.attachmentMetadataReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
