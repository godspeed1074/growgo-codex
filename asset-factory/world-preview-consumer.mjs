import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "WORLD_LAYOUT_001_PREVIEW_001";
const SCENE_ID = "WORLD_LAYOUT_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "WORLD_LAYOUT_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "WORLD_LAYOUT_001_PREVIEW_CONSUMER_001";
const CAPTURE_RECORD_ID = "WORLD_INSPECTION_CAPTURE_RECORD_001";
const CAPTURE_RECORD_FILENAME = `${CAPTURE_RECORD_ID}.json`;
const PREVIEW_VERSION = "SESSION_84_WORLD_PREVIEW_CONSUMER_PASS";
const PREVIEW_CONSUMER_VERSION = "SESSION_84_WORLD_VISUAL_PREVIEW_CONSUMER";
const GENERATOR_VERSION = "SESSION_83_DETERMINISTIC_WORLD_GENERATOR";
const VALIDATION_VERSION = "WORLD_PREVIEW_VALIDATION_001";

export const worldPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/WORLD_LAYOUT_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_world_layout_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/WORLD_LAYOUT_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "TOP_DOWN_WORLD_INSPECTION",
      viewType: "top_down_world",
      angleDegrees: 90
    }),
    angledWorld25D: deepFreeze({
      cameraId: "ANGLED_WORLD_2_5D_INSPECTION",
      viewType: "angled_25d_world",
      angleDegrees: 56
    }),
    regionNetworkOverview: deepFreeze({
      cameraId: "REGION_NETWORK_OVERVIEW_INSPECTION",
      viewType: "region_network_overview",
      angleDegrees: 40
    })
  }),
  geographyPresentation: deepFreeze({
    OCEAN: deepFreeze({ displayColour: "OCEAN_BLUE", markerType: "ocean_zone" }),
    COASTLINE: deepFreeze({
      displayColour: "COASTLINE_CYAN",
      markerType: "coastline_zone"
    }),
    FOREST: deepFreeze({ displayColour: "FOREST_GREEN", markerType: "forest_zone" }),
    FARMLAND: deepFreeze({
      displayColour: "FARMLAND_GOLD",
      markerType: "farmland_zone"
    }),
    RIVER: deepFreeze({ displayColour: "RIVER_BLUE", markerType: "river_zone" }),
    WETLAND: deepFreeze({
      displayColour: "WETLAND_TEAL",
      markerType: "wetland_zone"
    }),
    MOUNTAINS: deepFreeze({
      displayColour: "MOUNTAIN_GREY",
      markerType: "mountain_zone"
    }),
    PROTECTED_AREA: deepFreeze({
      displayColour: "PROTECTED_GREEN",
      markerType: "protected_area_zone"
    })
  }),
  regionPresentation: deepFreeze({
    COASTAL_REGION: deepFreeze({
      displayColour: "REGION_COASTAL_BLUE",
      markerType: "coastal_region"
    }),
    RURAL_REGION: deepFreeze({
      displayColour: "REGION_RURAL_GOLD",
      markerType: "rural_region"
    }),
    MOUNTAIN_REGION: deepFreeze({
      displayColour: "REGION_MOUNTAIN_GREY",
      markerType: "mountain_region"
    }),
    TOURISM_REGION: deepFreeze({
      displayColour: "REGION_TOURISM_CORAL",
      markerType: "tourism_region"
    }),
    METROPOLITAN_EDGE_REGION: deepFreeze({
      displayColour: "REGION_METRO_RED",
      markerType: "metropolitan_edge_region"
    })
  }),
  connectionPresentation: deepFreeze({
    HIGHWAY: deepFreeze({ lineWeight: "HEAVY", markerType: "highway_connection" }),
    RAILWAY: deepFreeze({
      lineWeight: "MEDIUM_DASHED",
      markerType: "railway_connection"
    }),
    COASTAL_ROUTE: deepFreeze({
      lineWeight: "MEDIUM_SCENIC",
      markerType: "coastal_connection"
    }),
    FERRY_ROUTE: deepFreeze({
      lineWeight: "MEDIUM_WATER",
      markerType: "ferry_connection"
    }),
    TRAIL: deepFreeze({ lineWeight: "LIGHT", markerType: "trail_connection" })
  }),
  landmarkPresentation: deepFreeze({
    NATURAL_WONDER: deepFreeze({ markerType: "natural_wonder_landmark" }),
    HISTORICAL_SITE: deepFreeze({ markerType: "historical_site_landmark" }),
    RARE_DISCOVERY: deepFreeze({ markerType: "rare_discovery_landmark" }),
    ICONIC_LOCATION: deepFreeze({ markerType: "iconic_location_landmark" })
  }),
  explorationRoutePresentation: deepFreeze({
    COASTAL_GRAND_TOUR: deepFreeze({
      displayColour: "ROUTE_BLUE",
      lineStyle: "SCENIC"
    }),
    INLAND_HERITAGE_ROUTE: deepFreeze({
      displayColour: "ROUTE_GOLD",
      lineStyle: "HERITAGE"
    }),
    MOUNTAIN_DISCOVERY_ROUTE: deepFreeze({
      displayColour: "ROUTE_GREY",
      lineStyle: "DISCOVERY"
    }),
    INTER_REGION_CONNECTOR: deepFreeze({
      displayColour: "ROUTE_ORANGE",
      lineStyle: "CONNECTOR"
    }),
    PROTECTED_AREA_TRAIL: deepFreeze({
      displayColour: "ROUTE_GREEN",
      lineStyle: "TRAIL"
    }),
    FERRY_EXPLORATION_LOOP: deepFreeze({
      displayColour: "ROUTE_CYAN",
      lineStyle: "FERRY"
    })
  })
});

