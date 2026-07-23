import {
  supportedAssetPackageImportFormats,
  supportedAssetPackageLodKeys
} from "./asset-package-import-contract.mjs";
import {
  buildFirstBlenderGeneratedAssetPrototypeWorkflowContext,
  firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
  validateFirstBlenderGeneratedAssetPrototypeWorkflow
} from "./first-blender-generated-asset-prototype-workflow.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  buildSyntheticWorldCustom25DVisualVerificationContext,
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import { buildSyntheticWorldSceneConsumer, validateSyntheticWorldSceneConsumer } from "./synthetic-world-scene-consumer.mjs";

export const realAssetPackageIntegrationRequiredFields = Object.freeze([
  "assetId",
  "version",
  "packageLocation",
  "modelReferences",
  "materialReferences",
  "textureReferences",
  "lodReferences",
  "appearanceProfiles"
]);

export const realAssetPackageIntegrationDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  version: "1.0.0",
  packageLocation: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export",
  modelReferences: {
    primary: "LIGHTHOUSE_ISLAND_ROCKY_001.glb"
  },
  materialReferences: [
    "LIGHTHOUSE_MASONRY_SHARED_001",
    "LIGHTHOUSE_LANTERN_SHARED_001",
    "LIGHTHOUSE_BEAM_SHARED_001"
  ],
  textureReferences: ["LIGHTHOUSE_ATLAS_COASTAL_001"],
  lodReferences: {
    close: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE.glb",
    gameplay: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY.glb",
    map: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP.glb",
    distantSilhouette: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb"
  },
  appearanceProfiles: [
    "DAY_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE"
  ],
  componentReferences: [
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ],
  recipeId: "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
  performanceMetadata: {
    storageTargetKb: 256,
    ramTargetKb: 384,
    gpuVertexBudget: 480,
    batchingExpected: true
  },
  rendererCompatibilityProfile: "custom-2.5d-passive"
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const supportedRendererProfile = "custom-2.5d-passive";

export function buildRealAssetPackageIntegrationContext() {
  return Object.freeze(buildSyntheticWorldCustom25DVisualVerificationContext());
}

export function validateRealAssetPackageIntegration(
  rawRegistration = realAssetPackageIntegrationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeIntegrationOptions(options);
    const registration = normalizeRealAssetPackageRegistration(rawRegistration);

    const prototypeWorkflowResult =
      normalizedOptions.validateFirstBlenderGeneratedAssetPrototypeWorkflow(
        normalizedOptions.prototypeWorkflowDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!prototypeWorkflowResult.ok) {
      return freezeFailure(prototypeWorkflowResult);
    }

    const blenderBridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.blenderBridgeDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!blenderBridgeResult.ok) {
      return freezeFailure(blenderBridgeResult);
    }

    const visualVerificationResult =
      normalizedOptions.validateSyntheticWorldCustom25DVisualVerification(
        normalizedOptions.visualVerificationDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!visualVerificationResult.ok) {
      return freezeFailure(visualVerificationResult);
    }

    const syntheticWorldResult = normalizedOptions.validateSyntheticWorldSceneConsumer(
      normalizedOptions.syntheticWorldDefinition,
      { context: normalizedOptions.validationContext }
    );
    if (!syntheticWorldResult.ok) {
      return freezeFailure(syntheticWorldResult);
    }

    const integration = buildRealAssetPackageIntegrationResult(
      registration,
      prototypeWorkflowResult.prototypeWorkflow.workflow,
      blenderBridgeResult.bridge.request,
      visualVerificationResult.visualVerification,
      syntheticWorldResult.syntheticWorldScene,
      normalizedOptions.validationContext
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      integration
    });
  } catch (error) {
    if (error?.name !== "RealAssetPackageIntegrationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      integration: null
    });
  }
}

