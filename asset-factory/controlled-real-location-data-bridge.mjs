import {
  buildControlledSyntheticWorldRuntimeAttachmentPreparationContext,
  validateControlledSyntheticWorldRuntimeAttachmentPreparation
} from "./controlled-synthetic-world-runtime-attachment-preparation.mjs";
import { resolveDeterministicAssetSelection } from "./deterministic-asset-resolver.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";
import {
  buildWorldInstanceManagerFoundationContext,
  validateWorldInstanceManagerFoundation
} from "./world-instance-manager-foundation.mjs";
import {
  buildWorldStreamingCoordinatorFoundationContext,
  validateWorldStreamingCoordinatorFoundation
} from "./world-streaming-coordinator-foundation.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";

export const controlledRealLocationDataBridgeRequiredFields = Object.freeze([
  "locationRequest",
  "locationClassification",
  "assetCandidateRequest",
  "runtimeHandoff"
]);

export const controlledRealLocationEnvironmentTypes = Object.freeze([
  "coastal",
  "urban",
  "rural",
  "park",
  "water",
  "landmark_area"
]);

export const controlledRealLocationDataBridgeDefinition = deepFreeze({
  locationRequest: deepFreeze({
    locationId: "MORNINGTON_PIER_COASTAL_001",
    latitude: -38.2189,
    longitude: 145.0385,
    region: "mornington_peninsula_victoria_australia",
    environmentType: "coastal",
    worldSeed: "growgo-coastal-alpha-seed-001"
  }),
  locationClassification: deepFreeze({
    classification: "coastal",
    regionType: "coastal_settlement",
    environmentSignals: deepFreeze([
      "shoreline_access",
      "mixed_residential",
      "landmark_visibility"
    ])
  }),
  assetCandidateRequest: deepFreeze({
    possibleAssetFamilies: deepFreeze([
      "LIGHTHOUSE_COASTAL_FAMILY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_FAMILY_001",
      "ROAD_STRAIGHT_SMALL_FAMILY_001",
      "TREE_EUCALYPTUS_FAMILY_001"
    ]),
    placementCategories: deepFreeze([
      "landmark",
      "building_plot",
      "road_segment",
      "nature_cluster"
    ]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze([
        "building_plot",
        "road_segment",
        "nature_cluster",
        "landmark_edge"
      ]),
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  runtimeHandoff: deepFreeze({
    activationMode: "manual-only-location-bridge",
    runtimeActivationAuthorized: false
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const regionPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const locationEnvironmentProfiles = deepFreeze({
  coastal: deepFreeze({
    classification: "coastal",
    regionType: "coastal_settlement",
    environmentSignals: deepFreeze([
      "shoreline_access",
      "mixed_residential",
      "landmark_visibility"
    ]),
    possibleAssetFamilies: deepFreeze([
      "LIGHTHOUSE_COASTAL_FAMILY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_FAMILY_001",
      "ROAD_STRAIGHT_SMALL_FAMILY_001",
      "TREE_EUCALYPTUS_FAMILY_001"
    ]),
    placementCategories: deepFreeze([
      "landmark",
      "building_plot",
      "road_segment",
      "nature_cluster"
    ]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze([
        "building_plot",
        "road_segment",
        "nature_cluster",
        "landmark_edge"
      ]),
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      previewAssetReferences: deepFreeze(["BUILDING_HOUSE_SMALL_COASTAL_001"]),
      previewAssetCategory: "buildings",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  urban: deepFreeze({
    classification: "urban",
    regionType: "urban_main_street",
    environmentSignals: deepFreeze([
      "commercial_frontage",
      "dense_access_roads",
      "pedestrian_edges"
    ]),
    possibleAssetFamilies: deepFreeze([
      "BUILDING_SHOP_GENERAL_FAMILY_001",
      "ROAD_INTERSECTION_SMALL_FAMILY_001",
      "LAMP_POST_BASIC_FAMILY_001",
      "BENCH_PARK_FAMILY_001"
    ]),
    placementCategories: deepFreeze([
      "building_plot",
      "road_segment",
      "decoration_edge"
    ]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze([
        "building_plot",
        "road_segment",
        "decoration_edge"
      ]),
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      previewAssetReferences: deepFreeze(["BUILDING_SHOP_GENERAL_001"]),
      previewAssetCategory: "buildings",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  rural: deepFreeze({
    classification: "rural",
    regionType: "rural_open_edge",
    environmentSignals: deepFreeze([
      "open_land",
      "sparse_structures",
      "natural_canopy"
    ]),
    possibleAssetFamilies: deepFreeze([
      "TREE_EUCALYPTUS_FAMILY_001",
      "ROCK_COASTAL_FAMILY_001",
      "TRAIL_PATH_SMALL_FAMILY_001"
    ]),
    placementCategories: deepFreeze(["nature_cluster", "trail_edge"]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze(["nature_cluster", "trail_edge"]),
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      previewAssetReferences: deepFreeze(["TREE_EUCALYPTUS_001"]),
      previewAssetCategory: "nature",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  park: deepFreeze({
    classification: "park",
    regionType: "parkland_public_space",
    environmentSignals: deepFreeze([
      "pedestrian_rest_area",
      "managed_greenery",
      "civic_access"
    ]),
    possibleAssetFamilies: deepFreeze([
      "BENCH_PARK_FAMILY_001",
      "TREE_EUCALYPTUS_FAMILY_001",
      "BUSH_NATIVE_FAMILY_001"
    ]),
    placementCategories: deepFreeze([
      "decoration_edge",
      "nature_cluster"
    ]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze(["decoration_edge", "nature_cluster"]),
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      previewAssetReferences: deepFreeze(["BENCH_PARK_001"]),
      previewAssetCategory: "decorations",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  water: deepFreeze({
    classification: "water",
    regionType: "water_edge_transition",
    environmentSignals: deepFreeze([
      "shoreline_boundary",
      "rocky_edge",
      "restricted_building_footprint"
    ]),
    possibleAssetFamilies: deepFreeze([
      "ROCK_COASTAL_FAMILY_001",
      "TREE_EUCALYPTUS_FAMILY_001",
      "TRAIL_PATH_SMALL_FAMILY_001"
    ]),
    placementCategories: deepFreeze(["nature_cluster", "shoreline_edge"]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze(["nature_cluster", "shoreline_edge"]),
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      previewAssetReferences: deepFreeze(["ROCK_COASTAL_001"]),
      previewAssetCategory: "nature",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  }),
  landmark_area: deepFreeze({
    classification: "landmark_area",
    regionType: "landmark_focus_zone",
    environmentSignals: deepFreeze([
      "high_visibility_anchor",
      "tourist_orientation",
      "manual_runtime_review_required"
    ]),
    possibleAssetFamilies: deepFreeze([
      "LIGHTHOUSE_COASTAL_FAMILY_001",
      "SIGN_GENERIC_FAMILY_001",
      "ROAD_STRAIGHT_SMALL_FAMILY_001"
    ]),
    placementCategories: deepFreeze([
      "landmark",
      "decoration_edge",
      "road_segment"
    ]),
    environmentRules: deepFreeze({
      terrainType: "grass",
      locationTypes: deepFreeze([
        "building_plot",
        "road_segment",
        "decoration_edge",
        "landmark_edge"
      ]),
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      previewAssetReferences: deepFreeze(["SIGN_GENERIC_001"]),
      previewAssetCategory: "decorations",
      appearanceProfile: "day",
      manualActivationOnly: true
    })
  })
});

export function buildControlledRealLocationDataBridgeContext() {
  return Object.freeze({
    starterLayers: buildStarterAssetFactoryLayers(),
    worldInstanceContext: buildWorldInstanceManagerFoundationContext(),
    worldStreamingContext: buildWorldStreamingCoordinatorFoundationContext(),
    runtimePreparationContext:
      buildControlledSyntheticWorldRuntimeAttachmentPreparationContext()
  });
}

export function createControlledRealLocationWorldRequest(
  rawLocationRequest = controlledRealLocationDataBridgeDefinition.locationRequest,
  options = {}
) {
  const normalizedOptions = normalizeOptions(options);
  const locationRequest = normalizeLocationRequest(rawLocationRequest);
  const locationClassification = classifyLocationRequest(locationRequest);
  const assetCandidateRequest = buildAssetCandidateRequest(locationClassification);

  const previewAssetSelection = resolvePreviewAssetSelection(
    locationRequest,
    assetCandidateRequest,
    normalizedOptions.context.starterLayers
  );
  const placementPreview = resolvePlacementPreview(
    locationRequest,
    assetCandidateRequest,
    previewAssetSelection,
    normalizedOptions.context.starterLayers
  );

  const deterministicWorldRequest = buildDeterministicWorldRequest(
    locationRequest,
    locationClassification,
    assetCandidateRequest,
    previewAssetSelection,
    placementPreview
  );

  return Object.freeze({
    locationRequest,
    locationClassification,
    assetCandidateRequest,
    deterministicWorldRequest
  });
}

export function validateControlledRealLocationDataBridge(
  rawDefinition = controlledRealLocationDataBridgeDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const worldStreamingResult =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation();
    if (!worldStreamingResult.ok) {
      return freezeFailure(worldStreamingResult);
    }

    const runtimePreparationResult =
      normalizedOptions.validateControlledSyntheticWorldRuntimeAttachmentPreparation();
    if (!runtimePreparationResult.ok) {
      return freezeFailure(runtimePreparationResult);
    }

    const worldRequest = createControlledRealLocationWorldRequest(
      definition.locationRequest,
      { context: normalizedOptions.context }
    );

    validateLocationClassification(
      definition.locationClassification,
      worldRequest.locationClassification
    );
    validateAssetCandidateRequest(
      definition.assetCandidateRequest,
      worldRequest.assetCandidateRequest
    );
    const runtimeHandoff = buildRuntimeHandoff(
      definition.runtimeHandoff,
      worldRequest,
      runtimePreparationResult.runtimePreparation
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      locationBridge: Object.freeze({
        locationRequest: worldRequest.locationRequest,
        locationClassification: worldRequest.locationClassification,
        assetCandidateRequest: worldRequest.assetCandidateRequest,
        deterministicWorldRequest: worldRequest.deterministicWorldRequest,
        runtimeHandoff,
        worldInstanceManager:
          worldInstanceResult.worldInstanceManager.foundation,
        worldStreamingCoordinator:
          worldStreamingResult.worldStreamingCoordinator.foundation,
        compatibility: Object.freeze({
          deterministicWorldGenerationVerified: true,
          passiveOnly: true,
          manualActivationRequired: true,
          gpsConnected: false,
          externalMapServicesQueried: false,
          liveWorldObjectsSpawned: false,
          rendererRuntimeEnabled: false
        })
      })
    });
  } catch (error) {
    if (error?.name !== "ControlledRealLocationDataBridgeValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      locationBridge: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildControlledRealLocationDataBridgeContext(),
    validateWorldInstanceManagerFoundation:
      options.validateWorldInstanceManagerFoundation ??
      validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      options.validateWorldStreamingCoordinatorFoundation ??
      validateWorldStreamingCoordinatorFoundation,
    validateControlledSyntheticWorldRuntimeAttachmentPreparation:
      options.validateControlledSyntheticWorldRuntimeAttachmentPreparation ??
      validateControlledSyntheticWorldRuntimeAttachmentPreparation
  });
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "controlled real location data bridge");

  assertRequiredFields(
    definition,
    controlledRealLocationDataBridgeRequiredFields,
    "controlled real location data bridge"
  );

  return deepFreeze({
    locationRequest: normalizeLocationRequest(definition.locationRequest),
    locationClassification: normalizeLocationClassification(
      definition.locationClassification
    ),
    assetCandidateRequest: normalizeAssetCandidateRequest(
      definition.assetCandidateRequest
    ),
    runtimeHandoff: normalizeRuntimeHandoff(definition.runtimeHandoff)
  });
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  const locationId = normalizePermanentId(locationRequest.locationId, "locationId");
  const latitude = normalizeLatitude(locationRequest.latitude, "latitude");
  const longitude = normalizeLongitude(locationRequest.longitude, "longitude");
  const region = normalizeRegion(locationRequest.region, "region");
  const environmentType = normalizeEnvironmentType(
    locationRequest.environmentType,
    "environmentType"
  );
  const worldSeed = normalizeStringValue(locationRequest.worldSeed, "worldSeed");

  return deepFreeze({
    locationId,
    latitude,
    longitude,
    region,
    environmentType,
    worldSeed
  });
}

function normalizeLocationClassification(rawClassification) {
  const classification = asPlainObject(
    rawClassification,
    "locationClassification"
  );

  return deepFreeze({
    classification: normalizeEnvironmentType(
      classification.classification,
      "locationClassification.classification"
    ),
    regionType: normalizeStringValue(
      classification.regionType,
      "locationClassification.regionType"
    ),
    environmentSignals: normalizeStringArray(
      classification.environmentSignals,
      "locationClassification.environmentSignals"
    )
  });
}

function normalizeAssetCandidateRequest(rawRequest) {
  const request = asPlainObject(rawRequest, "assetCandidateRequest");
  const environmentRules = asPlainObject(
    request.environmentRules,
    "assetCandidateRequest.environmentRules"
  );

  return deepFreeze({
    possibleAssetFamilies: normalizePermanentIdArray(
      request.possibleAssetFamilies,
      "assetCandidateRequest.possibleAssetFamilies"
    ),
    placementCategories: normalizeStringArray(
      request.placementCategories,
      "assetCandidateRequest.placementCategories"
    ),
    environmentRules: deepFreeze({
      terrainType: normalizeStringValue(
        environmentRules.terrainType,
        "assetCandidateRequest.environmentRules.terrainType"
      ),
      locationTypes: normalizeStringArray(
        environmentRules.locationTypes,
        "assetCandidateRequest.environmentRules.locationTypes"
      ),
      appearanceProfile: normalizeStringValue(
        environmentRules.appearanceProfile,
        "assetCandidateRequest.environmentRules.appearanceProfile"
      ),
      manualActivationOnly:
        environmentRules.manualActivationOnly === true
    })
  });
}

function normalizeRuntimeHandoff(rawRuntimeHandoff) {
  const runtimeHandoff = asPlainObject(rawRuntimeHandoff, "runtimeHandoff");

  return deepFreeze({
    activationMode: normalizeStringValue(
      runtimeHandoff.activationMode,
      "runtimeHandoff.activationMode"
    ),
    runtimeActivationAuthorized:
      runtimeHandoff.runtimeActivationAuthorized === true
  });
}

function classifyLocationRequest(locationRequest) {
  const profile = getLocationEnvironmentProfile(locationRequest.environmentType);

  return deepFreeze({
    classification: profile.classification,
    regionType: profile.regionType,
    environmentSignals: profile.environmentSignals
  });
}

function buildAssetCandidateRequest(locationClassification) {
  const profile = getLocationEnvironmentProfile(
    locationClassification.classification
  );

  return deepFreeze({
    possibleAssetFamilies: profile.possibleAssetFamilies,
    placementCategories: profile.placementCategories,
    environmentRules: deepFreeze({
      terrainType: profile.environmentRules.terrainType,
      locationTypes: profile.environmentRules.locationTypes,
      appearanceProfile: profile.environmentRules.appearanceProfile,
      manualActivationOnly: true
    })
  });
}

function resolvePreviewAssetSelection(
  locationRequest,
  assetCandidateRequest,
  starterLayers
) {
  const environmentProfile = getLocationEnvironmentProfile(
    locationRequest.environmentType
  );

  const selectionResult = resolveDeterministicAssetSelection(
    {
      locationId: locationRequest.locationId,
      coordinates: {
        x: locationRequest.latitude,
        y: locationRequest.longitude
      },
      seed: locationRequest.worldSeed,
      assetCategory: environmentProfile.environmentRules.previewAssetCategory,
      availableAssetReferences:
        environmentProfile.environmentRules.previewAssetReferences,
      resolverRules: {
        deterministicVariantSelection: true,
        source: "controlled-real-location-data-bridge"
      }
    },
    {
      assetRegistry: starterLayers.assetRegistry,
      manifestRegistry: starterLayers.manifestRegistry,
      recipeRegistry: starterLayers.recipeRegistry
    }
  );

  if (!selectionResult.ok) {
    throw createValidationError(
      selectionResult.errorCode ?? "preview_asset_selection_failed",
      selectionResult.message ??
        "Controlled real location data bridge could not resolve a preview asset selection."
    );
  }

  return deepFreeze({
    selectedAsset: selectionResult.selectedAsset,
    selectedManifest: selectionResult.selectedManifest,
    selectedRecipeReference: selectionResult.selectedRecipeReference,
    deterministicVariant: selectionResult.deterministicVariant
  });
}

function resolvePlacementPreview(
  locationRequest,
  assetCandidateRequest,
  previewAssetSelection,
  starterLayers
) {
  const environmentProfile = getLocationEnvironmentProfile(
    locationRequest.environmentType
  );

  const placementResult = calculateDeterministicPlacement(
    {
      placementRuleId: environmentProfile.environmentRules.placementRuleId,
      assetId: previewAssetSelection.selectedAsset.assetId,
      locationId: locationRequest.locationId,
      coordinates: {
        x: locationRequest.latitude,
        y: locationRequest.longitude
      },
      terrainType: assetCandidateRequest.environmentRules.terrainType,
      locationType: assetCandidateRequest.environmentRules.locationTypes[0],
      seed: locationRequest.worldSeed
    },
    {
      assetRegistry: starterLayers.assetRegistry,
      manifestRegistry: starterLayers.manifestRegistry,
      placementRuleRegistry: starterLayers.placementRuleRegistry
    }
  );

  if (!placementResult.ok) {
    throw createValidationError(
      placementResult.errorCode ?? "placement_preview_failed",
      placementResult.message ??
        "Controlled real location data bridge could not calculate a deterministic placement preview."
    );
  }

  return placementResult.deterministicPlacement;
}

function buildDeterministicWorldRequest(
  locationRequest,
  locationClassification,
  assetCandidateRequest,
  previewAssetSelection,
  placementPreview
) {
  const requestFingerprint = [
    locationRequest.locationId,
    locationRequest.latitude.toFixed(6),
    locationRequest.longitude.toFixed(6),
    locationRequest.region,
    locationRequest.environmentType,
    locationRequest.worldSeed
  ].join("|");

  return deepFreeze({
    worldRequestId: `WORLD_REQUEST_${toStableHash(requestFingerprint)}`,
    locationMetadata: deepFreeze({
      locationId: locationRequest.locationId,
      region: locationRequest.region,
      environmentType: locationRequest.environmentType,
      classification: locationClassification.classification
    }),
    worldSeed: locationRequest.worldSeed,
    worldRegion: deepFreeze({
      regionId: `${locationRequest.locationId}_REGION`,
      regionType: locationClassification.regionType
    }),
    assetCandidateRequest,
    previewSelection: deepFreeze({
      assetId: previewAssetSelection.selectedAsset.assetId,
      manifestId: previewAssetSelection.selectedManifest.assetId,
      recipeId: previewAssetSelection.selectedManifest.recipeId
    }),
    placementPreview: deepFreeze({
      placementRuleId: placementPreview.placementRuleId,
      orientation: placementPreview.orientation,
      alignmentRule: placementPreview.alignmentRule,
      placementCoordinates: placementPreview.placementCoordinates
    }),
    activationMode: "manual-only-location-request"
  });
}

function buildRuntimeHandoff(
  runtimeHandoffDefinition,
  worldRequest,
  runtimePreparation
) {
  if (runtimeHandoffDefinition.runtimeActivationAuthorized) {
    throw createValidationError(
      "runtime_activation_not_allowed",
      "Controlled real location data bridge may not authorize runtime activation."
    );
  }

  if (runtimeHandoffDefinition.activationMode !== "manual-only-location-bridge") {
    throw createValidationError(
      "invalid_activation_mode",
      "Controlled real location data bridge requires the manual-only-location-bridge activation mode."
    );
  }

  return deepFreeze({
    activationMode: runtimeHandoffDefinition.activationMode,
    runtimeActivationAuthorized: false,
    locationMetadata: worldRequest.locationMetadata,
    worldRequest: worldRequest,
    runtimePreparationReference: deepFreeze({
      sessionId: runtimePreparation.runtimeSession.sessionId,
      worldId: runtimePreparation.runtimeSession.worldId,
      manualActivationRequired: true
    }),
    passiveGuarantees: deepFreeze({
      liveRuntimeEnabled: false,
      mapAttachmentEnabled: false,
      gpsConnected: false,
      externalMapServicesQueried: false,
      liveWorldObjectsSpawned: false
    })
  });
}

function validateLocationClassification(expected, actual) {
  if (expected.classification !== actual.classification) {
    throw createValidationError(
      "location_classification_mismatch",
      "Controlled real location data bridge classification does not match the deterministic location environment profile."
    );
  }

  if (expected.regionType !== actual.regionType) {
    throw createValidationError(
      "location_region_type_mismatch",
      "Controlled real location data bridge region type does not match the deterministic location environment profile."
    );
  }
}

function validateAssetCandidateRequest(expected, actual) {
  if (!areArraysEqual(expected.possibleAssetFamilies, actual.possibleAssetFamilies)) {
    throw createValidationError(
      "asset_candidate_family_mismatch",
      "Controlled real location data bridge possible asset families do not match the selected environment profile."
    );
  }

  if (!areArraysEqual(expected.placementCategories, actual.placementCategories)) {
    throw createValidationError(
      "placement_category_mismatch",
      "Controlled real location data bridge placement categories do not match the selected environment profile."
    );
  }

  if (
    expected.environmentRules.terrainType !== actual.environmentRules.terrainType
  ) {
    throw createValidationError(
      "environment_rule_mismatch",
      "Controlled real location data bridge terrain rules do not match the selected environment profile."
    );
  }

  if (
    expected.environmentRules.manualActivationOnly !==
    actual.environmentRules.manualActivationOnly
  ) {
    throw createValidationError(
      "manual_activation_rule_mismatch",
      "Controlled real location data bridge manual activation rules do not match the selected environment profile."
    );
  }
}

function getLocationEnvironmentProfile(environmentType) {
  const profile = locationEnvironmentProfiles[environmentType];

  if (!profile) {
    throw createValidationError(
      "invalid_environment_type",
      `Environment type ${environmentType} is not supported by the controlled real location data bridge.`
    );
  }

  return profile;
}

function assertRequiredFields(objectValue, requiredFields, label) {
  for (const field of requiredFields) {
    if (!(field in objectValue)) {
      throw createValidationError(
        "missing_required_field",
        `${label} is missing required field ${field}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName).toUpperCase();

  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent uppercase GrowGo identifier.`
    );
  }

  return normalizedValue;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_permanent_id_array",
      `${fieldName} must be a non-empty array of permanent identifiers.`
    );
  }

  return deepFreeze(
    value.map((entry, index) =>
      normalizePermanentId(entry, `${fieldName}[${index}]`)
    )
  );
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `${fieldName} must be a non-empty array of strings.`
    );
  }

  return deepFreeze(
    value.map((entry, index) =>
      normalizeStringValue(entry, `${fieldName}[${index}]`)
    )
  );
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

function normalizeRegion(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName).toLowerCase();

  if (!regionPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_region",
      `${fieldName} must use lowercase underscore-separated region naming.`
    );
  }

  return normalizedValue;
}

function normalizeEnvironmentType(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName).toLowerCase();

  if (!controlledRealLocationEnvironmentTypes.includes(normalizedValue)) {
    throw createValidationError(
      "invalid_environment_type",
      `${fieldName} must be one of ${controlledRealLocationEnvironmentTypes.join(", ")}.`
    );
  }

  return normalizedValue;
}

function normalizeLatitude(value, fieldName) {
  if (!Number.isFinite(value) || value < -90 || value > 90) {
    throw createValidationError(
      "invalid_latitude",
      `${fieldName} must be a finite latitude between -90 and 90.`
    );
  }

  return Number(value);
}

function normalizeLongitude(value, fieldName) {
  if (!Number.isFinite(value) || value < -180 || value > 180) {
    throw createValidationError(
      "invalid_longitude",
      `${fieldName} must be a finite longitude between -180 and 180.`
    );
  }

  return Number(value);
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    locationBridge: null
  });
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "ControlledRealLocationDataBridgeValidationError";
  error.code = code;
  return error;
}

function areArraysEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

function toStableHash(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return String(hash).padStart(10, "0");
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
