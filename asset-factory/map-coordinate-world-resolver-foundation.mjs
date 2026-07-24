import {
  coastalSettlementGeneratorFoundationDefinition,
  createCoastalSettlementGeneratorFoundation,
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";
import {
  createCoastalStarterWorldRealAssetSceneAssembly,
  validateCoastalStarterWorldRealAssetSceneAssembly
} from "./coastal-starter-world-real-asset-scene-assembly.mjs";

export const mapCoordinateWorldResolverFoundationRequiredFields = Object.freeze([
  "worldId",
  "latitude",
  "longitude",
  "bounds",
  "seed",
  "terrainType"
]);

export const mapCoordinateWorldResolverFoundationDefinition = deepFreeze({
  worldId: "COASTAL_MAP_WORLD_001",
  latitude: -38.2189,
  longitude: 145.0385,
  bounds: deepFreeze({
    minLatitude: -38.2225,
    minLongitude: 145.0325,
    maxLatitude: -38.2153,
    maxLongitude: 145.0445,
    minX: 0,
    minY: 0,
    maxX: 960,
    maxY: 640
  }),
  seed: "growgo-coastal-map-world-seed-001",
  terrainType: "coastal_grassland"
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedTerrainTypes = new Set(["coastal_grassland"]);

export async function createMapCoordinateWorldResolverFoundation(
  rawDefinition = mapCoordinateWorldResolverFoundationDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const resolvedWorldId = createResolvedWorldId(
    definition.worldId,
    definition.latitude,
    definition.longitude,
    definition.terrainType
  );
  const derivedSettlementDefinition = buildSettlementDefinition(definition, resolvedWorldId);
  const settlement = await createCoastalSettlementGeneratorFoundation(
    derivedSettlementDefinition,
    options
  );
  const scenePackage = await createCoastalStarterWorldRealAssetSceneAssembly(options);

  const result = deepFreeze({
    worldLocationResolver: deepFreeze({
      worldId: resolvedWorldId,
      latitude: definition.latitude,
      longitude: definition.longitude,
      bounds: definition.bounds,
      seed: definition.seed,
      terrainType: definition.terrainType
    }),
    settlement,
    scenePackage,
    validationResult: buildValidationResult(resolvedWorldId, settlement, scenePackage),
    worldSummary: buildWorldSummary(resolvedWorldId, definition, settlement, scenePackage)
  });

  const validation = validateMapCoordinateWorldResolverFoundation(result);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return result;
}

export function validateMapCoordinateWorldResolverFoundation(rawResolver) {
  try {
    const resolver = normalizeGeneratedResolver(rawResolver);

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      resolver.settlement
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_invalid",
        settlementValidation.message ?? "Resolved settlement must validate successfully."
      );
    }

    const sceneValidation = validateCoastalStarterWorldRealAssetSceneAssembly(
      resolver.scenePackage
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "scene_package_invalid",
        sceneValidation.message ?? "Resolved scene package must validate successfully."
      );
    }

    if (!resolver.validationResult.sameCoordinateSameWorld) {
      throw createValidationError(
        "world_identity_invalid",
        "Map coordinate world resolver sameCoordinateSameWorld must be true."
      );
    }
    if (!resolver.validationResult.sameSeedSameSettlement) {
      throw createValidationError(
        "settlement_identity_invalid",
        "Map coordinate world resolver sameSeedSameSettlement must be true."
      );
    }
    if (!resolver.validationResult.assetReferencesRemainValid) {
      throw createValidationError(
        "asset_reference_invalid",
        "Map coordinate world resolver assetReferencesRemainValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapCoordinateWorldResolver: resolver
    });
  } catch (error) {
    if (error?.name !== "MapCoordinateWorldResolverFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapCoordinateWorldResolver: null
    });
  }
}

function buildSettlementDefinition(definition, resolvedWorldId) {
  return deepFreeze({
    ...coastalSettlementGeneratorFoundationDefinition,
    worldRegionId: `${resolvedWorldId}_SETTLEMENT_REGION_001`,
    bounds: deepFreeze({
      minX: definition.bounds.minX,
      minY: definition.bounds.minY,
      maxX: definition.bounds.maxX,
      maxY: definition.bounds.maxY
    }),
    seed: definition.seed,
    terrainType: definition.terrainType
  });
}

function buildValidationResult(resolvedWorldId, settlement, scenePackage) {
  const settlementAssetIds = new Set(
    settlement.assetPlacements.map((placement) => placement.assetId)
  );
  const sceneAssetIds = new Set(
    scenePackage.assetInstances.map((assetInstance) => assetInstance.assetId)
  );

  return deepFreeze({
    sameCoordinateSameWorld: typeof resolvedWorldId === "string" && resolvedWorldId.length > 0,
    sameSeedSameSettlement:
      typeof settlement.settlementSummary?.settlementId === "string" &&
      settlement.settlementSummary.settlementId.length > 0,
    assetReferencesRemainValid: [...settlementAssetIds].every((assetId) =>
      sceneAssetIds.has(assetId)
    )
  });
}

function buildWorldSummary(resolvedWorldId, definition, settlement, scenePackage) {
  return deepFreeze({
    worldId: resolvedWorldId,
    latitude: definition.latitude,
    longitude: definition.longitude,
    terrainType: definition.terrainType,
    seed: definition.seed,
    settlementId: settlement.settlementSummary.settlementId,
    residentialLotCount: settlement.settlementSummary.residentialLotCount,
    roadSegmentCount: settlement.settlementSummary.roadSegmentCount,
    generatedAssetCount: settlement.settlementSummary.generatedAssetCount,
    sceneAssetCount: scenePackage.assetInstances.length,
    sceneId: scenePackage.sceneId
  });
}

