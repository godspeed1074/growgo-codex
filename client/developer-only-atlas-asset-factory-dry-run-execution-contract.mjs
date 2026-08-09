import {
  createDeveloperOnlyAtlasBatchOrchestrationAuditTrails,
  getDeveloperOnlyAtlasBatchOrchestrationAuditTrailsStatus,
  resolveDeveloperOnlyAtlasBatchOrchestrationAuditTrail
} from "./developer-only-atlas-batch-orchestration-audit-trails.mjs";
import {
  createDeveloperOnlyAtlasAssetFactoryBuildRecipes,
  getDeveloperOnlyAtlasAssetFactoryBuildRecipesStatus,
  resolveDeveloperOnlyAtlasAssetFactoryBuildRecipe
} from "./developer-only-atlas-asset-factory-build-recipes.mjs";
import {
  createDeveloperOnlyAtlasExportContractNamingProfiles,
  getDeveloperOnlyAtlasExportContractNamingProfilesStatus,
  resolveDeveloperOnlyAtlasExportContractNamingProfile
} from "./developer-only-atlas-export-contract-naming-profiles.mjs";
import {
  createDeveloperOnlyAtlasAssetFactoryPackageManifests,
  getDeveloperOnlyAtlasAssetFactoryPackageManifestsStatus,
  resolveDeveloperOnlyAtlasAssetFactoryPackageManifest
} from "./developer-only-atlas-asset-factory-package-manifests.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_VERSION =
  "atlas_asset_factory_dry_run_execution_contract_v1";

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

function sanitizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function createState(version, statuses = {}) {
  return {
    atlasAssetFactoryDryRunExecutionContractVersion: version,
    registeredBatchOrchestrationRuleCount:
      statuses.batch?.registeredBatchOrchestrationRuleCount ?? 0,
    registeredAssetFactoryBuildRecipeRuleCount:
      statuses.build?.registeredAssetFactoryBuildRecipeRuleCount ?? 0,
    registeredExportContractRuleCount:
      statuses.export?.registeredExportContractRuleCount ?? 0,
    registeredAssetFactoryManifestRuleCount:
      statuses.manifest?.registeredAssetFactoryManifestRuleCount ?? 0,
    dryRunExecutionId: null,
    selectedJobTicketId: null,
    selectedProductionBatchId: null,
    resolvedBuildRecipeId: null,
    resolvedExportContractId: null,
    expectedAssetId: null,
    expectedOutputFilename: null,
    dependencyValidationStatus: null,
    dryRunStatus: null,
    dryRunReason: null,
    lastFailureReason: null
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasAssetFactoryDryRunExecutionContractVersion:
      state.atlasAssetFactoryDryRunExecutionContractVersion,
    registeredBatchOrchestrationRuleCount:
      state.registeredBatchOrchestrationRuleCount,
    registeredAssetFactoryBuildRecipeRuleCount:
      state.registeredAssetFactoryBuildRecipeRuleCount,
    registeredExportContractRuleCount:
      state.registeredExportContractRuleCount,
    registeredAssetFactoryManifestRuleCount:
      state.registeredAssetFactoryManifestRuleCount,
    dryRunExecutionId: state.dryRunExecutionId,
    selectedJobTicketId: state.selectedJobTicketId,
    selectedProductionBatchId: state.selectedProductionBatchId,
    resolvedBuildRecipeId: state.resolvedBuildRecipeId,
    resolvedExportContractId: state.resolvedExportContractId,
    expectedAssetId: state.expectedAssetId,
    expectedOutputFilename: state.expectedOutputFilename,
    dependencyValidationStatus: state.dependencyValidationStatus,
    dryRunStatus: state.dryRunStatus,
    dryRunReason: state.dryRunReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract) {
    throw Object.assign(
      new Error("ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_UNAVAILABLE"),
      { reasonCode: "ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_UNAVAILABLE" }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode, patch = {}) {
  updateState(registry, {
    dryRunExecutionId: null,
    selectedJobTicketId: sanitizeString(patch.selectedJobTicketId),
    selectedProductionBatchId: sanitizeString(patch.selectedProductionBatchId),
    resolvedBuildRecipeId: null,
    resolvedExportContractId: null,
    expectedAssetId: sanitizeString(patch.expectedAssetId),
    expectedOutputFilename: null,
    dependencyValidationStatus: "blocked",
    dryRunStatus: "blocked",
    dryRunReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    dryRunExecutionId: null,
    selectedJobTicketId: sanitizeString(patch.selectedJobTicketId),
    selectedProductionBatchId: sanitizeString(patch.selectedProductionBatchId),
    resolvedBuildRecipeId: null,
    resolvedExportContractId: null,
    expectedAssetId: sanitizeString(patch.expectedAssetId),
    expectedOutputFilename: null,
    dependencyValidationStatus: "blocked",
    dryRunStatus: "blocked",
    dryRunReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function normalizeFilenameToken(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildExpectedOutputFilename(expectedAssetId, resolvedExportContractId) {
  return `${normalizeFilenameToken(expectedAssetId)}--${normalizeFilenameToken(
    resolvedExportContractId
  )}.glb`;
}

function buildDryRunExecutionId(batchId, jobTicketId) {
  return `ATLAS_DRY_RUN_EXECUTION_${normalizeFilenameToken(
    batchId
  ).toUpperCase()}_${normalizeFilenameToken(jobTicketId).toUpperCase()}`;
}

function findRule(registry, predicate) {
  return registry.__rules.find(predicate) ?? null;
}

export function createDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_DRY_RUN_EXECUTION_CONTRACT_VERSION,
  atlasBatchOrchestrationAuditTrails =
    createDeveloperOnlyAtlasBatchOrchestrationAuditTrails(),
  atlasAssetFactoryBuildRecipes =
    createDeveloperOnlyAtlasAssetFactoryBuildRecipes(),
  atlasExportContractNamingProfiles =
    createDeveloperOnlyAtlasExportContractNamingProfiles(),
  atlasAssetFactoryPackageManifests =
    createDeveloperOnlyAtlasAssetFactoryPackageManifests()
} = {}) {
  const statuses = {
    batch: getDeveloperOnlyAtlasBatchOrchestrationAuditTrailsStatus(
      atlasBatchOrchestrationAuditTrails
    ),
    build: getDeveloperOnlyAtlasAssetFactoryBuildRecipesStatus(
      atlasAssetFactoryBuildRecipes
    ),
    export: getDeveloperOnlyAtlasExportContractNamingProfilesStatus(
      atlasExportContractNamingProfiles
    ),
    manifest: getDeveloperOnlyAtlasAssetFactoryPackageManifestsStatus(
      atlasAssetFactoryPackageManifests
    )
  };

  return {
    __growgoDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract: true,
    __state: createState(version, statuses),
    __internal: {
      atlasBatchOrchestrationAuditTrails,
      atlasAssetFactoryBuildRecipes,
      atlasExportContractNamingProfiles,
      atlasAssetFactoryPackageManifests
    }
  };
}

export function getDeveloperOnlyAtlasAssetFactoryDryRunExecutionContractStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryDryRunExecutionContract) {
    return freezeStatus(createState(null));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasAssetFactoryDryRunExecution(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const productionBundleId = sanitizeString(input.productionBundleId);
  const assetJobTicketId = sanitizeString(input.assetJobTicketId);
  const productionBatchId = sanitizeString(input.productionBatchId);
  const assetPackageManifestId = sanitizeString(input.assetPackageManifestId);
  const assetBuildRecipeId = sanitizeString(input.assetBuildRecipeId);
  const exportContractId = sanitizeString(input.exportContractId);
  const expectedAssetId = sanitizeString(input.selectedAssetId);
  const componentRecipeId = sanitizeString(input.componentRecipeId);
  const materialSlotSetId = sanitizeString(input.materialSlotSetId);
  const attachmentMetadataProfileId = sanitizeString(
    input.attachmentMetadataProfileId
  );
  const glbPreparationProfileId = sanitizeString(input.glbPreparationProfileId);
  const modularBibleFamilyId = sanitizeString(input.modularBibleFamilyId);

  const batchResolution = resolveDeveloperOnlyAtlasBatchOrchestrationAuditTrail(
    registry.__internal.atlasBatchOrchestrationAuditTrails,
    {
      productionBundleId,
      assetJobTicketId
    }
  );
  if (!batchResolution.matched) {
    return fail(registry, batchResolution.reasonCode, {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId: productionBatchId,
      expectedAssetId
    });
  }
  if (productionBatchId && batchResolution.productionBatchId !== productionBatchId) {
    return fail(registry, "DRY_RUN_PRODUCTION_BATCH_ID_MISMATCH", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId: productionBatchId,
      expectedAssetId
    });
  }

  const manifestRule = findRule(
    registry.__internal.atlasAssetFactoryPackageManifests,
    (candidate) => candidate.assetPackageManifestId === assetPackageManifestId
  );
  if (!manifestRule) {
    return fail(registry, "DRY_RUN_MANIFEST_INVALID", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }

  const exportResolution = resolveDeveloperOnlyAtlasExportContractNamingProfile(
    registry.__internal.atlasExportContractNamingProfiles,
    {
      attachmentMetadataProfileId,
      glbPreparationProfileId,
      modularBibleFamilyId,
      selectedAssetId: expectedAssetId
    }
  );
  if (!exportResolution.matched) {
    return fail(registry, "DRY_RUN_EXPORT_CONTRACT_INVALID", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }
  if (exportContractId && exportResolution.exportContractId !== exportContractId) {
    return fail(registry, "DRY_RUN_EXPORT_CONTRACT_MISMATCH", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }

  const manifestResolution = resolveDeveloperOnlyAtlasAssetFactoryPackageManifest(
    registry.__internal.atlasAssetFactoryPackageManifests,
    {
      exportContractId: exportResolution.exportContractId,
      selectedAssetId: expectedAssetId,
      componentRecipeId,
      materialSlotSetId,
      attachmentMetadataProfileId
    }
  );
  if (!manifestResolution.matched) {
    return fail(registry, "DRY_RUN_MANIFEST_INVALID", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }
  if (manifestResolution.assetPackageManifestId !== assetPackageManifestId) {
    return fail(registry, "DRY_RUN_MANIFEST_ID_MISMATCH", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }

  const buildResolution = resolveDeveloperOnlyAtlasAssetFactoryBuildRecipe(
    registry.__internal.atlasAssetFactoryBuildRecipes,
    {
      assetPackageManifestId: manifestResolution.assetPackageManifestId,
      exportValidationProfileId: manifestResolution.exportValidationProfileId,
      exportContractId: exportResolution.exportContractId
    }
  );
  if (!buildResolution.matched) {
    return fail(registry, "DRY_RUN_BUILD_RECIPE_INVALID", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }
  if (assetBuildRecipeId && buildResolution.assetBuildRecipeId !== assetBuildRecipeId) {
    return fail(registry, "DRY_RUN_BUILD_RECIPE_MISMATCH", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }

  const bundleRule = findRule(
    registry.__internal.atlasAssetFactoryBuildRecipes,
    (candidate) => candidate.assetBuildRecipeId === buildResolution.assetBuildRecipeId
  );
  const dependencyValidationStatus =
    sanitizeNumber(buildResolution.dependencyCount) ===
      sanitizeNumber(batchResolution.batchDependencyCount) &&
    bundleRule
      ? "valid"
      : "blocked";
  if (dependencyValidationStatus !== "valid") {
    return fail(registry, "DRY_RUN_DEPENDENCY_VALIDATION_FAILED", {
      selectedJobTicketId: assetJobTicketId,
      selectedProductionBatchId:
        batchResolution.productionBatchId ?? productionBatchId,
      expectedAssetId
    });
  }

  const resolvedBuildRecipeId = buildResolution.assetBuildRecipeId;
  const resolvedExportContractId = exportResolution.exportContractId;
  const selectedProductionBatchId =
    batchResolution.productionBatchId ?? productionBatchId;
  const selectedJobTicketId = assetJobTicketId;
  const expectedOutputFilename = buildExpectedOutputFilename(
    expectedAssetId,
    resolvedExportContractId
  );
  const dryRunExecutionId = buildDryRunExecutionId(
    selectedProductionBatchId,
    selectedJobTicketId
  );
  const dryRunReason =
    "dry run traversed batch dependency build recipe export contract and expected output identity without side effects";

  updateState(registry, {
    dryRunExecutionId,
    selectedJobTicketId,
    selectedProductionBatchId,
    resolvedBuildRecipeId,
    resolvedExportContractId,
    expectedAssetId,
    expectedOutputFilename,
    dependencyValidationStatus,
    dryRunStatus: "completed",
    dryRunReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    dryRunExecutionId,
    selectedJobTicketId,
    selectedProductionBatchId,
    resolvedBuildRecipeId,
    resolvedExportContractId,
    expectedAssetId,
    expectedOutputFilename,
    dependencyValidationStatus,
    dryRunStatus: "completed",
    dryRunReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
