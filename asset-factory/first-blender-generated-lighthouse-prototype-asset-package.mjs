import {
  firstGrowGoLighthouseAssetPrototypeDefinition,
  validateFirstGrowGoLighthouseAssetPrototype
} from "./first-growgo-lighthouse-asset-prototype.mjs";
import {
  blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
  validateBlenderPrototypeAssetGenerationGlbExportFoundation
} from "./blender-prototype-asset-generation-glb-export-foundation.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  buildAssetGenerationWorkspaceAppearanceProfileFoundationContext,
  validateAssetGenerationWorkspaceAppearanceProfileFoundation
} from "./asset-generation-workspace-appearance-profile-foundation.mjs";
import {
  buildRealAssetPackageIntegrationContext,
  realAssetPackageIntegrationDefinition,
  validateRealAssetPackageIntegration
} from "./real-asset-package-integration.mjs";

export const firstBlenderGeneratedLighthousePrototypeAssetPackageRequiredFields =
  Object.freeze([
    "assetId",
    "modelReferences",
    "materialReferences",
    "textureReferences",
    "lodReferences",
    "appearanceProfiles",
    "prototypeComponentDefinitions",
    "metadata",
    "performanceMetadata"
  ]);

export const firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  modelReferences: {
    primary: "LIGHTHOUSE_ISLAND_ROCKY_001.glb",
    placeholder: "LIGHTHOUSE_ISLAND_ROCKY_001_PLACEHOLDER.glb"
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
    "SUNSET_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE"
  ],
  prototypeComponentDefinitions:
    firstGrowGoLighthouseAssetPrototypeDefinition.prototypeModuleDefinitions,
  metadata: {
    packageId: "LIGHTHOUSE_ISLAND_ROCKY_PROTOTYPE_PACKAGE_001",
    packageLocation:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export",
    assetMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/metadata/lighthouse-island-rocky-prototype.json",
    exportMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/lighthouse-island-rocky-export.json",
    validationMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/lighthouse-island-rocky-validation.json",
    packageFormat: "glb-prototype",
    rendererCompatibilityProfile: "custom-2.5d-passive",
    productionReady: false
  },
  performanceMetadata: {
    storageTargetKb: 256,
    ramTargetKb: 384,
    gpuVertexBudget: 480,
    batchingExpected: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodKeys = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);

export function buildFirstBlenderGeneratedLighthousePrototypeAssetPackageContext() {
  return Object.freeze(buildRealAssetPackageIntegrationContext());
}

