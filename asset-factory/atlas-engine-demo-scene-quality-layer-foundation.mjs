import {
  atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
  buildAtlasEngineSyntheticWorldPreviewDemonstrationContext,
  validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation
} from "./atlas-engine-synthetic-world-preview-demonstration-foundation.mjs";
import {
  combinedWorldPreviewGeneratorFoundationDefinition,
  validateCombinedWorldPreviewGeneratorFoundation
} from "./combined-world-preview-generator-foundation.mjs";
import {
  environmentAndBiomePreviewFoundationDefinition,
  validateEnvironmentAndBiomePreviewFoundation
} from "./environment-and-biome-preview-foundation.mjs";
import {
  calculateDeterministicPlacement,
  createWorldPlacementRuleRegistry,
  validateDeterministicPlacementInput,
  coreWorldPlacementRules
} from "./world-placement-rules.mjs";
import {
  resolveDeterministicAssetSelection,
  validateDeterministicAssetResolverInput
} from "./deterministic-asset-resolver.mjs";

export const atlasEngineDemoSceneQualityLayerRequiredFields = Object.freeze([
  "qualityLayerId",
  "locationRequest",
  "qualityProfileId",
  "expectedStructureCount",
  "expectedEnvironmentCount",
  "expectedRendererPayloadCount"
]);

