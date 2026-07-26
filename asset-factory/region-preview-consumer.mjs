import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "REGION_LAYOUT_001_PREVIEW_001";
const SCENE_ID = "REGION_LAYOUT_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "REGION_LAYOUT_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "REGION_LAYOUT_001_PREVIEW_CONSUMER_001";
const CAPTURE_RECORD_ID = "REGION_INSPECTION_CAPTURE_RECORD_001";
const CAPTURE_RECORD_FILENAME = `${CAPTURE_RECORD_ID}.json`;
const REFINEMENT_VERSION = "SESSION_78_TERRAIN_REFINEMENT_PASS";
const PREVIEW_CONSUMER_VERSION = "SESSION_80_REGION_EVIDENCE_CLOSEOUT";
const GENERATOR_VERSION = "SESSION_78_TERRAIN_REFINEMENT_PASS";
const VALIDATION_VERSION = "REGION_PREVIEW_VALIDATION_001";

export const regionPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_region_layout_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "TOP_DOWN_REGION_INSPECTION",
      viewType: "top_down_region",
      angleDegrees: 90
    }),
    angledRegion25D: deepFreeze({
      cameraId: "ANGLED_REGION_2_5D_INSPECTION",
      viewType: "angled_25d_region",
      angleDegrees: 58
    }),
    settlementNetworkOverview: deepFreeze({
      cameraId: "SETTLEMENT_NETWORK_OVERVIEW_INSPECTION",
      viewType: "settlement_network_overview",
      angleDegrees: 42
    })
  }),
  naturalZonePresentation: deepFreeze({
    COASTLINE: deepFreeze({
      displayColour: "COASTAL_BLUE",
      markerType: "coastline_zone"
    }),
    FOREST: deepFreeze({
      displayColour: "FOREST_GREEN",
      markerType: "forest_zone"
    }),
    FARMLAND: deepFreeze({
      displayColour: "FARMLAND_GOLD",
      markerType: "farmland_zone"
    }),
    RIVER: deepFreeze({
      displayColour: "RIVER_BLUE",
      markerType: "river_zone"
    }),
    WETLAND: deepFreeze({
      displayColour: "WETLAND_TEAL",
      markerType: "wetland_zone"
    }),
    PROTECTED_AREA: deepFreeze({
      displayColour: "PROTECTED_GREEN",
      markerType: "protected_area_zone"
    }),
    MOUNTAINS: deepFreeze({
      displayColour: "MOUNTAIN_GREY",
      markerType: "mountain_zone"
    })
  }),
  settlementPresentation: deepFreeze({
    MAJOR_TOWN: deepFreeze({
      displayColour: "SETTLEMENT_RED",
      markerType: "major_town"
    }),
    REGIONAL_TOWN: deepFreeze({
      displayColour: "SETTLEMENT_ORANGE",
      markerType: "regional_town"
    }),
    SMALL_COASTAL_TOWN: deepFreeze({
      displayColour: "SETTLEMENT_CYAN",
      markerType: "small_coastal_town"
    }),
    VILLAGE: deepFreeze({
      displayColour: "SETTLEMENT_GREEN",
      markerType: "village"
    }),
    HAMLET: deepFreeze({
      displayColour: "SETTLEMENT_YELLOW",
      markerType: "hamlet"
    })
  }),
  transportPresentation: deepFreeze({
    HIGHWAY: deepFreeze({ lineWeight: "HEAVY", markerType: "highway_corridor" }),
    MAJOR_ROAD: deepFreeze({ lineWeight: "MEDIUM", markerType: "major_road_corridor" }),
    LOCAL_ROAD: deepFreeze({ lineWeight: "LIGHT", markerType: "local_road_corridor" }),
    RAILWAY_CORRIDOR: deepFreeze({
      lineWeight: "MEDIUM_DASHED",
      markerType: "railway_placeholder"
    }),
    COASTAL_ROUTE: deepFreeze({
      lineWeight: "MEDIUM_SCENIC",
      markerType: "coastal_route"
    })
  }),
  landmarkPresentation: deepFreeze({
    WATERFALL: deepFreeze({ markerType: "waterfall_landmark" }),
    LIGHTHOUSE: deepFreeze({ markerType: "lighthouse_landmark" }),
    HISTORIC_SITE: deepFreeze({ markerType: "historic_landmark" }),
    NATIONAL_PARK: deepFreeze({ markerType: "national_park_landmark" }),
    LOOKOUT: deepFreeze({ markerType: "lookout_landmark" }),
    GEOLOGICAL_FEATURE: deepFreeze({ markerType: "geological_landmark" })
  }),
  explorationRoutePresentation: deepFreeze({
    COASTAL_SCENIC_ROUTE: deepFreeze({
      displayColour: "ROUTE_BLUE",
      lineStyle: "SCENIC"
    }),
    NATURE_DISCOVERY_ROUTE: deepFreeze({
      displayColour: "ROUTE_GREEN",
      lineStyle: "DISCOVERY"
    }),
    HERITAGE_ROUTE: deepFreeze({
      displayColour: "ROUTE_GOLD",
      lineStyle: "HERITAGE"
    }),
    TOWN_CONNECTOR_ROUTE: deepFreeze({
      displayColour: "ROUTE_ORANGE",
      lineStyle: "CONNECTOR"
    })
  })
});

