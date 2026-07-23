import {
  blenderGlbProductionWorkflowContractDefinition,
  buildBlenderGlbProductionWorkflowContractContext,
  validateBlenderGlbProductionWorkflowContract
} from "./blender-glb-production-workflow-contract.mjs";
import {
  lighthouseConceptAssetFactoryHandoffDefinition,
  lighthouseCoastalFamilyConceptDefinition,
  validateLighthouseConceptAssetFactoryHandoff
} from "./lighthouse-concept-asset-factory-handoff.mjs";

export const blenderApiBridgeFoundationRequiredFields = Object.freeze([
  "assetId",
  "assetFamilyId",
  "recipeId",
  "componentReferences",
  "materialReferences",
  "lodRequirements",
  "exportRequirements",
  "metadata"
]);

export const blenderApiBridgeFoundationDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  assetFamilyId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  recipeId: "LIGHTHOUSE_CLASSIC_RECIPE_001",
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
  materialReferences: [
    "LIGHTHOUSE_MASONRY_SHARED_001",
    "LIGHTHOUSE_LANTERN_SHARED_001",
    "LIGHTHOUSE_BEAM_SHARED_001"
  ],
  lodRequirements: {
    close: {
      lodKey: "close",
      geometryProfile: "lod0",
      targetPurpose: "detail-modeling"
    },
    gameplay: {
      lodKey: "gameplay",
      geometryProfile: "lod1",
      targetPurpose: "primary-gameplay-view"
    },
    map: {
      lodKey: "map",
      geometryProfile: "lod2",
      targetPurpose: "map-presence"
    },
    distantSilhouette: {
      lodKey: "distantSilhouette",
      geometryProfile: "lod3",
      targetPurpose: "skyline-silhouette"
    }
  },
  exportRequirements: {
    format: "glb",
    lodExports: {
      close: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_CLOSE.glb",
      gameplay: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_GAMEPLAY.glb",
      map: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_MAP.glb",
      distantSilhouette: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_DISTANT_SILHOUETTE.glb"
    },
    validationRequirements: {
      namingValidated: true,
      lodValidated: true,
      materialsValidated: true,
      workflowValidated: true
    }
  },
  metadata: {
    bridgeProfileId: "BLENDER_API_BRIDGE_PROFILE_001",
    rendererCompatibilityProfile: "custom-2.5d-passive",
    generationHooks: [
      {
        componentId: "LIGHTHOUSE_TOWER_BASE_001",
        blenderObjectId: "LIGHTHOUSE_TOWER_BASE_001_OBJ",
        futureGenerationHook: "tower-base-generator"
      },
      {
        componentId: "LIGHTHOUSE_TOWER_BODY_SHORT_001",
        blenderObjectId: "LIGHTHOUSE_TOWER_BODY_SHORT_001_OBJ",
        futureGenerationHook: "tower-body-short-generator"
      },
      {
        componentId: "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
        blenderObjectId: "LIGHTHOUSE_TOWER_BODY_MEDIUM_001_OBJ",
        futureGenerationHook: "tower-body-medium-generator"
      },
      {
        componentId: "LIGHTHOUSE_TOWER_BODY_TALL_001",
        blenderObjectId: "LIGHTHOUSE_TOWER_BODY_TALL_001_OBJ",
        futureGenerationHook: "tower-body-tall-generator"
      },
      {
        componentId: "LIGHTHOUSE_LANTERN_BASE_001",
        blenderObjectId: "LIGHTHOUSE_LANTERN_BASE_001_OBJ",
        futureGenerationHook: "lantern-base-generator"
      },
      {
        componentId: "LIGHTHOUSE_GLASS_RING_001",
        blenderObjectId: "LIGHTHOUSE_GLASS_RING_001_OBJ",
        futureGenerationHook: "glass-ring-generator"
      },
      {
        componentId: "LIGHTHOUSE_LIGHT_SOURCE_001",
        blenderObjectId: "LIGHTHOUSE_LIGHT_SOURCE_001_OBJ",
        futureGenerationHook: "light-source-generator"
      },
      {
        componentId: "LIGHTHOUSE_BEAM_EFFECT_001",
        blenderObjectId: "LIGHTHOUSE_BEAM_EFFECT_001_OBJ",
        futureGenerationHook: "beam-effect-generator"
      },
      {
        componentId: "LIGHTHOUSE_ROOF_CAP_001",
        blenderObjectId: "LIGHTHOUSE_ROOF_CAP_001_OBJ",
        futureGenerationHook: "roof-cap-generator"
      }
    ],
    blenderSceneContract: {
      collectionStructure: {
        rootCollection: "LIGHTHOUSE_COASTAL_FAMILY_001",
        lodCollections: {
          close: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_CLOSE",
          gameplay: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_GAMEPLAY",
          map: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_MAP",
          distantSilhouette: "LIGHTHOUSE_COASTAL_FAMILY_001_LOD_DISTANT_SILHOUETTE"
        }
      },
      objectNamingExpectation: "LIGHTHOUSE_*_OBJ",
      materialNamingExpectation: "LIGHTHOUSE_*_SHARED_001",
      lodOrganization: "per-lod-collection"
    },
    exportPreparationMetadata: {
      glbNamingPrefix: "LIGHTHOUSE_COASTAL_FAMILY_001",
      lodExportExpectation: "all-required-lods-exported",
      validationProfile: "pre-blender-export-validation-required"
    }
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const uppercaseProfilePattern = /^[A-Z][A-Z0-9_]*$/;
const supportedLodKeys = Object.freeze(["close", "gameplay", "map", "distantSilhouette"]);

export function buildBlenderApiBridgeFoundationContext() {
  return Object.freeze(buildBlenderGlbProductionWorkflowContractContext());
}

export function validateBlenderApiBridgeFoundation(
  rawRequest = blenderApiBridgeFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeFoundationOptions(options);
    const request = normalizeBlenderGenerationRequest(rawRequest);

    const handoffResult = normalizedOptions.validateLighthouseConceptAssetFactoryHandoff(
      normalizedOptions.handoffDefinition,
      { conceptCard: normalizedOptions.conceptDefinition }
    );

    if (!handoffResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: handoffResult.errorCode,
        message: handoffResult.message,
        bridge: null
      });
    }

    const workflowResult = normalizedOptions.validateBlenderGlbProductionWorkflowContract(
      normalizedOptions.workflowDefinition,
      { validationContext: normalizedOptions.validationContext }
    );

    if (!workflowResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: workflowResult.errorCode,
        message: workflowResult.message,
        bridge: null
      });
    }

    validateComponentReferences(request, handoffResult.handoff.planningData.plannedComponents);
    validateRecipeReference(request, handoffResult.handoff.planningData.plannedRecipes);
    validateWorkflowCompatibility(request, workflowResult.workflowContract.contract);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      bridge: Object.freeze({
        request,
        handoff: handoffResult.handoff,
        workflowContract: workflowResult.workflowContract,
        compatibility: Object.freeze({
          componentValidityVerified: true,
          recipeValidityVerified: true,
          blenderWorkflowCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BlenderApiBridgeFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      bridge: null
    });
  }
}