export function validateFirstBlenderGeneratedLighthousePrototypeAssetPackage(
  rawPackage = firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const prototypeAssetPackage = normalizePrototypeAssetPackage(rawPackage);

    const lighthousePrototypeResult =
      normalizedOptions.validateFirstGrowGoLighthouseAssetPrototype(
        normalizedOptions.lighthousePrototypeDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!lighthousePrototypeResult.ok) {
      return freezeFailure(lighthousePrototypeResult);
    }

    const exportFoundationResult =
      normalizedOptions.validateBlenderPrototypeAssetGenerationGlbExportFoundation(
        normalizedOptions.exportFoundationDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!exportFoundationResult.ok) {
      return freezeFailure(exportFoundationResult);
    }

    const bridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.bridgeDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const workspaceResult =
      normalizedOptions.validateAssetGenerationWorkspaceAppearanceProfileFoundation(
        normalizedOptions.workspaceDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!workspaceResult.ok) {
      return freezeFailure(workspaceResult);
    }

    const integrationResult = normalizedOptions.validateRealAssetPackageIntegration(
      normalizedOptions.integrationDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!integrationResult.ok) {
      return freezeFailure(integrationResult);
    }

    const lighthouseAssetPackage = buildLighthouseAssetPackageResult(
      prototypeAssetPackage,
      lighthousePrototypeResult.lighthousePrototype,
      exportFoundationResult.exportFoundation,
      bridgeResult.bridge,
      workspaceResult.workspaceProfile,
      integrationResult.integration
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      lighthouseAssetPackage
    });
  } catch (error) {
    if (
      error?.name !==
      "FirstBlenderGeneratedLighthousePrototypeAssetPackageValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      lighthouseAssetPackage: null
    });
  }
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ??
    buildFirstBlenderGeneratedLighthousePrototypeAssetPackageContext();

  return Object.freeze({
    validationContext,
    lighthousePrototypeDefinition:
      options.lighthousePrototypeDefinition ??
      firstGrowGoLighthouseAssetPrototypeDefinition,
    exportFoundationDefinition:
      options.exportFoundationDefinition ??
      blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
    bridgeDefinition:
      options.bridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    workspaceDefinition:
      options.workspaceDefinition ??
      assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
    integrationDefinition:
      options.integrationDefinition ?? realAssetPackageIntegrationDefinition,
    validateFirstGrowGoLighthouseAssetPrototype:
      typeof options.validateFirstGrowGoLighthouseAssetPrototype === "function"
        ? options.validateFirstGrowGoLighthouseAssetPrototype
        : validateFirstGrowGoLighthouseAssetPrototype,
    validateBlenderPrototypeAssetGenerationGlbExportFoundation:
      typeof options.validateBlenderPrototypeAssetGenerationGlbExportFoundation ===
      "function"
        ? options.validateBlenderPrototypeAssetGenerationGlbExportFoundation
        : validateBlenderPrototypeAssetGenerationGlbExportFoundation,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation,
    validateAssetGenerationWorkspaceAppearanceProfileFoundation:
      typeof options.validateAssetGenerationWorkspaceAppearanceProfileFoundation ===
      "function"
        ? options.validateAssetGenerationWorkspaceAppearanceProfileFoundation
        : validateAssetGenerationWorkspaceAppearanceProfileFoundation,
    validateRealAssetPackageIntegration:
      typeof options.validateRealAssetPackageIntegration === "function"
        ? options.validateRealAssetPackageIntegration
        : validateRealAssetPackageIntegration
  });
}

function buildLighthouseAssetPackageResult(
  prototypeAssetPackage,
  lighthousePrototype,
  exportFoundation,
  bridge,
  workspaceProfile,
  integration
) {
  validatePackageIdentity(
    prototypeAssetPackage,
    lighthousePrototype,
    exportFoundation,
    integration
  );
  validateComponentDefinitions(
    prototypeAssetPackage,
    lighthousePrototype,
    bridge,
    integration
  );
  validatePackageStructure(
    prototypeAssetPackage,
    exportFoundation,
    integration
  );
  validateWorkspaceCompatibility(
    prototypeAssetPackage,
    workspaceProfile,
    integration
  );
  validatePerformanceCompatibility(prototypeAssetPackage, workspaceProfile, integration);

  return Object.freeze({
    prototypeAssetPackage: Object.freeze({
      assetId: prototypeAssetPackage.assetId,
      modelReferences: deepFreeze(prototypeAssetPackage.modelReferences),
      materialReferences: deepFreeze(prototypeAssetPackage.materialReferences),
      textureReferences: deepFreeze(prototypeAssetPackage.textureReferences),
      lodReferences: deepFreeze(prototypeAssetPackage.lodReferences),
      appearanceProfiles: deepFreeze(prototypeAssetPackage.appearanceProfiles),
      prototypeComponentDefinitions: deepFreeze(
        prototypeAssetPackage.prototypeComponentDefinitions
      ),
      metadata: deepFreeze(prototypeAssetPackage.metadata),
      performanceMetadata: deepFreeze(prototypeAssetPackage.performanceMetadata)
    }),
    compatibility: Object.freeze({
      componentCompatibilityVerified: true,
      recipeCompatibilityVerified: true,
      importContractCompatibilityVerified: true,
      workspaceCompatibilityVerified: true,
      performanceProfileCompatibilityVerified: true,
      passiveOnly: true
    })
  });
}

function validatePackageIdentity(
  prototypeAssetPackage,
  lighthousePrototype,
  exportFoundation,
  integration
) {
  if (
    prototypeAssetPackage.assetId !== lighthousePrototype.prototypeAsset.assetId ||
    prototypeAssetPackage.assetId !== exportFoundation.foundation.assetPackage.assetId ||
    prototypeAssetPackage.assetId !== integration.assetPackage.assetId
  ) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Prototype lighthouse asset package identity must match the lighthouse prototype, export foundation, and package integration asset identity."
    );
  }
}

