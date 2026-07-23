import {
  buildRealAssetSpecificationPipelineValidationContext,
  realAssetSpecificationPipelineValidationDefinition,
  validateRealAssetSpecificationPipeline
} from "./real-asset-specification-pipeline-validation.mjs";

export const realAssetToCustom25DPassiveRendererValidationRequiredFields = Object.freeze([
  "assetId",
  "locationId",
  "coordinates",
  "seed"
]);

export const realAssetToCustom25DPassiveRendererValidationDefinition = Object.freeze({
  ...realAssetSpecificationPipelineValidationDefinition
});

const supportedRendererProfile = "custom-2.5d-passive";

export function buildRealAssetToCustom25DPassiveRendererValidationContext() {
  return Object.freeze(buildRealAssetSpecificationPipelineValidationContext());
}

export function validateRealAssetToCustom25DPassiveRenderer(
  rawInput = realAssetToCustom25DPassiveRendererValidationDefinition,
  options = {}
) {
  const pipelineResult = validateRealAssetSpecificationPipeline(rawInput, options);

  if (!pipelineResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: pipelineResult.errorCode,
      message: pipelineResult.message,
      custom25DValidation: null
    });
  }

  try {
    const custom25DValidation = validateCustom25DPassiveRendererCompatibility(
      pipelineResult.pipelineResult
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      custom25DValidation
    });
  } catch (error) {
    if (error?.name !== "RealAssetToCustom25DPassiveRendererValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      custom25DValidation: null
    });
  }
}

export function validateCustom25DPassiveRendererCompatibility(rawArtifacts) {
  const artifacts = normalizePipelineArtifacts(rawArtifacts);
  const {
    specification,
    manifest,
    recipe,
    placementResult,
    adapterResult,
    consumerResult,
    rendererPayload
  } = artifacts;

  const expectedOrientation = placementResult.placement.orientation;
  const expectedPosition = placementResult.placement.position;
  const expectedComponentIds = manifest.componentReferences;
  const rendererComponentIds = rendererPayload.rendererComponentReferences.map(
    (componentReference) => componentReference.componentId
  );

  if (rendererPayload.metadata.adapterProfile !== supportedRendererProfile) {
    throw createCustom25DValidationError(
      "unsupported_renderer_profile",
      `Renderer payload profile ${rendererPayload.metadata.adapterProfile} is not compatible with the Custom 2.5D passive renderer contract.`
    );
  }

  if (rendererPayload.rendererAssetReference.assetId !== specification.assetId) {
    throw createCustom25DValidationError(
      "asset_identity_mismatch",
      "Renderer-facing asset identity must match the validated real asset specification."
    );
  }

  if (rendererPayload.rendererAssetReference.manifestId !== manifest.assetId) {
    throw createCustom25DValidationError(
      "manifest_reference_mismatch",
      "Renderer-facing manifest identity must match the validated manifest reference."
    );
  }

  if (rendererPayload.rendererAssetReference.recipeId !== recipe.recipeId) {
    throw createCustom25DValidationError(
      "recipe_reference_mismatch",
      "Renderer-facing recipe identity must match the validated recipe reference."
    );
  }

  if (JSON.stringify(rendererComponentIds) !== JSON.stringify(expectedComponentIds)) {
    throw createCustom25DValidationError(
      "component_reference_mismatch",
      "Renderer-facing component references must match the approved manifest component references."
    );
  }

  if (!specification.orientationSupport.allowedOrientations.includes(expectedOrientation)) {
    throw createCustom25DValidationError(
      "unsupported_orientation",
      `Orientation ${expectedOrientation} is not approved by the asset specification orientation contract.`
    );
  }

  if (rendererPayload.transformData.orientation !== expectedOrientation) {
    throw createCustom25DValidationError(
      "transform_orientation_mismatch",
      "Renderer-facing transform orientation must match the validated placement orientation."
    );
  }

  if (
    rendererPayload.transformData.position.x !== expectedPosition.x ||
    rendererPayload.transformData.position.y !== expectedPosition.y
  ) {
    throw createCustom25DValidationError(
      "transform_position_mismatch",
      "Renderer-facing transform position must match the deterministic placement position."
    );
  }

  if (
    rendererPayload.transformData.placementRuleId !==
    placementResult.deterministicPlacement.placementRuleId
  ) {
    throw createCustom25DValidationError(
      "placement_rule_mismatch",
      "Renderer-facing placement rule must match the deterministic placement contract."
    );
  }

  if (rendererPayload.transformData.locationId !== placementResult.placement.locationId) {
    throw createCustom25DValidationError(
      "location_identity_mismatch",
      "Renderer-facing location identity must match the deterministic placement contract."
    );
  }

  validateLodMetadata(specification.lodRequirements);
  validateMobilePerformanceMetadata(specification.mobilePerformanceRequirements);

  if (!adapterResult.ok || !consumerResult.ok) {
    throw createCustom25DValidationError(
      "factory_output_incompatible",
      "Factory pipeline artifacts must remain adapter-valid and passive-consumer-valid for Custom 2.5D compatibility."
    );
  }

  return Object.freeze({
    specification,
    manifest,
    recipe,
    placementResult,
    adapterResult,
    consumerResult,
    rendererFacingOutput: rendererPayload,
    compatibility: Object.freeze({
      rendererProfile: supportedRendererProfile,
      assetIdentityVerified: true,
      recipeReferenceVerified: true,
      componentReferencesVerified: true,
      placementOrientationVerified: true,
      transformDataVerified: true,
      lodMetadataVerified: true,
      mobilePerformanceMetadataVerified: true,
      passiveConsumerCompatibilityVerified: true
    })
  });
}

