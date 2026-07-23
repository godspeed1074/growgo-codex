import {
  buildCoastalAustraliaAssetSpecificationPackContext,
  coastalAustraliaAssetSpecificationPackDefinition
} from "./coastal-australia-asset-specification-pack.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";
import { adaptFactoryAssetForRenderer } from "./factory-to-renderer-adapter.mjs";
import { consumePassiveRendererPayload } from "./passive-renderer-consumer.mjs";

export const realAssetSpecificationPipelineValidationRequiredFields = Object.freeze([
  "assetId",
  "locationId",
  "coordinates",
  "seed"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export const realAssetSpecificationPipelineValidationDefinition = Object.freeze({
  assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
  locationId: "COASTAL_PIPELINE_VALIDATION_PLOT_001",
  coordinates: Object.freeze({
    x: 14.25,
    y: 6.75
  }),
  seed: "real-asset-specification-pipeline-seed-001"
});

export function buildRealAssetSpecificationPipelineValidationContext() {
  return Object.freeze(buildCoastalAustraliaAssetSpecificationPackContext());
}

export function validateRealAssetSpecificationPipeline(
  rawInput = realAssetSpecificationPipelineValidationDefinition,
  options = {}
) {
  const normalizedOptions = normalizePipelineOptions(options);

  try {
    assertRequiredRegistries(normalizedOptions);
    const normalizedInput = normalizePipelineInput(rawInput);
    const specification = findAssetSpecification(normalizedInput.assetId);
    const asset = validateAssetAvailability(normalizedInput.assetId, normalizedOptions);
    const manifest = validateManifestAvailability(normalizedInput.assetId, normalizedOptions);
    const recipe = validateRecipeAvailability(manifest.recipeId, normalizedOptions);
    validateComponentAvailability(
      specification.componentRequirements,
      manifest.componentReferences,
      normalizedOptions
    );

    const placementResult = calculateDeterministicPlacement(
      {
        placementRuleId: specification.placementExpectations.placementRuleId,
        assetId: normalizedInput.assetId,
        locationId: normalizedInput.locationId,
        coordinates: normalizedInput.coordinates,
        seed: normalizedInput.seed,
        terrainType: specification.placementExpectations.terrainProfile[0],
        locationType: specification.placementExpectations.preferredLocations[0]
      },
      normalizedOptions
    );

    if (!placementResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: placementResult.errorCode,
        message: placementResult.message,
        pipelineResult: null
      });
    }

    const adapterResult = adaptFactoryAssetForRenderer(
      {
        assetId: normalizedInput.assetId,
        manifestReference: {
          assetId: manifest.assetId,
          category: manifest.category
        },
        recipeReference: recipe.recipeId,
        componentReferences: [...manifest.componentReferences],
        placementData: {
          placementRuleId: placementResult.deterministicPlacement.placementRuleId,
          locationId: placementResult.placement.locationId,
          alignmentRule: placementResult.placement.alignmentRule,
          position: {
            x: placementResult.placement.position.x,
            y: placementResult.placement.position.y
          }
        },
        orientation: placementResult.placement.orientation,
        metadata: {
          rendererAdapterProfile: "custom-2.5d-passive",
          placementMetadata: {
            pipelineValidation: true,
            sourceSpecification: specification.assetId
          }
        }
      },
      normalizedOptions
    );

    if (!adapterResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: adapterResult.errorCode,
        message: adapterResult.message,
        pipelineResult: null
      });
    }

    const consumerResult = consumePassiveRendererPayload({
      ...adapterResult,
      orientation: adapterResult.transformData.orientation
    });

    if (!consumerResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: consumerResult.errorCode,
        message: consumerResult.message,
        pipelineResult: null
      });
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      pipelineResult: Object.freeze({
        specification,
        asset,
        manifest,
        recipe,
        placementResult,
        adapterResult,
        consumerResult,
        rendererPayload: consumerResult.acceptedPayload
      })
    });
  } catch (error) {
    if (error?.name !== "RealAssetSpecificationPipelineValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      pipelineResult: null
    });
  }
}

function findAssetSpecification(assetId) {
  const specification =
    coastalAustraliaAssetSpecificationPackDefinition.assetSpecifications.find(
      (entry) => entry.assetId === assetId
    ) ?? null;

  if (!specification) {
    throw createPipelineValidationError(
      "missing_asset_specification",
      `Asset specification ${assetId} is not available in the coastal Australia specification pack.`
    );
  }

  return specification;
}