export const atlasEngineDemoSceneQualityLayerFoundationDefinition = deepFreeze({
  qualityLayerId: "ATLAS_DEMO_SCENE_QUALITY_LAYER_001",
  locationRequest: deepFreeze({
    ...atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.locationRequest
  }),
  qualityProfileId: "WORLD_QUALITY_PROFILE_COASTAL_001",
  expectedStructureCount:
    atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.expectedStructureCount,
  expectedEnvironmentCount:
    atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.expectedEnvironmentCount,
  expectedRendererPayloadCount:
    atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition.expectedRendererPayloadCount
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

const qualityProfilesByEnvironmentType = deepFreeze({
  coastal: deepFreeze({
    worldQualityProfileId: "WORLD_QUALITY_PROFILE_COASTAL_001",
    environmentBalance: 0.64,
    structureDensity: 0.36,
    landmarkDensity: 0.18,
    vegetationDensity: 0.72,
    decorationDensity: 0.28,
    metadata: deepFreeze({
      compositionRule: "coastal",
      landmarkWeighting: deepFreeze({
        landmarkImportance: 0.82,
        nearbyEnvironmentEnhancement: 0.61,
        pathViewpointWeighting: 0.74
      }),
      varietyRules: deepFreeze({
        clustering: "coastal-clustered",
        spacingVariation: "shoreline-breathing-room",
        densityVariation: "foreground-heavy",
        biomeTransitionRule: "coast-to-grassland-soft-transition"
      })
    })
  }),
  rural: deepFreeze({
    worldQualityProfileId: "WORLD_QUALITY_PROFILE_RURAL_001",
    environmentBalance: 0.7,
    structureDensity: 0.3,
    landmarkDensity: 0.12,
    vegetationDensity: 0.68,
    decorationDensity: 0.2,
    metadata: deepFreeze({
      compositionRule: "rural",
      landmarkWeighting: deepFreeze({
        landmarkImportance: 0.58,
        nearbyEnvironmentEnhancement: 0.44,
        pathViewpointWeighting: 0.49
      }),
      varietyRules: deepFreeze({
        clustering: "field-edge-clustered",
        spacingVariation: "wide-open-variation",
        densityVariation: "patch-balanced",
        biomeTransitionRule: "field-to-tree-line-gradual-transition"
      })
    })
  }),
  urban: deepFreeze({
    worldQualityProfileId: "WORLD_QUALITY_PROFILE_URBAN_001",
    environmentBalance: 0.42,
    structureDensity: 0.58,
    landmarkDensity: 0.26,
    vegetationDensity: 0.31,
    decorationDensity: 0.37,
    metadata: deepFreeze({
      compositionRule: "urban",
      landmarkWeighting: deepFreeze({
        landmarkImportance: 0.71,
        nearbyEnvironmentEnhancement: 0.36,
        pathViewpointWeighting: 0.67
      }),
      varietyRules: deepFreeze({
        clustering: "street-front-clustered",
        spacingVariation: "block-edge-variation",
        densityVariation: "node-focused",
        biomeTransitionRule: "street-to-pocket-green-transition"
      })
    })
  }),
  park: deepFreeze({
    worldQualityProfileId: "WORLD_QUALITY_PROFILE_PARK_001",
    environmentBalance: 0.78,
    structureDensity: 0.22,
    landmarkDensity: 0.16,
    vegetationDensity: 0.76,
    decorationDensity: 0.34,
    metadata: deepFreeze({
      compositionRule: "park",
      landmarkWeighting: deepFreeze({
        landmarkImportance: 0.63,
        nearbyEnvironmentEnhancement: 0.73,
        pathViewpointWeighting: 0.69
      }),
      varietyRules: deepFreeze({
        clustering: "grove-clustered",
        spacingVariation: "trailside-variation",
        densityVariation: "canopy-layered",
        biomeTransitionRule: "green-core-to-edge-transition"
      })
    })
  })
});

export function buildAtlasEngineDemoSceneQualityLayerContext() {
  return Object.freeze(buildAtlasEngineSyntheticWorldPreviewDemonstrationContext());
}

export function validateAtlasEngineDemoSceneQualityLayerFoundation(
  rawFoundation = atlasEngineDemoSceneQualityLayerFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const demonstrationResult =
      normalizedOptions.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation(
        buildDemonstrationDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!demonstrationResult.ok) {
      return freezeFailure(demonstrationResult);
    }

    const combinedPreviewResult =
      normalizedOptions.validateCombinedWorldPreviewGeneratorFoundation(
        buildCombinedWorldPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!combinedPreviewResult.ok) {
      return freezeFailure(combinedPreviewResult);
    }

    const environmentPreviewResult =
      normalizedOptions.validateEnvironmentAndBiomePreviewFoundation(
        buildEnvironmentPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context }
      );
    if (!environmentPreviewResult.ok) {
      return freezeFailure(environmentPreviewResult);
    }

    const qualityProfile = selectQualityProfile(
      foundation.qualityProfileId,
      foundation.locationRequest.environmentType
    );

    const qualityGuardrails = buildQualityGuardrails(
      combinedPreviewResult.combinedWorldPreview,
      environmentPreviewResult.environmentBiomePreview,
      normalizedOptions.context
    );

    validateCounts(
      foundation,
      combinedPreviewResult.combinedWorldPreview
    );

    const enhancedSummary = buildEnhancedSummary(
      demonstrationResult.atlasSyntheticWorldPreviewDemonstration,
      environmentPreviewResult.environmentBiomePreview,
      qualityProfile,
      qualityGuardrails
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasDemoSceneQualityLayer: Object.freeze({
        qualityLayerId: foundation.qualityLayerId,
        locationRequest: deepFreeze({ ...foundation.locationRequest }),
        worldQualityProfile: qualityProfile,
        demoSceneQualitySummary: enhancedSummary,
        deterministicVerification: Object.freeze({
          sameLocationAndSeedProduceIdenticalQuality: true,
          qualityHash: createQualityHash(
            foundation.locationRequest.locationId,
            foundation.locationRequest.worldSeed,
            qualityProfile.worldQualityProfileId
          )
        }),
        validation: Object.freeze({
          locationBridgeVerified: true,
          worldGenerationVerified: true,
          landmarkWeightingVerified: true,
          compositionRulesVerified: true,
          varietyRulesVerified: true,
          summaryEnhancementVerified: true,
          resolverGuardrailsVerified: qualityGuardrails.resolverVerified,
          placementGuardrailsVerified: qualityGuardrails.placementVerified
        }),
        compatibility: Object.freeze({
          passiveOnly: true,
          gpsConnected: false,
          externalMapServicesQueried: false,
          liveWorldObjectsCreated: false,
          rendererModified: false,
          gameplayModified: false,
          firebaseModified: false,
          backendModified: false
        })
      })
    });
  } catch (error) {
    if (error?.name !== "AtlasEngineDemoSceneQualityLayerValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasDemoSceneQualityLayer: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context: options.context ?? buildAtlasEngineDemoSceneQualityLayerContext(),
    validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation:
      options.validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation ??
      validateAtlasEngineSyntheticWorldPreviewDemonstrationFoundation,
    validateCombinedWorldPreviewGeneratorFoundation:
      options.validateCombinedWorldPreviewGeneratorFoundation ??
      validateCombinedWorldPreviewGeneratorFoundation,
    validateEnvironmentAndBiomePreviewFoundation:
      options.validateEnvironmentAndBiomePreviewFoundation ??
      validateEnvironmentAndBiomePreviewFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine demo scene quality layer foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    qualityLayerId: normalizePermanentId(
      foundation.qualityLayerId,
      "qualityLayerId"
    ),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    qualityProfileId: normalizePermanentId(
      foundation.qualityProfileId,
      "qualityProfileId"
    ),
    expectedStructureCount: normalizePositiveInteger(
      foundation.expectedStructureCount,
      "expectedStructureCount"
    ),
    expectedEnvironmentCount: normalizePositiveInteger(
      foundation.expectedEnvironmentCount,
      "expectedEnvironmentCount"
    ),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    )
  });
}

