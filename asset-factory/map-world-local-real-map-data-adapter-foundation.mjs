import {
  createMapWorldLiveMapFoundation,
  mapWorldLiveMapFoundationDefinition,
  validateMapWorldLiveMapFoundation
} from "./map-world-live-map-foundation.mjs";
import {
  createMapWorldRealLocationPreviewFoundation,
  mapWorldRealLocationPreviewFoundationDefinition,
  validateMapWorldRealLocationPreviewFoundation
} from "./map-world-real-location-preview-foundation.mjs";
import {
  createMapCoordinateWorldResolverFoundation,
  mapCoordinateWorldResolverFoundationDefinition,
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";

export const mapWorldLocalRealMapDataAdapterFoundationRequiredFields = Object.freeze([
  "providerId",
  "mapDataId",
  "coordinate",
  "bounds",
  "roads",
  "terrainHints",
  "landmarkHints",
  "validationResult"
]);

export const mapWorldLocalRealMapDataAdapterFoundationDefinition = deepFreeze({
  ...mapWorldRealLocationPreviewFoundationDefinition
});

export async function createMapWorldLocalRealMapDataAdapterFoundation(
  rawDefinition = mapWorldLocalRealMapDataAdapterFoundationDefinition,
  options = {}
) {
  const liveMapFoundation = await createMapWorldLiveMapFoundation(rawDefinition, options);
  const previewFoundation = await createMapWorldRealLocationPreviewFoundation(
    rawDefinition,
    options
  );
  const resolverDefinition = buildResolverDefinition(liveMapFoundation, previewFoundation);
  const worldResolver = await createMapCoordinateWorldResolverFoundation(
    resolverDefinition,
    options
  );

  const providerId = "LOCAL_FIXTURE_MAP_PROVIDER_001";
  const mapDataId = createMapDataId(
    providerId,
    worldResolver.worldLocationResolver.worldId,
    previewFoundation.coordinate
  );
  const roads = buildRoadsFromFixture(worldResolver.settlement.roadNetwork.roadSegments);
  const terrainHints = buildTerrainHints(worldResolver);
  const landmarkHints = buildLandmarkHints(previewFoundation.previewScene.assetInstances);

  const foundation = deepFreeze({
    providerId,
    mapDataId,
    coordinate: deepFreeze({
      latitude: previewFoundation.coordinate.latitude,
      longitude: previewFoundation.coordinate.longitude
    }),
    bounds: deepFreeze({
      ...worldResolver.worldLocationResolver.bounds
    }),
    roads,
    terrainHints,
    landmarkHints,
    providerBoundary: deepFreeze({
      providerKind: "local_fixture_map_provider",
      compatibleFutureProviderKinds: deepFreeze([
        "local_fixture_map_provider",
        "future_osm_provider"
      ]),
      liveNetworkAllowed: false,
      deterministicSource: true
    }),
    worldResolver,
    mapWorldLiveMapFoundation: liveMapFoundation,
    mapWorldRealLocationPreview: previewFoundation,
    validationResult: deepFreeze({
      deterministicOutputValid:
        previewFoundation.validationResult.deterministicOutputValid &&
        worldResolver.validationResult.sameCoordinateSameWorld,
      providerContractValid: true,
      coordinateConsistencyValid:
        previewFoundation.coordinate.latitude === worldResolver.worldLocationResolver.latitude &&
        previewFoundation.coordinate.longitude === worldResolver.worldLocationResolver.longitude,
      fallbackBehaviorValid:
        liveMapFoundation.validationResult.fallbackBehaviorPreserved === true,
      localFixtureDataValid: roads.length > 0 && landmarkHints.length > 0
    })
  });

  const validation = validateMapWorldLocalRealMapDataAdapterFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldLocalRealMapDataAdapterFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const liveMapValidation = validateMapWorldLiveMapFoundation(
      foundation.mapWorldLiveMapFoundation
    );
    if (!liveMapValidation.ok) {
      throw createValidationError(
        liveMapValidation.errorCode ?? "live_map_invalid",
        liveMapValidation.message ??
          "Map world local real map data adapter requires a valid live map foundation."
      );
    }

    const previewValidation = validateMapWorldRealLocationPreviewFoundation(
      foundation.mapWorldRealLocationPreview
    );
    if (!previewValidation.ok) {
      throw createValidationError(
        previewValidation.errorCode ?? "preview_invalid",
        previewValidation.message ??
          "Map world local real map data adapter requires a valid real-location preview foundation."
      );
    }

    const worldResolverValidation = validateMapCoordinateWorldResolverFoundation(
      foundation.worldResolver
    );
    if (!worldResolverValidation.ok) {
      throw createValidationError(
        worldResolverValidation.errorCode ?? "world_resolver_invalid",
        worldResolverValidation.message ??
          "Map world local real map data adapter requires a valid world resolver."
      );
    }

    if (!foundation.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world local real map data adapter deterministicOutputValid must be true."
      );
    }
    if (!foundation.validationResult.providerContractValid) {
      throw createValidationError(
        "provider_contract_invalid",
        "Map world local real map data adapter providerContractValid must be true."
      );
    }
    if (!foundation.validationResult.coordinateConsistencyValid) {
      throw createValidationError(
        "coordinate_consistency_invalid",
        "Map world local real map data adapter coordinateConsistencyValid must be true."
      );
    }
    if (!foundation.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_behavior_invalid",
        "Map world local real map data adapter fallbackBehaviorValid must be true."
      );
    }
    if (!foundation.validationResult.localFixtureDataValid) {
      throw createValidationError(
        "local_fixture_data_invalid",
        "Map world local real map data adapter localFixtureDataValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldLocalRealMapDataAdapter: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldLocalRealMapDataAdapterFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldLocalRealMapDataAdapter: null
    });
  }
}