export function createWorldPreviewConsumer(
  rawDefinition = worldPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildWorldPreviewBlenderCommand(
  rawDefinition = worldPreviewConsumerDefinition
) {
  const definition = normalizeDefinition(rawDefinition);
  return [
    "blender",
    "--python",
    definition.blenderScriptPath,
    "--",
    "--source-json",
    definition.sourcePreviewPath,
    "--output-dir",
    definition.outputDirectory
  ].join(" ");
}

export function createWorldPreviewSceneMetadata(
  rawDefinition = worldPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const capturePositions = buildCapturePositions(preview);
  const traceability = buildTraceabilityBundle(definition, preview);

  return freeze({
    sceneId: definition.previewSceneId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sourcePreviewPath: definition.sourcePreviewPath,
    previewType: "procedural_world_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "WORLD_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 56,
      framing: "world_overview",
      paddingMeters: 640
    }),
    traceability,
    visualCaptureWorkflow: freeze({
      previewVersion: PREVIEW_VERSION,
      worldSeed: preview.seedConfig.worldSeed,
      worldProfile: preview.worldProfile.profileId,
      previewVersionSeedSignature:
        preview.validationResult.deterministicSignatureHash,
      validationResult: preview.validationResult.validationPassed ? "PASS" : "FAIL",
      inspectionStatus: "READY_FOR_WORLD_INSPECTION",
      generatorVersion: GENERATOR_VERSION,
      previewConsumerVersion: PREVIEW_CONSUMER_VERSION,
      validationVersion: VALIDATION_VERSION,
      topDown: freeze({
        ...definition.previewCaptureProfiles.topDown,
        position: capturePositions.topDown.position,
        rotation: capturePositions.topDown.rotation
      }),
      angledWorld25D: freeze({
        ...definition.previewCaptureProfiles.angledWorld25D,
        position: capturePositions.angledWorld25D.position,
        rotation: capturePositions.angledWorld25D.rotation
      }),
      regionNetworkOverview: freeze({
        ...definition.previewCaptureProfiles.regionNetworkOverview,
        position: capturePositions.regionNetworkOverview.position,
        rotation: capturePositions.regionNetworkOverview.rotation
      })
    }),
    worldLayer: freeze({
      worldId: preview.worldId,
      worldBoundaryVisible: true,
      worldBounds: preview.worldBounds,
      boundaryStyle: preview.worldBounds.boundaryStyle,
      profileIdentity: preview.worldProfile.profileId,
      geographyZoneCount: preview.worldGeographyZones.length,
      regionCount: preview.regionInstances.length,
      connectionCount: preview.worldConnections.length,
      landmarkReserveCount: preview.worldLandmarkReserves.length,
      explorationRouteCount: preview.worldExplorationRoutes.length,
      streamingChunkCount: preview.streamingChunks.length
    }),
    geographyLayer: freeze({
      zoneCount: preview.worldGeographyZones.length,
      showOceans: true,
      showCoastlines: true,
      showForests: true,
      showFarmland: true,
      showMountains: true,
      showRivers: true,
      showProtectedAreas: true,
      resolvedWorldGeographyZones: freeze(
        preview.worldGeographyZones.map((zone) =>
          freeze({
            zoneId: zone.zoneId,
            zoneType: zone.zoneType,
            boundary: zone.boundary,
            biome: zone.biome,
            climate: zone.climate,
            accessibility: zone.accessibility,
            influenceRules: zone.influenceRules,
            displayColour:
              definition.geographyPresentation[zone.zoneType]?.displayColour ??
              "GEOGRAPHY_DEFAULT",
            markerType:
              definition.geographyPresentation[zone.zoneType]?.markerType ??
              "geography_zone"
          })
        )
      )
    }),
    regionLayer: freeze({
      regionCount: preview.regionInstances.length,
      showRegionLabels: true,
      showNeighbourLinks: true,
      showProfileColours: true,
      placementMode: "reference_based_region_markers_only",
      resolvedRegionInstances: freeze(
        preview.regionInstances.map((region) =>
          freeze({
            regionId: region.regionId,
            profile: region.profile,
            position: region.position,
            size: region.size,
            biome: region.biome,
            climate: region.climate,
            neighbouringRegions: region.neighbouringRegions,
            transitionRules: region.transitionRules,
            displayColour:
              definition.regionPresentation[region.profile]?.displayColour ??
              "REGION_DEFAULT",
            markerType:
              definition.regionPresentation[region.profile]?.markerType ??
              "region_instance"
          })
        )
      )
    }),
    connectionLayer: freeze({
      corridorCount: preview.worldConnections.length,
      showHighways: true,
      showRailways: true,
      showCoastalRoutes: true,
      showFerries: true,
      showTrails: true,
      readabilityEnhancements: freeze({
        hierarchyLineWeighting: true,
        scenicRouteEmphasis: true,
        regionLinkMarkers: true
      }),
      resolvedWorldConnections: freeze(
        preview.worldConnections.map((corridor) =>
          freeze({
            corridorId: corridor.corridorId,
            startRegion: corridor.startRegion,
            endRegion: corridor.endRegion,
            connectionType: corridor.connectionType,
            hierarchy: corridor.hierarchy,
            distance: corridor.distance,
            difficulty: corridor.difficulty,
            explorationValue: corridor.explorationValue,
            terrainInfluence: corridor.terrainInfluence,
            markerType:
              definition.connectionPresentation[corridor.connectionType]?.markerType ??
              "world_connection",
            lineWeight:
              definition.connectionPresentation[corridor.connectionType]?.lineWeight ??
              "MEDIUM"
          })
        )
      )
    }),
    landmarkLayer: freeze({
      landmarkReserveCount: preview.worldLandmarkReserves.length,
      showLandmarkMarkers: true,
      showRarityLabels: true,
      showExplorationValue: true,
      resolvedWorldLandmarkReserves: freeze(
        preview.worldLandmarkReserves.map((landmark) =>
          freeze({
            landmarkId: landmark.landmarkId,
            landmarkType: landmark.landmarkType,
            location: landmark.location,
            rarity: landmark.rarity,
            regionRelationship: landmark.regionRelationship,
            discoveryValue: landmark.discoveryValue,
            markerType:
              definition.landmarkPresentation[landmark.landmarkType]?.markerType ??
              "world_landmark"
          })
        )
      )
    }),
    explorationLayer: freeze({
      routeCount: preview.worldExplorationRoutes.length,
      showRegionalJourneys: true,
      showLandmarkRoutes: true,
      showTravelCorridors: true,
      resolvedWorldExplorationRoutes: freeze(
        preview.worldExplorationRoutes.map((route) =>
          freeze({
            routeId: route.routeId,
            routeType: route.routeType,
            startAnchor: route.startAnchor,
            endAnchor: route.endAnchor,
            distance: route.distance,
            difficulty: route.difficulty,
            rewardPotential: route.rewardPotential,
            displayColour:
              definition.explorationRoutePresentation[route.routeType]
                ?.displayColour ?? "ROUTE_DEFAULT",
            lineStyle:
              definition.explorationRoutePresentation[route.routeType]?.lineStyle ??
              "STANDARD"
          })
        )
      )
    }),
    streamingLayer: freeze({
      chunkCount: preview.streamingChunks.length,
      showChunkBoundaries: true,
      showOwnershipZones: true,
      showLoadingPriority: true,
      resolvedStreamingChunks: freeze(
        preview.streamingChunks.map((chunk) =>
          freeze({
            chunkId: chunk.chunkId,
            regionOwnership: chunk.regionOwnership,
            boundary: chunk.boundary,
            loadingPriority: chunk.loadingPriority,
            cacheRules: chunk.cacheRules,
            neighbourRelationships: chunk.neighbourRelationships,
            instanceReferencesOnly: chunk.instanceReferencesOnly
          })
        )
      )
    }),
    debugLayer: freeze({
      showWorldBoundaryMarkers: true,
      showRegionLabels: true,
      showGeographyLabels: true,
      showCorridorMarkers: true,
      showLandmarkMarkers: true,
      showChunkLabels: true,
      showValidationIndicators: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "reference_based_preview_only",
      duplicateGeometryGenerationAllowed: false,
      streamingReadyStructure: true,
      noDuplicateGeometryGeneration: true,
      futureAtlasEngineCompatibility: "world_preview_reference_ready",
      expectedRegionReferences: preview.regionInstances.length,
      expectedConnectionReferences: preview.worldConnections.length,
      expectedStreamingChunks: preview.streamingChunks.length
    })
  });
}