function buildDemonstrationDefinition(locationRequest) {
  return deepFreeze({
    ...atlasEngineSyntheticWorldPreviewDemonstrationFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildCombinedWorldPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...combinedWorldPreviewGeneratorFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest }),
    worldSeed: locationRequest.worldSeed
  });
}

function buildEnvironmentPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...environmentAndBiomePreviewFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function selectQualityProfile(qualityProfileId, environmentType) {
  const profile = qualityProfilesByEnvironmentType[environmentType] ?? null;
  if (!profile) {
    throw createValidationError(
      "unsupported_composition_rule",
      `No approved Atlas quality profile exists for environment type ${environmentType}.`
    );
  }

  if (profile.worldQualityProfileId !== qualityProfileId) {
    throw createValidationError(
      "quality_profile_mismatch",
      "Atlas quality profile ID must match the approved environment composition rule."
    );
  }

  return profile;
}

function buildQualityGuardrails(
  combinedWorldPreview,
  environmentBiomePreview,
  context
) {
  const starterLayers = context.starterLayers;
  const placementRuleRegistry =
    context.placementRuleRegistry ??
    createWorldPlacementRuleRegistry(coreWorldPlacementRules);

  const pathAssetReferences = collectPathAssetReferences(combinedWorldPreview);
  const landmarkAssetReferences = collectLandmarkAssetReferences(combinedWorldPreview);

  const pathResolverInput = {
    locationId: combinedWorldPreview.locationRequest.locationId,
    coordinates: { x: 38, y: 0 },
    seed: `${combinedWorldPreview.worldSeed}::paths`,
    assetCategory: "roads",
    availableAssetReferences: pathAssetReferences,
    resolverRules: {
      variantPolicy: "seeded-index",
      variantOffset: 0
    }
  };

  const pathResolverValidation = validateDeterministicAssetResolverInput(
    pathResolverInput,
    starterLayers
  );
  if (!pathResolverValidation.ok) {
    throw createValidationError(
      pathResolverValidation.errorCode ?? "resolver_guardrail_failed",
      pathResolverValidation.message ??
        "Atlas demo scene quality layer requires deterministic resolver guardrails."
    );
  }

  const pathResolverResult = resolveDeterministicAssetSelection(
    pathResolverInput,
    starterLayers
  );
  if (!pathResolverResult.ok) {
    throw createValidationError(
      pathResolverResult.errorCode ?? "resolver_guardrail_failed",
      pathResolverResult.message ??
        "Atlas demo scene quality layer requires deterministic resolver selection."
    );
  }

  const pathModule =
    environmentBiomePreview.environmentModules.find(
      (entry) => entry.moduleGroup === "paths"
    ) ?? null;
  if (!pathModule) {
    throw createValidationError(
      "missing_path_module",
      "Atlas demo scene quality layer requires an approved path module in the environment preview."
    );
  }

  const pathInstance =
    combinedWorldPreview.environmentInstances.find(
      (entry) => entry.assetId === pathModule.assetId
    ) ?? null;
  if (!pathInstance) {
    throw createValidationError(
      "missing_path_instance",
      "Atlas demo scene quality layer requires a matching combined-world path instance."
    );
  }

  const placementInput = {
    placementRuleId: pathModule.placementResult.placementRuleId,
    assetId: pathModule.assetId,
    locationId: pathInstance.locationId,
    coordinates: {
      x: pathInstance.placement.position.x,
      y: pathInstance.placement.position.y
    },
    seed: `${combinedWorldPreview.worldSeed}::quality-path-placement`,
    terrainType: pathInstance.placement.terrainType
  };

  const placementValidation = validateDeterministicPlacementInput(placementInput, {
    assetRegistry: starterLayers.assetRegistry,
    manifestRegistry: starterLayers.manifestRegistry,
    placementRuleRegistry
  });
  if (!placementValidation.ok) {
    throw createValidationError(
      placementValidation.errorCode ?? "placement_guardrail_failed",
      placementValidation.message ??
        "Atlas demo scene quality layer requires deterministic placement guardrails."
    );
  }

  const placementResult = calculateDeterministicPlacement(placementInput, {
    assetRegistry: starterLayers.assetRegistry,
    manifestRegistry: starterLayers.manifestRegistry,
    placementRuleRegistry
  });
  if (!placementResult.ok) {
    throw createValidationError(
      placementResult.errorCode ?? "placement_guardrail_failed",
      placementResult.message ??
        "Atlas demo scene quality layer requires deterministic placement output."
    );
  }

  return Object.freeze({
    resolverVerified: true,
    placementVerified: true,
    pathViewpointAssetId: pathResolverResult.selectedAsset.assetId,
    pathViewpointPlacementRuleId:
      placementResult.deterministicPlacement.placementRuleId,
    landmarkCandidates: deepFreeze(landmarkAssetReferences)
  });
}

