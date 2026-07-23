import {
  adaptFactoryAssetForRenderer,
  validateFactoryToRendererAdapterInput
} from "./factory-to-renderer-adapter.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";

export const syntheticFactoryRendererValidationSceneRequiredFields = Object.freeze([
  "sceneId",
  "seed",
  "locationId",
  "assetReferences",
  "placementReferences"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export const syntheticFactoryRendererValidationSceneDefinition = deepFreeze({
  sceneId: "SYNTHETIC_FACTORY_RENDERER_VALIDATION_SCENE_001",
  seed: "synthetic-factory-renderer-seed-001",
  locationId: "SYNTHETIC_VALIDATION_PLOT_001",
  assetReferences: deepFreeze(["BUILDING_HOUSE_SMALL_COASTAL_001"]),
  placementReferences: deepFreeze([
    deepFreeze({
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      coordinates: deepFreeze({
        x: 10.25,
        y: 4.75
      }),
      terrainType: "grass",
      locationType: "building_plot"
    })
  ])
});

export function buildSyntheticFactoryRendererValidationScene(
  scene = syntheticFactoryRendererValidationSceneDefinition,
  options = {}
) {
  const normalizedOptions = normalizeSceneOptions(options);
  const validation = validateSyntheticFactoryRendererValidationScene(
    scene,
    normalizedOptions
  );

  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      scene: null
    });
  }

  const normalizedScene = validation.normalizedScene;
  const assetId = normalizedScene.assetReferences[0];
  const placementReference = normalizedScene.placementReferences[0];
  const manifest =
    normalizedOptions.manifestRegistry.findManifestByAssetId(assetId);

  const placementResult = calculateDeterministicPlacement(
    {
      placementRuleId: placementReference.placementRuleId,
      assetId: placementReference.assetId,
      locationId: normalizedScene.locationId,
      coordinates: placementReference.coordinates,
      seed: normalizedScene.seed,
      terrainType: placementReference.terrainType,
      locationType: placementReference.locationType
    },
    normalizedOptions
  );

  if (!placementResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: placementResult.errorCode,
      message: placementResult.message,
      scene: null
    });
  }

  const adapterInput = Object.freeze({
    assetId,
    manifestReference: Object.freeze({
      assetId: manifest.assetId,
      category: manifest.category
    }),
    recipeReference: manifest.recipeId,
    componentReferences: deepFreeze([...manifest.componentReferences]),
    placementData: Object.freeze({
      placementRuleId: placementResult.deterministicPlacement.placementRuleId,
      locationId: placementResult.placement.locationId,
      alignmentRule: placementResult.placement.alignmentRule,
      position: deepFreeze({
        x: placementResult.placement.position.x,
        y: placementResult.placement.position.y
      })
    }),
    orientation: placementResult.placement.orientation,
    metadata: Object.freeze({
      rendererAdapterProfile: "custom-2.5d-passive",
      placementMetadata: Object.freeze({
        syntheticValidationScene: normalizedScene.sceneId
      })
    })
  });

  const adapterValidation = validateFactoryToRendererAdapterInput(
    adapterInput,
    normalizedOptions
  );

  if (!adapterValidation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: adapterValidation.errorCode,
      message: adapterValidation.message,
      scene: null
    });
  }

  const adapterResult = adaptFactoryAssetForRenderer(
    adapterInput,
    normalizedOptions
  );

  if (!adapterResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: adapterResult.errorCode,
      message: adapterResult.message,
      scene: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    scene: Object.freeze({
      sceneId: normalizedScene.sceneId,
      seed: normalizedScene.seed,
      locationId: normalizedScene.locationId,
      assetReferences: normalizedScene.assetReferences,
      placementReferences: normalizedScene.placementReferences,
      rendererAdapterOutput: Object.freeze({
        rendererAssetReference: adapterResult.rendererAssetReference,
        rendererComponentReferences: adapterResult.rendererComponentReferences,
        transformData: adapterResult.transformData,
        metadata: adapterResult.metadata
      })
    })
  });
}

