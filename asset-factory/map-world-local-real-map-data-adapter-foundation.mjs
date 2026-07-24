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
  "landAreas",
  "buildingHints",
  "vegetationHints",
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
  const landAreas = buildLandAreasFromFixture(
    worldResolver.worldLocationResolver.bounds,
    worldResolver.settlement
  );
  const buildingHints = buildBuildingHints(worldResolver.settlement);
  const vegetationHints = buildVegetationHints(worldResolver.settlement);
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
    landAreas,
    buildingHints,
    vegetationHints,
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
      localFixtureDataValid:
        roads.length >= 3 &&
        landAreas.length >= 3 &&
        buildingHints.length >= 1 &&
        vegetationHints.length >= 1 &&
        landmarkHints.length >= 1,
      mapDataContractValid:
        roads.every((road) => Array.isArray(road.connectedIntersectionIds)) &&
        landAreas.every((area) => Array.isArray(area.boundaryPoints)) &&
        buildingHints.every((hint) => typeof hint.facing === "string") &&
        vegetationHints.every((hint) => typeof hint.density === "string"),
      placementValidityPreserved:
        worldResolver.settlement.validationResult.placementValidity === true,
      assetReferenceValidityPreserved:
        worldResolver.settlement.validationResult.assetReferenceValidity === true
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
    if (!foundation.validationResult.mapDataContractValid) {
      throw createValidationError(
        "map_data_contract_invalid",
        "Map world local real map data adapter mapDataContractValid must be true."
      );
    }
    if (!foundation.validationResult.placementValidityPreserved) {
      throw createValidationError(
        "placement_validity_invalid",
        "Map world local real map data adapter placementValidityPreserved must be true."
      );
    }
    if (!foundation.validationResult.assetReferenceValidityPreserved) {
      throw createValidationError(
        "asset_reference_invalid",
        "Map world local real map data adapter assetReferenceValidityPreserved must be true."
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
  const intersectionLookup = buildIntersectionLookup(roadSegments);
  return deepFreeze(
    roadSegments.map((roadSegment) =>
      deepFreeze({
        roadSegmentId: roadSegment.roadSegmentId,
        roadClass: roadSegment.roadType,
        orientation: roadSegment.orientation,
        start: deepFreeze({ ...roadSegment.start }),
        end: deepFreeze({ ...roadSegment.end }),
        width: roadSegment.width,
        connectedIntersectionIds: deepFreeze(
          intersectionLookup.get(roadSegment.roadSegmentId) ?? []
        )
      })
    )
  );
}

function buildLandAreasFromFixture(bounds, settlement) {
  const { minX, minY, maxX, maxY } = bounds;
  const shorelineY = settlement.roadNetwork.roadSegments[0].start.y + 96;
  const residentialTopY = Math.max(
    ...settlement.residentialLots.map((lot) => lot.position.y - lot.depth / 2)
  ) - 24;

  return deepFreeze([
    deepFreeze({
      landAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001",
      areaType: "residential_neighbourhood",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: minX + 36, y: residentialTopY }),
        deepFreeze({ x: maxX - 36, y: residentialTopY }),
        deepFreeze({ x: maxX - 36, y: shorelineY - 48 }),
        deepFreeze({ x: minX + 36, y: shorelineY - 48 })
      ])
    }),
    deepFreeze({
      landAreaId: "LOCAL_MAP_LAND_AREA_COASTLINE_001",
      areaType: "coastline_boundary",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: minX, y: shorelineY }),
        deepFreeze({ x: maxX, y: shorelineY }),
        deepFreeze({ x: maxX, y: maxY }),
        deepFreeze({ x: minX, y: maxY })
      ])
    }),
    deepFreeze({
      landAreaId: "LOCAL_MAP_LAND_AREA_FORESHORE_001",
      areaType: "foreshore_transition",
      boundaryPoints: deepFreeze([
        deepFreeze({ x: minX + 24, y: shorelineY - 52 }),
        deepFreeze({ x: maxX - 24, y: shorelineY - 52 }),
        deepFreeze({ x: maxX - 24, y: shorelineY + 28 }),
        deepFreeze({ x: minX + 24, y: shorelineY + 28 })
      ])
    })
  ]);
}

function buildBuildingHints(settlement) {
  return deepFreeze(
    settlement.residentialLots.map((lot, index) =>
      deepFreeze({
        buildingHintId: `LOCAL_MAP_BUILDING_HINT_${String(index + 1).padStart(3, "0")}`,
        assetId: "BUILDING_COASTAL_COTTAGE_001",
        lotId: lot.lotId,
        frontageRoadSegmentId: lot.roadFrontage.roadSegmentId,
        position: deepFreeze({ ...lot.position }),
        width: lot.width,
        depth: lot.depth,
        facing: lot.orientation,
        residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001"
      })
    )
  );
}

function buildVegetationHints(settlement) {
  return deepFreeze(
    settlement.assetPlacements
      .filter((placement) => placement.assetId === "TREE_EUCALYPTUS_001")
      .map((placement, index) =>
        deepFreeze({
          vegetationHintId: `LOCAL_MAP_VEGETATION_HINT_${String(index + 1).padStart(3, "0")}`,
          assetId: placement.assetId,
          position: deepFreeze({ ...placement.position }),
          density: index < 3 ? "moderate" : "light",
          vegetationAreaId:
            placement.position.y > settlement.roadNetwork.roadSegments[0].start.y
              ? "LOCAL_MAP_LAND_AREA_FORESHORE_001"
              : "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001"
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
    source: "local_fixture_map_data",
    coastlineBoundaryId: "LOCAL_MAP_LAND_AREA_COASTLINE_001",
    residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001",
    foreshoreAreaId: "LOCAL_MAP_LAND_AREA_FORESHORE_001"
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

function buildIntersectionLookup(roadSegments) {
  const lookup = new Map();
  if (roadSegments.length === 0) {
    return lookup;
  }

  const mainRoad = roadSegments.find((segment) => segment.orientation === "east-west");
  const spurRoads = roadSegments.filter((segment) => segment.orientation === "north-south");

  for (const segment of roadSegments) {
    lookup.set(segment.roadSegmentId, []);
  }

  spurRoads.forEach((spurRoad, index) => {
    const intersectionId = `LOCAL_MAP_INTERSECTION_${String(index + 1).padStart(3, "0")}`;
    lookup.get(spurRoad.roadSegmentId).push(intersectionId);
    if (mainRoad) {
      lookup.get(mainRoad.roadSegmentId).push(intersectionId);
    }
  });

  return lookup;
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
    landAreas: normalizeArray(foundation.landAreas, "landAreas"),
    buildingHints: normalizeArray(foundation.buildingHints, "buildingHints"),
    vegetationHints: normalizeArray(foundation.vegetationHints, "vegetationHints"),
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