function validateAssetAvailability(assetId, options) {
  const asset = options.assetRegistry.findAssetById(assetId);
  if (!asset) {
    throw createPipelineValidationError(
      "missing_asset_reference",
      `Pipeline asset ${assetId} is not registered.`
    );
  }

  if (
    typeof options.assetRegistry.isAssetAvailable === "function" &&
    !options.assetRegistry.isAssetAvailable(assetId)
  ) {
    throw createPipelineValidationError(
      "unavailable_asset_reference",
      `Pipeline asset ${assetId} is not approved.`
    );
  }

  return asset;
}

function validateManifestAvailability(assetId, options) {
  const manifest = options.manifestRegistry.findManifestByAssetId(assetId);
  if (!manifest) {
    throw createPipelineValidationError(
      "missing_manifest_reference",
      `Pipeline asset ${assetId} is missing a manifest.`
    );
  }

  if (
    typeof options.manifestRegistry.isManifestAvailable === "function" &&
    !options.manifestRegistry.isManifestAvailable(assetId)
  ) {
    throw createPipelineValidationError(
      "unavailable_manifest_reference",
      `Pipeline manifest ${assetId} is not approved.`
    );
  }

  return manifest;
}

function validateRecipeAvailability(recipeId, options) {
  const recipe = options.recipeRegistry.findRecipeById(recipeId);
  if (!recipe) {
    throw createPipelineValidationError(
      "missing_recipe_reference",
      `Pipeline recipe ${recipeId} is not registered.`
    );
  }

  if (
    typeof options.recipeRegistry.isRecipeAvailable === "function" &&
    !options.recipeRegistry.isRecipeAvailable(recipeId)
  ) {
    throw createPipelineValidationError(
      "unavailable_recipe_reference",
      `Pipeline recipe ${recipeId} is not approved.`
    );
  }

  return recipe;
}

function validateComponentAvailability(componentRequirements, manifestComponents, options) {
  if (componentRequirements.length !== manifestComponents.length) {
    throw createPipelineValidationError(
      "component_requirement_mismatch",
      "Pipeline specification component requirements must match the manifest component set."
    );
  }

  for (const componentId of componentRequirements) {
    if (!manifestComponents.includes(componentId)) {
      throw createPipelineValidationError(
        "component_requirement_mismatch",
        `Pipeline component ${componentId} is not part of the manifest component set.`
      );
    }

    if (!options.componentLibrary.findComponentById(componentId)) {
      throw createPipelineValidationError(
        "missing_component_reference",
        `Pipeline component ${componentId} is not registered.`
      );
    }

    if (
      typeof options.componentLibrary.isComponentAvailable === "function" &&
      !options.componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createPipelineValidationError(
        "unavailable_component_reference",
        `Pipeline component ${componentId} is not approved.`
      );
    }
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
      throw createPipelineValidationError(
        errorCode,
        `Real asset specification pipeline requires available ${key}.`
      );
    }
  }
}

function normalizePipelineOptions(options) {
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

function normalizePipelineInput(rawInput) {
  const input = asPlainObject(rawInput, "real asset specification pipeline input");
  assertRequiredFields(input);

  return Object.freeze({
    assetId: normalizePermanentId(input.assetId, "assetId"),
    locationId: normalizeStringValue(input.locationId, "locationId"),
    coordinates: Object.freeze({
      x: normalizeFiniteNumber(input.coordinates?.x, "coordinates.x"),
      y: normalizeFiniteNumber(input.coordinates?.y, "coordinates.y")
    }),
    seed: normalizeStringValue(input.seed, "seed")
  });
}

function assertRequiredFields(input) {
  for (const fieldName of realAssetSpecificationPipelineValidationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(input, fieldName)) {
      throw createPipelineValidationError(
        "missing_required_field",
        `Real asset specification pipeline input is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createPipelineValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createPipelineValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createPipelineValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createPipelineValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createPipelineValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createPipelineValidationError(code, message) {
  const error = new Error(message);
  error.name = "RealAssetSpecificationPipelineValidationError";
  error.code = code;
  return error;
}