function normalizeIntegrationOptions(options) {
  const validationContext =
    options.validationContext ?? buildRealAssetPackageIntegrationContext();

  return Object.freeze({
    validationContext,
    prototypeWorkflowDefinition:
      options.prototypeWorkflowDefinition ??
      firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
    blenderBridgeDefinition:
      options.blenderBridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    syntheticWorldDefinition:
      options.syntheticWorldDefinition ?? buildSyntheticWorldSceneConsumer().syntheticWorldScene?.world ?? undefined,
    validateFirstBlenderGeneratedAssetPrototypeWorkflow:
      typeof options.validateFirstBlenderGeneratedAssetPrototypeWorkflow === "function"
        ? options.validateFirstBlenderGeneratedAssetPrototypeWorkflow
        : validateFirstBlenderGeneratedAssetPrototypeWorkflow,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation,
    validateSyntheticWorldCustom25DVisualVerification:
      typeof options.validateSyntheticWorldCustom25DVisualVerification === "function"
        ? options.validateSyntheticWorldCustom25DVisualVerification
        : validateSyntheticWorldCustom25DVisualVerification,
    validateSyntheticWorldSceneConsumer:
      typeof options.validateSyntheticWorldSceneConsumer === "function"
        ? options.validateSyntheticWorldSceneConsumer
        : validateSyntheticWorldSceneConsumer
  });
}

function buildRealAssetPackageIntegrationResult(
  registration,
  prototypeWorkflow,
  blenderBridgeRequest,
  visualVerification,
  syntheticWorldScene,
  context
) {
  const asset = context.assetRegistry.findAssetById(registration.assetId);
  const manifest = context.manifestRegistry.findManifestByAssetId(registration.assetId);
  const recipe = context.recipeRegistry.findRecipeById(registration.recipeId);

  if (!asset || !context.assetRegistry.isAssetAvailable(registration.assetId)) {
    throw createValidationError(
      "missing_asset_reference",
      `Asset ${registration.assetId} is not available for real package integration.`
    );
  }

  if (!manifest || !context.manifestRegistry.isManifestAvailable(registration.assetId)) {
    throw createValidationError(
      "missing_manifest_reference",
      `Manifest ${registration.assetId} is not available for real package integration.`
    );
  }

  if (!recipe || !context.recipeRegistry.isRecipeAvailable(registration.recipeId)) {
    throw createValidationError(
      "missing_recipe_reference",
      `Recipe ${registration.recipeId} is not available for real package integration.`
    );
  }

  validateIdentity(registration, prototypeWorkflow, asset, manifest, recipe);
  validateComponentCompatibility(registration, manifest, recipe, context);
  validateManifestCompatibility(registration, manifest);
  validateRecipeCompatibility(registration, recipe, prototypeWorkflow, blenderBridgeRequest);
  validateImportContractCompatibility(registration, prototypeWorkflow, blenderBridgeRequest);
  validatePerformanceMetadata(registration);

  const lighthouseWorldInstanceReference =
    findWorldInstanceReference(syntheticWorldScene.worldInstanceRecords, registration.assetId);
  const lighthouseRendererPayloadReference =
    findRendererPayloadReference(visualVerification.rendererPayloads, registration.assetId);

  const placeholderReference =
    `${prototypeWorkflow.prototypeGenerationMetadata.exportPreparationData.exportFolder}/${prototypeWorkflow.prototypeGenerationMetadata.exportPreparationData.glbNamingPrefix}_PLACEHOLDER.glb`;
  const realPackageReference = `${registration.packageLocation}/${registration.modelReferences.primary}`;

  const worldOutputSnapshot = Object.freeze({
    worldId: visualVerification.worldId,
    receivedObjectCount: visualVerification.renderAcceptanceState.receivedObjectCount,
    lighthouseRendererAssetId:
      lighthouseRendererPayloadReference.rendererAssetReference.assetId,
    lighthouseTransformData: deepFreeze(lighthouseRendererPayloadReference.transformData),
    lighthouseLodProfile:
      findAssetState(visualVerification.lodProfiles, registration.assetId, "lodProfile")
        .lodProfile,
    lighthouseVisibilityState:
      findAssetState(
        visualVerification.visibilityStates,
        registration.assetId,
        "visibilityState"
      ).visibilityState
  });

  return Object.freeze({
    assetPackage: registration,
    manifestReference: Object.freeze({
      assetId: manifest.assetId,
      recipeId: manifest.recipeId,
      componentReferences: deepFreeze([...manifest.componentReferences])
    }),
    worldInstanceReference: Object.freeze({
      instanceId: lighthouseWorldInstanceReference.instanceId,
      assetId: lighthouseWorldInstanceReference.assetId,
      locationId: lighthouseWorldInstanceReference.locationId,
      placementRuleId: lighthouseWorldInstanceReference.placementRuleId
    }),
    rendererPayloadReference: Object.freeze({
      assetId: lighthouseRendererPayloadReference.rendererAssetReference.assetId,
      manifestId: lighthouseRendererPayloadReference.rendererAssetReference.manifestId,
      recipeId: lighthouseRendererPayloadReference.rendererAssetReference.recipeId,
      transformData: deepFreeze(lighthouseRendererPayloadReference.transformData)
    }),
    replacementValidation: Object.freeze({
      placeholderReference,
      realPackageReference,
      sameWorldOutput: true,
      worldOutputSnapshot
    }),
    compatibility: Object.freeze({
      identityVerified: true,
      componentCompatibilityVerified: true,
      manifestCompatibilityVerified: true,
      recipeCompatibilityVerified: true,
      importContractCompatibilityVerified: true,
      performanceMetadataVerified: true,
      syntheticReplacementVerified: true,
      passiveOnly: true
    })
  });
}