export function createWorldInspectionCaptureRecord(
  rawDefinition = worldPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const metadata = createWorldPreviewSceneMetadata(definition, options);
  const traceability = buildTraceabilityBundle(definition, preview);

  return freeze({
    captureRecordId: CAPTURE_RECORD_ID,
    sceneId: definition.previewSceneId,
    sourcePreviewId: definition.sourcePreviewId,
    worldId: preview.worldId,
    worldSeed: preview.seedConfig.worldSeed,
    worldProfile: preview.worldProfile.profileId,
    previewVersion: PREVIEW_VERSION,
    captureStatus: "METADATA_ONLY_PENDING_VIEWPORT_CAPTURE",
    validationStatus: preview.validationResult.validationPassed ? "PASS" : "FAIL",
    cameraProfiles: freeze([
      metadata.visualCaptureWorkflow.topDown,
      metadata.visualCaptureWorkflow.angledWorld25D,
      metadata.visualCaptureWorkflow.regionNetworkOverview
    ]),
    traceability
  });
}

export function createWorldPreviewValidationReport(
  rawDefinition = worldPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const metadata = createWorldPreviewSceneMetadata(definition, options);
  const captureRecord = createWorldInspectionCaptureRecord(definition, options);

  const boundaryValid =
    Number.isFinite(preview.worldBounds.minX) &&
    Number.isFinite(preview.worldBounds.maxX) &&
    preview.worldBounds.maxX > preview.worldBounds.minX &&
    preview.worldBounds.maxY > preview.worldBounds.minY &&
    Array.isArray(preview.worldBounds.boundaryPolygon) &&
    preview.worldBounds.boundaryPolygon.length >= 4;
  const geographyValid = preview.validationResult.geographyValid === true;
  const regionsValid = preview.validationResult.regionsValid === true;
  const corridorsConnected =
    preview.validationResult.corridorsConnected === true;
  const travelRoutesValid = preview.validationResult.routesReachable === true;
  const landmarkPlacementValid =
    preview.validationResult.landmarksAccessible === true;
  const chunksValid = preview.validationResult.chunksValid === true;
  const ownershipValid = preview.streamingChunks.every(
    (chunk) =>
      Array.isArray(chunk.regionOwnership) && chunk.regionOwnership.length > 0
  );
  const deterministicSourceMatches =
    stableStringify(preview) ===
    stableStringify(
      readJson(path.resolve(options.cwd ?? process.cwd(), definition.sourcePreviewPath))
    );
  const referenceBasedPlacement =
    preview.validationResult.referenceBasedStructure === true;
  const streamingReadyStructure =
    preview.validationResult.streamingReady === true;
  const noDuplicateGeometryGeneration =
    preview.validationResult.noDuplicateGeometryGeneration === true;
  const cameraProfileValid = validateCaptureProfiles(definition.previewCaptureProfiles);
  const metadataVersionMatchesPreviewState =
    metadata.visualCaptureWorkflow.previewVersion === PREVIEW_VERSION &&
    metadata.traceability.generatorVersion === GENERATOR_VERSION &&
    metadata.traceability.previewConsumerVersion === PREVIEW_CONSUMER_VERSION &&
    metadata.traceability.validationVersion === VALIDATION_VERSION;
  const inspectionRecordComplete =
    captureRecord.captureRecordId === CAPTURE_RECORD_ID &&
    captureRecord.previewVersion === PREVIEW_VERSION &&
    captureRecord.validationStatus === "PASS" &&
    Array.isArray(captureRecord.cameraProfiles) &&
    captureRecord.cameraProfiles.length === 3;
  const validationReferenceConsistent =
    metadata.sourcePreviewId === definition.sourcePreviewId &&
    captureRecord.sourcePreviewId === definition.sourcePreviewId &&
    metadata.traceability.sourcePreview.previewId === preview.previewId &&
    metadata.traceability.sourcePreview.deterministicSignatureHash ===
      preview.validationResult.deterministicSignatureHash;

  const checks = freeze({
    worldBoundaryValid: passFail(boundaryValid),
    geographyValid: passFail(geographyValid),
    regionsValid: passFail(regionsValid),
    corridorsConnected: passFail(corridorsConnected),
    travelRoutesValid: passFail(travelRoutesValid),
    landmarkPlacementValid: passFail(landmarkPlacementValid),
    chunksValid: passFail(chunksValid),
    ownershipValid: passFail(ownershipValid),
    deterministicSourceMatches: passFail(deterministicSourceMatches),
    referenceBasedPlacement: passFail(referenceBasedPlacement),
    streamingReadyStructure: passFail(streamingReadyStructure),
    noDuplicateGeometryGeneration: passFail(noDuplicateGeometryGeneration),
    cameraProfileValid: passFail(cameraProfileValid),
    metadataVersionMatchesPreviewState: passFail(
      metadataVersionMatchesPreviewState
    ),
    inspectionRecordComplete: passFail(inspectionRecordComplete),
    validationReferenceConsistent: passFail(validationReferenceConsistent)
  });

  return freeze({
    validationId: definition.validationId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sceneId: definition.previewSceneId,
    traceability: metadata.traceability,
    inspectionCaptureRecordId: CAPTURE_RECORD_ID,
    checks,
    summary: freeze({
      validationPassed: Object.values(checks).every((status) => status === "PASS"),
      worldProfileId: preview.worldProfile.profileId,
      geographyZoneCount: preview.worldGeographyZones.length,
      regionCount: preview.regionInstances.length,
      connectionCount: preview.worldConnections.length,
      landmarkReserveCount: preview.worldLandmarkReserves.length,
      explorationRouteCount: preview.worldExplorationRoutes.length,
      streamingChunkCount: preview.streamingChunks.length
    })
  });
}

