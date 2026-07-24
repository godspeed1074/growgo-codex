import {
  createWorldExpansionPlanningFoundation,
  validateWorldExpansionPlanningFoundation,
  worldExpansionPlanningFoundationDefinition
} from "./world-expansion-planning-foundation.mjs";
import {
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";

export const worldRegionResolutionFoundationRequiredFields = Object.freeze([
  "regionResolutionId",
  "worldRegionId",
  "regionType",
  "generationProfile",
  "assetProfile",
  "validationResult"
]);

export const worldRegionResolutionFoundationDefinition = deepFreeze({
  ...worldExpansionPlanningFoundationDefinition
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRegionTypes = new Set(["coastal", "suburban", "rural", "urban"]);

export async function createWorldRegionResolutionFoundation(
  rawDefinition = worldRegionResolutionFoundationDefinition,
  options = {}
) {
  const planningFoundation = await createWorldExpansionPlanningFoundation(
    rawDefinition,
    options
  );

  const coordinate = deepFreeze({
    latitude: planningFoundation.activeWorldLocation.latitude,
    longitude: planningFoundation.activeWorldLocation.longitude
  });
  const resolvedRegion = resolveRegionProfileForCoordinate(
    coordinate,
    planningFoundation.worldExpansionRegistry
  );
  const coastalRegion = planningFoundation.worldExpansionRegistry.find(
    (region) => region.regionType === "coastal"
  );

  const result = deepFreeze({
    regionResolutionId: createRegionResolutionId(
      planningFoundation.activeWorldLocation.worldId,
      resolvedRegion.worldRegionId,
      planningFoundation.activeWorldLocation.seed
    ),
    worldRegionId: resolvedRegion.worldRegionId,
    regionType: resolvedRegion.regionType,
    generationProfile: deepFreeze({
      ...resolvedRegion.generationProfile
    }),
    assetProfile: deepFreeze({
      ...resolvedRegion.assetProfile
    }),
    coordinate,
    fallbackRegionType:
      resolvedRegion.regionType === "coastal" ? null : coastalRegion?.regionType ?? null,
    planningFoundation,
    validationResult: deepFreeze({
      coordinateResolutionValid:
        resolvedRegion.regionType === "coastal" &&
        planningFoundation.regionGenerationPipeline.worldLocation.latitude ===
          coordinate.latitude &&
        planningFoundation.regionGenerationPipeline.worldLocation.longitude ===
          coordinate.longitude,
      profileSelectionValid:
        resolvedRegion.worldRegionId ===
          planningFoundation.regionGenerationPipeline.regionProfile.worldRegionId &&
        resolvedRegion.generationProfile.generationProfileId ===
          planningFoundation.regionGenerationPipeline.regionProfile.generationProfile
            .generationProfileId,
      deterministicRegionResultValid: true,
      fallbackBehaviorValid:
        coastalRegion != null &&
        planningFoundation.worldExpansionRegistry.some(
          (region) => region.regionType === "suburban"
        ) &&
        planningFoundation.worldExpansionRegistry.some(
          (region) => region.regionType === "rural"
        ) &&
        planningFoundation.worldExpansionRegistry.some(
          (region) => region.regionType === "urban"
        ),
      coastalFirstLocationUnchangedValid:
        resolvedRegion.regionType === "coastal" &&
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true,
      existingScenePipelineValid:
        planningFoundation.regionGenerationPipeline.sceneAssembly.worldId ===
          planningFoundation.regionGenerationPipeline.worldLocation.worldId &&
        planningFoundation.regionGenerationPipeline.settlementGeneration
          .deterministicOutput === true
    })
  });

  const validation = validateWorldRegionResolutionFoundation(result);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return result;
}

export function validateWorldRegionResolutionFoundation(rawResolution) {
  try {
    const resolution = normalizeResolution(rawResolution);
    const planningValidation = validateWorldExpansionPlanningFoundation(
      resolution.planningFoundation
    );
    if (!planningValidation.ok) {
      throw createValidationError(
        planningValidation.errorCode ?? "planning_foundation_invalid",
        planningValidation.message ??
          "World region resolution foundation requires a valid world expansion planning foundation."
      );
    }

    const resolverValidation = validateMapCoordinateWorldResolverFoundation(
      resolution.planningFoundation.regionGenerationPipeline.worldResolver
    );
    if (!resolverValidation.ok) {
      throw createValidationError(
        resolverValidation.errorCode ?? "world_resolver_invalid",
        resolverValidation.message ??
          "World region resolution foundation requires a valid world resolver."
      );
    }

    if (!supportedRegionTypes.has(resolution.regionType)) {
      throw createValidationError(
        "region_type_invalid",
        "World region resolution foundation regionType must be supported."
      );
    }
    if (!resolution.validationResult.coordinateResolutionValid) {
      throw createValidationError(
        "coordinate_resolution_invalid",
        "World region resolution foundation coordinateResolutionValid must be true."
      );
    }
    if (!resolution.validationResult.profileSelectionValid) {
      throw createValidationError(
        "profile_selection_invalid",
        "World region resolution foundation profileSelectionValid must be true."
      );
    }
    if (!resolution.validationResult.deterministicRegionResultValid) {
      throw createValidationError(
        "deterministic_region_result_invalid",
        "World region resolution foundation deterministicRegionResultValid must be true."
      );
    }
    if (!resolution.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_behavior_invalid",
        "World region resolution foundation fallbackBehaviorValid must be true."
      );
    }
    if (!resolution.validationResult.coastalFirstLocationUnchangedValid) {
      throw createValidationError(
        "coastal_first_location_changed",
        "World region resolution foundation coastalFirstLocationUnchangedValid must be true."
      );
    }
    if (!resolution.validationResult.existingScenePipelineValid) {
      throw createValidationError(
        "scene_pipeline_invalid",
        "World region resolution foundation existingScenePipelineValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldRegionResolutionFoundation: resolution
    });
  } catch (error) {
    if (error?.name !== "WorldRegionResolutionFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldRegionResolutionFoundation: null
    });
  }
}

export function resolveRegionProfileForCoordinate(coordinate, worldExpansionRegistry) {
  const normalizedCoordinate = normalizeCoordinate(coordinate);
  const registry = normalizeRegistry(worldExpansionRegistry);

  const matchingRegion =
    registry.find((region) => coordinateFallsWithinBounds(normalizedCoordinate, region.bounds)) ??
    registry.find((region) => region.regionType === "coastal") ??
    null;

  if (!matchingRegion) {
    throw createValidationError(
      "region_registry_empty",
      "World region resolution foundation requires at least one fallback region."
    );
  }

  return deepFreeze(matchingRegion);
}

function normalizeResolution(rawResolution) {
  const resolution = asPlainObject(
    rawResolution,
    "worldRegionResolutionFoundation"
  );
  for (const fieldName of worldRegionResolutionFoundationRequiredFields) {
    if (!(fieldName in resolution)) {
      throw createValidationError(
        "missing_required_field",
        `World region resolution foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    regionResolutionId: normalizePermanentId(
      resolution.regionResolutionId,
      "regionResolutionId"
    ),
    worldRegionId: normalizePermanentId(resolution.worldRegionId, "worldRegionId"),
    regionType: normalizeString(resolution.regionType, "regionType"),
    generationProfile: deepFreeze(
      asPlainObject(resolution.generationProfile, "generationProfile")
    ),
    assetProfile: deepFreeze(asPlainObject(resolution.assetProfile, "assetProfile")),
    coordinate: deepFreeze(asPlainObject(resolution.coordinate, "coordinate")),
    fallbackRegionType:
      resolution.fallbackRegionType == null
        ? null
        : normalizeString(resolution.fallbackRegionType, "fallbackRegionType"),
    planningFoundation: deepFreeze(
      asPlainObject(resolution.planningFoundation, "planningFoundation")
    ),
    validationResult: deepFreeze(
      asPlainObject(resolution.validationResult, "validationResult")
    )
  });
}

function normalizeRegistry(worldExpansionRegistry) {
  return deepFreeze(
    asArray(worldExpansionRegistry, "worldExpansionRegistry").map((region) =>
      deepFreeze(asPlainObject(region, "worldExpansionRegistry[]"))
    )
  );
}

function normalizeCoordinate(coordinate) {
  const normalized = asPlainObject(coordinate, "coordinate");
  const latitude = normalizeNumber(normalized.latitude, "coordinate.latitude");
  const longitude = normalizeNumber(normalized.longitude, "coordinate.longitude");
  return deepFreeze({ latitude, longitude });
}

function coordinateFallsWithinBounds(coordinate, bounds) {
  const normalizedBounds = asPlainObject(bounds, "bounds");
  if (
    normalizedBounds.minLatitude == null ||
    normalizedBounds.maxLatitude == null ||
    normalizedBounds.minLongitude == null ||
    normalizedBounds.maxLongitude == null
  ) {
    return false;
  }

  return (
    coordinate.latitude >= Number(normalizedBounds.minLatitude) &&
    coordinate.latitude <= Number(normalizedBounds.maxLatitude) &&
    coordinate.longitude >= Number(normalizedBounds.minLongitude) &&
    coordinate.longitude <= Number(normalizedBounds.maxLongitude)
  );
}

function createRegionResolutionId(worldId, worldRegionId, seed) {
  const hash = stableHash(`${worldId}::${worldRegionId}::${seed}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `WORLD_REGION_RESOLUTION_${hash}_001`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a supported permanent ID.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }
  return value;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function asArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError("invalid_array", `${fieldName} must be an array.`);
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldRegionResolutionFoundationValidationError";
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