function validateIdentity(registration, prototypeWorkflow, asset, manifest, recipe) {
  if (registration.assetId !== "LIGHTHOUSE_ISLAND_ROCKY_001") {
    throw createValidationError(
      "invalid_target_asset",
      "Phase 31 real asset package integration is approved only for LIGHTHOUSE_ISLAND_ROCKY_001."
    );
  }

  if (
    registration.assetId !== prototypeWorkflow.assetId ||
    registration.assetId !== asset.assetId ||
    registration.assetId !== manifest.assetId
  ) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Real asset package identity must match the lighthouse prototype workflow, asset registry, and manifest identity."
    );
  }

  if (registration.recipeId !== recipe.recipeId || manifest.recipeId !== recipe.recipeId) {
    throw createValidationError(
      "recipe_identity_mismatch",
      "Real asset package recipe identity must match the lighthouse manifest and recipe records."
    );
  }
}

function validateComponentCompatibility(registration, manifest, recipe, context) {
  const expectedComponentReferences = manifest.componentReferences;
  if (JSON.stringify(registration.componentReferences) !== JSON.stringify(expectedComponentReferences)) {
    throw createValidationError(
      "component_reference_mismatch",
      "Real asset package component references must match the lighthouse manifest component references exactly."
    );
  }

  if (JSON.stringify(registration.componentReferences) !== JSON.stringify(recipe.components)) {
    throw createValidationError(
      "recipe_component_mismatch",
      "Real asset package component references must match the lighthouse recipe component references exactly."
    );
  }

  for (const componentId of registration.componentReferences) {
    if (!context.componentLibrary.hasComponent(componentId)) {
      throw createValidationError(
        "missing_component_reference",
        `Real asset package component ${componentId} is not available in the component library.`
      );
    }
    if (!context.componentLibrary.isComponentAvailable(componentId)) {
      throw createValidationError(
        "unavailable_component_reference",
        `Real asset package component ${componentId} is not approved for integration.`
      );
    }
  }
}

function validateManifestCompatibility(registration, manifest) {
  if (manifest.status !== "validated") {
    throw createValidationError(
      "manifest_not_validated",
      "Real asset package integration requires a validated lighthouse manifest."
    );
  }

  if (registration.assetId !== manifest.assetId || registration.recipeId !== manifest.recipeId) {
    throw createValidationError(
      "manifest_reference_mismatch",
      "Real asset package registration must preserve the lighthouse manifest asset and recipe references."
    );
  }
}

