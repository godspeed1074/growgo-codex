import {
  firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
  buildFirstBlenderGeneratedAssetPrototypeWorkflowContext,
  validateFirstBlenderGeneratedAssetPrototypeWorkflow
} from "./first-blender-generated-asset-prototype-workflow.mjs";

export const blenderPrototypeSceneGenerationRequiredFields = Object.freeze([
  "assetId",
  "sceneCollections",
  "objectDefinitions",
  "materialDefinitions",
  "metadata"
]);

export const blenderPrototypeSceneGenerationDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  sceneCollections: [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ],
  objectDefinitions: [
    {
      objectId: "LIGHTHOUSE_TOWER_001_OBJ",
      objectRole: "lighthouse-tower",
      collectionId: "GEOMETRY",
      componentReference: "LIGHTHOUSE_TOWER_BODY_TALL_001",
      materialReference: "LIGHTHOUSE_WHITE_STONE_001",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ],
      lodMembership: ["LOD0", "LOD1", "LOD2", "LOD3"]
    },
    {
      objectId: "LIGHTHOUSE_LANTERN_ROOM_001_OBJ",
      objectRole: "lantern-room",
      collectionId: "GEOMETRY",
      componentReference: "LIGHTHOUSE_LANTERN_BASE_001",
      materialReference: "LIGHTHOUSE_GLASS_GLOW_001",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ],
      lodMembership: ["LOD0", "LOD1", "LOD2"]
    },
    {
      objectId: "LIGHTHOUSE_ROOF_CAP_001_OBJ",
      objectRole: "roof-cap",
      collectionId: "GEOMETRY",
      componentReference: "LIGHTHOUSE_ROOF_CAP_001",
      materialReference: "LIGHTHOUSE_DARK_ROOF_001",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ],
      lodMembership: ["LOD0", "LOD1", "LOD2", "LOD3"]
    },
    {
      objectId: "LIGHTHOUSE_BEAM_EFFECT_PLACEHOLDER_001_OBJ",
      objectRole: "beam-effect-placeholder",
      collectionId: "GEOMETRY",
      componentReference: "LIGHTHOUSE_BEAM_EFFECT_001",
      materialReference: "LIGHTHOUSE_GLASS_GLOW_001",
      appearanceProfiles: ["NIGHT_COASTAL_LIGHTHOUSE"],
      lodMembership: ["LOD0", "LOD1"]
    },
    {
      objectId: "COASTAL_ENVIRONMENT_ROCK_PLACEHOLDER_001_OBJ",
      objectRole: "coastal-environment-placeholder",
      collectionId: "GEOMETRY",
      componentReference: null,
      materialReference: "LIGHTHOUSE_COASTAL_ROCK_001",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ],
      lodMembership: ["LOD0", "LOD1", "LOD2", "LOD3"]
    },
    {
      objectId: "COASTAL_ENVIRONMENT_GRASS_PLACEHOLDER_001_OBJ",
      objectRole: "coastal-environment-placeholder",
      collectionId: "GEOMETRY",
      componentReference: null,
      materialReference: "LIGHTHOUSE_GRASS_001",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ],
      lodMembership: ["LOD0", "LOD1", "LOD2", "LOD3"]
    }
  ],
  materialDefinitions: [
    {
      materialId: "LIGHTHOUSE_WHITE_STONE_001",
      materialRole: "white-stone",
      collectionId: "MATERIALS",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    },
    {
      materialId: "LIGHTHOUSE_DARK_ROOF_001",
      materialRole: "dark-roof",
      collectionId: "MATERIALS",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    },
    {
      materialId: "LIGHTHOUSE_GLASS_GLOW_001",
      materialRole: "glass-glow",
      collectionId: "MATERIALS",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    },
    {
      materialId: "LIGHTHOUSE_COASTAL_ROCK_001",
      materialRole: "coastal-rock",
      collectionId: "MATERIALS",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    },
    {
      materialId: "LIGHTHOUSE_GRASS_001",
      materialRole: "grass",
      collectionId: "MATERIALS",
      appearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "SUNSET_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    }
  ],
  metadata: {
    sceneProfileId: "BLENDER_PROTOTYPE_SCENE_PROFILE_001",
    workspaceLocation:
      "asset-factory-workspace/prototypes/LIGHTHOUSE_ISLAND_ROCKY_001/scene",
    exportCollectionId: "EXPORT",
    sceneCompatibilityProfile: "lighthouse-prototype-scene",
    appearanceProfileSource: "approved-lighthouse-appearance-profiles"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const uppercaseProfilePattern = /^[A-Z][A-Z0-9_]*$/;
const blenderObjectPattern = /^[A-Z][A-Z0-9_]*_OBJ$/;
const requiredSceneCollections = Object.freeze([
  "GEOMETRY",
  "MATERIALS",
  "LOD0",
  "LOD1",
  "LOD2",
  "LOD3",
  "EXPORT"
]);
const requiredMaterialRoles = Object.freeze([
  "white-stone",
  "dark-roof",
  "glass-glow",
  "coastal-rock",
  "grass"
]);
const supportedObjectRoles = Object.freeze([
  "lighthouse-tower",
  "lantern-room",
  "roof-cap",
  "beam-effect-placeholder",
  "coastal-environment-placeholder"
]);
const supportedLodCollections = Object.freeze(["LOD0", "LOD1", "LOD2", "LOD3"]);

export function buildBlenderPrototypeSceneGenerationContext() {
  return Object.freeze(buildFirstBlenderGeneratedAssetPrototypeWorkflowContext());
}

export function validateBlenderPrototypeSceneGeneration(
  rawScene = blenderPrototypeSceneGenerationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeSceneOptions(options);
    const scene = normalizeSceneDefinition(rawScene);

    const workflowResult = normalizedOptions.validateFirstBlenderGeneratedAssetPrototypeWorkflow(
      normalizedOptions.workflowDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!workflowResult.ok) {
      return freezeFailure(workflowResult);
    }

    validateSceneIdentity(scene, workflowResult.prototypeWorkflow.workflow);
    validateSceneCollections(scene.sceneCollections);
    validateMaterialDefinitions(
      scene.materialDefinitions,
      workflowResult.prototypeWorkflow.workflow.blenderPrototypeGenerationRequest.appearanceProfiles
    );
    validateObjectDefinitions(
      scene.objectDefinitions,
      workflowResult.prototypeWorkflow.workflow,
      scene.materialDefinitions
    );
    validateSceneMetadata(scene.metadata, workflowResult.prototypeWorkflow.workflow);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      prototypeScene: Object.freeze({
        scene,
        prototypeWorkflow: workflowResult.prototypeWorkflow,
        compatibility: Object.freeze({
          sceneStructureVerified: true,
          objectNamingVerified: true,
          componentMappingVerified: true,
          workspaceCompatibilityVerified: true,
          appearanceProfileCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BlenderPrototypeSceneGenerationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      prototypeScene: null
    });
  }
}

function normalizeSceneOptions(options) {
  return Object.freeze({
    workflowDefinition:
      options.workflowDefinition ?? firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
    validationContext:
      options.validationContext ?? buildBlenderPrototypeSceneGenerationContext(),
    validateFirstBlenderGeneratedAssetPrototypeWorkflow:
      typeof options.validateFirstBlenderGeneratedAssetPrototypeWorkflow === "function"
        ? options.validateFirstBlenderGeneratedAssetPrototypeWorkflow
        : validateFirstBlenderGeneratedAssetPrototypeWorkflow
  });
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    prototypeScene: null
  });
}

function normalizeSceneDefinition(rawScene) {
  const scene = asPlainObject(rawScene, "blender prototype scene generation");
  assertRequiredFields(scene);

  return deepFreeze({
    assetId: normalizePermanentId(scene.assetId, "assetId"),
    sceneCollections: deepFreeze(
      normalizeUppercaseIdArray(scene.sceneCollections, "sceneCollections")
    ),
    objectDefinitions: deepFreeze(normalizeObjectDefinitions(scene.objectDefinitions)),
    materialDefinitions: deepFreeze(normalizeMaterialDefinitions(scene.materialDefinitions)),
    metadata: normalizeSceneMetadata(scene.metadata)
  });
}

function normalizeObjectDefinitions(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "Field objectDefinitions must be an array of object definitions."
    );
  }

  return value.map((entry, index) => {
    const objectDefinition = asPlainObject(entry, `objectDefinitions[${index}]`);
    const objectId = normalizeStringValue(objectDefinition.objectId, `objectDefinitions[${index}].objectId`).toUpperCase();
    if (!blenderObjectPattern.test(objectId)) {
      throw createValidationError(
        "invalid_object_name",
        `Object ${objectId} must follow the approved Blender object naming format.`
      );
    }

    const objectRole = normalizeStringValue(
      objectDefinition.objectRole,
      `objectDefinitions[${index}].objectRole`
    );
    if (!supportedObjectRoles.includes(objectRole)) {
      throw createValidationError(
        "invalid_object_role",
        `Object ${objectId} must use an approved object role.`
      );
    }

    return deepFreeze({
      objectId,
      objectRole,
      collectionId: normalizeUppercaseId(
        objectDefinition.collectionId,
        `objectDefinitions[${index}].collectionId`
      ),
      componentReference:
        objectDefinition.componentReference === null
          ? null
          : normalizePermanentId(
              objectDefinition.componentReference,
              `objectDefinitions[${index}].componentReference`
            ),
      materialReference: normalizePermanentId(
        objectDefinition.materialReference,
        `objectDefinitions[${index}].materialReference`
      ),
      appearanceProfiles: deepFreeze(
        normalizeUppercaseIdArray(
          objectDefinition.appearanceProfiles,
          `objectDefinitions[${index}].appearanceProfiles`
        )
      ),
      lodMembership: deepFreeze(
        normalizeUppercaseIdArray(
          objectDefinition.lodMembership,
          `objectDefinitions[${index}].lodMembership`
        )
      )
    });
  });
}

