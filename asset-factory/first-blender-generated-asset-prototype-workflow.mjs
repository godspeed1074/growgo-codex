import {
  assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  buildAssetGenerationWorkspaceAppearanceProfileFoundationContext,
  validateAssetGenerationWorkspaceAppearanceProfileFoundation
} from "./asset-generation-workspace-appearance-profile-foundation.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  lighthouseConceptAssetFactoryHandoffDefinition,
  validateLighthouseConceptAssetFactoryHandoff
} from "./lighthouse-concept-asset-factory-handoff.mjs";

export const firstBlenderGeneratedAssetPrototypeWorkflowRequiredFields = Object.freeze([
  "assetId",
  "assetFamilyId",
  "modularLibraryAudit",
  "blenderPrototypeGenerationRequest",
  "prototypeGenerationMetadata"
]);

export const firstBlenderGeneratedAssetPrototypeWorkflowDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  assetFamilyId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  modularLibraryAudit: {
    existingReusableComponents: [],
    newLighthouseSpecificComponents: [
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
    reusePercentage: 0
  },
  blenderPrototypeGenerationRequest: {
    assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    recipeId: "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
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
        geometryProfile: "lod0"
      },
      gameplay: {
        lodKey: "gameplay",
        geometryProfile: "lod1"
      },
      map: {
        lodKey: "map",
        geometryProfile: "lod2"
      },
      distantSilhouette: {
        lodKey: "distantSilhouette",
        geometryProfile: "lod3"
      }
    },
    appearanceProfiles: [
      "DAY_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE"
    ]
  },
  prototypeGenerationMetadata: {
    workspaceLocation:
      "asset-factory-workspace/prototypes/LIGHTHOUSE_ISLAND_ROCKY_001",
    expectedBlenderCollections: {
      rootCollection: "LIGHTHOUSE_ISLAND_ROCKY_001",
      lodCollections: {
        close: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE",
        gameplay: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY",
        map: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP",
        distantSilhouette: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE"
      }
    },
    exportPreparationData: {
      glbNamingPrefix: "LIGHTHOUSE_ISLAND_ROCKY_001",
      exportFolder:
        "asset-factory-workspace/prototypes/LIGHTHOUSE_ISLAND_ROCKY_001/export",
      validationProfile: "prototype-pre-export-validation-required"
    }
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodKeys = Object.freeze(["close", "gameplay", "map", "distantSilhouette"]);
const uppercaseProfilePattern = /^[A-Z][A-Z0-9_]*$/;

export function buildFirstBlenderGeneratedAssetPrototypeWorkflowContext() {
  return Object.freeze(buildAssetGenerationWorkspaceAppearanceProfileFoundationContext());
}

export function validateFirstBlenderGeneratedAssetPrototypeWorkflow(
  rawWorkflow = firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeWorkflowOptions(options);
    const workflow = normalizePrototypeWorkflow(rawWorkflow);

    const handoffResult = normalizedOptions.validateLighthouseConceptAssetFactoryHandoff(
      normalizedOptions.handoffDefinition
    );
    if (!handoffResult.ok) {
      return freezeFailure(handoffResult);
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
      return freezeFailure(workspaceResult, "workspaceProfile");
    }

    validatePrototypeIdentity(workflow, handoffResult.handoff.planningData);
    validateModularLibraryAudit(
      workflow.modularLibraryAudit,
      handoffResult.handoff.planningData.plannedComponents
    );
    validatePrototypeGenerationRequest(
      workflow.blenderPrototypeGenerationRequest,
      handoffResult.handoff.planningData,
      bridgeResult.bridge.request
    );
    validatePrototypeMetadata(
      workflow.prototypeGenerationMetadata,
      workspaceResult.workspaceProfile.foundation
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      prototypeWorkflow: Object.freeze({
        workflow,
        handoff: handoffResult.handoff,
        bridge: bridgeResult.bridge,
        workspaceProfile: workspaceResult.workspaceProfile,
        compatibility: Object.freeze({
          modularAuditVerified: true,
          blenderRequestVerified: true,
          componentReferencesVerified: true,
          workspaceMetadataVerified: true,
          appearanceProfilesVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "FirstBlenderGeneratedAssetPrototypeWorkflowValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      prototypeWorkflow: null
    });
  }
}

function normalizeWorkflowOptions(options) {
  return Object.freeze({
    handoffDefinition: options.handoffDefinition ?? lighthouseConceptAssetFactoryHandoffDefinition,
    bridgeDefinition: options.bridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    workspaceDefinition:
      options.workspaceDefinition ?? assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
    validationContext:
      options.validationContext ?? buildFirstBlenderGeneratedAssetPrototypeWorkflowContext(),
    validateLighthouseConceptAssetFactoryHandoff:
      typeof options.validateLighthouseConceptAssetFactoryHandoff === "function"
        ? options.validateLighthouseConceptAssetFactoryHandoff
        : validateLighthouseConceptAssetFactoryHandoff,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation,
    validateAssetGenerationWorkspaceAppearanceProfileFoundation:
      typeof options.validateAssetGenerationWorkspaceAppearanceProfileFoundation === "function"
        ? options.validateAssetGenerationWorkspaceAppearanceProfileFoundation
        : validateAssetGenerationWorkspaceAppearanceProfileFoundation
  });
}

function freezeFailure(result, key = "bridge") {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    prototypeWorkflow: null
  });
}

function normalizePrototypeWorkflow(rawWorkflow) {
  const workflow = asPlainObject(rawWorkflow, "prototype workflow");
  assertRequiredFields(workflow);

  return deepFreeze({
    assetId: normalizePermanentId(workflow.assetId, "assetId"),
    assetFamilyId: normalizePermanentId(workflow.assetFamilyId, "assetFamilyId"),
    modularLibraryAudit: normalizeModularLibraryAudit(workflow.modularLibraryAudit),
    blenderPrototypeGenerationRequest: normalizePrototypeGenerationRequest(
      workflow.blenderPrototypeGenerationRequest
    ),
    prototypeGenerationMetadata: normalizePrototypeGenerationMetadata(
      workflow.prototypeGenerationMetadata
    )
  });
}

function normalizeModularLibraryAudit(rawAudit) {
  const audit = asPlainObject(rawAudit, "modularLibraryAudit");
  return deepFreeze({
    existingReusableComponents: deepFreeze(
      normalizePermanentIdArray(
        audit.existingReusableComponents,
        "modularLibraryAudit.existingReusableComponents"
      )
    ),
    newLighthouseSpecificComponents: deepFreeze(
      normalizePermanentIdArray(
        audit.newLighthouseSpecificComponents,
        "modularLibraryAudit.newLighthouseSpecificComponents"
      )
    ),
    reusePercentage: normalizePercentage(audit.reusePercentage, "modularLibraryAudit.reusePercentage")
  });
}

function normalizePrototypeGenerationRequest(rawRequest) {
  const request = asPlainObject(rawRequest, "blenderPrototypeGenerationRequest");
  const lodRequirements = asPlainObject(request.lodRequirements, "blenderPrototypeGenerationRequest.lodRequirements");
  const normalizedLodRequirements = {};
  for (const lodKey of supportedLodKeys) {
    const lodEntry = asPlainObject(
      lodRequirements[lodKey],
      `blenderPrototypeGenerationRequest.lodRequirements.${lodKey}`
    );
    normalizedLodRequirements[lodKey] = deepFreeze({
      lodKey: normalizeLodKey(lodEntry.lodKey, `blenderPrototypeGenerationRequest.lodRequirements.${lodKey}.lodKey`),
      geometryProfile: normalizeStringValue(
        lodEntry.geometryProfile,
        `blenderPrototypeGenerationRequest.lodRequirements.${lodKey}.geometryProfile`
      )
    });
  }

  return deepFreeze({
    assetId: normalizePermanentId(request.assetId, "blenderPrototypeGenerationRequest.assetId"),
    recipeId: normalizePermanentId(request.recipeId, "blenderPrototypeGenerationRequest.recipeId"),
    componentReferences: deepFreeze(
      normalizePermanentIdArray(
        request.componentReferences,
        "blenderPrototypeGenerationRequest.componentReferences"
      )
    ),
    materialReferences: deepFreeze(
      normalizePermanentIdArray(
        request.materialReferences,
        "blenderPrototypeGenerationRequest.materialReferences"
      )
    ),
    lodRequirements: deepFreeze(normalizedLodRequirements),
    appearanceProfiles: deepFreeze(
      normalizeUppercaseIdArray(
        request.appearanceProfiles,
        "blenderPrototypeGenerationRequest.appearanceProfiles"
      )
    )
  });
}

function normalizePrototypeGenerationMetadata(rawMetadata) {
  const metadata = asPlainObject(rawMetadata, "prototypeGenerationMetadata");
  const collections = asPlainObject(
    metadata.expectedBlenderCollections,
    "prototypeGenerationMetadata.expectedBlenderCollections"
  );
  const lodCollections = asPlainObject(
    collections.lodCollections,
    "prototypeGenerationMetadata.expectedBlenderCollections.lodCollections"
  );
  const exportPreparationData = asPlainObject(
    metadata.exportPreparationData,
    "prototypeGenerationMetadata.exportPreparationData"
  );

  const normalizedLodCollections = {};
  for (const lodKey of supportedLodKeys) {
    normalizedLodCollections[lodKey] = normalizeStringValue(
      lodCollections[lodKey],
      `prototypeGenerationMetadata.expectedBlenderCollections.lodCollections.${lodKey}`
    );
  }

  return deepFreeze({
    workspaceLocation: normalizeStringValue(
      metadata.workspaceLocation,
      "prototypeGenerationMetadata.workspaceLocation"
    ),
    expectedBlenderCollections: deepFreeze({
      rootCollection: normalizeStringValue(
        collections.rootCollection,
        "prototypeGenerationMetadata.expectedBlenderCollections.rootCollection"
      ),
      lodCollections: deepFreeze(normalizedLodCollections)
    }),
    exportPreparationData: deepFreeze({
      glbNamingPrefix: normalizeStringValue(
        exportPreparationData.glbNamingPrefix,
        "prototypeGenerationMetadata.exportPreparationData.glbNamingPrefix"
      ),
      exportFolder: normalizeStringValue(
        exportPreparationData.exportFolder,
        "prototypeGenerationMetadata.exportPreparationData.exportFolder"
      ),
      validationProfile: normalizeStringValue(
        exportPreparationData.validationProfile,
        "prototypeGenerationMetadata.exportPreparationData.validationProfile"
      )
    })
  });
}

function validatePrototypeIdentity(workflow, planningData) {
  if (workflow.assetFamilyId !== planningData.assetFamilyId) {
    throw createValidationError(
      "asset_family_identity_mismatch",
      "Prototype workflow assetFamilyId must match the lighthouse handoff assetFamilyId."
    );
  }
}

function validateModularLibraryAudit(audit, plannedComponents) {
  const combined = [...audit.existingReusableComponents, ...audit.newLighthouseSpecificComponents];
  if (JSON.stringify(combined) !== JSON.stringify(plannedComponents)) {
    throw createValidationError(
      "modular_audit_incomplete",
      "Modular library audit must account for every approved lighthouse component exactly once."
    );
  }

  const expectedReusePercentage =
    combined.length === 0
      ? 0
      : Math.round((audit.existingReusableComponents.length / combined.length) * 100);

  if (audit.reusePercentage !== expectedReusePercentage) {
    throw createValidationError(
      "reuse_percentage_mismatch",
      "Modular library audit reusePercentage must match the calculated component reuse ratio."
    );
  }
}

function validatePrototypeGenerationRequest(request, planningData, bridgeRequest) {
  if (request.recipeId !== "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001") {
    throw createValidationError(
      "recipe_reference_mismatch",
      "Prototype workflow must target LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001."
    );
  }

  if (!planningData.plannedRecipes.includes(request.recipeId)) {
    throw createValidationError(
      "recipe_reference_mismatch",
      "Prototype recipeId must be one of the approved lighthouse plannedRecipes."
    );
  }

  if (JSON.stringify(request.componentReferences) !== JSON.stringify(planningData.plannedComponents)) {
    throw createValidationError(
      "component_reference_mismatch",
      "Prototype componentReferences must match the approved lighthouse plannedComponents."
    );
  }

  if (JSON.stringify(request.appearanceProfiles.slice().sort()) !== JSON.stringify(planningData.appearanceProfiles.slice().sort())) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Prototype appearanceProfiles must match the approved lighthouse appearance profile set."
    );
  }

  const bridgeLodKeys = Object.keys(bridgeRequest.lodRequirements);
  const requestLodKeys = Object.keys(request.lodRequirements);
  if (JSON.stringify(requestLodKeys) !== JSON.stringify(bridgeLodKeys)) {
    throw createValidationError(
      "lod_requirement_mismatch",
      "Prototype LOD requirements must match the Blender bridge LOD requirement keys."
    );
  }
}