export function writeWorldPreviewArtifacts(
  rawDefinition = worldPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createWorldPreviewSceneMetadata(definition, { cwd });
  const captureRecord = createWorldInspectionCaptureRecord(definition, { cwd });
  const validation = createWorldPreviewValidationReport(definition, { cwd });
  const manifest = freeze({
    consumerId: definition.consumerId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    captureRecordId: CAPTURE_RECORD_ID,
    sourcePreviewPath: definition.sourcePreviewPath,
    traceability: metadata.traceability,
    previewVersion: PREVIEW_VERSION,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildWorldPreviewBlenderCommand(definition),
    artifactPaths: freeze({
      metadataPath: "preview-scene-metadata.json",
      manifestPath: "preview-scene-manifest.json",
      validationPath: `${definition.validationId}.json`,
      captureRecordPath: CAPTURE_RECORD_FILENAME
    })
  });

  fs.writeFileSync(
    path.join(outputDirectory, "preview-scene-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(outputDirectory, "preview-scene-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(outputDirectory, `${definition.validationId}.json`),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(outputDirectory, CAPTURE_RECORD_FILENAME),
    `${JSON.stringify(captureRecord, null, 2)}\n`
  );

  return freeze({
    outputDirectory,
    metadataPath: path.join(outputDirectory, "preview-scene-metadata.json"),
    manifestPath: path.join(outputDirectory, "preview-scene-manifest.json"),
    validationPath: path.join(outputDirectory, `${definition.validationId}.json`),
    captureRecordPath: path.join(outputDirectory, CAPTURE_RECORD_FILENAME)
  });
}

function buildTraceabilityBundle(definition, preview) {
  return freeze({
    generatorVersion: GENERATOR_VERSION,
    previewConsumerVersion: PREVIEW_CONSUMER_VERSION,
    refinementVersion: PREVIEW_VERSION,
    validationVersion: VALIDATION_VERSION,
    sourcePreview: freeze({
      previewId: preview.previewId,
      schemaId: preview.schemaId,
      previewPath: definition.sourcePreviewPath,
      worldId: preview.worldId,
      deterministicSignatureHash:
        preview.validationResult.deterministicSignatureHash
    })
  });
}

function buildCapturePositions(preview) {
  const bounds = preview.worldBounds;
  const centreX = (bounds.minX + bounds.maxX) / 2;
  const centreY = (bounds.minY + bounds.maxY) / 2;
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const sceneSpan = Math.max(spanX, spanY);
  return freeze({
    topDown: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY),
        z: round(sceneSpan * 1.16)
      }),
      rotation: freeze({ x: 0, y: 0, z: 0 })
    }),
    angledWorld25D: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY - spanY * 0.7),
        z: round(sceneSpan * 0.92)
      }),
      rotation: freeze({ x: 56, y: 0, z: 0 })
    }),
    regionNetworkOverview: freeze({
      position: freeze({
        x: round(centreX + spanX * 0.14),
        y: round(centreY - spanY * 0.18),
        z: round(sceneSpan * 0.6)
      }),
      rotation: freeze({ x: 64, y: 0, z: 22 })
    })
  });
}