function normalizeMaterialDefinitions(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "Field materialDefinitions must be an array of material definitions."
    );
  }

  return value.map((entry, index) => {
    const materialDefinition = asPlainObject(entry, `materialDefinitions[${index}]`);
    return deepFreeze({
      materialId: normalizePermanentId(
        materialDefinition.materialId,
        `materialDefinitions[${index}].materialId`
      ),
      materialRole: normalizeStringValue(
        materialDefinition.materialRole,
        `materialDefinitions[${index}].materialRole`
      ),
      collectionId: normalizeUppercaseId(
        materialDefinition.collectionId,
        `materialDefinitions[${index}].collectionId`
      ),
      appearanceProfiles: deepFreeze(
        normalizeUppercaseIdArray(
          materialDefinition.appearanceProfiles,
          `materialDefinitions[${index}].appearanceProfiles`
        )
      )
    });
  });
}

function normalizeSceneMetadata(value) {
  const metadata = asPlainObject(value, "metadata");
  return deepFreeze({
    sceneProfileId: normalizePermanentId(metadata.sceneProfileId, "metadata.sceneProfileId"),
    workspaceLocation: normalizeStringValue(metadata.workspaceLocation, "metadata.workspaceLocation"),
    exportCollectionId: normalizeUppercaseId(
      metadata.exportCollectionId,
      "metadata.exportCollectionId"
    ),
    sceneCompatibilityProfile: normalizeStringValue(
      metadata.sceneCompatibilityProfile,
      "metadata.sceneCompatibilityProfile"
    ),
    appearanceProfileSource: normalizeStringValue(
      metadata.appearanceProfileSource,
      "metadata.appearanceProfileSource"
    )
  });
}