export function createRegionPreviewConsumer(
  rawDefinition = regionPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildRegionPreviewBlenderCommand(
  rawDefinition = regionPreviewConsumerDefinition
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

export function createRegionPreviewSceneMetadata(
  rawDefinition = regionPreviewConsumerDefinition,
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
    previewType: "procedural_region_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "REGION_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 58,
      framing: "region_overview",
      paddingMeters: 320
    }),
    traceability,
    visualCaptureWorkflow: freeze({
      previewVersion: REFINEMENT_VERSION,
      regionSeed: preview.seedConfig.regionSeed,
      regionProfile: preview.regionProfile.profileId,
      previewVersionSeedSignature:
        preview.validationResult.deterministicSignatureHash,
      validationResult: preview.validationResult.validationPassed ? "PASS" : "FAIL",
      inspectionStatus: "READY_FOR_REGION_INSPECTION",
      generatorVersion: GENERATOR_VERSION,
      previewConsumerVersion: PREVIEW_CONSUMER_VERSION,
      validationVersion: VALIDATION_VERSION,
      topDown: freeze({
        ...definition.previewCaptureProfiles.topDown,
        position: capturePositions.topDown.position,
        rotation: capturePositions.topDown.rotation
      }),
      angledRegion25D: freeze({
        ...definition.previewCaptureProfiles.angledRegion25D,
        position: capturePositions.angledRegion25D.position,
        rotation: capturePositions.angledRegion25D.rotation
      }),
      settlementNetworkOverview: freeze({
        ...definition.previewCaptureProfiles.settlementNetworkOverview,
        position: capturePositions.settlementNetworkOverview.position,
        rotation: capturePositions.settlementNetworkOverview.rotation
      })
    }),
    regionLayer: freeze({
      regionId: preview.regionId,
      regionBoundaryVisible: true,
      regionBounds: preview.regionBounds,
      boundaryStyle: preview.regionBounds.boundaryStyle,
      profileIdentity: preview.regionProfile.profileId,
      settlementCount: preview.settlements.length,
      naturalZoneCount: preview.naturalZones.length,
      transportCorridorCount: preview.transportCorridors.length,
      landmarkReserveCount: preview.landmarkReserves.length,
      explorationRouteCount: preview.explorationRoutes.length
    }),
    naturalSystemLayer: freeze({
      zoneCount: preview.naturalZones.length,
      showCoastline: true,
      showForests: true,
      showFarmland: true,
      showWetlands: true,
      showProtectedAreas: true,
      resolvedNaturalZones: freeze(
        preview.naturalZones.map((zone) =>
          freeze({
            naturalZoneId: zone.naturalZoneId,
            zoneType: zone.zoneType,
            boundary: zone.boundary,
            biomeType: zone.biomeType,
            accessibility: zone.accessibility,
            explorationValue: zone.explorationValue,
            barrierSeverity: zone.barrierSeverity,
            preferredCrossingMode: zone.preferredCrossingMode,
            corridorGuidance: zone.corridorGuidance,
            displayColour:
              definition.naturalZonePresentation[zone.zoneType]?.displayColour ??
              "NATURAL_DEFAULT",
            markerType:
              definition.naturalZonePresentation[zone.zoneType]?.markerType ??
              "natural_zone"
          })
        )
      )
    }),
    settlementLayer: freeze({
      settlementCount: preview.settlements.length,
      showSettlementLabels: true,
      showHierarchyMarkers: true,
      showRelationshipLinks: true,
      placementMode: "reference_based_settlement_markers_only",
      resolvedSettlements: freeze(
        preview.settlements.map((settlement) =>
          freeze({
            settlementId: settlement.settlementId,
            settlementType: settlement.settlementType,
            position: settlement.position,
            sizeProfile: settlement.sizeProfile,
            townProfile: settlement.townProfile,
            populationScale: settlement.populationScale,
            terrainRelationship: settlement.terrainRelationship,
            transportRelationship: settlement.transportRelationship,
            connectionPriority: settlement.connectionPriority,
            connectionExpectation: settlement.connectionExpectation,
            landmarkAccessRole: settlement.landmarkAccessRole,
            linkedSettlements: settlement.linkedSettlements,
            streamingCellId: settlement.streamingCellId,
            displayColour:
              definition.settlementPresentation[settlement.settlementType]
                ?.displayColour ?? "SETTLEMENT_DEFAULT",
            markerType:
              definition.settlementPresentation[settlement.settlementType]
                ?.markerType ?? "settlement"
          })
        )
      )
    }),
    transportLayer: freeze({
      corridorCount: preview.transportCorridors.length,
      showHighways: true,
      showMajorRoads: true,
      showLocalRoads: true,
      showRailwayPlaceholders: true,
      showCoastalRoutes: true,
      readabilityEnhancements: freeze({
        hierarchyLineWeighting: true,
        settlementLinkMarkers: true,
        scenicRouteEmphasis: true
      }),
      resolvedTransportCorridors: freeze(
        preview.transportCorridors.map((corridor) =>
          freeze({
            corridorId: corridor.corridorId,
            transportType: corridor.transportType,
            hierarchy: corridor.hierarchy,
            startLocation: corridor.startLocation,
            endLocation: corridor.endLocation,
            path: corridor.path,
            connectedSettlements: corridor.connectedSettlements,
            routeLength: corridor.routeLength,
            routeMode: corridor.routeMode,
            corridorReasoning: corridor.corridorReasoning,
            terrainInfluences: corridor.terrainInfluences,
            geographicPurpose: corridor.geographicPurpose,
            markerType:
              definition.transportPresentation[corridor.transportType]?.markerType ??
              "transport_corridor",
            lineWeight:
              definition.transportPresentation[corridor.transportType]?.lineWeight ??
              "MEDIUM"
          })
        )
      )
    }),
    landmarkLayer: freeze({
      landmarkReserveCount: preview.landmarkReserves.length,
      showLandmarkMarkers: true,
      showExplorationTargets: true,
      showAttractionLabels: true,
      resolvedLandmarkReserves: freeze(
        preview.landmarkReserves.map((reserve) =>
          freeze({
            landmarkReserveId: reserve.landmarkReserveId,
            landmarkType: reserve.landmarkType,
            position: reserve.position,
            accessibility: reserve.accessibility,
            questCompatibility: reserve.questCompatibility,
            naturalRelationship: reserve.naturalRelationship,
            settlementRelationship: reserve.settlementRelationship,
            visibilityProfile: reserve.visibilityProfile,
            markerType:
              definition.landmarkPresentation[reserve.landmarkType]?.markerType ??
              "landmark_placeholder"
          })
        )
      )
    }),
    explorationLayer: freeze({
      routeCount: preview.explorationRoutes.length,
      showSettlementLinks: true,
      showLandmarkLinks: true,
      showDiscoveryCorridors: true,
      resolvedExplorationRoutes: freeze(
        preview.explorationRoutes.map((route) =>
          freeze({
            routeId: route.routeId,
            routeType: route.routeType,
            startAnchor: route.startAnchor,
            endAnchor: route.endAnchor,
            distance: route.distance,
            difficulty: route.difficulty,
            discoveryValue: route.discoveryValue,
            connectedPointsOfInterest: route.connectedPointsOfInterest,
            travelModeCompatibility: route.travelModeCompatibility,
            landmarkRelationships: route.landmarkRelationships,
            geographicRelationship: route.geographicRelationship,
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
    debugLayer: freeze({
      showRegionBoundaryMarkers: true,
      showSettlementLabels: true,
      showRoadHierarchyMarkers: true,
      showNaturalZoneLabels: true,
      showLandmarkMarkers: true,
      showValidationIndicators: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "reference_based_preview_only",
      duplicateGeometryGenerationAllowed: false,
      settlementMarkersOnly: true,
      streamingReadyStructure: true,
      noDuplicateGeometryGeneration: true,
      futureAtlasEngineCompatibility: "region_preview_reference_ready",
      expectedSettlementReferences: preview.settlements.length,
      expectedTransportCorridors: preview.transportCorridors.length
    })
  });
}

export function createRegionInspectionCaptureRecord(
  rawDefinition = regionPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const metadata = createRegionPreviewSceneMetadata(definition, options);
  const traceability = buildTraceabilityBundle(definition, preview);

  return freeze({
    captureRecordId: CAPTURE_RECORD_ID,
    sceneId: definition.previewSceneId,
    sourcePreviewId: definition.sourcePreviewId,
    regionId: preview.regionId,
    regionSeed: preview.seedConfig.regionSeed,
    regionProfile: preview.regionProfile.profileId,
    previewVersion: REFINEMENT_VERSION,
    captureStatus: "METADATA_ONLY_PENDING_VIEWPORT_CAPTURE",
    validationStatus: preview.validationResult.validationPassed ? "PASS" : "FAIL",
    cameraProfiles: freeze([
      metadata.visualCaptureWorkflow.topDown,
      metadata.visualCaptureWorkflow.angledRegion25D,
      metadata.visualCaptureWorkflow.settlementNetworkOverview
    ]),
    traceability
  });
}

export function createRegionPreviewValidationReport(
  rawDefinition = regionPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const metadata = createRegionPreviewSceneMetadata(definition, options);
  const captureRecord = createRegionInspectionCaptureRecord(definition, options);

  const boundaryValid =
    Number.isFinite(preview.regionBounds.minX) &&
    Number.isFinite(preview.regionBounds.maxX) &&
    preview.regionBounds.maxX > preview.regionBounds.minX &&
    preview.regionBounds.maxY > preview.regionBounds.minY &&
    Array.isArray(preview.regionBounds.boundaryPolygon) &&
    preview.regionBounds.boundaryPolygon.length >= 4;
  const naturalZonesValid = preview.validationResult.naturalZonesValid === true;
  const settlementsValid = preview.validationResult.settlementsValid === true;
  const corridorsConnected = preview.validationResult.corridorsConnected === true;
  const terrainAwareCorridorValidity =
    preview.validationResult.terrainAwareCorridorValidity === true;
  const scenicRouteValidity = preview.validationResult.scenicRouteValidity === true;
  const settlementConnectivity =
    preview.validationResult.settlementConnectivity === true;
  const naturalBarrierCompliance =
    preview.validationResult.naturalBarrierCompliance === true;
  const settlementsLinked =
    preview.validationResult.transportConnected === true &&
    preview.transportCorridors.every(
      (corridor) => corridor.connectedSettlements.length >= 2
    );
  const landmarksAccessible = preview.validationResult.landmarksAccessible === true;
  const routeCompatible = preview.landmarkReserves.every((reserve) =>
    preview.explorationRoutes.some(
      (route) =>
        route.startAnchor === reserve.landmarkReserveId ||
        route.endAnchor === reserve.landmarkReserveId ||
        route.connectedPointsOfInterest.includes(reserve.landmarkReserveId) ||
        route.connectedPointsOfInterest.includes(reserve.settlementRelationship) ||
        route.connectedPointsOfInterest.includes(reserve.naturalRelationship)
    )
  );
  const explorationRoutesValid = preview.validationResult.explorationRoutesValid === true;
  const explorationRouteQuality =
    preview.validationResult.explorationRouteQuality === true;
  const deterministicSourceMatches =
    stableStringify(preview) ===
    stableStringify(readJson(path.resolve(options.cwd ?? process.cwd(), definition.sourcePreviewPath)));
  const referenceBasedPlacement =
    preview.validationResult.instanceReferencesOnly === true;
  const streamingReadyStructure =
    preview.validationResult.streamingReadyStructure === true;
  const noDuplicateGeometryGeneration =
    preview.validationResult.instanceReferencesOnly === true;
  const cameraProfileValid = validateCaptureProfiles(definition.previewCaptureProfiles);
  const metadataVersionMatchesRefinementState =
    metadata.visualCaptureWorkflow.previewVersion === REFINEMENT_VERSION &&
    metadata.traceability.refinementVersion === REFINEMENT_VERSION &&
    metadata.traceability.generatorVersion === GENERATOR_VERSION &&
    metadata.traceability.previewConsumerVersion === PREVIEW_CONSUMER_VERSION &&
    metadata.traceability.validationVersion === VALIDATION_VERSION;
  const inspectionRecordComplete =
    captureRecord.captureRecordId === CAPTURE_RECORD_ID &&
    captureRecord.previewVersion === REFINEMENT_VERSION &&
    captureRecord.validationStatus === "PASS" &&
    Array.isArray(captureRecord.cameraProfiles) &&
    captureRecord.cameraProfiles.length === 3;
  const cameraProfileComplete = captureRecord.cameraProfiles.every(
    (profile) =>
      typeof profile.cameraId === "string" &&
      typeof profile.viewType === "string" &&
      Number.isFinite(profile.angleDegrees) &&
      profile.position &&
      profile.rotation
  );
  const validationReferenceConsistent =
    metadata.sourcePreviewId === definition.sourcePreviewId &&
    captureRecord.sourcePreviewId === definition.sourcePreviewId &&
    metadata.traceability.sourcePreview.previewId === preview.previewId &&
    metadata.traceability.sourcePreview.previewId === captureRecord.traceability.sourcePreview.previewId &&
    metadata.traceability.sourcePreview.deterministicSignatureHash ===
      preview.validationResult.deterministicSignatureHash;

  const checks = freeze({
    regionBoundaryValid: passFail(boundaryValid),
    naturalZonesValid: passFail(naturalZonesValid),
    settlementsValid: passFail(settlementsValid),
    corridorsConnected: passFail(corridorsConnected),
    terrainAwareCorridorValidity: passFail(terrainAwareCorridorValidity),
    scenicRouteValidity: passFail(scenicRouteValidity),
    settlementConnectivity: passFail(settlementConnectivity),
    naturalBarrierCompliance: passFail(naturalBarrierCompliance),
    settlementsLinked: passFail(settlementsLinked),
    landmarksAccessible: passFail(landmarksAccessible),
    routeCompatible: passFail(routeCompatible),
    explorationRoutesValid: passFail(explorationRoutesValid),
    explorationRouteQuality: passFail(explorationRouteQuality),
    deterministicSourceMatches: passFail(deterministicSourceMatches),
    referenceBasedPlacement: passFail(referenceBasedPlacement),
    streamingReadyStructure: passFail(streamingReadyStructure),
    noDuplicateGeometryGeneration: passFail(noDuplicateGeometryGeneration),
    cameraProfileValid: passFail(cameraProfileValid),
    metadataVersionMatchesRefinementState: passFail(
      metadataVersionMatchesRefinementState
    ),
    inspectionRecordComplete: passFail(inspectionRecordComplete),
    cameraProfileComplete: passFail(cameraProfileComplete),
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
      regionProfileId: preview.regionProfile.profileId,
      settlementCount: preview.settlements.length,
      naturalZoneCount: preview.naturalZones.length,
      transportCorridorCount: preview.transportCorridors.length,
      landmarkReserveCount: preview.landmarkReserves.length,
      explorationRouteCount: preview.explorationRoutes.length
    })
  });
}

export function writeRegionPreviewArtifacts(
  rawDefinition = regionPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createRegionPreviewSceneMetadata(definition, { cwd });
  const captureRecord = createRegionInspectionCaptureRecord(definition, { cwd });
  const validation = createRegionPreviewValidationReport(definition, { cwd });
  const manifest = freeze({
    consumerId: definition.consumerId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    captureRecordId: CAPTURE_RECORD_ID,
    sourcePreviewPath: definition.sourcePreviewPath,
    traceability: metadata.traceability,
    previewVersion: REFINEMENT_VERSION,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildRegionPreviewBlenderCommand(definition),
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
    refinementVersion: REFINEMENT_VERSION,
    validationVersion: VALIDATION_VERSION,
    sourcePreview: freeze({
      previewId: preview.previewId,
      schemaId: preview.schemaId,
      previewPath: definition.sourcePreviewPath,
      regionId: preview.regionId,
      deterministicSignatureHash:
        preview.validationResult.deterministicSignatureHash
    })
  });
}

function buildCapturePositions(preview) {
  const bounds = preview.regionBounds;
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
        z: round(sceneSpan * 1.12)
      }),
      rotation: freeze({ x: 0, y: 0, z: 0 })
    }),
    angledRegion25D: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY - spanY * 0.74),
        z: round(sceneSpan * 0.9)
      }),
      rotation: freeze({ x: 57.9, y: 0, z: 0 })
    }),
    settlementNetworkOverview: freeze({
      position: freeze({
        x: round(centreX + spanX * 0.12),
        y: round(centreY - spanY * 0.16),
        z: round(sceneSpan * 0.54)
      }),
      rotation: freeze({ x: 66.5, y: 0, z: 24 })
    })
  });
}

function validateCaptureProfiles(profiles) {
  return [
    profiles.topDown,
    profiles.angledRegion25D,
    profiles.settlementNetworkOverview
  ].every(
    (profile) =>
      typeof profile.cameraId === "string" &&
      profile.cameraId.length > 0 &&
      typeof profile.viewType === "string" &&
      Number.isFinite(profile.angleDegrees)
  );
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "region preview consumer");
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
    previewSceneId: normalizeNonEmptyString(definition.previewSceneId, "previewSceneId"),
    validationId: normalizeNonEmptyString(definition.validationId, "validationId"),
    previewCaptureProfiles: normalizeCaptureProfiles(definition.previewCaptureProfiles),
    naturalZonePresentation: freeze(definition.naturalZonePresentation ?? {}),
    settlementPresentation: freeze(definition.settlementPresentation ?? {}),
    transportPresentation: freeze(definition.transportPresentation ?? {}),
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
    angledRegion25D: normalizeCaptureProfile(
      profiles.angledRegion25D,
      "angledRegion25D"
    ),
    settlementNetworkOverview: normalizeCaptureProfile(
      profiles.settlementNetworkOverview,
      "settlementNetworkOverview"
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
  writeRegionPreviewArtifacts();
}