function normalizeFoundationOptions(options) {
  return Object.freeze({
    conceptDefinition: options.conceptDefinition ?? lighthouseCoastalFamilyConceptDefinition,
    handoffDefinition: options.handoffDefinition ?? lighthouseConceptAssetFactoryHandoffDefinition,
    workflowDefinition: options.workflowDefinition ?? blenderGlbProductionWorkflowContractDefinition,
    validationContext: options.validationContext ?? buildBlenderApiBridgeFoundationContext(),
    validateLighthouseConceptAssetFactoryHandoff:
      typeof options.validateLighthouseConceptAssetFactoryHandoff === "function"
        ? options.validateLighthouseConceptAssetFactoryHandoff
        : validateLighthouseConceptAssetFactoryHandoff,
    validateBlenderGlbProductionWorkflowContract:
      typeof options.validateBlenderGlbProductionWorkflowContract === "function"
        ? options.validateBlenderGlbProductionWorkflowContract
        : validateBlenderGlbProductionWorkflowContract
  });
}

function normalizeBlenderGenerationRequest(rawRequest) {
  const request = asPlainObject(rawRequest, "blender generation request");
  assertRequiredFields(request);

  return deepFreeze({
    assetId: normalizePermanentId(request.assetId, "assetId"),
    assetFamilyId: normalizePermanentId(request.assetFamilyId, "assetFamilyId"),
    recipeId: normalizePermanentId(request.recipeId, "recipeId"),
    componentReferences: deepFreeze(
      normalizePermanentIdArray(request.componentReferences, "componentReferences")
    ),
    materialReferences: deepFreeze(
      normalizePermanentIdArray(request.materialReferences, "materialReferences")
    ),
    lodRequirements: normalizeLodRequirements(request.lodRequirements),
    exportRequirements: normalizeExportRequirements(request.exportRequirements),
    metadata: normalizeBridgeMetadata(request.metadata)
  });
}