function validateSceneIdentity(scene, workflow) {
  if (scene.assetId !== workflow.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Prototype scene assetId must match the prototype workflow assetId."
    );
  }
}

function validateSceneCollections(collections) {
  if (JSON.stringify(collections) !== JSON.stringify(requiredSceneCollections)) {
    throw createValidationError(
      "scene_structure_mismatch",
      "Prototype scene collections must match the required Blender prototype scene structure."
    );
  }
}

function validateMaterialDefinitions(materialDefinitions, approvedAppearanceProfiles) {
  const materialRoles = materialDefinitions.map((entry) => entry.materialRole);
  if (JSON.stringify(materialRoles) !== JSON.stringify(requiredMaterialRoles)) {
    throw createValidationError(
      "material_definition_mismatch",
      "Prototype material definitions must include the approved lighthouse material role set."
    );
  }

  for (const materialDefinition of materialDefinitions) {
    if (materialDefinition.collectionId !== "MATERIALS") {
      throw createValidationError(
        "material_collection_mismatch",
        `Material ${materialDefinition.materialId} must live in the MATERIALS collection.`
      );
    }

    if (!haveSameEntries(materialDefinition.appearanceProfiles, approvedAppearanceProfiles)) {
      throw createValidationError(
        "appearance_profile_mismatch",
        `Material ${materialDefinition.materialId} must match the approved lighthouse appearance profiles.`
      );
    }
  }
}

