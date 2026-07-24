import {
  createWorldExpansionPlanningFoundation,
  validateWorldExpansionPlanningFoundation,
  worldExpansionPlanningFoundationDefinition
} from "./world-expansion-planning-foundation.mjs";
import {
  createWorldRegionResolutionFoundation,
  validateWorldRegionResolutionFoundation
} from "./world-region-resolution-foundation.mjs";
import {
  createWorldRegionSceneRoutingFoundation,
  validateWorldRegionSceneRoutingFoundation
} from "./world-region-scene-routing-foundation.mjs";
import {
  createWorldRegionMapDataRoutingFoundation,
  validateWorldRegionMapDataRoutingFoundation
} from "./world-region-map-data-routing-foundation.mjs";
import {
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";
import {
  validateMapWorldSettlementAtlasSceneExpansion
} from "./map-world-settlement-atlas-scene-expansion.mjs";

export const worldExpansionPipelineValidationFoundationRequiredFields = Object.freeze([
  "pipelineValidationId",
  "coordinate",
  "regionResolution",
  "sceneRoute",
  "mapDataRoute",
  "settlementOutput",
  "sceneOutput",
  "validationResult"
]);

export const worldExpansionPipelineValidationFoundationDefinition = deepFreeze({
  ...worldExpansionPlanningFoundationDefinition
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export async function createWorldExpansionPipelineValidationFoundation(
  rawDefinition = worldExpansionPipelineValidationFoundationDefinition,
  options = {}
) {
  const planningFoundation = await createWorldExpansionPlanningFoundation(
    rawDefinition,
    options
  );
  const regionResolution = await createWorldRegionResolutionFoundation(
    rawDefinition,
    options
  );
  const sceneRoute = await createWorldRegionSceneRoutingFoundation(
    rawDefinition,
    options
  );
  const mapDataRoute = await createWorldRegionMapDataRoutingFoundation(
    rawDefinition,
    options
  );

  const settlementOutput =
    planningFoundation.regionGenerationPipeline.worldResolver.settlement;
  const sceneOutput = planningFoundation.regionGenerationPipeline.sceneAssembly.scene;
  const coordinate = deepFreeze({
    latitude: planningFoundation.activeWorldLocation.latitude,
    longitude: planningFoundation.activeWorldLocation.longitude
  });

  const foundation = deepFreeze({
    pipelineValidationId: createPipelineValidationId(
      planningFoundation.activeWorldLocation.worldId,
      planningFoundation.activeWorldLocation.seed,
      regionResolution.regionResolutionId
    ),
    coordinate,
    planningFoundation,
    regionResolution,
    sceneRoute,
    mapDataRoute,
    settlementOutput,
    sceneOutput,
    validationResult: deepFreeze({
      fullChainValid:
        planningFoundation.validationResult.deterministicRegionOutputValid === true &&
        regionResolution.validationResult.coordinateResolutionValid === true &&
        sceneRoute.validationResult.deterministicSceneRoutingValid === true &&
        mapDataRoute.validationResult.deterministicRoutingValid === true &&
        settlementOutput.validationResult.deterministicOutput === true &&
        sceneOutput.validationResult.deterministicSceneOutputValid === true,
      coastalLocationUnchangedValid:
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true &&
        regionResolution.validationResult.coastalFirstLocationUnchangedValid === true &&
        sceneRoute.validationResult.coastalRouteUnchangedValid === true &&
        mapDataRoute.validationResult.coastalMapPathUnchangedValid === true,
      deterministicOutputValid:
        planningFoundation.validationResult.deterministicRegionOutputValid === true &&
        regionResolution.validationResult.deterministicRegionResultValid === true &&
        sceneRoute.validationResult.deterministicSceneRoutingValid === true &&
        mapDataRoute.validationResult.deterministicRoutingValid === true &&
        settlementOutput.validationResult.deterministicOutput === true &&
        sceneOutput.validationResult.deterministicSceneOutputValid === true,
      assetCompatibilityValid:
        sceneRoute.validationResult.assetCompatibilityValid === true &&
        settlementOutput.validationResult.assetReferenceValidity === true &&
        sceneOutput.validationResult.assetReferencesValid === true,
      fallbackSafetyValid:
        regionResolution.validationResult.fallbackBehaviorValid === true &&
        sceneRoute.validationResult.unsupportedRegionsFallbackSafelyValid === true &&
        mapDataRoute.validationResult.safeFallbackValid === true,
      chainIdentityConsistencyValid:
        regionResolution.worldRegionId === sceneRoute.worldRegionId &&
        sceneRoute.worldRegionId === mapDataRoute.worldRegionId &&
        sceneRoute.settlementProfile.settlementId ===
          settlementOutput.settlementSummary.settlementId &&
        sceneRoute.sceneProfile.sceneId === sceneOutput.sceneId &&
        mapDataRoute.mapFixtureProfile.sceneAssemblyId ===
          sceneRoute.sceneProfile.sceneAssemblyId,
      coordinateConsistencyValid:
        coordinate.latitude === regionResolution.coordinate.latitude &&
        coordinate.longitude === regionResolution.coordinate.longitude &&
        coordinate.latitude === mapDataRoute.localMapDataAdapter.coordinate.latitude &&
        coordinate.longitude === mapDataRoute.localMapDataAdapter.coordinate.longitude
    })
  });

  const validation = validateWorldExpansionPipelineValidationFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateWorldExpansionPipelineValidationFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const planningValidation = validateWorldExpansionPlanningFoundation(
      foundation.planningFoundation
    );
    if (!planningValidation.ok) {
      throw createValidationError(
        planningValidation.errorCode ?? "planning_foundation_invalid",
        planningValidation.message ??
          "World expansion pipeline validation foundation requires a valid world expansion planning foundation."
      );
    }

    const regionResolutionValidation = validateWorldRegionResolutionFoundation(
      foundation.regionResolution
    );
    if (!regionResolutionValidation.ok) {
      throw createValidationError(
        regionResolutionValidation.errorCode ?? "region_resolution_invalid",
        regionResolutionValidation.message ??
          "World expansion pipeline validation foundation requires a valid region resolution."
      );
    }

    const sceneRouteValidation = validateWorldRegionSceneRoutingFoundation(
      foundation.sceneRoute
    );
    if (!sceneRouteValidation.ok) {
      throw createValidationError(
        sceneRouteValidation.errorCode ?? "scene_route_invalid",
        sceneRouteValidation.message ??
          "World expansion pipeline validation foundation requires a valid scene route."
      );
    }

    const mapDataRouteValidation = validateWorldRegionMapDataRoutingFoundation(
      foundation.mapDataRoute
    );
    if (!mapDataRouteValidation.ok) {
      throw createValidationError(
        mapDataRouteValidation.errorCode ?? "map_data_route_invalid",
        mapDataRouteValidation.message ??
          "World expansion pipeline validation foundation requires a valid map data route."
      );
    }

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      foundation.settlementOutput
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_output_invalid",
        settlementValidation.message ??
          "World expansion pipeline validation foundation requires valid settlement output."
      );
    }

    const sceneValidation = validateMapWorldSettlementAtlasSceneExpansion(
      foundation.sceneOutput
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "scene_output_invalid",
        sceneValidation.message ??
          "World expansion pipeline validation foundation requires valid scene output."
      );
    }

    for (const key of [
      "fullChainValid",
      "coastalLocationUnchangedValid",
      "deterministicOutputValid",
      "assetCompatibilityValid",
      "fallbackSafetyValid",
      "chainIdentityConsistencyValid",
      "coordinateConsistencyValid"
    ]) {
      if (foundation.validationResult[key] !== true) {
        throw createValidationError(
          "validation_result_invalid",
          `World expansion pipeline validation foundation ${key} must be true.`
        );
      }
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldExpansionPipelineValidationFoundation: foundation
    });
  } catch (error) {
    if (error?.name !== "WorldExpansionPipelineValidationFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldExpansionPipelineValidationFoundation: null
    });
  }
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "worldExpansionPipelineValidationFoundation"
  );
  for (const fieldName of worldExpansionPipelineValidationFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `World expansion pipeline validation foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    pipelineValidationId: normalizePermanentId(
      foundation.pipelineValidationId,
      "pipelineValidationId"
    ),
    coordinate: deepFreeze(asPlainObject(foundation.coordinate, "coordinate")),
    planningFoundation: deepFreeze(
      asPlainObject(foundation.planningFoundation, "planningFoundation")
    ),
    regionResolution: deepFreeze(
      asPlainObject(foundation.regionResolution, "regionResolution")
    ),
    sceneRoute: deepFreeze(asPlainObject(foundation.sceneRoute, "sceneRoute")),
    mapDataRoute: deepFreeze(asPlainObject(foundation.mapDataRoute, "mapDataRoute")),
    settlementOutput: deepFreeze(
      asPlainObject(foundation.settlementOutput, "settlementOutput")
    ),
    sceneOutput: deepFreeze(asPlainObject(foundation.sceneOutput, "sceneOutput")),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    )
  });
}

function createPipelineValidationId(worldId, seed, regionResolutionId) {
  const suffix = String(hashString(`${worldId}:${seed}:${regionResolutionId}`)).padStart(
    3,
    "0"
  );
  return `WORLD_EXPANSION_PIPELINE_VALIDATION_${suffix}`;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `World expansion pipeline validation foundation ${fieldName} must match the permanent ID format.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_string",
      `World expansion pipeline validation foundation ${fieldName} must be a string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "empty_string",
      `World expansion pipeline validation foundation ${fieldName} cannot be empty.`
    );
  }
  return normalized;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `World expansion pipeline validation foundation ${fieldName} must be an object.`
    );
  }
  return value;
}

function hashString(value) {
  let hash = 0;
  for (const character of String(value)) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }
  return hash;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldExpansionPipelineValidationFoundationValidationError";
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