function validateComponentDefinitions(
  prototypeAssetPackage,
  lighthousePrototype,
  bridge,
  integration
) {
  const expectedDefinitions = lighthousePrototype.prototypeModuleDefinitions;
  if (
    prototypeAssetPackage.prototypeComponentDefinitions.length !==
    expectedDefinitions.length
  ) {
    throw createValidationError(
      "component_definition_mismatch",
      "Prototype lighthouse asset package must preserve the approved six lighthouse component definitions."
    );
  }

  for (let index = 0; index < expectedDefinitions.length; index += 1) {
    const candidate = prototypeAssetPackage.prototypeComponentDefinitions[index];
    const expected = expectedDefinitions[index];

    if (JSON.stringify(candidate) !== JSON.stringify(expected)) {
      throw createValidationError(
        "component_definition_mismatch",
        `Prototype component definition ${candidate.componentId} must match the approved lighthouse prototype component contract.`
      );
    }

    if (!bridge.request.componentReferences.includes(candidate.componentId)) {
      throw createValidationError(
        "bridge_component_mismatch",
        `Prototype component definition ${candidate.componentId} is not present in the Blender bridge component references.`
      );
    }

    if (!integration.assetPackage.componentReferences.includes(candidate.componentId)) {
      throw createValidationError(
        "recipe_component_mismatch",
        `Prototype component definition ${candidate.componentId} is not present in the integrated lighthouse recipe component set.`
      );
    }
  }
}

function validatePackageStructure(
  prototypeAssetPackage,
  exportFoundation,
  integration
) {
  if (
    prototypeAssetPackage.modelReferences.primary !==
    exportFoundation.foundation.modelReferences.primary
  ) {
    throw createValidationError(
      "model_reference_mismatch",
      "Prototype lighthouse package primary model reference must match the GLB export foundation primary model reference."
    );
  }

  if (
    prototypeAssetPackage.modelReferences.primary !==
    integration.assetPackage.modelReferences.primary
  ) {
    throw createValidationError(
      "model_reference_mismatch",
      "Prototype lighthouse package primary model reference must match the integrated lighthouse package primary model reference."
    );
  }

  if (
    JSON.stringify(prototypeAssetPackage.materialReferences) !==
    JSON.stringify(integration.assetPackage.materialReferences)
  ) {
    throw createValidationError(
      "material_reference_mismatch",
      "Prototype lighthouse package material references must match the integrated lighthouse material references."
    );
  }

  if (
    JSON.stringify(prototypeAssetPackage.textureReferences) !==
    JSON.stringify(integration.assetPackage.textureReferences)
  ) {
    throw createValidationError(
      "texture_reference_mismatch",
      "Prototype lighthouse package texture references must match the integrated lighthouse texture references."
    );
  }

  if (
    JSON.stringify(prototypeAssetPackage.lodReferences) !==
    JSON.stringify(integration.assetPackage.lodReferences)
  ) {
    throw createValidationError(
      "lod_reference_mismatch",
      "Prototype lighthouse package LOD references must match the integrated lighthouse LOD references."
    );
  }

  const expectedAppearanceProfiles = integration.assetPackage.appearanceProfiles;
  if (
    !sameStringSet(
      prototypeAssetPackage.appearanceProfiles,
      expectedAppearanceProfiles
    )
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Prototype lighthouse package must include the day, sunset, and night appearance profiles selected by the lighthouse workflow."
    );
  }

  if (prototypeAssetPackage.metadata.productionReady !== false) {
    throw createValidationError(
      "invalid_production_readiness",
      "Prototype lighthouse package must remain non-production and fail closed."
    );
  }
}