function normalizeLodRequirements(rawLodRequirements) {
  const lodRequirements = asPlainObject(rawLodRequirements, "lodRequirements");
  const normalized = {};

  for (const lodKey of supportedLodKeys) {
    const lodEntry = asPlainObject(lodRequirements[lodKey], `lodRequirements.${lodKey}`);
    normalized[lodKey] = deepFreeze({
      lodKey: normalizeLodKey(lodEntry.lodKey, `lodRequirements.${lodKey}.lodKey`),
      geometryProfile: normalizeStringValue(
        lodEntry.geometryProfile,
        `lodRequirements.${lodKey}.geometryProfile`
      ),
      targetPurpose: normalizeStringValue(
        lodEntry.targetPurpose,
        `lodRequirements.${lodKey}.targetPurpose`
      )
    });
  }

  return deepFreeze(normalized);
}

function normalizeExportRequirements(rawExportRequirements) {
  const exportRequirements = asPlainObject(rawExportRequirements, "exportRequirements");
  const lodExports = asPlainObject(exportRequirements.lodExports, "exportRequirements.lodExports");
  const validationRequirements = asPlainObject(
    exportRequirements.validationRequirements,
    "exportRequirements.validationRequirements"
  );
  const normalizedLodExports = {};

  for (const lodKey of supportedLodKeys) {
    normalizedLodExports[lodKey] = normalizeStringValue(
      lodExports[lodKey],
      `exportRequirements.lodExports.${lodKey}`
    );
  }

  return deepFreeze({
    format: normalizeStringValue(exportRequirements.format, "exportRequirements.format").toLowerCase(),
    lodExports: deepFreeze(normalizedLodExports),
    validationRequirements: deepFreeze({
      namingValidated: normalizeBoolean(
        validationRequirements.namingValidated,
        "exportRequirements.validationRequirements.namingValidated"
      ),
      lodValidated: normalizeBoolean(
        validationRequirements.lodValidated,
        "exportRequirements.validationRequirements.lodValidated"
      ),
      materialsValidated: normalizeBoolean(
        validationRequirements.materialsValidated,
        "exportRequirements.validationRequirements.materialsValidated"
      ),
      workflowValidated: normalizeBoolean(
        validationRequirements.workflowValidated,
        "exportRequirements.validationRequirements.workflowValidated"
      )
    })
  });
}

function normalizeBridgeMetadata(rawMetadata) {
  const metadata = asPlainObject(rawMetadata, "metadata");
  const blenderSceneContract = asPlainObject(
    metadata.blenderSceneContract,
    "metadata.blenderSceneContract"
  );
  const collectionStructure = asPlainObject(
    blenderSceneContract.collectionStructure,
    "metadata.blenderSceneContract.collectionStructure"
  );
  const lodCollections = asPlainObject(
    collectionStructure.lodCollections,
    "metadata.blenderSceneContract.collectionStructure.lodCollections"
  );
  const exportPreparationMetadata = asPlainObject(
    metadata.exportPreparationMetadata,
    "metadata.exportPreparationMetadata"
  );

  const generationHooks = normalizeGenerationHooks(metadata.generationHooks);
  const normalizedLodCollections = {};
  for (const lodKey of supportedLodKeys) {
    normalizedLodCollections[lodKey] = normalizeStringValue(
      lodCollections[lodKey],
      `metadata.blenderSceneContract.collectionStructure.lodCollections.${lodKey}`
    );
  }

  return deepFreeze({
    bridgeProfileId: normalizePermanentId(metadata.bridgeProfileId, "metadata.bridgeProfileId"),
    rendererCompatibilityProfile: normalizeStringValue(
      metadata.rendererCompatibilityProfile,
      "metadata.rendererCompatibilityProfile"
    ),
    generationHooks: deepFreeze(generationHooks),
    blenderSceneContract: deepFreeze({
      collectionStructure: deepFreeze({
        rootCollection: normalizeStringValue(
          collectionStructure.rootCollection,
          "metadata.blenderSceneContract.collectionStructure.rootCollection"
        ),
        lodCollections: deepFreeze(normalizedLodCollections)
      }),
      objectNamingExpectation: normalizeStringValue(
        blenderSceneContract.objectNamingExpectation,
        "metadata.blenderSceneContract.objectNamingExpectation"
      ),
      materialNamingExpectation: normalizeStringValue(
        blenderSceneContract.materialNamingExpectation,
        "metadata.blenderSceneContract.materialNamingExpectation"
      ),
      lodOrganization: normalizeStringValue(
        blenderSceneContract.lodOrganization,
        "metadata.blenderSceneContract.lodOrganization"
      )
    }),
    exportPreparationMetadata: deepFreeze({
      glbNamingPrefix: normalizeStringValue(
        exportPreparationMetadata.glbNamingPrefix,
        "metadata.exportPreparationMetadata.glbNamingPrefix"
      ),
      lodExportExpectation: normalizeStringValue(
        exportPreparationMetadata.lodExportExpectation,
        "metadata.exportPreparationMetadata.lodExportExpectation"
      ),
      validationProfile: normalizeStringValue(
        exportPreparationMetadata.validationProfile,
        "metadata.exportPreparationMetadata.validationProfile"
      )
    })
  });
}