function validateCaptureProfiles(profiles) {
  return [
    profiles.topDown,
    profiles.angledWorld25D,
    profiles.regionNetworkOverview
  ].every(
    (profile) =>
      typeof profile.cameraId === "string" &&
      profile.cameraId.length > 0 &&
      typeof profile.viewType === "string" &&
      Number.isFinite(profile.angleDegrees)
  );
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "world preview consumer");
  return freeze({
    consumerId: normalizeNonEmptyString(definition.consumerId, "consumerId"),
    sourcePreviewId: normalizeNonEmptyString(
      definition.sourcePreviewId,
      "sourcePreviewId"
    ),
    sourcePreviewPath: normalizeRelativePath(
      definition.sourcePreviewPath,
      "sourcePreviewPath"
    ),
    blenderScriptPath: normalizeRelativePath(
      definition.blenderScriptPath,
      "blenderScriptPath"
    ),
    outputDirectory: normalizeRelativePath(
      definition.outputDirectory,
      "outputDirectory"
    ),
    previewSceneId: normalizeNonEmptyString(
      definition.previewSceneId,
      "previewSceneId"
    ),
    validationId: normalizeNonEmptyString(definition.validationId, "validationId"),
    previewCaptureProfiles: normalizeCaptureProfiles(definition.previewCaptureProfiles),
    geographyPresentation: freeze(definition.geographyPresentation ?? {}),
    regionPresentation: freeze(definition.regionPresentation ?? {}),
    connectionPresentation: freeze(definition.connectionPresentation ?? {}),
    landmarkPresentation: freeze(definition.landmarkPresentation ?? {}),
    explorationRoutePresentation: freeze(
      definition.explorationRoutePresentation ?? {}
    )
  });
}