function validateWorkspaceCompatibility(
  prototypeAssetPackage,
  workspaceProfile,
  integration
) {
  const workspaceContract = workspaceProfile.foundation.workspaceContract;

  if (
    prototypeAssetPackage.metadata.packageLocation !==
    workspaceContract.exportFolder
  ) {
    throw createValidationError(
      "workspace_compatibility_mismatch",
      "Prototype lighthouse package location must remain inside the workspace export folder."
    );
  }

  const metadataPaths = [
    prototypeAssetPackage.metadata.assetMetadata,
    prototypeAssetPackage.metadata.exportMetadata,
    prototypeAssetPackage.metadata.validationMetadata
  ];

  for (const metadataPath of metadataPaths) {
    if (!metadataPath.startsWith(workspaceContract.productionFolder)) {
      throw createValidationError(
        "workspace_compatibility_mismatch",
        "Prototype lighthouse package metadata references must remain within the validated workspace production folder."
      );
    }
  }

  if (
    prototypeAssetPackage.metadata.rendererCompatibilityProfile !==
    workspaceProfile.foundation.metadata.rendererCompatibilityProfile
  ) {
    throw createValidationError(
      "workspace_compatibility_mismatch",
      "Prototype lighthouse package renderer compatibility profile must match the workspace compatibility profile."
    );
  }

  if (
    prototypeAssetPackage.metadata.packageLocation !==
    integration.assetPackage.packageLocation
  ) {
    throw createValidationError(
      "import_contract_mismatch",
      "Prototype lighthouse package location must match the integrated lighthouse package location."
    );
  }
}

function validatePerformanceCompatibility(
  prototypeAssetPackage,
  workspaceProfile,
  integration
) {
  const workspaceBudget = workspaceProfile.foundation.performanceProfile;

  if (
    prototypeAssetPackage.performanceMetadata.storageTargetKb >
      workspaceBudget.storageBudgetKb ||
    prototypeAssetPackage.performanceMetadata.ramTargetKb >
      workspaceBudget.ramBudgetKb
  ) {
    throw createValidationError(
      "performance_profile_incompatible",
      "Prototype lighthouse package performance metadata must remain within the workspace performance budgets."
    );
  }

  if (
    JSON.stringify(prototypeAssetPackage.performanceMetadata) !==
    JSON.stringify(integration.assetPackage.performanceMetadata)
  ) {
    throw createValidationError(
      "performance_profile_incompatible",
      "Prototype lighthouse package performance metadata must match the integrated lighthouse package performance metadata."
    );
  }
}

function normalizePrototypeAssetPackage(rawPackage) {
  const prototypeAssetPackage = asPlainObject(
    rawPackage,
    "prototype lighthouse asset package"
  );
  assertRequiredFields(prototypeAssetPackage);

  return deepFreeze({
    assetId: normalizePermanentId(prototypeAssetPackage.assetId, "assetId"),
    modelReferences: normalizeModelReferences(prototypeAssetPackage.modelReferences),
    materialReferences: deepFreeze(
      normalizePermanentIdArray(
        prototypeAssetPackage.materialReferences,
        "materialReferences"
      )
    ),
    textureReferences: deepFreeze(
      normalizePermanentIdArray(
        prototypeAssetPackage.textureReferences,
        "textureReferences"
      )
    ),
    lodReferences: normalizeLodReferences(prototypeAssetPackage.lodReferences),
    appearanceProfiles: deepFreeze(
      normalizeStringArray(
        prototypeAssetPackage.appearanceProfiles,
        "appearanceProfiles"
      )
    ),
    prototypeComponentDefinitions: deepFreeze(
      normalizePrototypeComponentDefinitions(
        prototypeAssetPackage.prototypeComponentDefinitions
      )
    ),
    metadata: normalizeMetadata(prototypeAssetPackage.metadata),
    performanceMetadata: normalizePerformanceMetadata(
      prototypeAssetPackage.performanceMetadata
    )
  });
}

function normalizeModelReferences(rawModelReferences) {
  const modelReferences = asPlainObject(rawModelReferences, "modelReferences");
  return deepFreeze({
    primary: normalizeGlbFilename(modelReferences.primary, "modelReferences.primary"),
    placeholder: normalizeGlbFilename(
      modelReferences.placeholder,
      "modelReferences.placeholder"
    )
  });
}

function normalizeLodReferences(rawLodReferences) {
  const lodReferences = asPlainObject(rawLodReferences, "lodReferences");
  const normalizedLodReferences = {};

  for (const lodKey of supportedLodKeys) {
    normalizedLodReferences[lodKey] = normalizeGlbFilename(
      lodReferences[lodKey],
      `lodReferences.${lodKey}`
    );
  }

  return deepFreeze(normalizedLodReferences);
}

