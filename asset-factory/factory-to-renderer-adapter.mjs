import { assetFactoryCategories } from "./asset-registry.mjs";
import { allowedPlacementOrientations } from "./world-placement-rules.mjs";

export const factoryToRendererAdapterRequiredFields = Object.freeze([
  "assetId",
  "manifestReference",
  "recipeReference",
  "componentReferences",
  "placementData",
  "orientation",
  "metadata"
]);

export const supportedRendererAdapterProfiles = Object.freeze([
  "custom-2.5d-passive"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createFactoryToRendererAdapter(options = {}) {
  const normalizedOptions = normalizeAdapterOptions(options);

  return Object.freeze({
    adapt(input) {
      return adaptFactoryAssetForRenderer(input, normalizedOptions);
    },
    validateInput(input) {
      return validateFactoryToRendererAdapterInput(input, normalizedOptions);
    }
  });
}

export function adaptFactoryAssetForRenderer(input, options = {}) {
  const normalizedOptions = normalizeAdapterOptions(options);
  const validation = validateFactoryToRendererAdapterInput(
    input,
    normalizedOptions
  );

  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      rendererAssetReference: null,
      rendererComponentReferences: null,
      transformData: null,
      metadata: null
    });
  }

  const normalizedInput = validation.normalizedInput;
  const asset = normalizedOptions.assetRegistry.findAssetById(
    normalizedInput.assetId
  );
  const manifest = normalizedOptions.manifestRegistry.findManifestByAssetId(
    normalizedInput.assetId
  );
  const recipe = normalizedOptions.recipeRegistry.findRecipeById(
    normalizedInput.recipeReference
  );

  const rendererAssetReference = Object.freeze({
    assetId: normalizedInput.assetId,
    manifestId: manifest.assetId,
    recipeId: recipe.recipeId,
    rendererCategory: manifest.category,
    rendererLayer: mapAssetCategoryToRendererLayer(manifest.category)
  });

  const rendererComponentReferences = Object.freeze(
    normalizedInput.componentReferences.map((componentId) => {
      const component =
        normalizedOptions.componentLibrary.findComponentById(componentId);

      return Object.freeze({
        componentId,
        rendererComponentKey: component.type,
        rendererComponentCategory: component.category
      });
    })
  );

  const transformData = Object.freeze({
    position: deepFreeze({
      x: normalizedInput.placementData.position.x,
      y: normalizedInput.placementData.position.y
    }),
    orientation: normalizedInput.orientation,
    alignmentRule: normalizedInput.placementData.alignmentRule,
    placementRuleId: normalizedInput.placementData.placementRuleId,
    locationId: normalizedInput.placementData.locationId
  });

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    rendererAssetReference,
    rendererComponentReferences,
    transformData,
    metadata: deepFreeze({
      adapterProfile: normalizedInput.metadata.rendererAdapterProfile,
      assetMetadata: asset.metadata,
      manifestMetadata: manifest.metadata,
      recipeMetadata: recipe.metadata,
      placementMetadata: normalizedInput.metadata.placementMetadata ?? null
    })
  });
}