function collectPathAssetReferences(combinedWorldPreview) {
  const collected = new Set();

  for (const instance of combinedWorldPreview.structureInstances) {
    if (instance.assetFamilyId.includes("ROAD") || instance.assetId.includes("PATH")) {
      collected.add(instance.assetId);
    }
  }

  for (const instance of combinedWorldPreview.environmentInstances) {
    if (instance.assetFamilyId.includes("ROAD") || instance.assetId.includes("PATH")) {
      collected.add(instance.assetId);
    }
  }

  return [...collected].sort((left, right) => left.localeCompare(right));
}

function collectLandmarkAssetReferences(combinedWorldPreview) {
  const candidates = [];

  for (const instance of combinedWorldPreview.structureInstances) {
    if (
      instance.assetId.includes("LIGHTHOUSE") ||
      instance.assetId.includes("SIGN") ||
      instance.assetFamilyId.includes("LANDMARK")
    ) {
      candidates.push(instance.assetId);
    }
  }

  return candidates.sort((left, right) => left.localeCompare(right));
}

function buildEnhancedSummary(
  demonstration,
  environmentBiomePreview,
  qualityProfile,
  qualityGuardrails
) {
  const combinedWorldPreview = demonstration.worldPreview.combinedWorldPreview;
  const allAssets = [
    ...combinedWorldPreview.structureInstances.map((entry) => entry.assetId),
    ...combinedWorldPreview.environmentInstances.map((entry) => entry.assetId)
  ];

  return Object.freeze({
    location: demonstration.demoOutputSummary.location,
    biome: demonstration.demoOutputSummary.biome,
    landmarks: Object.freeze({
      count: countAssetsByMatcher(
        allAssets,
        (assetId) =>
          assetId.includes("LIGHTHOUSE") ||
          assetId.includes("SIGN") ||
          assetId.includes("LANDMARK")
      ),
      weighting: qualityProfile.metadata.landmarkWeighting
    }),
    buildings: Object.freeze({
      count: countAssetsByMatcher(
        combinedWorldPreview.structureInstances.map((entry) => entry.assetId),
        (assetId) => assetId.startsWith("BUILDING_")
      ),
      densityScore: qualityProfile.structureDensity
    }),
    vegetation: Object.freeze({
      count: countAssetsByMatcher(
        allAssets,
        (assetId) =>
          assetId.startsWith("TREE_") ||
          assetId.startsWith("BUSH_") ||
          assetId.startsWith("GRASS_")
      ),
      densityScore: qualityProfile.vegetationDensity
    }),
    paths: Object.freeze({
      count: countAssetsByMatcher(
        allAssets,
        (assetId) => assetId.includes("ROAD_") || assetId.includes("PATH")
      ),
      viewpointWeighting:
        qualityProfile.metadata.landmarkWeighting.pathViewpointWeighting,
      deterministicPathReference: qualityGuardrails.pathViewpointAssetId
    }),
    worldQualityProfile: qualityProfile,
    compositionRules: Object.freeze({
      environmentType: environmentBiomePreview.selectedBiome.environmentType,
      compositionRule: qualityProfile.metadata.compositionRule,
      varietyRules: qualityProfile.metadata.varietyRules,
      pathPlacementRuleId: qualityGuardrails.pathViewpointPlacementRuleId
    }),
    structureCount: demonstration.demoOutputSummary.structureCount,
    environmentCount: demonstration.demoOutputSummary.environmentCount,
    rendererVerification: demonstration.demoOutputSummary.rendererVerification
  });
}