function normalizePipelineArtifacts(rawArtifacts) {
  const artifacts = asPlainObject(rawArtifacts, "real asset Custom 2.5D validation artifacts");
  const requiredFields = [
    "specification",
    "manifest",
    "recipe",
    "placementResult",
    "adapterResult",
    "consumerResult",
    "rendererPayload"
  ];

  for (const fieldName of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(artifacts, fieldName)) {
      throw createCustom25DValidationError(
        "missing_pipeline_result",
        `Custom 2.5D passive renderer validation requires pipeline artifact ${fieldName}.`
      );
    }
  }

  return Object.freeze({
    specification: asPlainObject(artifacts.specification, "specification"),
    manifest: asPlainObject(artifacts.manifest, "manifest"),
    recipe: asPlainObject(artifacts.recipe, "recipe"),
    placementResult: asPlainObject(artifacts.placementResult, "placementResult"),
    adapterResult: asPlainObject(artifacts.adapterResult, "adapterResult"),
    consumerResult: asPlainObject(artifacts.consumerResult, "consumerResult"),
    rendererPayload: asPlainObject(artifacts.rendererPayload, "rendererPayload")
  });
}

function validateLodMetadata(lodRequirements) {
  const lod = asPlainObject(lodRequirements, "lodRequirements");

  if (typeof lod.profile !== "string" || lod.profile.length === 0) {
    throw createCustom25DValidationError(
      "invalid_lod_metadata",
      "Custom 2.5D compatibility requires a non-empty LOD profile."
    );
  }

  if (!Array.isArray(lod.lodLevels) || lod.lodLevels.length === 0) {
    throw createCustom25DValidationError(
      "invalid_lod_metadata",
      "Custom 2.5D compatibility requires at least one approved LOD level."
    );
  }
}

function validateMobilePerformanceMetadata(mobilePerformanceRequirements) {
  const performance = asPlainObject(
    mobilePerformanceRequirements,
    "mobilePerformanceRequirements"
  );
  const requiredBudgetFields = ["storageBudget", "ramBudget", "gpuBudget"];

  for (const fieldName of requiredBudgetFields) {
    if (
      typeof performance[fieldName] !== "string" ||
      performance[fieldName].length === 0
    ) {
      throw createCustom25DValidationError(
        "invalid_mobile_performance_metadata",
        `Custom 2.5D compatibility requires non-empty ${fieldName} metadata.`
      );
    }
  }

  if (typeof performance.batchingFriendly !== "boolean") {
    throw createCustom25DValidationError(
      "invalid_mobile_performance_metadata",
      "Custom 2.5D compatibility requires explicit batchingFriendly metadata."
    );
  }
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createCustom25DValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createCustom25DValidationError(code, message) {
  const error = new Error(message);
  error.name = "RealAssetToCustom25DPassiveRendererValidationError";
  error.code = code;
  return error;
}
