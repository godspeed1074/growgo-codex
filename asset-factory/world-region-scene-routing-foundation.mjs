import {
  createWorldRegionResolutionFoundation,
  resolveRegionProfileForCoordinate,
  validateWorldRegionResolutionFoundation,
  worldRegionResolutionFoundationDefinition
} from "./world-region-resolution-foundation.mjs";
import {
  validateMapWorldSettlementAtlasSceneExpansion
} from "./map-world-settlement-atlas-scene-expansion.mjs";
import {
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";

export const worldRegionSceneRoutingFoundationRequiredFields = Object.freeze([
  "sceneRouteId",
  "worldRegionId",
  "regionType",
  "sceneProfile",
  "settlementProfile",
  "validationResult"
]);

export const worldRegionSceneRoutingFoundationDefinition = deepFreeze({
  ...worldRegionResolutionFoundationDefinition
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRegionTypes = new Set(["coastal", "suburban", "rural", "urban"]);

export async function createWorldRegionSceneRoutingFoundation(
  rawDefinition = worldRegionSceneRoutingFoundationDefinition,
  options = {}
) {
  const regionResolution = await createWorldRegionResolutionFoundation(
    rawDefinition,
    options
  );
  const sceneRoute = resolveSceneRouteForRegionResolution(regionResolution);

  const result = deepFreeze({
    sceneRouteId: sceneRoute.sceneRouteId,
    worldRegionId: sceneRoute.worldRegionId,
    regionType: sceneRoute.regionType,
    sceneProfile: deepFreeze(sceneRoute.sceneProfile),
    settlementProfile: deepFreeze(sceneRoute.settlementProfile),
    regionResolution,
    validationResult: deepFreeze({
      coastalRouteUnchangedValid:
        sceneRoute.regionType === "coastal" &&
        sceneRoute.sceneProfile.sceneAssemblyId ===
          regionResolution.planningFoundation.regionGenerationPipeline.sceneAssembly
            .sceneAssemblyId &&
        sceneRoute.sceneProfile.sceneId ===
          regionResolution.planningFoundation.regionGenerationPipeline.sceneAssembly
            .sceneId,
      unsupportedRegionsFallbackSafelyValid:
        supportedRegionTypes.has(sceneRoute.regionType) &&
        (sceneRoute.regionType === "coastal"
          ? sceneRoute.sceneProfile.fallbackActivated === false
          : sceneRoute.sceneProfile.fallbackActivated === true &&
            sceneRoute.sceneProfile.fallbackRegionType === "coastal"),
      deterministicSceneRoutingValid: true,
      assetCompatibilityValid:
        sceneRoute.sceneProfile.supportedAssetIds.every((assetId) =>
          sceneRoute.sceneProfile.routeAssetIds.includes(assetId)
        ) &&
        sceneRoute.sceneProfile.routeAssetIds.length >=
          sceneRoute.sceneProfile.supportedAssetIds.length
    })
  });

  const validation = validateWorldRegionSceneRoutingFoundation(result);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return result;
}

export function validateWorldRegionSceneRoutingFoundation(rawRouting) {
  try {
    const routing = normalizeRouting(rawRouting);
    const regionResolutionValidation = validateWorldRegionResolutionFoundation(
      routing.regionResolution
    );
    if (!regionResolutionValidation.ok) {
      throw createValidationError(
        regionResolutionValidation.errorCode ?? "region_resolution_invalid",
        regionResolutionValidation.message ??
          "World region scene routing foundation requires a valid region resolution foundation."
      );
    }

    const sceneValidation = validateMapWorldSettlementAtlasSceneExpansion(
      routing.regionResolution.planningFoundation.regionGenerationPipeline.sceneAssembly
        .scene
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "scene_invalid",
        sceneValidation.message ??
          "World region scene routing foundation requires a valid routed scene assembly."
      );
    }

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      routing.regionResolution.planningFoundation.regionGenerationPipeline.worldResolver
        .settlement
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_invalid",
        settlementValidation.message ??
          "World region scene routing foundation requires a valid routed settlement."
      );
    }

    if (!supportedRegionTypes.has(routing.regionType)) {
      throw createValidationError(
        "region_type_invalid",
        "World region scene routing foundation regionType must be supported."
      );
    }
    if (!routing.validationResult.coastalRouteUnchangedValid) {
      throw createValidationError(
        "coastal_route_changed",
        "World region scene routing foundation coastalRouteUnchangedValid must be true."
      );
    }
    if (!routing.validationResult.unsupportedRegionsFallbackSafelyValid) {
      throw createValidationError(
        "unsafe_fallback_behavior",
        "World region scene routing foundation unsupportedRegionsFallbackSafelyValid must be true."
      );
    }
    if (!routing.validationResult.deterministicSceneRoutingValid) {
      throw createValidationError(
        "deterministic_scene_routing_invalid",
        "World region scene routing foundation deterministicSceneRoutingValid must be true."
      );
    }
    if (!routing.validationResult.assetCompatibilityValid) {
      throw createValidationError(
        "asset_compatibility_invalid",
        "World region scene routing foundation assetCompatibilityValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldRegionSceneRoutingFoundation: routing
    });
  } catch (error) {
    if (error?.name !== "WorldRegionSceneRoutingFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldRegionSceneRoutingFoundation: null
    });
  }
}