function validatePrototypeMetadata(metadata, workspaceFoundation) {
  if (!metadata.workspaceLocation.startsWith("asset-factory-workspace/prototypes/")) {
    throw createValidationError(
      "workspace_location_invalid",
      "Prototype workspaceLocation must live under the prototype workspace root."
    );
  }

  if (!metadata.exportPreparationData.exportFolder.startsWith(metadata.workspaceLocation)) {
    throw createValidationError(
      "export_folder_mismatch",
      "Prototype export folder must be nested inside the prototype workspaceLocation."
    );
  }

  if (workspaceFoundation.metadata.rendererCompatibilityProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "workspace_profile_invalid",
      "Workspace foundation must remain aligned to the passive Custom 2.5D renderer profile."
    );
  }
}

function assertRequiredFields(workflow) {
  for (const fieldName of firstBlenderGeneratedAssetPrototypeWorkflowRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(workflow, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Prototype workflow is missing required field ${fieldName}.`
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

function normalizeUppercaseIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of uppercase IDs.`
    );
  }
  return value.map((entry, index) => {
    const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`).toUpperCase();
    if (!uppercaseProfilePattern.test(normalized)) {
      throw createValidationError(
        "invalid_identifier",
        `Field ${fieldName}[${index}] must use the approved uppercase ID format.`
      );
    }
    return normalized;
  });
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

function normalizePercentage(value, fieldName) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be an integer percentage between 0 and 100.`
    );
  }
  return value;
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
  error.name = "FirstBlenderGeneratedAssetPrototypeWorkflowValidationError";
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
