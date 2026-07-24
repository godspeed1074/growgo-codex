import {
  createMapCoordinateWorldResolverFoundation,
  mapCoordinateWorldResolverFoundationDefinition,
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";
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
  createMapWorldLocalRealMapDataAdapterFoundation,
  validateMapWorldLocalRealMapDataAdapterFoundation
} from "./map-world-local-real-map-data-adapter-foundation.mjs";
import {
  validateCoastalSettlementGeneratorFoundation
} from "./coastal-settlement-generator-foundation.mjs";

export const mapWorldRealLocationOsmPreparationFoundationRequiredFields = Object.freeze([
  "mapDataId",
  "coordinate",
  "bounds",
  "roads",
  "terrainHints",
  "landmarkHints",
  "validationResult"
]);

export const mapWorldRealLocationOsmPreparationFoundationDefinition = deepFreeze({
  ...mapWorldRealLocationPreviewFoundationDefinition
});

const supportedProviderKinds = new Set([
  "local_fixture_map_provider",
  "future_osm_provider"
]);

export async function createMapWorldRealLocationOsmPreparationFoundation(
  rawDefinition = mapWorldRealLocationOsmPreparationFoundationDefinition,
  options = {}
) {
  const localMapDataAdapter =
    await createMapWorldLocalRealMapDataAdapterFoundation(rawDefinition, options);
  const liveMapFoundation = localMapDataAdapter.mapWorldLiveMapFoundation;
  const previewFoundation = localMapDataAdapter.mapWorldRealLocationPreview;
  const resolver = localMapDataAdapter.worldResolver;

  const roadHints = deepFreeze(
    localMapDataAdapter.roads.map((roadSegment) => deepFreeze({ ...roadSegment }))
  );

  const terrainHints = deepFreeze({
    ...localMapDataAdapter.terrainHints
  });

  const landmarkHints = deepFreeze(
    localMapDataAdapter.landmarkHints.map((landmarkHint) =>
      deepFreeze({ ...landmarkHint })
    )
  );

  const providerBoundary = deepFreeze({
    currentProvider: deepFreeze({
      providerKind: "local_fixture_map_provider",
      providerId: localMapDataAdapter.providerId,
      liveNetworkAllowed: false,
      deterministicSource: true
    }),
    compatibleProviders: deepFreeze([
      "local_fixture_map_provider",
      "future_osm_provider"
    ]),
    providerContract: deepFreeze({
      requiredFields: deepFreeze([
        "mapDataId",
        "coordinate",
        "bounds",
        "roads",
        "terrainHints",
        "landmarkHints"
      ]),
      futureOsmCompatibility: true,
      fallbackProviderKind: "local_fixture_map_provider"
    })
  });

  const foundation = deepFreeze({
    mapDataId: localMapDataAdapter.mapDataId,
    coordinate: deepFreeze({
      ...localMapDataAdapter.coordinate
    }),
    bounds: deepFreeze({
      ...localMapDataAdapter.bounds
    }),
    roads: roadHints,
    terrainHints,
    landmarkHints,
    providerBoundary,
    localMapDataAdapter,
    worldResolver: resolver,
    mapWorldLiveMapFoundation: liveMapFoundation,
    mapWorldRealLocationPreview: previewFoundation,
    settlementGenerator: resolver.settlement,
    validationResult: deepFreeze({
      deterministicOutputValid:
        previewFoundation.validationResult.deterministicOutputValid &&
        resolver.validationResult.sameCoordinateSameWorld,
      providerContractValid:
        validateProviderBoundary(providerBoundary) &&
        localMapDataAdapter.validationResult.providerContractValid,
      coordinateConsistencyValid:
        localMapDataAdapter.coordinate.latitude === resolver.worldLocationResolver.latitude &&
        localMapDataAdapter.coordinate.longitude === resolver.worldLocationResolver.longitude,
      fallbackBehaviorValid:
        liveMapFoundation.validationResult.fallbackBehaviorPreserved === true &&
        providerBoundary.currentProvider.liveNetworkAllowed === false
    })
  });

  const validation = validateMapWorldRealLocationOsmPreparationFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateMapWorldRealLocationOsmPreparationFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);
    const previewValidation = validateMapWorldRealLocationPreviewFoundation(
      foundation.mapWorldRealLocationPreview
    );
    if (!previewValidation.ok) {
      throw createValidationError(
        previewValidation.errorCode ?? "preview_invalid",
        previewValidation.message ??
          "Map world real location OSM preparation foundation requires a valid real-location preview foundation."
      );
    }

    const liveMapValidation = validateMapWorldLiveMapFoundation(
      foundation.mapWorldLiveMapFoundation
    );
    if (!liveMapValidation.ok) {
      throw createValidationError(
        liveMapValidation.errorCode ?? "live_map_invalid",
        liveMapValidation.message ??
          "Map world real location OSM preparation foundation requires a valid live map foundation."
      );
    }

    const localMapDataValidation = validateMapWorldLocalRealMapDataAdapterFoundation(
      foundation.localMapDataAdapter
    );
    if (!localMapDataValidation.ok) {
      throw createValidationError(
        localMapDataValidation.errorCode ?? "local_map_data_invalid",
        localMapDataValidation.message ??
          "Map world real location OSM preparation foundation requires a valid local map data adapter."
      );
    }

    const resolverValidation = validateMapCoordinateWorldResolverFoundation(
      foundation.worldResolver
    );
    if (!resolverValidation.ok) {
      throw createValidationError(
        resolverValidation.errorCode ?? "world_resolver_invalid",
        resolverValidation.message ??
          "Map world real location OSM preparation foundation requires a valid world resolver."
      );
    }

    const settlementValidation = validateCoastalSettlementGeneratorFoundation(
      foundation.settlementGenerator
    );
    if (!settlementValidation.ok) {
      throw createValidationError(
        settlementValidation.errorCode ?? "settlement_invalid",
        settlementValidation.message ??
          "Map world real location OSM preparation foundation requires a valid settlement generator result."
      );
    }

    if (!foundation.validationResult.deterministicOutputValid) {
      throw createValidationError(
        "deterministic_output_invalid",
        "Map world real location OSM preparation foundation deterministicOutputValid must be true."
      );
    }
    if (!foundation.validationResult.providerContractValid) {
      throw createValidationError(
        "provider_contract_invalid",
        "Map world real location OSM preparation foundation providerContractValid must be true."
      );
    }
    if (!foundation.validationResult.coordinateConsistencyValid) {
      throw createValidationError(
        "coordinate_consistency_invalid",
        "Map world real location OSM preparation foundation coordinateConsistencyValid must be true."
      );
    }
    if (!foundation.validationResult.fallbackBehaviorValid) {
      throw createValidationError(
        "fallback_behavior_invalid",
        "Map world real location OSM preparation foundation fallbackBehaviorValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      mapWorldRealLocationOsmPreparation: foundation
    });
  } catch (error) {
    if (error?.name !== "MapWorldRealLocationOsmPreparationFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      mapWorldRealLocationOsmPreparation: null
    });
  }
}