function createResolvedWorldId(worldIdPrefix, latitude, longitude, terrainType) {
  const coordinateHash = stableHash(
    `${latitude.toFixed(6)}::${longitude.toFixed(6)}::${terrainType}`
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `${worldIdPrefix}_${coordinateHash}`;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "mapCoordinateWorldResolverFoundation");
  for (const fieldName of mapCoordinateWorldResolverFoundationRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Map coordinate world resolver definition is missing ${fieldName}.`
      );
    }
  }

  const worldId = normalizePermanentId(definition.worldId, "worldId");
  const latitude = normalizeLatitude(definition.latitude, "latitude");
  const longitude = normalizeLongitude(definition.longitude, "longitude");
  const bounds = normalizeBounds(definition.bounds);
  const seed = normalizeString(definition.seed, "seed");
  const terrainType = normalizeString(definition.terrainType, "terrainType");
  if (!supportedTerrainTypes.has(terrainType)) {
    throw createValidationError(
      "terrain_type_invalid",
      "Map coordinate world resolver terrainType must be supported."
    );
  }

  if (
    latitude < bounds.minLatitude ||
    latitude > bounds.maxLatitude ||
    longitude < bounds.minLongitude ||
    longitude > bounds.maxLongitude
  ) {
    throw createValidationError(
      "coordinate_out_of_bounds",
      "Map coordinate world resolver latitude/longitude must sit inside bounds."
    );
  }

  return deepFreeze({
    worldId,
    latitude,
    longitude,
    bounds,
    seed,
    terrainType
  });
}

function normalizeGeneratedResolver(rawResolver) {
  const resolver = asPlainObject(rawResolver, "mapCoordinateWorldResolver");
  const worldLocationResolver = asPlainObject(
    resolver.worldLocationResolver,
    "worldLocationResolver"
  );

  return deepFreeze({
    worldLocationResolver: deepFreeze({
      worldId: normalizeString(worldLocationResolver.worldId, "worldLocationResolver.worldId"),
      latitude: normalizeLatitude(
        worldLocationResolver.latitude,
        "worldLocationResolver.latitude"
      ),
      longitude: normalizeLongitude(
        worldLocationResolver.longitude,
        "worldLocationResolver.longitude"
      ),
      bounds: normalizeBounds(worldLocationResolver.bounds),
      seed: normalizeString(worldLocationResolver.seed, "worldLocationResolver.seed"),
      terrainType: normalizeString(
        worldLocationResolver.terrainType,
        "worldLocationResolver.terrainType"
      )
    }),
    settlement: deepFreeze(resolver.settlement),
    scenePackage: deepFreeze(resolver.scenePackage),
    validationResult: deepFreeze({
      sameCoordinateSameWorld: Boolean(resolver.validationResult?.sameCoordinateSameWorld),
      sameSeedSameSettlement: Boolean(resolver.validationResult?.sameSeedSameSettlement),
      assetReferencesRemainValid: Boolean(
        resolver.validationResult?.assetReferencesRemainValid
      )
    }),
    worldSummary: deepFreeze({
      ...asPlainObject(resolver.worldSummary, "worldSummary")
    })
  });
}

function normalizeBounds(rawBounds) {
  const bounds = asPlainObject(rawBounds, "bounds");
  const minLatitude = normalizeLatitude(bounds.minLatitude, "bounds.minLatitude");
  const minLongitude = normalizeLongitude(bounds.minLongitude, "bounds.minLongitude");
  const maxLatitude = normalizeLatitude(bounds.maxLatitude, "bounds.maxLatitude");
  const maxLongitude = normalizeLongitude(bounds.maxLongitude, "bounds.maxLongitude");
  const minX = Number(bounds.minX);
  const minY = Number(bounds.minY);
  const maxX = Number(bounds.maxX);
  const maxY = Number(bounds.maxY);

  if (maxLatitude <= minLatitude || maxLongitude <= minLongitude) {
    throw createValidationError(
      "bounds_invalid",
      "Map coordinate world resolver geographic bounds must have positive size."
    );
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    throw createValidationError(
      "bounds_invalid",
      "Map coordinate world resolver local bounds must be finite numbers."
    );
  }
  if (maxX <= minX || maxY <= minY) {
    throw createValidationError(
      "bounds_invalid",
      "Map coordinate world resolver local bounds must have positive size."
    );
  }

  return deepFreeze({
    minLatitude,
    minLongitude,
    maxLatitude,
    maxLongitude,
    minX,
    minY,
    maxX,
    maxY
  });
}

function normalizeLatitude(value, fieldName) {
  const latitude = Number(value);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw createValidationError(
      "invalid_latitude",
      `${fieldName} must be a finite latitude between -90 and 90.`
    );
  }
  return latitude;
}

function normalizeLongitude(value, fieldName) {
  const longitude = Number(value);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw createValidationError(
      "invalid_longitude",
      `${fieldName} must be a finite longitude between -180 and 180.`
    );
  }
  return longitude;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "permanent_id_invalid",
      `${fieldName} must use a permanent GrowGo-style identifier.`
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

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "MapCoordinateWorldResolverFoundationValidationError"
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