function validateRecipeCompatibility(
  registration,
  recipe,
  prototypeWorkflow,
  blenderBridgeRequest
) {
  if (recipe.status !== "validated") {
    throw createValidationError(
      "recipe_not_validated",
      "Real asset package integration requires a validated lighthouse recipe."
    );
  }

  if (registration.recipeId !== prototypeWorkflow.blenderPrototypeGenerationRequest.recipeId) {
    throw createValidationError(
      "prototype_recipe_mismatch",
      "Real asset package recipe must match the lighthouse prototype workflow recipe reference."
    );
  }

  if (!blenderBridgeRequest.componentReferences.every((entry) => registration.componentReferences.includes(entry))) {
    throw createValidationError(
      "bridge_component_mismatch",
      "Real asset package component references must cover the lighthouse Blender bridge component references."
    );
  }

  if (
    JSON.stringify(registration.appearanceProfiles) !==
    JSON.stringify(prototypeWorkflow.blenderPrototypeGenerationRequest.appearanceProfiles)
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Real asset package appearance profiles must match the lighthouse prototype appearance profiles."
    );
  }
}

function validateImportContractCompatibility(registration, prototypeWorkflow, blenderBridgeRequest) {
  const format = getFileExtension(registration.modelReferences.primary);
  if (!supportedAssetPackageImportFormats.includes(format)) {
    throw createValidationError(
      "unsupported_format",
      `Real asset package format ${format} is not approved by the asset package import contract.`
    );
  }

  for (const lodKey of supportedAssetPackageLodKeys) {
    const filename = registration.lodReferences[lodKey];
    if (getFileExtension(filename) !== format) {
      throw createValidationError(
        "lod_format_mismatch",
        `LOD file ${lodKey} must use the same ${format} package format.`
      );
    }

    const expectedFragment = `_LOD_${normalizeLodSegment(lodKey)}.`;
    if (!filename.includes(expectedFragment)) {
      throw createValidationError(
        "invalid_lod_naming",
        `LOD file ${lodKey} must include ${expectedFragment} in its filename.`
      );
    }
  }

  const expectedMaterialReferences =
    prototypeWorkflow.blenderPrototypeGenerationRequest.materialReferences;
  if (
    JSON.stringify(registration.materialReferences) !==
    JSON.stringify(expectedMaterialReferences)
  ) {
    throw createValidationError(
      "material_reference_mismatch",
      "Real asset package material references must match the lighthouse prototype material references."
    );
  }

  if (
    registration.rendererCompatibilityProfile !== supportedRendererProfile ||
    blenderBridgeRequest.metadata.rendererCompatibilityProfile !== supportedRendererProfile
  ) {
    throw createValidationError(
      "renderer_profile_mismatch",
      "Real asset package renderer compatibility must remain aligned to the passive Custom 2.5D renderer profile."
    );
  }
}

function validatePerformanceMetadata(registration) {
  const performanceMetadata = asPlainObject(
    registration.performanceMetadata,
    "performanceMetadata"
  );
  const requiredFields = ["storageTargetKb", "ramTargetKb", "gpuVertexBudget"];

  for (const fieldName of requiredFields) {
    if (!Number.isInteger(performanceMetadata[fieldName]) || performanceMetadata[fieldName] <= 0) {
      throw createValidationError(
        "invalid_performance_metadata",
        `Real asset package performance field ${fieldName} must be a positive integer.`
      );
    }
  }

  if (typeof performanceMetadata.batchingExpected !== "boolean") {
    throw createValidationError(
      "invalid_performance_metadata",
      "Real asset package performance metadata must explicitly declare batchingExpected."
    );
  }
}

function findWorldInstanceReference(worldInstanceRecords, assetId) {
  const worldInstanceReference =
    worldInstanceRecords.find((entry) => entry.assetId === assetId) ?? null;
  if (!worldInstanceReference) {
    throw createValidationError(
      "missing_world_instance_reference",
      `Synthetic lighthouse world instance reference for ${assetId} is unavailable.`
    );
  }
  return worldInstanceReference;
}

function findRendererPayloadReference(rendererPayloads, assetId) {
  const rendererPayloadReference =
    rendererPayloads.find((entry) => entry.rendererAssetReference.assetId === assetId) ??
    null;
  if (!rendererPayloadReference) {
    throw createValidationError(
      "missing_renderer_payload_reference",
      `Synthetic lighthouse renderer payload reference for ${assetId} is unavailable.`
    );
  }
  return rendererPayloadReference;
}