function normalizeGenerationHooks(rawGenerationHooks) {
  if (!Array.isArray(rawGenerationHooks)) {
    throw createValidationError(
      "invalid_field_type",
      "metadata.generationHooks must be an array of bridge generation hooks."
    );
  }

  return rawGenerationHooks.map((entry, index) => {
    const hook = asPlainObject(entry, `metadata.generationHooks[${index}]`);
    return deepFreeze({
      componentId: normalizePermanentId(
        hook.componentId,
        `metadata.generationHooks[${index}].componentId`
      ),
      blenderObjectId: normalizeUppercaseProfileId(
        hook.blenderObjectId,
        `metadata.generationHooks[${index}].blenderObjectId`
      ),
      futureGenerationHook: normalizeStringValue(
        hook.futureGenerationHook,
        `metadata.generationHooks[${index}].futureGenerationHook`
      )
    });
  });
}

function validateComponentReferences(request, plannedComponents) {
  if (JSON.stringify(request.componentReferences) !== JSON.stringify(plannedComponents)) {
    throw createValidationError(
      "component_reference_mismatch",
      "Bridge componentReferences must match the lighthouse handoff plannedComponents."
    );
  }

  const hookComponentIds = request.metadata.generationHooks.map((entry) => entry.componentId);
  if (JSON.stringify(hookComponentIds) !== JSON.stringify(request.componentReferences)) {
    throw createValidationError(
      "generation_hook_mismatch",
      "Bridge generation hooks must cover every component reference exactly once."
    );
  }
}

function validateRecipeReference(request, plannedRecipes) {
  if (!plannedRecipes.includes(request.recipeId)) {
    throw createValidationError(
      "recipe_reference_mismatch",
      "Bridge recipeId must be one of the approved lighthouse plannedRecipes."
    );
  }
}

function validateWorkflowCompatibility(request, workflowContract) {
  if (request.exportRequirements.format !== workflowContract.glbExportRules.primaryFormat) {
    throw createValidationError(
      "export_format_mismatch",
      "Bridge export format must match the Blender workflow primary format."
    );
  }

  if (
    request.metadata.rendererCompatibilityProfile !==
    workflowContract.metadata.rendererCompatibilityProfile
  ) {
    throw createValidationError(
      "renderer_profile_mismatch",
      "Bridge renderer compatibility profile must match the Blender workflow contract."
    );
  }

  for (const lodKey of supportedLodKeys) {
    if (
      request.lodRequirements[lodKey].geometryProfile !==
      workflowContract.lodWorkflow[lodKey].geometryProfile
    ) {
      throw createValidationError(
        "lod_profile_mismatch",
        `Bridge LOD ${lodKey} geometryProfile must match the Blender workflow contract.`
      );
    }
  }
}

function assertRequiredFields(request) {
  for (const fieldName of blenderApiBridgeFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(request, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Blender bridge request is missing required field ${fieldName}.`
      );
    }
  }
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

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }
  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeUppercaseProfileId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!uppercaseProfilePattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved uppercase bridge identifier format.`
    );
  }
  return normalized;
}

function normalizeLodKey(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedLodKeys.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_key",
      `Field ${fieldName} must use one of ${supportedLodKeys.join(", ")}.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
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

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BlenderApiBridgeFoundationValidationError";
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