function validateProviderBoundary(providerBoundary) {
  const currentProvider = providerBoundary?.currentProvider;
  const contract = providerBoundary?.providerContract;
  if (!currentProvider || !contract) {
    return false;
  }
  if (!supportedProviderKinds.has(currentProvider.providerKind)) {
    return false;
  }
  if (currentProvider.providerKind !== "local_fixture_map_provider") {
    return false;
  }
  if (currentProvider.liveNetworkAllowed !== false) {
    return false;
  }
  if (contract.futureOsmCompatibility !== true) {
    return false;
  }
  if (contract.fallbackProviderKind !== "local_fixture_map_provider") {
    return false;
  }
  return Array.isArray(contract.requiredFields) && contract.requiredFields.length >= 6;
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "mapWorldRealLocationOsmPreparationFoundation"
  );
  for (const fieldName of mapWorldRealLocationOsmPreparationFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `Map world real location OSM preparation foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    mapDataId: normalizeString(foundation.mapDataId, "mapDataId"),
    coordinate: deepFreeze(asPlainObject(foundation.coordinate, "coordinate")),
    bounds: deepFreeze(asPlainObject(foundation.bounds, "bounds")),
    roads: normalizeArray(foundation.roads, "roads"),
    terrainHints: deepFreeze(asPlainObject(foundation.terrainHints, "terrainHints")),
    landmarkHints: normalizeArray(foundation.landmarkHints, "landmarkHints"),
    providerBoundary: deepFreeze(asPlainObject(foundation.providerBoundary, "providerBoundary")),
    localMapDataAdapter: deepFreeze(
      asPlainObject(foundation.localMapDataAdapter, "localMapDataAdapter")
    ),
    worldResolver: deepFreeze(asPlainObject(foundation.worldResolver, "worldResolver")),
    mapWorldLiveMapFoundation: deepFreeze(
      asPlainObject(foundation.mapWorldLiveMapFoundation, "mapWorldLiveMapFoundation")
    ),
    mapWorldRealLocationPreview: deepFreeze(
      asPlainObject(foundation.mapWorldRealLocationPreview, "mapWorldRealLocationPreview")
    ),
    settlementGenerator: deepFreeze(
      asPlainObject(foundation.settlementGenerator, "settlementGenerator")
    ),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    )
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
  return Object.assign(new Error(message), {
    code,
    name: "MapWorldRealLocationOsmPreparationFoundationValidationError"
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