function validateObjectDefinitions(objectDefinitions, workflow, materialDefinitions) {
  const objectIds = new Set();
  const approvedComponents = new Set(
    workflow.blenderPrototypeGenerationRequest.componentReferences
  );
  const approvedAppearanceProfiles =
    workflow.blenderPrototypeGenerationRequest.appearanceProfiles;
  const materialIds = new Set(materialDefinitions.map((entry) => entry.materialId));

  for (const objectDefinition of objectDefinitions) {
    if (objectIds.has(objectDefinition.objectId)) {
      throw createValidationError(
        "duplicate_object_definition",
        `Prototype scene object ${objectDefinition.objectId} must be unique.`
      );
    }
    objectIds.add(objectDefinition.objectId);

    if (objectDefinition.collectionId !== "GEOMETRY") {
      throw createValidationError(
        "object_collection_mismatch",
        `Object ${objectDefinition.objectId} must be placed in the GEOMETRY collection.`
      );
    }

    if (!materialIds.has(objectDefinition.materialReference)) {
      throw createValidationError(
        "material_reference_mismatch",
        `Object ${objectDefinition.objectId} references an unknown material definition.`
      );
    }

    for (const lodCollection of objectDefinition.lodMembership) {
      if (!supportedLodCollections.includes(lodCollection)) {
        throw createValidationError(
          "invalid_lod_membership",
          `Object ${objectDefinition.objectId} uses an unsupported LOD collection ${lodCollection}.`
        );
      }
    }

    if (objectDefinition.objectRole === "coastal-environment-placeholder") {
      if (objectDefinition.componentReference !== null) {
        throw createValidationError(
          "placeholder_component_mismatch",
          `Coastal environment placeholder ${objectDefinition.objectId} must not claim a lighthouse component reference.`
        );
      }
    } else if (!approvedComponents.has(objectDefinition.componentReference)) {
      throw createValidationError(
        "component_reference_mismatch",
        `Object ${objectDefinition.objectId} must map to an approved lighthouse component reference.`
      );
    }

    const isNightOnly = objectDefinition.objectRole === "beam-effect-placeholder";
    const expectedProfiles = isNightOnly
      ? ["NIGHT_COASTAL_LIGHTHOUSE"]
      : approvedAppearanceProfiles;

    if (!haveSameEntries(objectDefinition.appearanceProfiles, expectedProfiles)) {
      throw createValidationError(
        "appearance_profile_mismatch",
        `Object ${objectDefinition.objectId} must use the approved appearance profiles for its role.`
      );
    }
  }
}

function validateSceneMetadata(metadata, workflow) {
  if (!metadata.workspaceLocation.startsWith("asset-factory-workspace/prototypes/")) {
    throw createValidationError(
      "workspace_location_invalid",
      "Prototype scene workspaceLocation must live under the prototype workspace root."
    );
  }

  if (metadata.exportCollectionId !== "EXPORT") {
    throw createValidationError(
      "export_collection_invalid",
      "Prototype scene exportCollectionId must be EXPORT."
    );
  }

  if (
    !metadata.workspaceLocation.startsWith(
      workflow.prototypeGenerationMetadata.workspaceLocation
    )
  ) {
    throw createValidationError(
      "workspace_compatibility_mismatch",
      "Prototype scene workspaceLocation must be nested under the approved prototype workspaceLocation."
    );
  }
}

function assertRequiredFields(scene) {
  for (const fieldName of blenderPrototypeSceneGenerationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(scene, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Prototype scene generation is missing required field ${fieldName}.`
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

function normalizeUppercaseId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!uppercaseProfilePattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved uppercase ID format.`
    );
  }
  return normalized;
}

function normalizeUppercaseIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of uppercase IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizeUppercaseId(entry, `${fieldName}[${index}]`)
  );
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

function haveSameEntries(left, right) {
  return JSON.stringify(left.slice().sort()) === JSON.stringify(right.slice().sort());
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BlenderPrototypeSceneGenerationValidationError";
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
