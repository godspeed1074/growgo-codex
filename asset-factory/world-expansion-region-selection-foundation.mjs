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
  resolveSceneRouteForRegionResolution,
  validateWorldRegionSceneRoutingFoundation
} from "./world-region-scene-routing-foundation.mjs";
import {
  resolveMapDataRouteForSceneRoute,
  validateWorldRegionMapDataRoutingFoundation
} from "./world-region-map-data-routing-foundation.mjs";
import {
  createMapWorldLocalRealMapDataAdapterFoundation
} from "./map-world-local-real-map-data-adapter-foundation.mjs";

export const worldExpansionRegionSelectionFoundationRequiredFields = Object.freeze([
  "selectedRegionType",
  "selectedGenerationProfile",
  "selectedAssetProfile",
  "selectionSource",
  "validationResult"
]);

export const worldExpansionRegionSelectionFoundationDefinition = deepFreeze({
  ...worldExpansionPlanningFoundationDefinition
});

const supportedRegionTypes = new Set(["coastal", "suburban", "rural", "urban"]);

export async function createWorldExpansionRegionSelectionFoundation(
  rawDefinition = worldExpansionRegionSelectionFoundationDefinition,
  options = {}
) {
  const planningFoundation = await createWorldExpansionPlanningFoundation(
    rawDefinition,
    options
  );
  const activeRegionResolution = await createWorldRegionResolutionFoundation(
    rawDefinition,
    options
  );
  const localMapDataAdapter = await createMapWorldLocalRealMapDataAdapterFoundation(
    rawDefinition,
    options
  );

  const selection = buildRegionSelectionState({
    selectedRegionType: "coastal",
    selectionSource: "default-active-coordinate",
    planningFoundation,
    activeRegionResolution,
    localMapDataAdapter
  });

  const validation = validateWorldExpansionRegionSelectionFoundation(selection);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return selection;
}

export function validateWorldExpansionRegionSelectionFoundation(rawSelection) {
  try {
    const selection = normalizeSelection(rawSelection);

    const planningValidation = validateWorldExpansionPlanningFoundation(
      selection.planningFoundation
    );
    if (!planningValidation.ok) {
      throw createValidationError(
        planningValidation.errorCode ?? "planning_foundation_invalid",
        planningValidation.message ??
          "World expansion region selection foundation requires a valid planning foundation."
      );
    }

    const regionResolutionValidation = validateWorldRegionResolutionFoundation(
      selection.regionResolution
    );
    if (!regionResolutionValidation.ok) {
      throw createValidationError(
        regionResolutionValidation.errorCode ?? "region_resolution_invalid",
        regionResolutionValidation.message ??
          "World expansion region selection foundation requires a valid region resolution."
      );
    }

    const sceneRouteValidation = validateWorldRegionSceneRoutingFoundation(
      selection.sceneRoute
    );
    if (!sceneRouteValidation.ok) {
      throw createValidationError(
        sceneRouteValidation.errorCode ?? "scene_route_invalid",
        sceneRouteValidation.message ??
          "World expansion region selection foundation requires a valid scene route."
      );
    }

    const mapDataRouteValidation = validateWorldRegionMapDataRoutingFoundation({
      ...selection.mapDataRoute,
      sceneRoute: selection.sceneRoute,
      localMapDataAdapter: selection.localMapDataAdapter
    });
    if (!mapDataRouteValidation.ok) {
      throw createValidationError(
        mapDataRouteValidation.errorCode ?? "map_data_route_invalid",
        mapDataRouteValidation.message ??
          "World expansion region selection foundation requires a valid map data route."
      );
    }

    if (!supportedRegionTypes.has(selection.selectedRegionType)) {
      throw createValidationError(
        "selected_region_type_invalid",
        "World expansion region selection foundation selectedRegionType must be supported."
      );
    }

    for (const key of [
      "regionSelectionConsistencyValid",
      "safeFallbackValid",
      "deterministicRoutingValid",
      "coastalUnchangedValid"
    ]) {
      if (selection.validationResult[key] !== true) {
        throw createValidationError(
          "validation_result_invalid",
          `World expansion region selection foundation ${key} must be true.`
        );
      }
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldExpansionRegionSelectionFoundation: selection
    });
  } catch (error) {
    if (error?.name !== "WorldExpansionRegionSelectionFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldExpansionRegionSelectionFoundation: null
    });
  }
}