function findAssetState(stateEntries, assetId, fieldName) {
  const entry = stateEntries.find((item) => item.assetId === assetId) ?? null;
  if (!entry) {
    throw createValidationError(
      "missing_asset_state",
      `Synthetic lighthouse ${fieldName} for ${assetId} is unavailable.`
    );
  }
  return entry;
}

function normalizeRealAssetPackageRegistration(rawRegistration) {
  const registration = asPlainObject(rawRegistration, "real asset package registration");
  assertRequiredFields(registration);

  const assetId = normalizePermanentId(registration.assetId, "assetId");
  const version = normalizeVersion(registration.version, "version");
  const packageLocation = normalizeStringValue(registration.packageLocation, "packageLocation");
  const modelReferences = normalizeModelReferences(registration.modelReferences);
  const materialReferences = deepFreeze(
    normalizePermanentIdArray(registration.materialReferences, "materialReferences")
  );
  const textureReferences = deepFreeze(
    normalizePermanentIdArray(registration.textureReferences, "textureReferences")
  );
  const lodReferences = normalizeLodReferences(registration.lodReferences, getFileExtension(modelReferences.primary));
  const appearanceProfiles = deepFreeze(
    normalizeUppercaseStringArray(registration.appearanceProfiles, "appearanceProfiles")
  );
  const componentReferences = deepFreeze(
    normalizePermanentIdArray(registration.componentReferences, "componentReferences")
  );
  const recipeId = normalizePermanentId(registration.recipeId, "recipeId");
  const performanceMetadata = deepFreeze(
    asPlainObject(registration.performanceMetadata, "performanceMetadata")
  );
  const rendererCompatibilityProfile = normalizeStringValue(
    registration.rendererCompatibilityProfile,
    "rendererCompatibilityProfile"
  );

  return deepFreeze({
    assetId,
    version,
    packageLocation,
    modelReferences,
    materialReferences,
    textureReferences,
    lodReferences,
    appearanceProfiles,
    componentReferences,
    recipeId,
    performanceMetadata,
    rendererCompatibilityProfile
  });
}

function normalizeModelReferences(value) {
  const modelReferences = asPlainObject(value, "modelReferences");
  return deepFreeze({
    primary: normalizeFilename(
      modelReferences.primary,
      "modelReferences.primary"
    )
  });
}

function normalizeLodReferences(value, expectedFormat) {
  const lodReferences = asPlainObject(value, "lodReferences");
  const normalized = {};

  for (const lodKey of supportedAssetPackageLodKeys) {
    normalized[lodKey] = normalizeFilename(
      lodReferences[lodKey],
      `lodReferences.${lodKey}`,
      expectedFormat
    );
  }

  return deepFreeze(normalized);
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeUppercaseStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) => {
    const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`);
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalized)) {
      throw createValidationError(
        "invalid_field_value",
        `${fieldName}[${index}] must use the approved uppercase appearance profile format.`
      );
    }
    return normalized;
  });
}

function normalizeFilename(value, fieldName, expectedFormat = null) {
  const normalized = normalizeStringValue(value, fieldName);
  const extension = getFileExtension(normalized);
  if (expectedFormat && extension !== expectedFormat) {
    throw createValidationError(
      "invalid_file_extension",
      `File ${fieldName} must use the declared ${expectedFormat} format.`
    );
  }
  if (!supportedAssetPackageImportFormats.includes(extension)) {
    throw createValidationError(
      "unsupported_format",
      `File ${fieldName} must use an approved asset package format.`
    );
  }
  return normalized;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }
  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
}

function assertRequiredFields(registration) {
  for (const fieldName of realAssetPackageIntegrationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(registration, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Real asset package integration is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeLodSegment(lodKey) {
  return lodKey === "distantSilhouette"
    ? "DISTANT_SILHOUETTE"
    : lodKey.toUpperCase();
}

function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1).toLowerCase() : "";
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    integration: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "RealAssetPackageIntegrationValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
