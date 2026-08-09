import {
  createDeveloperOnlyAtlasAssetRegistry,
  getDeveloperOnlyAtlasAssetRegistryStatus,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import {
  createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry,
  resolveDeveloperOnlyAtlasPopulationModularAssetBinding,
  getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus
} from "./developer-only-atlas-population-modular-asset-binding-rules.mjs";
import {
  createDeveloperOnlyAtlasAssetWorldValidationFoundation,
  getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus,
  resolveDeveloperOnlyAtlasAssetWorldValidationFoundation
} from "./developer-only-atlas-asset-world-validation-foundation.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_VERSION =
  "atlas_controlled_existing_asset_binding_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS =
  Object.freeze([
    Object.freeze({
      assetId: "TREE_EUCALYPTUS_001",
      assetVersion: "v001",
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      approvedRecipeIds: Object.freeze([
        "TREE_EUCALYPTUS_RECIPE_001",
        "COASTAL_LOCATION_RECIPE_001",
        "PARK_PUBLIC_GREEN_RECIPE_001"
      ]),
      resolvedLodProfile: "LOD_PROFILE_TREE_TALL_CLOSE_MEDIUM_DISTANT_001",
      resolvedGlbIdentity:
        "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_EUCALYPTUS_001_v001",
      manifestVersion: "v001",
      status: "approved_existing"
    }),
    Object.freeze({
      assetId: "TREE_BOTTLEBRUSH_001",
      assetVersion: "v002",
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      approvedRecipeIds: Object.freeze([
        "TREE_BOTTLEBRUSH_RECIPE_001",
        "COASTAL_LOCATION_RECIPE_001",
        "COASTAL_GREEN_RECIPE_001"
      ]),
      resolvedLodProfile: "LOD_PROFILE_TREE_STANDARD_CLOSE_MEDIUM_DISTANT_001",
      resolvedGlbIdentity: "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_TREE_BOTTLEBRUSH_001_v002",
      manifestVersion: "v002",
      status: "approved_existing"
    }),
    Object.freeze({
      assetId: "SHRUB_COASTAL_LOW_001",
      assetVersion: "v002",
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      approvedRecipeIds: Object.freeze([
        "SHRUB_COASTAL_LOW_RECIPE_001",
        "COASTAL_LOCATION_RECIPE_001",
        "PARK_PUBLIC_GREEN_RECIPE_001",
        "COASTAL_GREEN_RECIPE_001"
      ]),
      resolvedLodProfile: "LOD_PROFILE_SHRUB_LIGHT_CLOSE_MEDIUM_DISTANT_001",
      resolvedGlbIdentity: "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb",
      manifestIdentity: "EXISTING_ASSET_MANIFEST_SHRUB_COASTAL_LOW_001_v002",
      manifestVersion: "v002",
      status: "approved_existing"
    }),
    Object.freeze({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      assetVersion: "1.0.0",
      assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
      approvedRecipeIds: Object.freeze([
        "BUILDING_CIVIC_SPORTS_PAVILION_001",
        "SPORTS_OVAL_RECIPE_001",
        "RECREATION_AREA_RECIPE_001",
        "COASTAL_LOCATION_RECIPE_001",
        "BUILDING_CIVIC_RECIPE_001"
      ]),
      resolvedLodProfile: "LOD_PROFILE_CIVIC_BUILDING_CLOSE_MEDIUM_DISTANT_001",
      resolvedGlbIdentity: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
      manifestIdentity:
        "EXISTING_ASSET_MANIFEST_BUILDING_CIVIC_SPORTS_PAVILION_001_1_0_0",
      manifestVersion: "1.0.0",
      status: "approved_existing"
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

function createState(version, statuses = {}) {
  return {
    atlasControlledExistingAssetBindingVersion: version,
    registeredAssetCount: statuses.assetRegistry?.registeredAssetCount ?? 0,
    registeredModularBindingRuleCount:
      statuses.modularBinding?.registeredModularBindingRuleCount ?? 0,
    registeredAtlasAssetValidationRuleCount:
      statuses.assetValidation?.registeredAtlasAssetValidationRuleCount ?? 0,
    registeredExistingAssetRecordCount:
      statuses.existingRecords?.registeredExistingAssetRecordCount ?? 0,
    existingAssetBindingId: null,
    selectedExistingAssetId: null,
    assetRegistryMatchStatus: null,
    assetManifestMatchStatus: null,
    resolvedLodProfile: null,
    resolvedGlbIdentity: null,
    existingAssetBindingStatus: null,
    existingAssetBindingReason: null,
    lastFailureReason: null
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasControlledExistingAssetBindingVersion:
      state.atlasControlledExistingAssetBindingVersion,
    registeredAssetCount: state.registeredAssetCount,
    registeredModularBindingRuleCount:
      state.registeredModularBindingRuleCount,
    registeredAtlasAssetValidationRuleCount:
      state.registeredAtlasAssetValidationRuleCount,
    registeredExistingAssetRecordCount:
      state.registeredExistingAssetRecordCount,
    existingAssetBindingId: state.existingAssetBindingId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    assetRegistryMatchStatus: state.assetRegistryMatchStatus,
    assetManifestMatchStatus: state.assetManifestMatchStatus,
    resolvedLodProfile: state.resolvedLodProfile,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    existingAssetBindingStatus: state.existingAssetBindingStatus,
    existingAssetBindingReason: state.existingAssetBindingReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasControlledExistingAssetBinding) {
    throw Object.assign(
      new Error("ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_UNAVAILABLE"),
      { reasonCode: "ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function derivePlacementIntent(assetFamilyId) {
  switch (sanitizeString(assetFamilyId)) {
    case "ASSET_FAMILY_VEGETATION_COASTAL_001":
      return "vegetation_coastal_cluster";
    case "ASSET_FAMILY_CIVIC_HERITAGE_001":
      return "civic_landmark_anchor";
    case "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001":
      return "residential_placeholder_mass";
    case "ASSET_FAMILY_COMMERCIAL_URBAN_001":
      return "commercial_frontage_anchor";
    default:
      return null;
  }
}

function resolveInputFeatureClass(input = {}) {
  return sanitizeString(input.featureClass ?? input.matchedFeatureClass);
}

function buildBindingId({
  selectedExistingAssetId,
  resolvedLodProfile,
  dryRunExecutionId
}) {
  return `ATLAS_EXISTING_ASSET_BINDING_${String(
    `${selectedExistingAssetId}:${resolvedLodProfile}:${dryRunExecutionId}`
  )
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120)}`;
}

function fail(registry, reasonCode, patch = {}) {
  updateState(registry, {
    existingAssetBindingId: null,
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    assetRegistryMatchStatus: sanitizeString(patch.assetRegistryMatchStatus) ?? "blocked",
    assetManifestMatchStatus:
      sanitizeString(patch.assetManifestMatchStatus) ?? "blocked",
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    existingAssetBindingStatus: "blocked",
    existingAssetBindingReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    existingAssetBindingId: null,
    selectedExistingAssetId: sanitizeString(patch.selectedExistingAssetId),
    assetRegistryMatchStatus: sanitizeString(patch.assetRegistryMatchStatus) ?? "blocked",
    assetManifestMatchStatus:
      sanitizeString(patch.assetManifestMatchStatus) ?? "blocked",
    resolvedLodProfile: sanitizeString(patch.resolvedLodProfile),
    resolvedGlbIdentity: sanitizeString(patch.resolvedGlbIdentity),
    existingAssetBindingStatus: "blocked",
    existingAssetBindingReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasControlledExistingAssetBinding({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_CONTROLLED_EXISTING_ASSET_BINDING_VERSION,
  atlasAssetRegistry = createDeveloperOnlyAtlasAssetRegistry(),
  modularAssetBindingRegistry =
    createDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistry(),
  atlasAssetWorldValidationFoundation =
    createDeveloperOnlyAtlasAssetWorldValidationFoundation(),
  existingAssetRecords =
    DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS
} = {}) {
  const statuses = {
    assetRegistry: getDeveloperOnlyAtlasAssetRegistryStatus(atlasAssetRegistry),
    modularBinding:
      getDeveloperOnlyAtlasPopulationModularAssetBindingRuleRegistryStatus(
        modularAssetBindingRegistry
      ),
    assetValidation: getDeveloperOnlyAtlasAssetWorldValidationFoundationStatus(
      atlasAssetWorldValidationFoundation
    ),
    existingRecords: {
      registeredExistingAssetRecordCount: existingAssetRecords.length
    }
  };

  const existingAssetRecordsById = new Map(
    existingAssetRecords.map((record) => [record.assetId, deepFreeze({ ...record })])
  );

  return Object.freeze({
    __growgoDeveloperOnlyAtlasControlledExistingAssetBinding: true,
    __state: createState(version, statuses),
    __internal: {
      atlasAssetRegistry,
      modularAssetBindingRegistry,
      atlasAssetWorldValidationFoundation,
      existingAssetRecordsById
    }
  });
}

export function getDeveloperOnlyAtlasControlledExistingAssetBindingStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasControlledExistingAssetBinding) {
    return freezeStatus(createState(null));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasControlledExistingAssetBinding(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const dryRunStatus = sanitizeString(input.dryRunStatus);
  if (dryRunStatus !== "completed") {
    return fail(registry, "EXISTING_ASSET_BINDING_DRY_RUN_NOT_COMPLETED", {
      selectedExistingAssetId: input.selectedExistingAssetId
    });
  }

  const selectedExistingAssetId = sanitizeString(
    input.selectedExistingAssetId ?? input.expectedAssetId
  );
  if (!selectedExistingAssetId) {
    return fail(registry, "MISSING_EXISTING_ASSET_ID");
  }

  let assetRegistryEntry;
  try {
    assetRegistryEntry = resolveDeveloperOnlyAtlasAssetRegistryEntry(
      registry.__internal.atlasAssetRegistry,
      selectedExistingAssetId
    );
  } catch (error) {
    return fail(registry, error.reasonCode ?? "UNKNOWN_ASSET_ID", {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "missing"
    });
  }

  const existingAssetRecord =
    registry.__internal.existingAssetRecordsById.get(selectedExistingAssetId) ??
    null;
  if (!existingAssetRecord) {
    return fail(registry, "EXISTING_ASSET_MANIFEST_NOT_FOUND", {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "missing"
    });
  }

  const modularBindingResult = resolveDeveloperOnlyAtlasPopulationModularAssetBinding(
    registry.__internal.modularAssetBindingRegistry,
    {
      assetFamilyId: input.assetFamilyId,
      selectedAssetId: selectedExistingAssetId,
      featureClass: resolveInputFeatureClass(input),
      materialFamilyId: input.materialFamilyId,
      paletteProfileId: input.paletteProfileId,
      selectorSeed: input.selectorSeed,
      deterministicFeatureIdentity: input.deterministicFeatureIdentity,
      coordinate: input.coordinate,
      candidateIndex: input.candidateIndex ?? 0
    }
  );
  if (!modularBindingResult.matched) {
    return fail(registry, modularBindingResult.reasonCode, {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "matched_record_incompatible"
    });
  }

  const placementIntent = derivePlacementIntent(input.assetFamilyId);
  if (!placementIntent) {
    return fail(registry, "EXISTING_ASSET_BINDING_PLACEMENT_INTENT_UNAVAILABLE", {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "matched_record_incompatible"
    });
  }

  const worldValidationResult =
    resolveDeveloperOnlyAtlasAssetWorldValidationFoundation(
      registry.__internal.atlasAssetWorldValidationFoundation,
      {
        assetFamilyId: input.assetFamilyId,
        selectedAssetId: selectedExistingAssetId,
        assetVariantId: modularBindingResult.assetVariantId,
        materialFamilyId: input.materialFamilyId,
        paletteProfileId: input.paletteProfileId,
        lodProfileId: modularBindingResult.lodProfileId,
        placementIntent,
        coordinate: input.coordinate
      }
    );
  if (!worldValidationResult.matched) {
    return fail(registry, worldValidationResult.reasonCode, {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "matched_record_incompatible",
      resolvedLodProfile: modularBindingResult.lodProfileId
    });
  }

  if (assetRegistryEntry.assetVersion !== existingAssetRecord.assetVersion) {
    return fail(registry, "EXISTING_ASSET_MANIFEST_IDENTITY_MISMATCH", {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "identity_mismatch",
      resolvedLodProfile: modularBindingResult.lodProfileId
    });
  }

  if (existingAssetRecord.resolvedLodProfile !== modularBindingResult.lodProfileId) {
    return fail(registry, "EXISTING_ASSET_LOD_PROFILE_MISMATCH", {
      selectedExistingAssetId,
      assetRegistryMatchStatus: "matched",
      assetManifestMatchStatus: "matched_record_incompatible",
      resolvedLodProfile: modularBindingResult.lodProfileId
    });
  }

  const existingAssetBindingId = buildBindingId({
    selectedExistingAssetId,
    resolvedLodProfile: modularBindingResult.lodProfileId,
    dryRunExecutionId: input.dryRunExecutionId
  });

  const result = deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    existingAssetBindingId,
    selectedExistingAssetId,
    assetRegistryMatchStatus: "matched",
    assetManifestMatchStatus: "matched",
    resolvedLodProfile: modularBindingResult.lodProfileId,
    resolvedGlbIdentity: existingAssetRecord.resolvedGlbIdentity,
    existingAssetBindingStatus: "bound_existing_asset",
    existingAssetBindingReason:
      "validated atlas placement bound to approved existing asset record without generation or rendering",
    canonicalSafetyFlags: canonicalSafetyFlags()
  });

  updateState(registry, {
    existingAssetBindingId: result.existingAssetBindingId,
    selectedExistingAssetId: result.selectedExistingAssetId,
    assetRegistryMatchStatus: result.assetRegistryMatchStatus,
    assetManifestMatchStatus: result.assetManifestMatchStatus,
    resolvedLodProfile: result.resolvedLodProfile,
    resolvedGlbIdentity: result.resolvedGlbIdentity,
    existingAssetBindingStatus: result.existingAssetBindingStatus,
    existingAssetBindingReason: result.existingAssetBindingReason,
    lastFailureReason: null
  });

  return result;
}