export function validateSyntheticFactoryRendererValidationScene(
  scene = syntheticFactoryRendererValidationSceneDefinition,
  options = {}
) {
  try {
    const normalizedScene = normalizeSceneDefinition(
      scene,
      normalizeSceneOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedScene,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "SyntheticFactoryRendererValidationSceneError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedScene: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeSceneDefinition(rawScene, options) {
  assertRequiredRegistries(options);

  const scene = asPlainObject(rawScene, "synthetic validation scene");
  assertRequiredFields(scene);

  const sceneId = normalizePermanentId(scene.sceneId, "sceneId");
  const seed = normalizeStringValue(scene.seed, "seed");
  const locationId = normalizeStringValue(scene.locationId, "locationId");
  const assetReferences = normalizePermanentIdArray(
    scene.assetReferences,
    "assetReferences"
  );
  const placementReferences = normalizePlacementReferences(
    scene.placementReferences
  );

  if (assetReferences.length !== 1 || placementReferences.length !== 1) {
    throw createSceneValidationError(
      "invalid_scene_shape",
      "Synthetic validation scene must contain exactly one asset reference and one placement reference."
    );
  }

  const assetId = assetReferences[0];
  const placementReference = placementReferences[0];

  if (placementReference.assetId !== assetId) {
    throw createSceneValidationError(
      "scene_asset_mismatch",
      `Placement reference asset ${placementReference.assetId} does not match scene asset ${assetId}.`
    );
  }

  validateAssetChainAvailability(assetId, options);
  validatePlacementReference(assetId, placementReference, options);

  return Object.freeze({
    sceneId,
    seed,
    locationId,
    assetReferences: deepFreeze(assetReferences),
    placementReferences: deepFreeze(placementReferences)
  });
}

function validateAssetChainAvailability(assetId, options) {
  const asset = options.assetRegistry.findAssetById(assetId);
  if (!asset) {
    throw createSceneValidationError(
      "missing_asset_reference",
      `Synthetic validation scene asset ${assetId} is not available.`
    );
  }

  if (
    typeof options.assetRegistry.isAssetAvailable === "function" &&
    !options.assetRegistry.isAssetAvailable(assetId)
  ) {
    throw createSceneValidationError(
      "unavailable_asset_reference",
      `Synthetic validation scene asset ${assetId} is not approved.`
    );
  }

  const manifest = options.manifestRegistry.findManifestByAssetId(assetId);
  if (!manifest) {
    throw createSceneValidationError(
      "missing_manifest_reference",
      `Synthetic validation scene asset ${assetId} is missing a manifest.`
    );
  }

  if (
    typeof options.manifestRegistry.isManifestAvailable === "function" &&
    !options.manifestRegistry.isManifestAvailable(assetId)
  ) {
    throw createSceneValidationError(
      "unavailable_manifest_reference",
      `Synthetic validation scene manifest ${assetId} is not approved.`
    );
  }

  const recipe = options.recipeRegistry.findRecipeById(manifest.recipeId);
  if (!recipe) {
    throw createSceneValidationError(
      "missing_recipe_reference",
      `Synthetic validation scene manifest ${assetId} references a missing recipe.`
    );
  }

  if (
    typeof options.recipeRegistry.isRecipeAvailable === "function" &&
    !options.recipeRegistry.isRecipeAvailable(manifest.recipeId)
  ) {
    throw createSceneValidationError(
      "unavailable_recipe_reference",
      `Synthetic validation scene recipe ${manifest.recipeId} is not approved.`
    );
  }

  for (const componentId of manifest.componentReferences) {
    if (!options.componentLibrary.findComponentById(componentId)) {
      throw createSceneValidationError(
        "missing_component_reference",
        `Synthetic validation scene component ${componentId} is missing.`
      );
    }

    if (
      typeof options.componentLibrary.isComponentAvailable === "function" &&
      !options.componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createSceneValidationError(
        "unavailable_component_reference",
        `Synthetic validation scene component ${componentId} is not approved.`
      );
    }
  }
}

function validatePlacementReference(assetId, placementReference, options) {
  const placementRule = options.placementRuleRegistry.findPlacementRuleById(
    placementReference.placementRuleId
  );

  if (!placementRule) {
    throw createSceneValidationError(
      "missing_placement_rule",
      `Synthetic validation scene placement rule ${placementReference.placementRuleId} is missing.`
    );
  }

  if (
    placementRule.compatibilityRules.allowedAssetIds.length > 0 &&
    !placementRule.compatibilityRules.allowedAssetIds.includes(assetId)
  ) {
    throw createSceneValidationError(
      "asset_not_allowed_by_placement_rule",
      `Synthetic validation scene asset ${assetId} is not approved by placement rule ${placementReference.placementRuleId}.`
    );
  }
}

function assertRequiredRegistries(options) {
  const requiredChecks = [
    ["assetRegistry", "findAssetById", "asset_registry_unavailable"],
    [
      "manifestRegistry",
      "findManifestByAssetId",
      "manifest_registry_unavailable"
    ],
    ["recipeRegistry", "findRecipeById", "recipe_registry_unavailable"],
    ["componentLibrary", "findComponentById", "component_library_unavailable"],
    [
      "placementRuleRegistry",
      "findPlacementRuleById",
      "placement_rule_registry_unavailable"
    ]
  ];

  for (const [key, methodName, errorCode] of requiredChecks) {
    if (!options[key] || typeof options[key][methodName] !== "function") {
      throw createSceneValidationError(
        errorCode,
        `Synthetic validation scene requires available ${key}.`
      );
    }
  }
}

function assertRequiredFields(scene) {
  for (const fieldName of syntheticFactoryRendererValidationSceneRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(scene, fieldName)) {
      throw createSceneValidationError(
        "missing_required_field",
        `Synthetic validation scene is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeSceneOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      assetRegistry: null,
      manifestRegistry: null,
      recipeRegistry: null,
      componentLibrary: null,
      placementRuleRegistry: null
    });
  }

  return Object.freeze({
    assetRegistry:
      options.assetRegistry && typeof options.assetRegistry === "object"
        ? options.assetRegistry
        : null,
    manifestRegistry:
      options.manifestRegistry && typeof options.manifestRegistry === "object"
        ? options.manifestRegistry
        : null,
    recipeRegistry:
      options.recipeRegistry && typeof options.recipeRegistry === "object"
        ? options.recipeRegistry
        : null,
    componentLibrary:
      options.componentLibrary && typeof options.componentLibrary === "object"
        ? options.componentLibrary
        : null,
    placementRuleRegistry:
      options.placementRuleRegistry &&
      typeof options.placementRuleRegistry === "object"
        ? options.placementRuleRegistry
        : null
  });
}

function normalizePlacementReferences(value) {
  if (!Array.isArray(value)) {
    throw createSceneValidationError(
      "invalid_field_type",
      "Field placementReferences must be an array of placement references."
    );
  }

  return value.map((entry, index) => {
    const placementReference = asPlainObject(
      entry,
      `placementReferences[${index}]`
    );

    return deepFreeze({
      placementRuleId: normalizePermanentId(
        placementReference.placementRuleId,
        `placementReferences[${index}].placementRuleId`
      ),
      assetId: normalizePermanentId(
        placementReference.assetId,
        `placementReferences[${index}].assetId`
      ),
      coordinates: deepFreeze({
        x: normalizeFiniteNumber(
          placementReference.coordinates?.x,
          `placementReferences[${index}].coordinates.x`
        ),
        y: normalizeFiniteNumber(
          placementReference.coordinates?.y,
          `placementReferences[${index}].coordinates.y`
        )
      }),
      terrainType: normalizeStringValue(
        placementReference.terrainType,
        `placementReferences[${index}].terrainType`
      ),
      locationType: normalizeStringValue(
        placementReference.locationType,
        `placementReferences[${index}].locationType`
      )
    });
  });
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createSceneValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();

  if (!permanentIdPattern.test(normalized)) {
    throw createSceneValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createSceneValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createSceneValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createSceneValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createSceneValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createSceneValidationError(code, message) {
  const error = new Error(message);
  error.name = "SyntheticFactoryRendererValidationSceneError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}
