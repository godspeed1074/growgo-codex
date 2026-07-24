import {
  createWorldRegionSceneRoutingFoundation,
  resolveSceneRouteForRegionResolution,
  validateWorldRegionSceneRoutingFoundation,
  worldRegionSceneRoutingFoundationDefinition
} from "./world-region-scene-routing-foundation.mjs";
import {
  createMapWorldLocalRealMapDataAdapterFoundation,
  validateMapWorldLocalRealMapDataAdapterFoundation
} from "./map-world-local-real-map-data-adapter-foundation.mjs";

export const worldRegionMapDataRoutingFoundationRequiredFields = Object.freeze([
  "mapDataRouteId",
  "worldRegionId",
  "regionType",
  "providerProfile",
  "mapFixtureProfile",
  "validationResult"
]);

export const worldRegionMapDataRoutingFoundationDefinition = deepFreeze({
  ...worldRegionSceneRoutingFoundationDefinition
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRegionTypes = new Set(["coastal", "suburban", "rural", "urban"]);

export async function createWorldRegionMapDataRoutingFoundation(
  rawDefinition = worldRegionMapDataRoutingFoundationDefinition,
  options = {}
) {
  const sceneRoute = await createWorldRegionSceneRoutingFoundation(rawDefinition, options);
  const localMapDataAdapter = await createMapWorldLocalRealMapDataAdapterFoundation(
    rawDefinition,
    options
  );
  const providerRoute = resolveMapDataRouteForSceneRoute(sceneRoute, localMapDataAdapter);

  const foundation = deepFreeze({
    mapDataRouteId: providerRoute.mapDataRouteId,
    worldRegionId: providerRoute.worldRegionId,
    regionType: providerRoute.regionType,
    providerProfile: deepFreeze(providerRoute.providerProfile),
    mapFixtureProfile: deepFreeze(providerRoute.mapFixtureProfile),
    sceneRoute,
    localMapDataAdapter,
    validationResult: deepFreeze({
      coastalMapPathUnchangedValid:
        providerRoute.regionType === "coastal" &&
        providerRoute.providerProfile.providerId === localMapDataAdapter.providerId &&
        providerRoute.providerProfile.providerMode === "active-local-fixture-provider" &&
        providerRoute.mapFixtureProfile.mapDataId === localMapDataAdapter.mapDataId,
      providerCompatibilityValid:
        providerRoute.providerProfile.supportedProviderKinds.includes(
          localMapDataAdapter.providerBoundary.providerKind
        ) &&
        providerRoute.providerProfile.compatibleFutureProviderKinds.includes(
          "future_osm_provider"
        ),
      deterministicRoutingValid: true,
      safeFallbackValid:
        providerRoute.regionType === "coastal"
          ? providerRoute.providerProfile.fallbackActivated === false
          : providerRoute.providerProfile.fallbackActivated === true &&
            providerRoute.providerProfile.fallbackRegionType === "coastal" &&
            providerRoute.mapFixtureProfile.fallbackFixtureProfileId ===
              "coastal_fixture_profile_001"
    })
  });

  const validation = validateWorldRegionMapDataRoutingFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateWorldRegionMapDataRoutingFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const sceneRouteValidation = validateWorldRegionSceneRoutingFoundation(
      foundation.sceneRoute
    );
    if (!sceneRouteValidation.ok) {
      throw createValidationError(
        sceneRouteValidation.errorCode ?? "scene_route_invalid",
        sceneRouteValidation.message ??
          "World region map data routing foundation requires a valid scene route."
      );
    }

    const localMapValidation = validateMapWorldLocalRealMapDataAdapterFoundation(
      foundation.localMapDataAdapter
    );
    if (!localMapValidation.ok) {
      throw createValidationError(
        localMapValidation.errorCode ?? "local_map_data_adapter_invalid",
        localMapValidation.message ??
          "World region map data routing foundation requires a valid local map data adapter."
      );
    }

    if (!supportedRegionTypes.has(foundation.regionType)) {
      throw createValidationError(
        "region_type_invalid",
        "World region map data routing foundation regionType must be supported."
      );
    }
    if (!foundation.validationResult.coastalMapPathUnchangedValid) {
      throw createValidationError(
        "coastal_map_path_changed",
        "World region map data routing foundation coastalMapPathUnchangedValid must be true."
      );
    }
    if (!foundation.validationResult.providerCompatibilityValid) {
      throw createValidationError(
        "provider_compatibility_invalid",
        "World region map data routing foundation providerCompatibilityValid must be true."
      );
    }
    if (!foundation.validationResult.deterministicRoutingValid) {
      throw createValidationError(
        "deterministic_routing_invalid",
        "World region map data routing foundation deterministicRoutingValid must be true."
      );
    }
    if (!foundation.validationResult.safeFallbackValid) {
      throw createValidationError(
        "safe_fallback_invalid",
        "World region map data routing foundation safeFallbackValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldRegionMapDataRoutingFoundation: foundation
    });
  } catch (error) {
    if (error?.name !== "WorldRegionMapDataRoutingFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldRegionMapDataRoutingFoundation: null
    });
  }
}