export function resolveSceneRouteForRegionResolution(regionResolution) {
  const normalizedResolution = normalizeRegionResolution(regionResolution);
  const sceneAssembly =
    normalizedResolution.planningFoundation.regionGenerationPipeline.sceneAssembly;
  const settlementGeneration =
    normalizedResolution.planningFoundation.regionGenerationPipeline.settlementGeneration;
  const routeAssetIds = collectRouteAssetIds(
    normalizedResolution.planningFoundation.regionGenerationPipeline.sceneAssembly.scene
  );

  const isCoastal = normalizedResolution.regionType === "coastal";

  const sceneProfile = deepFreeze({
    profileId: `${normalizedResolution.regionType}_scene_route_profile_001`,
    sceneAssemblyId: isCoastal
      ? sceneAssembly.sceneAssemblyId
      : "planned-scene-route-fallback",
    sceneId: sceneAssembly.sceneId,
    worldId: sceneAssembly.worldId,
    routeMode: isCoastal ? "active-scene-assembly" : "planned-fallback-scene-assembly",
    fallbackActivated: !isCoastal,
    fallbackRegionType: isCoastal ? null : "coastal",
    supportedAssetIds: deepFreeze([
      ...(normalizedResolution.assetProfile.supportedAssetIds ?? [])
    ]),
    routeAssetIds
  });

  const settlementProfile = deepFreeze({
    profileId: `${normalizedResolution.regionType}_settlement_route_profile_001`,
    generatorId: isCoastal
      ? settlementGeneration.generatorId
      : "planned-settlement-route-fallback",
    settlementId: settlementGeneration.settlementId,
    routeMode: isCoastal ? "active-settlement-generator" : "planned-fallback-settlement",
    fallbackActivated: !isCoastal,
    fallbackRegionType: isCoastal ? null : "coastal",
    generatedAssetCount: settlementGeneration.generatedAssetCount,
    deterministicOutput: settlementGeneration.deterministicOutput
  });

  return deepFreeze({
    sceneRouteId: createSceneRouteId(
      normalizedResolution.worldRegionId,
      normalizedResolution.regionType,
      normalizedResolution.regionResolutionId
    ),
    worldRegionId: normalizedResolution.worldRegionId,
    regionType: normalizedResolution.regionType,
    sceneProfile,
    settlementProfile
  });
}

export function resolveSceneRouteForCoordinate(
  coordinate,
  worldExpansionRegistry,
  regionResolution
) {
  const resolvedRegion =
    regionResolution ??
    deepFreeze({
      regionResolutionId: "WORLD_REGION_RESOLUTION_FALLBACK_001",
      worldRegionId: resolveRegionProfileForCoordinate(
        coordinate,
        worldExpansionRegistry
      ).worldRegionId,
      regionType: resolveRegionProfileForCoordinate(
        coordinate,
        worldExpansionRegistry
      ).regionType,
      generationProfile: resolveRegionProfileForCoordinate(
        coordinate,
        worldExpansionRegistry
      ).generationProfile,
      assetProfile: resolveRegionProfileForCoordinate(
        coordinate,
        worldExpansionRegistry
      ).assetProfile,
      coordinate: deepFreeze({ ...coordinate }),
      fallbackRegionType: null,
      planningFoundation: null,
      validationResult: deepFreeze({})
    });
  return resolveSceneRouteForRegionResolution(resolvedRegion);
}

function normalizeRouting(rawRouting) {
  const routing = asPlainObject(
    rawRouting,
    "worldRegionSceneRoutingFoundation"
  );
  for (const fieldName of worldRegionSceneRoutingFoundationRequiredFields) {
    if (!(fieldName in routing)) {
      throw createValidationError(
        "missing_required_field",
        `World region scene routing foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    sceneRouteId: normalizePermanentId(routing.sceneRouteId, "sceneRouteId"),
    worldRegionId: normalizePermanentId(routing.worldRegionId, "worldRegionId"),
    regionType: normalizeString(routing.regionType, "regionType"),
    sceneProfile: deepFreeze(asPlainObject(routing.sceneProfile, "sceneProfile")),
    settlementProfile: deepFreeze(
      asPlainObject(routing.settlementProfile, "settlementProfile")
    ),
    regionResolution: deepFreeze(
      asPlainObject(routing.regionResolution, "regionResolution")
    ),
    validationResult: deepFreeze(
      asPlainObject(routing.validationResult, "validationResult")
    )
  });
}

function normalizeRegionResolution(regionResolution) {
  return deepFreeze(asPlainObject(regionResolution, "regionResolution"));
}

function collectRouteAssetIds(scene) {
  const normalizedScene = asPlainObject(scene, "scene");
  return deepFreeze(
    [
      ...new Set(
        [
          ...(normalizedScene.roadInstances ?? []),
          ...(normalizedScene.buildingInstances ?? []),
          ...(normalizedScene.vegetationInstances ?? []),
          ...(normalizedScene.landmarkInstances ?? [])
        ].map((instance) => instance.assetId)
      )
    ].sort()
  );
}

function createSceneRouteId(worldRegionId, regionType, regionResolutionId) {
  const hash = stableHash(`${worldRegionId}::${regionType}::${regionResolutionId}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `WORLD_REGION_SCENE_ROUTE_${hash}_001`;
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

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldRegionSceneRoutingFoundationValidationError";
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