export function validateFactoryToRendererAdapterInput(input, options = {}) {
  try {
    const normalizedInput = normalizeAdapterInput(
      input,
      normalizeAdapterOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedInput,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "FactoryToRendererAdapterValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedInput: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeAdapterInput(rawInput, options) {
  const input = asPlainObject(rawInput, "factory-to-renderer adapter input");
  assertRequiredFields(input);
  assertRequiredRegistries(options);

  const assetId = normalizePermanentId(input.assetId, "assetId");
  const manifestReference = normalizeManifestReference(input.manifestReference);
  const recipeReference = normalizePermanentId(
    input.recipeReference,
    "recipeReference"
  );
  const componentReferences = normalizePermanentIdArray(
    input.componentReferences,
    "componentReferences"
  );
  const placementData = normalizePlacementData(input.placementData);
  const orientation = normalizeOrientation(input.orientation);
  const metadata = normalizeAdapterMetadata(input.metadata);

  validateAssetAvailability(assetId, options.assetRegistry);
  validateManifestAvailability(assetId, manifestReference, options.manifestRegistry);
  validateRecipeAvailability(
    assetId,
    recipeReference,
    options.manifestRegistry,
    options.recipeRegistry
  );
  validateComponentReferences(
    assetId,
    componentReferences,
    options.manifestRegistry,
    options.componentLibrary
  );
  validatePlacementCompatibility(
    assetId,
    placementData,
    orientation,
    options.assetRegistry,
    options.placementRuleRegistry
  );

  return Object.freeze({
    assetId,
    manifestReference,
    recipeReference,
    componentReferences: deepFreeze(componentReferences),
    placementData,
    orientation,
    metadata
  });
}

function assertRequiredRegistries(options) {
  if (!options.assetRegistry || typeof options.assetRegistry.findAssetById !== "function") {
    throw createAdapterValidationError(
      "asset_registry_unavailable",
      "Factory-to-renderer adapter validation requires an available asset registry."
    );
  }

  if (
    !options.manifestRegistry ||
    typeof options.manifestRegistry.findManifestByAssetId !== "function"
  ) {
    throw createAdapterValidationError(
      "manifest_registry_unavailable",
      "Factory-to-renderer adapter validation requires an available manifest registry."
    );
  }

  if (
    !options.recipeRegistry ||
    typeof options.recipeRegistry.findRecipeById !== "function"
  ) {
    throw createAdapterValidationError(
      "recipe_registry_unavailable",
      "Factory-to-renderer adapter validation requires an available recipe registry."
    );
  }

  if (
    !options.componentLibrary ||
    typeof options.componentLibrary.findComponentById !== "function"
  ) {
    throw createAdapterValidationError(
      "component_library_unavailable",
      "Factory-to-renderer adapter validation requires an available component library."
    );
  }

  if (
    !options.placementRuleRegistry ||
    typeof options.placementRuleRegistry.findPlacementRuleById !== "function"
  ) {
    throw createAdapterValidationError(
      "placement_rule_registry_unavailable",
      "Factory-to-renderer adapter validation requires an available placement rule registry."
    );
  }
}

function validateAssetAvailability(assetId, assetRegistry) {
  const asset = assetRegistry.findAssetById(assetId);
  if (!asset) {
    throw createAdapterValidationError(
      "missing_asset_reference",
      `Asset ${assetId} is not available for renderer adaptation.`
    );
  }

  if (
    typeof assetRegistry.isAssetAvailable === "function" &&
    !assetRegistry.isAssetAvailable(assetId)
  ) {
    throw createAdapterValidationError(
      "unavailable_asset_reference",
      `Asset ${assetId} is not approved for renderer adaptation.`
    );
  }
}

function validateManifestAvailability(assetId, manifestReference, manifestRegistry) {
  const manifest = manifestRegistry.findManifestByAssetId(assetId);
  if (!manifest) {
    throw createAdapterValidationError(
      "missing_manifest_reference",
      `Asset ${assetId} does not have an approved manifest for renderer adaptation.`
    );
  }

  if (manifestReference.assetId !== manifest.assetId) {
    throw createAdapterValidationError(
      "manifest_asset_mismatch",
      `Manifest reference ${manifestReference.assetId} does not match asset ${assetId}.`
    );
  }

  if (
    typeof manifestRegistry.isManifestAvailable === "function" &&
    !manifestRegistry.isManifestAvailable(assetId)
  ) {
    throw createAdapterValidationError(
      "unavailable_manifest_reference",
      `Manifest ${assetId} is not approved for renderer adaptation.`
    );
  }
}

function validateRecipeAvailability(
  assetId,
  recipeReference,
  manifestRegistry,
  recipeRegistry
) {
  const manifest = manifestRegistry.findManifestByAssetId(assetId);
  if (manifest.recipeId !== recipeReference) {
    throw createAdapterValidationError(
      "recipe_manifest_mismatch",
      `Recipe ${recipeReference} does not match manifest recipe ${manifest.recipeId}.`
    );
  }

  const recipe = recipeRegistry.findRecipeById(recipeReference);
  if (!recipe) {
    throw createAdapterValidationError(
      "missing_recipe_reference",
      `Recipe ${recipeReference} is not available for renderer adaptation.`
    );
  }

  if (
    typeof recipeRegistry.isRecipeAvailable === "function" &&
    !recipeRegistry.isRecipeAvailable(recipeReference)
  ) {
    throw createAdapterValidationError(
      "unavailable_recipe_reference",
      `Recipe ${recipeReference} is not approved for renderer adaptation.`
    );
  }
}

function validateComponentReferences(
  assetId,
  componentReferences,
  manifestRegistry,
  componentLibrary
) {
  const manifest = manifestRegistry.findManifestByAssetId(assetId);
  const manifestComponentReferences = manifest.componentReferences;

  if (componentReferences.length !== manifestComponentReferences.length) {
    throw createAdapterValidationError(
      "component_reference_mismatch",
      `Asset ${assetId} must provide the exact manifest component reference set.`
    );
  }

  for (const componentId of componentReferences) {
    if (!manifestComponentReferences.includes(componentId)) {
      throw createAdapterValidationError(
        "component_reference_mismatch",
        `Component ${componentId} is not part of manifest ${assetId}.`
      );
    }

    const component = componentLibrary.findComponentById(componentId);
    if (!component) {
      throw createAdapterValidationError(
        "missing_component_reference",
        `Component ${componentId} is not available for renderer adaptation.`
      );
    }

    if (
      typeof componentLibrary.isComponentAvailable === "function" &&
      !componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createAdapterValidationError(
        "unavailable_component_reference",
        `Component ${componentId} is not approved for renderer adaptation.`
      );
    }
  }
}

function validatePlacementCompatibility(
  assetId,
  placementData,
  orientation,
  assetRegistry,
  placementRuleRegistry
) {
  const asset = assetRegistry.findAssetById(assetId);
  const placementRule = placementRuleRegistry.findPlacementRuleById(
    placementData.placementRuleId
  );

  if (!placementRule) {
    throw createAdapterValidationError(
      "missing_placement_rule",
      `Placement rule ${placementData.placementRuleId} is not available.`
    );
  }

  if (placementRule.assetCategory !== asset.category) {
    throw createAdapterValidationError(
      "placement_category_mismatch",
      `Placement rule ${placementRule.placementRuleId} is not compatible with asset category ${asset.category}.`
    );
  }

  if (
    placementRule.compatibilityRules.allowedAssetIds.length > 0 &&
    !placementRule.compatibilityRules.allowedAssetIds.includes(assetId)
  ) {
    throw createAdapterValidationError(
      "asset_not_allowed_by_placement_rule",
      `Asset ${assetId} is not approved by placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    !placementRule.orientationRules.allowedOrientations.includes(orientation)
  ) {
    throw createAdapterValidationError(
      "orientation_not_allowed",
      `Orientation ${orientation} is not approved by placement rule ${placementRule.placementRuleId}.`
    );
  }
}

function normalizeManifestReference(value) {
  const manifestReference = asPlainObject(value, "manifestReference");

  return deepFreeze({
    assetId: normalizePermanentId(manifestReference.assetId, "manifestReference.assetId"),
    category: normalizeAssetCategory(
      manifestReference.category,
      "manifestReference.category"
    )
  });
}

function normalizePlacementData(value) {
  const placementData = asPlainObject(value, "placementData");

  return deepFreeze({
    placementRuleId: normalizePermanentId(
      placementData.placementRuleId,
      "placementData.placementRuleId"
    ),
    locationId: normalizeStringValue(placementData.locationId, "placementData.locationId"),
    alignmentRule: normalizeStringValue(
      placementData.alignmentRule,
      "placementData.alignmentRule"
    ),
    position: deepFreeze({
      x: normalizeFiniteNumber(placementData.position?.x, "placementData.position.x"),
      y: normalizeFiniteNumber(placementData.position?.y, "placementData.position.y")
    })
  });
}

function normalizeAdapterMetadata(value) {
  const metadata = asPlainObject(value, "metadata");
  const rendererAdapterProfile = normalizeStringValue(
    metadata.rendererAdapterProfile ?? "custom-2.5d-passive",
    "metadata.rendererAdapterProfile"
  );

  if (!supportedRendererAdapterProfiles.includes(rendererAdapterProfile)) {
    throw createAdapterValidationError(
      "unsupported_renderer_data",
      `Renderer adapter profile ${rendererAdapterProfile} is not supported by the passive Factory-to-Renderer adapter contract.`
    );
  }

  return deepFreeze({
    rendererAdapterProfile,
    placementMetadata:
      typeof metadata.placementMetadata === "undefined"
        ? null
        : deepFreeze(asPlainObject(metadata.placementMetadata, "metadata.placementMetadata"))
  });
}

function mapAssetCategoryToRendererLayer(category) {
  switch (category) {
    case "terrain":
      return "ground";
    case "roads":
      return "pathing";
    case "nature":
      return "foliage";
    case "buildings":
      return "structures";
    case "decorations":
      return "details";
    default:
      return "generic";
  }
}

function assertRequiredFields(input) {
  for (const fieldName of factoryToRendererAdapterRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(input, fieldName)) {
      throw createAdapterValidationError(
        "missing_required_field",
        `Factory-to-renderer adapter input is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAdapterOptions(options) {
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

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createAdapterValidationError(
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
    throw createAdapterValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeAssetCategory(value, fieldName) {
  const category = normalizeStringValue(value, fieldName);
  if (!assetFactoryCategories.includes(category)) {
    throw createAdapterValidationError(
      "invalid_category",
      `Field ${fieldName} must use an approved Asset Factory category.`
    );
  }

  return category;
}

function normalizeOrientation(value) {
  const orientation = normalizeStringValue(value, "orientation");
  if (!allowedPlacementOrientations.includes(orientation)) {
    throw createAdapterValidationError(
      "invalid_orientation",
      `Orientation ${orientation} is not approved for the passive renderer adapter contract.`
    );
  }

  return orientation;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAdapterValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createAdapterValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createAdapterValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAdapterValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAdapterValidationError(code, message) {
  const error = new Error(message);
  error.name = "FactoryToRendererAdapterValidationError";
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