function normalizePrototypeComponentDefinitions(rawDefinitions) {
  if (!Array.isArray(rawDefinitions) || rawDefinitions.length === 0) {
    throw createValidationError(
      "invalid_component_definitions",
      "prototypeComponentDefinitions must be a non-empty array."
    );
  }

  return rawDefinitions.map((rawDefinition, index) =>
    normalizePrototypeComponentDefinition(rawDefinition, index)
  );
}

function normalizePrototypeComponentDefinition(rawDefinition, index) {
  const definition = asPlainObject(
    rawDefinition,
    `prototypeComponentDefinitions[${index}]`
  );

  return deepFreeze({
    componentId: normalizePermanentId(
      definition.componentId,
      `prototypeComponentDefinitions[${index}].componentId`
    ),
    category: normalizeStringValue(
      definition.category,
      `prototypeComponentDefinitions[${index}].category`
    ),
    type: normalizeStringValue(
      definition.type,
      `prototypeComponentDefinitions[${index}].type`
    ),
    version: normalizeStringValue(
      definition.version,
      `prototypeComponentDefinitions[${index}].version`
    ),
    status: normalizeStringValue(
      definition.status,
      `prototypeComponentDefinitions[${index}].status`
    ),
    dimensions: normalizeDimensions(
      definition.dimensions,
      `prototypeComponentDefinitions[${index}].dimensions`
    ),
    attachmentPoints: deepFreeze(
      normalizeAttachmentPoints(
        definition.attachmentPoints,
        `prototypeComponentDefinitions[${index}].attachmentPoints`
      )
    ),
    compatibilityRules: normalizeCompatibilityRules(
      definition.compatibilityRules,
      `prototypeComponentDefinitions[${index}].compatibilityRules`
    ),
    tags: deepFreeze(
      normalizeStringArray(definition.tags, `prototypeComponentDefinitions[${index}].tags`)
    ),
    metadata: normalizeComponentMetadata(
      definition.metadata,
      `prototypeComponentDefinitions[${index}].metadata`
    )
  });
}

function normalizeDimensions(rawDimensions, fieldName) {
  const dimensions = asPlainObject(rawDimensions, fieldName);
  return deepFreeze({
    width: normalizePositiveInteger(dimensions.width, `${fieldName}.width`),
    height: normalizePositiveInteger(dimensions.height, `${fieldName}.height`),
    depth: normalizePositiveInteger(dimensions.depth, `${fieldName}.depth`)
  });
}

function normalizeAttachmentPoints(rawAttachmentPoints, fieldName) {
  if (!Array.isArray(rawAttachmentPoints) || rawAttachmentPoints.length === 0) {
    throw createValidationError(
      "invalid_attachment_points",
      `${fieldName} must be a non-empty array.`
    );
  }

  return rawAttachmentPoints.map((rawAttachmentPoint, index) => {
    const attachmentPoint = asPlainObject(
      rawAttachmentPoint,
      `${fieldName}[${index}]`
    );
    const position = asPlainObject(
      attachmentPoint.position,
      `${fieldName}[${index}].position`
    );

    return deepFreeze({
      pointId: normalizePermanentIdLikeString(
        attachmentPoint.pointId,
        `${fieldName}[${index}].pointId`
      ),
      type: normalizeStringValue(attachmentPoint.type, `${fieldName}[${index}].type`),
      position: deepFreeze({
        x: normalizeFiniteNumber(position.x, `${fieldName}[${index}].position.x`),
        y: normalizeFiniteNumber(position.y, `${fieldName}[${index}].position.y`),
        z: normalizeFiniteNumber(position.z, `${fieldName}[${index}].position.z`)
      })
    });
  });
}

function normalizeCompatibilityRules(rawCompatibilityRules, fieldName) {
  const compatibilityRules = asPlainObject(rawCompatibilityRules, fieldName);

  return deepFreeze({
    allowedCategories: deepFreeze(
      normalizeStringArray(
        compatibilityRules.allowedCategories,
        `${fieldName}.allowedCategories`,
        true
      )
    ),
    allowedTypes: deepFreeze(
      normalizeStringArray(
        compatibilityRules.allowedTypes,
        `${fieldName}.allowedTypes`,
        true
      )
    ),
    disallowedComponentIds: deepFreeze(
      normalizePermanentIdArray(
        compatibilityRules.disallowedComponentIds,
        `${fieldName}.disallowedComponentIds`,
        true
      )
    )
  });
}