export function selectWorldExpansionRegionProfile(
  regionSelectionFoundation,
  selectedRegionType = "coastal",
  options = {}
) {
  const foundation = normalizeSelection(regionSelectionFoundation);
  return buildRegionSelectionState({
    selectedRegionType,
    selectionSource: options.selectionSource ?? "demo-region-selector",
    planningFoundation: foundation.planningFoundation,
    activeRegionResolution: foundation.activeRegionResolution,
    localMapDataAdapter: foundation.localMapDataAdapter
  });
}

function buildRegionSelectionState({
  selectedRegionType,
  selectionSource,
  planningFoundation,
  activeRegionResolution,
  localMapDataAdapter
}) {
  const normalizedRegionType = normalizeRegionType(selectedRegionType);
  const registryEntry =
    planningFoundation.worldExpansionRegistry.find(
      (region) => region.regionType === normalizedRegionType
    ) ??
    planningFoundation.worldExpansionRegistry.find(
      (region) => region.regionType === "coastal"
    );

  if (!registryEntry) {
    throw createValidationError(
      "region_registry_empty",
      "World expansion region selection foundation requires a coastal registry entry."
    );
  }

  const coastalRegion = planningFoundation.worldExpansionRegistry.find(
    (region) => region.regionType === "coastal"
  );

  const regionResolution = deepFreeze({
    ...activeRegionResolution,
    regionResolutionId: createSelectedRegionResolutionId(
      activeRegionResolution.regionResolutionId,
      registryEntry.regionType
    ),
    worldRegionId: registryEntry.worldRegionId,
    regionType: registryEntry.regionType,
    generationProfile: deepFreeze({
      ...registryEntry.generationProfile
    }),
    assetProfile: deepFreeze({
      ...registryEntry.assetProfile
    }),
    fallbackRegionType:
      registryEntry.regionType === "coastal" ? null : coastalRegion?.regionType ?? "coastal",
    validationResult: deepFreeze({
      coordinateResolutionValid: true,
      profileSelectionValid: true,
      deterministicRegionResultValid: true,
      fallbackBehaviorValid: true,
      coastalFirstLocationUnchangedValid:
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true,
      existingScenePipelineValid: true
    })
  });

  const resolvedSceneRoute = resolveSceneRouteForRegionResolution(regionResolution);
  const sceneRoute = deepFreeze({
    ...resolvedSceneRoute,
    regionResolution,
    validationResult: deepFreeze({
      coastalRouteUnchangedValid:
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true,
      unsupportedRegionsFallbackSafelyValid:
        registryEntry.regionType === "coastal"
          ? resolvedSceneRoute.sceneProfile.fallbackActivated === false
          : resolvedSceneRoute.sceneProfile.fallbackActivated === true &&
            resolvedSceneRoute.sceneProfile.fallbackRegionType === "coastal",
      deterministicSceneRoutingValid: true,
      assetCompatibilityValid: true
    })
  });

  const resolvedMapDataRoute = resolveMapDataRouteForSceneRoute(
    sceneRoute,
    localMapDataAdapter
  );
  const mapDataRoute = deepFreeze({
    ...resolvedMapDataRoute,
    sceneRoute,
    localMapDataAdapter,
    validationResult: deepFreeze({
      coastalMapPathUnchangedValid:
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true,
      providerCompatibilityValid:
        resolvedMapDataRoute.providerProfile.supportedProviderKinds.includes(
          localMapDataAdapter.providerBoundary.providerKind
        ) &&
        resolvedMapDataRoute.providerProfile.compatibleFutureProviderKinds.includes(
          "future_osm_provider"
        ),
      deterministicRoutingValid: true,
      safeFallbackValid:
        registryEntry.regionType === "coastal"
          ? resolvedMapDataRoute.providerProfile.fallbackActivated === false
          : resolvedMapDataRoute.providerProfile.fallbackActivated === true &&
            resolvedMapDataRoute.providerProfile.fallbackRegionType === "coastal"
    })
  });

  return deepFreeze({
    selectedRegionType: registryEntry.regionType,
    selectedGenerationProfile: deepFreeze({
      ...registryEntry.generationProfile
    }),
    selectedAssetProfile: deepFreeze({
      ...registryEntry.assetProfile
    }),
    selectionSource: normalizeString(selectionSource, "selectionSource"),
    planningFoundation,
    activeRegionResolution,
    localMapDataAdapter,
    regionResolution,
    sceneRoute,
    mapDataRoute,
    validationResult: deepFreeze({
      regionSelectionConsistencyValid:
        registryEntry.regionType === regionResolution.regionType &&
        registryEntry.worldRegionId === regionResolution.worldRegionId &&
        registryEntry.generationProfile.generationProfileId ===
          regionResolution.generationProfile.generationProfileId &&
        registryEntry.assetProfile.assetProfileId ===
          regionResolution.assetProfile.assetProfileId &&
        sceneRoute.regionType === registryEntry.regionType &&
        mapDataRoute.regionType === registryEntry.regionType,
      safeFallbackValid:
        registryEntry.regionType === "coastal"
          ? sceneRoute.sceneProfile.fallbackActivated === false &&
            mapDataRoute.providerProfile.fallbackActivated === false
          : sceneRoute.sceneProfile.fallbackActivated === true &&
            sceneRoute.sceneProfile.fallbackRegionType === "coastal" &&
            mapDataRoute.providerProfile.fallbackActivated === true &&
            mapDataRoute.providerProfile.fallbackRegionType === "coastal",
      deterministicRoutingValid:
        sceneRoute.sceneProfile.routeMode != null &&
        mapDataRoute.providerProfile.providerMode != null,
      coastalUnchangedValid:
        planningFoundation.validationResult.existingCoastalWorldUnchangedValid === true &&
        activeRegionResolution.regionType === "coastal"
    })
  });
}