function buildResolverDefinition(liveMapFoundation, previewFoundation) {
  return deepFreeze({
    ...mapCoordinateWorldResolverFoundationDefinition,
    latitude: previewFoundation.coordinate.latitude,
    longitude: previewFoundation.coordinate.longitude,
    bounds: deepFreeze({
      minLatitude:
        previewFoundation.coordinate.latitude -
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxY - liveMapFoundation.bounds.minY),
      minLongitude:
        previewFoundation.coordinate.longitude -
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxX - liveMapFoundation.bounds.minX),
      maxLatitude:
        previewFoundation.coordinate.latitude +
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxY - liveMapFoundation.bounds.minY),
      maxLongitude:
        previewFoundation.coordinate.longitude +
        coordinateSpanFromWorldBounds(liveMapFoundation.bounds.maxX - liveMapFoundation.bounds.minX),
      ...liveMapFoundation.bounds
    }),
    seed:
      previewFoundation.mapWorldLiveMapFoundation.mapWorldVisualLayerAttachment
        .mapWorldRealMapDisplay.worldAttachment.worldLocationResolver.seed,
    terrainType: previewFoundation.resolvedWorld.terrainType
  });
}

function buildRoadsFromFixture(roadSegments) {
  return deepFreeze(
    roadSegments.map((roadSegment) =>
      deepFreeze({
        roadSegmentId: roadSegment.roadSegmentId,
        roadClass: roadSegment.roadType,
        orientation: roadSegment.orientation,
        start: deepFreeze({ ...roadSegment.start }),
        end: deepFreeze({ ...roadSegment.end }),
        width: roadSegment.width
      })
    )
  );
}

function buildTerrainHints(worldResolver) {
  return deepFreeze({
    terrainType: worldResolver.worldLocationResolver.terrainType,
    coastalProfile: deepFreeze({
      ...worldResolver.settlement.coastalProfile
    }),
    source: "local_fixture_map_data"
  });
}

function buildLandmarkHints(assetInstances) {
  return deepFreeze(
    assetInstances
      .filter((assetInstance) =>
        assetInstance.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001" ||
        assetInstance.assetId === "BUILDING_COASTAL_COTTAGE_001"
      )
      .map((assetInstance) =>
        deepFreeze({
          assetId: assetInstance.assetId,
          hintType:
            assetInstance.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
              ? "landmark"
              : "structure",
          source: "local_fixture_map_data"
        })
      )
  );
}

function coordinateSpanFromWorldBounds(worldSpan) {
  return Number((Math.max(Number(worldSpan) || 0, 1) / 100000).toFixed(6));
}

function createMapDataId(providerId, worldId, coordinate) {
  const hash = stableHash(
    `${providerId}::${worldId}::${coordinate.latitude.toFixed(6)}::${coordinate.longitude.toFixed(6)}`
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `LOCAL_REAL_MAP_DATA_${hash}`;
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "mapWorldLocalRealMapDataAdapterFoundation");
  for (const fieldName of mapWorldLocalRealMapDataAdapterFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world local real map data adapter foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    providerId: normalizeString(foundation.providerId, "providerId"),
    mapDataId: normalizeString(foundation.mapDataId, "mapDataId"),
    coordinate: deepFreeze(asPlainObject(foundation.coordinate, "coordinate")),
    bounds: deepFreeze(asPlainObject(foundation.bounds, "bounds")),
    roads: normalizeArray(foundation.roads, "roads"),
    terrainHints: deepFreeze(asPlainObject(foundation.terrainHints, "terrainHints")),
    landmarkHints: normalizeArray(foundation.landmarkHints, "landmarkHints"),
    providerBoundary: deepFreeze(asPlainObject(foundation.providerBoundary, "providerBoundary")),
    worldResolver: deepFreeze(asPlainObject(foundation.worldResolver, "worldResolver")),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(foundation.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    ),
    mapWorldRealLocationPreview: deepFreeze(
      asPlainObject(foundation.mapWorldRealLocationPreview, "mapWorldRealLocationPreview")
    ),
    validationResult: deepFreeze(asPlainObject(foundation.validationResult, "validationResult"))
  });
}

function normalizeArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError("invalid_array", `${fieldName} must be an array.`);
  }
  return deepFreeze(value.map((entry) => deepFreeze({ ...entry })));
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldLocalRealMapDataAdapterFoundationValidationError"
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