function normalizeComponentMetadata(rawMetadata, fieldName) {
  const metadata = asPlainObject(rawMetadata, fieldName);

  return deepFreeze({
    creatorSource: normalizeStringValue(
      metadata.creatorSource,
      `${fieldName}.creatorSource`
    ),
    validationState: normalizeStringValue(
      metadata.validationState,
      `${fieldName}.validationState`
    )
  });
}

function normalizeMetadata(rawMetadata) {
  const metadata = asPlainObject(rawMetadata, "metadata");

  return deepFreeze({
    packageId: normalizePermanentId(metadata.packageId, "metadata.packageId"),
    packageLocation: normalizeStringValue(
      metadata.packageLocation,
      "metadata.packageLocation"
    ),
    assetMetadata: normalizeStringValue(
      metadata.assetMetadata,
      "metadata.assetMetadata"
    ),
    exportMetadata: normalizeStringValue(
      metadata.exportMetadata,
      "metadata.exportMetadata"
    ),
    validationMetadata: normalizeStringValue(
      metadata.validationMetadata,
      "metadata.validationMetadata"
    ),
    packageFormat: normalizeStringValue(
      metadata.packageFormat,
      "metadata.packageFormat"
    ),
    rendererCompatibilityProfile: normalizeStringValue(
      metadata.rendererCompatibilityProfile,
      "metadata.rendererCompatibilityProfile"
    ),
    productionReady: normalizeBoolean(
      metadata.productionReady,
      "metadata.productionReady"
    )
  });
}

function normalizePerformanceMetadata(rawPerformanceMetadata) {
  const performanceMetadata = asPlainObject(
    rawPerformanceMetadata,
    "performanceMetadata"
  );

  return deepFreeze({
    storageTargetKb: normalizePositiveInteger(
      performanceMetadata.storageTargetKb,
      "performanceMetadata.storageTargetKb"
    ),
    ramTargetKb: normalizePositiveInteger(
      performanceMetadata.ramTargetKb,
      "performanceMetadata.ramTargetKb"
    ),
    gpuVertexBudget: normalizePositiveInteger(
      performanceMetadata.gpuVertexBudget,
      "performanceMetadata.gpuVertexBudget"
    ),
    batchingExpected: normalizeBoolean(
      performanceMetadata.batchingExpected,
      "performanceMetadata.batchingExpected"
    )
  });
}

function assertRequiredFields(value) {
  for (const fieldName of firstBlenderGeneratedLighthousePrototypeAssetPackageRequiredFields) {
    if (!(fieldName in value)) {
      throw createValidationError(
        "missing_required_field",
        `Missing required prototype asset package field: ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName, allowEmpty = false) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be an array.`
    );
  }

  if (!allowEmpty && value.length === 0) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must not be empty.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringArray(value, fieldName, allowEmpty = false) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be an array.`
    );
  }

  if (!allowEmpty && value.length === 0) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must not be empty.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent uppercase asset identifier.`
    );
  }
  return normalizedValue;
}

function normalizePermanentIdLikeString(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!/^[A-Z][A-Z0-9_]*$/.test(normalizedValue)) {
    throw createValidationError(
      "invalid_identifier",
      `${fieldName} must be an uppercase underscore-separated identifier.`
    );
  }
  return normalizedValue;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeGlbFilename(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!normalizedValue.endsWith(".glb")) {
    throw createValidationError(
      "invalid_glb_filename",
      `${fieldName} must end with .glb.`
    );
  }
  return normalizedValue;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }
  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }
  return value;
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size !== rightSet.size) {
    return false;
  }

  for (const value of leftSet) {
    if (!rightSet.has(value)) {
      return false;
    }
  }

  return true;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${fieldName} must be a plain object.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    lighthouseAssetPackage: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name =
    "FirstBlenderGeneratedLighthousePrototypeAssetPackageValidationError";
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