function normalizeSelection(rawSelection) {
  const selection = asPlainObject(
    rawSelection,
    "worldExpansionRegionSelectionFoundation"
  );
  for (const fieldName of worldExpansionRegionSelectionFoundationRequiredFields) {
    if (!(fieldName in selection)) {
      throw createValidationError(
        "missing_required_field",
        `World expansion region selection foundation is missing ${fieldName}.`
      );
    }
  }
  return deepFreeze({
    selectedRegionType: normalizeRegionType(selection.selectedRegionType),
    selectedGenerationProfile: deepFreeze(
      asPlainObject(selection.selectedGenerationProfile, "selectedGenerationProfile")
    ),
    selectedAssetProfile: deepFreeze(
      asPlainObject(selection.selectedAssetProfile, "selectedAssetProfile")
    ),
    selectionSource: normalizeString(selection.selectionSource, "selectionSource"),
    planningFoundation: deepFreeze(
      asPlainObject(selection.planningFoundation, "planningFoundation")
    ),
    activeRegionResolution: deepFreeze(
      asPlainObject(selection.activeRegionResolution, "activeRegionResolution")
    ),
    localMapDataAdapter: deepFreeze(
      asPlainObject(selection.localMapDataAdapter, "localMapDataAdapter")
    ),
    regionResolution: deepFreeze(
      asPlainObject(selection.regionResolution, "regionResolution")
    ),
    sceneRoute: deepFreeze(asPlainObject(selection.sceneRoute, "sceneRoute")),
    mapDataRoute: deepFreeze(asPlainObject(selection.mapDataRoute, "mapDataRoute")),
    validationResult: deepFreeze(
      asPlainObject(selection.validationResult, "validationResult")
    )
  });
}

function createSelectedRegionResolutionId(baseResolutionId, regionType) {
  const normalizedBase = normalizeString(baseResolutionId, "regionResolutionId");
  const normalizedRegionType = normalizeRegionType(regionType).toUpperCase();
  const suffix = String(hashString(`${normalizedBase}:${normalizedRegionType}`)).padStart(
    3,
    "0"
  );
  return `WORLD_REGION_SELECTION_RESOLUTION_${suffix}`;
}

function normalizeRegionType(value) {
  const normalized = normalizeString(value, "selectedRegionType").toLowerCase();
  if (!supportedRegionTypes.has(normalized)) {
    throw createValidationError(
      "unsupported_region_type",
      `World expansion region selection foundation does not support ${value}.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_string",
      `World expansion region selection foundation ${fieldName} must be a string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "empty_string",
      `World expansion region selection foundation ${fieldName} cannot be empty.`
    );
  }
  return normalized;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `World expansion region selection foundation ${fieldName} must be an object.`
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
  error.name = "WorldExpansionRegionSelectionFoundationValidationError";
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