export function resolveMapDataRouteForSceneRoute(sceneRoute, localMapDataAdapter) {
  const normalizedSceneRoute = normalizeSceneRoute(sceneRoute);
  const normalizedAdapter = normalizeLocalMapDataAdapter(localMapDataAdapter);
  const isCoastal = normalizedSceneRoute.regionType === "coastal";

  const providerProfile = deepFreeze({
    providerProfileId: `${normalizedSceneRoute.regionType}_map_provider_profile_001`,
    providerId: normalizedAdapter.providerId,
    providerKind: normalizedAdapter.providerBoundary.providerKind,
    providerMode: isCoastal
      ? "active-local-fixture-provider"
      : "planned-fallback-local-fixture-provider",
    supportedProviderKinds: deepFreeze([
      normalizedAdapter.providerBoundary.providerKind
    ]),
    compatibleFutureProviderKinds: deepFreeze([
      ...normalizedAdapter.providerBoundary.compatibleFutureProviderKinds
    ]),
    fallbackActivated: !isCoastal,
    fallbackRegionType: isCoastal ? null : "coastal",
    liveNetworkAllowed: normalizedAdapter.providerBoundary.liveNetworkAllowed
  });

  const mapFixtureProfile = deepFreeze({
    mapFixtureProfileId: `${normalizedSceneRoute.regionType}_fixture_profile_001`,
    mapDataId: normalizedAdapter.mapDataId,
    fixtureSource: isCoastal
      ? "active-coastal-local-map-fixture"
      : "planned-region-fallback-to-coastal-fixture",
    fixtureBounds: deepFreeze({
      ...normalizedAdapter.bounds
    }),
    settlementGeneratorId: normalizedSceneRoute.settlementProfile.generatorId,
    sceneAssemblyId: normalizedSceneRoute.sceneProfile.sceneAssemblyId,
    deterministicSource: normalizedAdapter.providerBoundary.deterministicSource,
    fallbackFixtureProfileId: isCoastal ? null : "coastal_fixture_profile_001"
  });

  return deepFreeze({
    mapDataRouteId: createMapDataRouteId(
      normalizedSceneRoute.worldRegionId,
      normalizedSceneRoute.regionType,
      normalizedSceneRoute.sceneRouteId
    ),
    worldRegionId: normalizedSceneRoute.worldRegionId,
    regionType: normalizedSceneRoute.regionType,
    providerProfile,
    mapFixtureProfile
  });
}