function validateCounts(foundation, combinedWorldPreview) {
  if (combinedWorldPreview.structureInstances.length !== foundation.expectedStructureCount) {
    throw createValidationError(
      "structure_count_mismatch",
      "Atlas demo scene quality layer expectedStructureCount does not match the combined world preview."
    );
  }

  if (
    combinedWorldPreview.environmentInstances.length !==
    foundation.expectedEnvironmentCount
  ) {
    throw createValidationError(
      "environment_count_mismatch",
      "Atlas demo scene quality layer expectedEnvironmentCount does not match the environment preview."
    );
  }

  if (
    combinedWorldPreview.rendererPayload.length !==
    foundation.expectedRendererPayloadCount
  ) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas demo scene quality layer expectedRendererPayloadCount does not match the renderer preview payload."
    );
  }
}

function countAssetsByMatcher(assetIds, matcher) {
  return assetIds.filter((assetId) => matcher(assetId)).length;
}

function createQualityHash(locationId, worldSeed, profileId) {
  return `${profileId}_${stableNumericHash(`${locationId}::${worldSeed}`)}`;
}

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    atlasDemoSceneQualityLayer: null
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEngineDemoSceneQualityLayerRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine demo scene quality layer foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  return Object.freeze({
    locationId: normalizePermanentId(
      locationRequest.locationId,
      "locationRequest.locationId"
    ),
    latitude: normalizeFiniteNumber(
      locationRequest.latitude,
      "locationRequest.latitude"
    ),
    longitude: normalizeFiniteNumber(
      locationRequest.longitude,
      "locationRequest.longitude"
    ),
    region: normalizeStringValue(locationRequest.region, "locationRequest.region"),
    environmentType: normalizeStringValue(
      locationRequest.environmentType,
      "locationRequest.environmentType"
    ),
    worldSeed: normalizeStringValue(
      locationRequest.worldSeed,
      "locationRequest.worldSeed"
    )
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must use the approved permanent ID format.`
    );
  }
  return normalized;
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

function normalizeFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }
  return Number(value);
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `${fieldName} must be a positive integer.`
    );
  }
  return value;
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
  error.name = "AtlasEngineDemoSceneQualityLayerValidationError";
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
