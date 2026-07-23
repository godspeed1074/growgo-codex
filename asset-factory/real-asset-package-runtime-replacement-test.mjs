import {
  buildRealAssetPackageIntegrationContext,
  realAssetPackageIntegrationDefinition,
  validateRealAssetPackageIntegration
} from "./real-asset-package-integration.mjs";
import {
  blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
  validateBlenderPrototypeAssetGenerationGlbExportFoundation
} from "./blender-prototype-asset-generation-glb-export-foundation.mjs";
import {
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import { validateSyntheticWorldSceneConsumer } from "./synthetic-world-scene-consumer.mjs";

export const realAssetPackageRuntimeReplacementTestRequiredFields = Object.freeze([
  "assetId",
  "packageVersion",
  "packageReference",
  "lodReferences",
  "appearanceProfiles"
]);

export const realAssetPackageRuntimeReplacementTestDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  packageVersion: "1.0.0",
  packageReference:
    "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/LIGHTHOUSE_ISLAND_ROCKY_001.glb",
  lodReferences: deepFreeze({
    close: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE.glb",
    gameplay: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY.glb",
    map: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP.glb",
    distantSilhouette: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb"
  }),
  appearanceProfiles: deepFreeze([
    "DAY_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE"
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function buildRealAssetPackageRuntimeReplacementTestContext() {
  return Object.freeze(buildRealAssetPackageIntegrationContext());
}

export function validateRealAssetPackageRuntimeReplacementTest(
  rawDefinition = realAssetPackageRuntimeReplacementTestDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const integrationResult = normalizedOptions.validateRealAssetPackageIntegration(
      normalizedOptions.integrationDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!integrationResult.ok) {
      return freezeFailure(integrationResult);
    }

    const exportFoundationResult =
      normalizedOptions.validateBlenderPrototypeAssetGenerationGlbExportFoundation(
        normalizedOptions.exportFoundationDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!exportFoundationResult.ok) {
      return freezeFailure(exportFoundationResult);
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

    const replacementValidation = buildRuntimeReplacementValidation(
      definition,
      integrationResult.integration,
      exportFoundationResult.exportFoundation,
      visualVerificationResult.visualVerification,
      syntheticWorldResult.syntheticWorldScene
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimeReplacementValidation: replacementValidation
    });
  } catch (error) {
    if (error?.name !== "RealAssetPackageRuntimeReplacementValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      runtimeReplacementValidation: null
    });
  }
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ?? buildRealAssetPackageRuntimeReplacementTestContext();

  return Object.freeze({
    validationContext,
    integrationDefinition:
      options.integrationDefinition ?? realAssetPackageIntegrationDefinition,
    exportFoundationDefinition:
      options.exportFoundationDefinition ??
      blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    syntheticWorldDefinition: options.syntheticWorldDefinition,
    validateRealAssetPackageIntegration:
      typeof options.validateRealAssetPackageIntegration === "function"
        ? options.validateRealAssetPackageIntegration
        : validateRealAssetPackageIntegration,
    validateBlenderPrototypeAssetGenerationGlbExportFoundation:
      typeof options.validateBlenderPrototypeAssetGenerationGlbExportFoundation === "function"
        ? options.validateBlenderPrototypeAssetGenerationGlbExportFoundation
        : validateBlenderPrototypeAssetGenerationGlbExportFoundation,
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

function buildRuntimeReplacementValidation(
  definition,
  integration,
  exportFoundation,
  visualVerification,
  syntheticWorldScene
) {
  validateResolution(definition, integration, exportFoundation);
  validateReplacement(definition, integration, exportFoundation);

  const worldInstanceReference = findWorldInstanceReference(
    syntheticWorldScene.worldInstanceRecords,
    definition.assetId
  );
  const candidateEvaluation = findCandidateEvaluation(
    syntheticWorldScene.candidateEvaluations,
    definition.assetId
  );
  const selectedInstance = findSelectedInstance(
    syntheticWorldScene.selectedInstances,
    worldInstanceReference.instanceId
  );
  const rendererPayload = findRendererPayload(
    visualVerification.rendererPayloads,
    definition.assetId
  );

  validatePipeline(integration, worldInstanceReference, candidateEvaluation, selectedInstance, rendererPayload);

  return Object.freeze({
    assetResolution: Object.freeze({
      assetId: definition.assetId,
      packageVersion: definition.packageVersion,
      packageReference: definition.packageReference,
      lodReferences: deepFreeze(definition.lodReferences),
      appearanceProfiles: deepFreeze(definition.appearanceProfiles)
    }),
    replacementValidation: Object.freeze({
      placeholderReference: integration.replacementValidation.placeholderReference,
      realPackageReference: definition.packageReference,
      sameWorldOutput: true
    }),
    pipelineVerification: Object.freeze({
      assetRegistration: Object.freeze({
        assetId: integration.assetPackage.assetId,
        manifestAssetId: integration.manifestReference.assetId,
        recipeId: integration.manifestReference.recipeId
      }),
      worldInstanceReference: Object.freeze({
        instanceId: worldInstanceReference.instanceId,
        assetId: worldInstanceReference.assetId,
        locationId: worldInstanceReference.locationId
      }),
      streamingSelection: Object.freeze({
        instanceId: selectedInstance.instanceId,
        lodProfile: selectedInstance.selectedLodProfile,
        streamingState: selectedInstance.streamingState,
        loadingPriority: selectedInstance.loadingPriority
      }),
      rendererPayload: Object.freeze({
        assetId: rendererPayload.rendererAssetReference.assetId,
        manifestId: rendererPayload.rendererAssetReference.manifestId,
        recipeId: rendererPayload.rendererAssetReference.recipeId,
        transformData: deepFreeze(rendererPayload.transformData)
      })
    }),
    deterministicVerification: Object.freeze({
      worldSeed: syntheticWorldScene.world.worldSeed,
      locationId: worldInstanceReference.locationId,
      assetId: definition.assetId,
      deterministicOutputVerified: true
    }),
    compatibility: Object.freeze({
      assetRegistrationVerified: true,
      worldInstanceVerified: true,
      streamingSelectionVerified: true,
      rendererPayloadVerified: true,
      syntheticReplacementVerified: true,
      deterministicOutputVerified: true,
      passiveOnly: true
    })
  });
}

function validateResolution(definition, integration, exportFoundation) {
  if (definition.assetId !== integration.assetPackage.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Runtime replacement assetId must match the integrated lighthouse asset package."
    );
  }

  if (definition.packageVersion !== integration.assetPackage.version) {
    throw createValidationError(
      "package_version_mismatch",
      "Runtime replacement packageVersion must match the integrated lighthouse package version."
    );
  }

  if (
    definition.packageReference !==
    exportFoundation.syntheticReplacementVerification.packageReference
  ) {
    throw createValidationError(
      "package_reference_mismatch",
      "Runtime replacement packageReference must match the prototype GLB export package reference."
    );
  }

  for (const [lodKey, filename] of Object.entries(definition.lodReferences)) {
    const integratedFilename = integration.assetPackage.lodReferences[lodKey];
    if (filename !== integratedFilename) {
      throw createValidationError(
        "lod_reference_mismatch",
        `Runtime replacement LOD reference ${lodKey} must match the integrated lighthouse package LOD reference.`
      );
    }
  }

  if (
    JSON.stringify(definition.appearanceProfiles) !==
    JSON.stringify(integration.assetPackage.appearanceProfiles)
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Runtime replacement appearance profiles must match the integrated lighthouse package appearance profiles."
    );
  }
}

function validateReplacement(definition, integration, exportFoundation) {
  if (!integration.replacementValidation.placeholderReference.includes("_PLACEHOLDER.glb")) {
    throw createValidationError(
      "placeholder_reference_missing",
      "Runtime replacement validation requires the lighthouse placeholder package reference."
    );
  }

  if (integration.replacementValidation.realPackageReference !== definition.packageReference) {
    throw createValidationError(
      "real_package_reference_mismatch",
      "Runtime replacement validation requires the same real package reference as the lighthouse package integration."
    );
  }

  if (exportFoundation.syntheticReplacementVerification.sameWorldOutput !== true) {
    throw createValidationError(
      "replacement_world_output_changed",
      "Runtime replacement validation requires prototype export replacement to preserve the same world output."
    );
  }
}

function validatePipeline(
  integration,
  worldInstanceReference,
  candidateEvaluation,
  selectedInstance,
  rendererPayload
) {
  if (worldInstanceReference.assetId !== integration.assetPackage.assetId) {
    throw createValidationError(
      "world_instance_asset_mismatch",
      "Runtime replacement world instance asset must match the lighthouse asset registration."
    );
  }

  if (candidateEvaluation.assetInstance.locationId !== worldInstanceReference.locationId) {
    throw createValidationError(
      "world_instance_location_mismatch",
      "Runtime replacement world instance location must match the evaluated synthetic world location."
    );
  }

  if (selectedInstance.instanceId !== worldInstanceReference.instanceId) {
    throw createValidationError(
      "streaming_instance_mismatch",
      "Runtime replacement selected streaming instance must match the lighthouse world instance."
    );
  }

  if (
    selectedInstance.selectedLodProfile !==
    candidateEvaluation.candidateEvaluation.selectedLodProfile
  ) {
    throw createValidationError(
      "streaming_lod_mismatch",
      "Runtime replacement selected streaming LOD must match the evaluated synthetic world LOD."
    );
  }

  if (
    selectedInstance.streamingState !==
    candidateEvaluation.candidateEvaluation.streamingState
  ) {
    throw createValidationError(
      "streaming_state_mismatch",
      "Runtime replacement selected streaming state must match the evaluated synthetic world state."
    );
  }

  if (rendererPayload.rendererAssetReference.assetId !== integration.assetPackage.assetId) {
    throw createValidationError(
      "renderer_asset_mismatch",
      "Runtime replacement renderer payload asset must match the lighthouse asset registration."
    );
  }

  if (rendererPayload.rendererAssetReference.recipeId !== integration.manifestReference.recipeId) {
    throw createValidationError(
      "renderer_recipe_mismatch",
      "Runtime replacement renderer payload recipe must match the lighthouse manifest recipe."
    );
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "real asset package runtime replacement definition"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    packageVersion: normalizeVersion(definition.packageVersion, "packageVersion"),
    packageReference: normalizeFilename(definition.packageReference, "packageReference"),
    lodReferences: normalizeLodReferences(definition.lodReferences),
    appearanceProfiles: deepFreeze(
      normalizeUppercaseStringArray(definition.appearanceProfiles, "appearanceProfiles")
    )
  });
}

function normalizeLodReferences(value) {
  const lodReferences = asPlainObject(value, "lodReferences");
  const normalized = {};
  for (const lodKey of ["close", "gameplay", "map", "distantSilhouette"]) {
    normalized[lodKey] = normalizeFilename(
      lodReferences[lodKey],
      `lodReferences.${lodKey}`
    );
  }
  return deepFreeze(normalized);
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

function normalizeFilename(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!normalized.endsWith(".glb")) {
    throw createValidationError(
      "invalid_file_extension",
      `Field ${fieldName} must point to a GLB reference.`
    );
  }
  return normalized;
}

function assertRequiredFields(definition) {
  for (const fieldName of realAssetPackageRuntimeReplacementTestRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Runtime replacement definition is missing required field ${fieldName}.`
      );
    }
  }
}

function findWorldInstanceReference(worldInstanceRecords, assetId) {
  const worldInstanceReference =
    worldInstanceRecords.find((entry) => entry.assetId === assetId) ?? null;
  if (!worldInstanceReference) {
    throw createValidationError(
      "missing_world_instance_reference",
      `Runtime replacement world instance reference for ${assetId} is unavailable.`
    );
  }
  return worldInstanceReference;
}

function findCandidateEvaluation(candidateEvaluations, assetId) {
  const candidateEvaluation =
    candidateEvaluations.find((entry) => entry.assetInstance.assetId === assetId) ?? null;
  if (!candidateEvaluation) {
    throw createValidationError(
      "missing_candidate_evaluation",
      `Runtime replacement candidate evaluation for ${assetId} is unavailable.`
    );
  }
  return candidateEvaluation;
}

function findSelectedInstance(selectedInstances, instanceId) {
  const selectedInstance =
    selectedInstances.find((entry) => entry.instanceId === instanceId) ?? null;
  if (!selectedInstance) {
    throw createValidationError(
      "missing_selected_instance",
      `Runtime replacement selected instance ${instanceId} is unavailable.`
    );
  }
  return selectedInstance;
}

function findRendererPayload(rendererPayloads, assetId) {
  const rendererPayload =
    rendererPayloads.find((entry) => entry.rendererAssetReference.assetId === assetId) ??
    null;
  if (!rendererPayload) {
    throw createValidationError(
      "missing_renderer_payload",
      `Runtime replacement renderer payload for ${assetId} is unavailable.`
    );
  }
  return rendererPayload;
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

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    runtimeReplacementValidation: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "RealAssetPackageRuntimeReplacementValidationError";
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