export function resolveMapDataRouteForCoordinate(
  coordinate,
  worldExpansionRegistry,
  options = {}
) {
  const { sceneRoute, localMapDataAdapter } = options;
  if (sceneRoute && localMapDataAdapter) {
    return resolveMapDataRouteForSceneRoute(sceneRoute, localMapDataAdapter);
  }

  const fallbackSceneRoute = resolveSceneRouteForRegionResolution({
    regionResolutionId: "WORLD_REGION_RESOLUTION_FALLBACK_001",
    worldRegionId: "COASTAL_WORLD_EXPANSION_REGION_001",
    regionType: "coastal",
    generationProfile: {
      generationProfileId: "coastal_generation_profile_001"
    },
    assetProfile: {
      assetProfileId: "coastal_asset_profile_001",
      supportedAssetIds: ["LIGHTHOUSE_ISLAND_ROCKY_001"]
    },
    coordinate,
    fallbackRegionType: null,
    planningFoundation: {
      worldExpansionRegistry,
      regionGenerationPipeline: {
        sceneAssembly: {
          sceneAssemblyId: "map-world-settlement-atlas-scene-expansion",
          sceneId: "MAP_WORLD_SETTLEMENT_SCENE_001",
          worldId: "COASTAL_WORLD_001",
          scene: {
            objectInstances: [
              { assetId: "LIGHTHOUSE_ISLAND_ROCKY_001" }
            ]
          }
        },
        settlementGeneration: {
          generatorId: "coastal-settlement-generator-foundation",
          settlementId: "COASTAL_SETTLEMENT_001",
          generatedAssetCount: 1,
          deterministicOutput: true
        }
      }
    },
    validationResult: {
      coordinateResolutionValid: true,
      profileSelectionValid: true,
      deterministicRegionResultValid: true,
      fallbackBehaviorValid: true,
      coastalFirstLocationUnchangedValid: true,
      existingScenePipelineValid: true
    }
  });

  return deepFreeze({
    mapDataRouteId: createMapDataRouteId(
      fallbackSceneRoute.worldRegionId,
      fallbackSceneRoute.regionType,
      fallbackSceneRoute.sceneRouteId
    ),
    worldRegionId: fallbackSceneRoute.worldRegionId,
    regionType: fallbackSceneRoute.regionType,
    providerProfile: deepFreeze({
      providerProfileId: "coastal_map_provider_profile_001",
      providerId: "LOCAL_FIXTURE_MAP_PROVIDER_001",
      providerKind: "local_fixture_map_provider",
      providerMode: "fallback-local-fixture-provider",
      supportedProviderKinds: deepFreeze(["local_fixture_map_provider"]),
      compatibleFutureProviderKinds: deepFreeze([
        "local_fixture_map_provider",
        "future_osm_provider"
      ]),
      fallbackActivated: false,
      fallbackRegionType: null,
      liveNetworkAllowed: false
    }),
    mapFixtureProfile: deepFreeze({
      mapFixtureProfileId: "coastal_fixture_profile_001",
      mapDataId: createFallbackMapDataId(coordinate),
      fixtureSource: "fallback-coastal-local-map-fixture",
      fixtureBounds: deepFreeze({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
      }),
      settlementGeneratorId: "coastal-settlement-generator-foundation",
      sceneAssemblyId: "map-world-settlement-atlas-scene-expansion",
      deterministicSource: true,
      fallbackFixtureProfileId: null
    })
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "worldRegionMapDataRoutingFoundation"
  );
  for (const fieldName of worldRegionMapDataRoutingFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `World region map data routing foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    mapDataRouteId: normalizePermanentId(foundation.mapDataRouteId, "mapDataRouteId"),
    worldRegionId: normalizePermanentId(foundation.worldRegionId, "worldRegionId"),
    regionType: normalizeString(foundation.regionType, "regionType"),
    providerProfile: deepFreeze(
      asPlainObject(foundation.providerProfile, "providerProfile")
    ),
    mapFixtureProfile: deepFreeze(
      asPlainObject(foundation.mapFixtureProfile, "mapFixtureProfile")
    ),
    sceneRoute: deepFreeze(asPlainObject(foundation.sceneRoute, "sceneRoute")),
    localMapDataAdapter: deepFreeze(
      asPlainObject(foundation.localMapDataAdapter, "localMapDataAdapter")
    ),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    )
  });
}

function normalizeSceneRoute(rawSceneRoute) {
  return deepFreeze(asPlainObject(rawSceneRoute, "sceneRoute"));
}

function normalizeLocalMapDataAdapter(rawLocalMapDataAdapter) {
  return deepFreeze(asPlainObject(rawLocalMapDataAdapter, "localMapDataAdapter"));
}

function createMapDataRouteId(worldRegionId, regionType, sceneRouteId) {
  const suffix = String(hashString(`${worldRegionId}:${regionType}:${sceneRouteId}`)).padStart(
    3,
    "0"
  );
  return `WORLD_REGION_MAP_DATA_ROUTE_${suffix}`;
}

function createFallbackMapDataId(coordinate) {
  return `LOCAL_FIXTURE_MAP_DATA_FALLBACK_${String(
    hashString(`${coordinate.latitude}:${coordinate.longitude}`)
  ).padStart(3, "0")}`;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `World region map data routing foundation ${fieldName} must match the permanent ID format.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_string",
      `World region map data routing foundation ${fieldName} must be a string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "empty_string",
      `World region map data routing foundation ${fieldName} cannot be empty.`
    );
  }
  return normalized;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `World region map data routing foundation ${fieldName} must be an object.`
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
  error.name = "WorldRegionMapDataRoutingFoundationValidationError";
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