function normalizeCaptureProfiles(rawProfiles) {
  const profiles = asPlainObject(rawProfiles, "previewCaptureProfiles");
  return freeze({
    topDown: normalizeCaptureProfile(profiles.topDown, "topDown"),
    angledWorld25D: normalizeCaptureProfile(
      profiles.angledWorld25D,
      "angledWorld25D"
    ),
    regionNetworkOverview: normalizeCaptureProfile(
      profiles.regionNetworkOverview,
      "regionNetworkOverview"
    )
  });
}

function normalizeCaptureProfile(rawProfile, label) {
  const profile = asPlainObject(rawProfile, label);
  return freeze({
    cameraId: normalizeNonEmptyString(profile.cameraId, `${label}.cameraId`),
    viewType: normalizeNonEmptyString(profile.viewType, `${label}.viewType`),
    angleDegrees: normalizeFiniteNumber(profile.angleDegrees, `${label}.angleDegrees`)
  });
}

function readSourcePreview(definition, cwd = process.cwd()) {
  return freeze(readJson(path.resolve(cwd, definition.sourcePreviewPath)));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeRelativePath(value, label) {
  const normalized = normalizeNonEmptyString(value, label);
  if (path.isAbsolute(normalized)) {
    throw new TypeError(`${label} must be a relative path.`);
  }
  return normalized;
}

function normalizeNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function stableStringify(value) {
  return JSON.stringify(orderKeys(value));
}

function orderKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => orderKeys(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = orderKeys(value[key]);
        return result;
      }, {});
  }
  return value;
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach((entry) => deepFreeze(entry));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => deepFreeze(entry));
  }
  return Object.freeze(value);
}

const freeze = deepFreeze;

if (import.meta.url === `file://${process.argv[1]}`) {
  writeWorldPreviewArtifacts();
}
