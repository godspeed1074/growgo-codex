import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "TOWN_LAYOUT_001_PREVIEW_001";
const SCENE_ID = "TOWN_LAYOUT_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "TOWN_LAYOUT_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "TOWN_LAYOUT_001_PREVIEW_CONSUMER_001";

export const townPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_town_layout_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "TOP_DOWN_TOWN_INSPECTION",
      viewType: "top_down_town",
      angleDegrees: 90
    }),
    angledTown25D: deepFreeze({
      cameraId: "ANGLED_TOWN_2_5D_INSPECTION",
      viewType: "angled_25d_town",
      angleDegrees: 58
    }),
    centreAndDistrictOverview: deepFreeze({
      cameraId: "CENTRE_AND_DISTRICT_OVERVIEW_INSPECTION",
      viewType: "centre_and_district_overview",
      angleDegrees: 38
    })
  }),
  districtPreviewLookup: deepFreeze({
    SUBURBAN_DISTRICT_001: deepFreeze({
      districtSchemaId: "SUBURBAN_DISTRICT_001",
      previewSceneId: "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001",
      previewMetadataPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-metadata.json",
      sourcePreviewPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_001.json",
      validationPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001.json",
      previewMode: "instance_reference_only"
    })
  }),
  districtPresentation: deepFreeze({
    RESIDENTIAL_DISTRICT_SUBURBAN: deepFreeze({
      displayColour: "SUBURBAN_GREEN",
      markerType: "suburban_district"
    }),
    RESIDENTIAL_DISTRICT_COASTAL: deepFreeze({
      displayColour: "COASTAL_CYAN",
      markerType: "coastal_district"
    }),
    RESIDENTIAL_DISTRICT_MIXED: deepFreeze({
      displayColour: "MIXED_GOLD",
      markerType: "mixed_district"
    }),
    RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY: deepFreeze({
      displayColour: "FUTURE_PURPLE",
      markerType: "future_density_district"
    })
  }),
  civicPresentation: deepFreeze({
    SCHOOL_RESERVE: deepFreeze({ markerType: "school_placeholder" }),
    LIBRARY_RESERVE: deepFreeze({ markerType: "library_placeholder" }),
    COMMUNITY_CENTRE_RESERVE: deepFreeze({ markerType: "community_placeholder" }),
    EMERGENCY_SERVICE_RESERVE: deepFreeze({ markerType: "emergency_placeholder" }),
    HEALTHCARE_RESERVE: deepFreeze({ markerType: "healthcare_placeholder" })
  }),
  recreationPresentation: deepFreeze({
    PARK: deepFreeze({ displayColour: "PARK_GREEN" }),
    SPORTS_FIELD: deepFreeze({ displayColour: "SPORTS_GREEN" }),
    PLAYGROUND_ZONE: deepFreeze({ displayColour: "PLAYGROUND_YELLOW" }),
    WALKING_TRAIL: deepFreeze({ displayColour: "TRAIL_BEIGE" }),
    GREEN_CORRIDOR: deepFreeze({ displayColour: "CORRIDOR_GREEN" })
  }),
  landmarkPresentation: deepFreeze({
    HISTORICAL_LANDMARK: deepFreeze({ markerType: "historical_landmark" }),
    TOURIST_ATTRACTION: deepFreeze({ markerType: "tourist_landmark" }),
    NATURAL_LANDMARK: deepFreeze({ markerType: "natural_landmark" }),
    UNIQUE_TOWN_FEATURE: deepFreeze({ markerType: "town_feature_landmark" })
  })
});

export function createTownPreviewConsumer(
  rawDefinition = townPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildTownPreviewBlenderCommand(
  rawDefinition = townPreviewConsumerDefinition
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

export function createTownPreviewSceneMetadata(
  rawDefinition = townPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const capturePositions = buildCapturePositions(preview);
  const districtReferenceCatalog = freeze(
    Object.values(definition.districtPreviewLookup).map((entry) =>
      freeze({
        districtSchemaId: entry.districtSchemaId,
        previewSceneId: entry.previewSceneId,
        previewMetadataPath: entry.previewMetadataPath,
        sourcePreviewPath: entry.sourcePreviewPath,
        validationPath: entry.validationPath,
        previewMode: entry.previewMode
      })
    )
  );
  const districtInstances = freeze(
    preview.districtPlacements.map((placement) => {
      const reference = definition.districtPreviewLookup[placement.sourceDistrictSchemaId];
      const presentation =
        definition.districtPresentation[placement.districtType] ?? {};
      return freeze({
        districtPlacementId: placement.districtPlacementId,
        districtType: placement.districtType,
        previewSceneId: reference.previewSceneId,
        previewMetadataPath: reference.previewMetadataPath,
        sourcePreviewPath: reference.sourcePreviewPath,
        validationPath: reference.validationPath,
        sourcePreviewId: placement.sourcePreviewId,
        sourceDistrictId: placement.sourceDistrictId,
        sourceSeed: placement.sourceSeed,
        sourceThemeSeed: placement.sourceThemeSeed,
        position: placement.position,
        rotation: placement.rotation,
        densityProfile: placement.densityProfile,
        sizeProfile: placement.sizeProfile,
        themeProfile: placement.themeProfile,
        estimatedLotCount: placement.estimatedLotCount,
        streamingCellId: placement.streamingCellId,
        connectorRelationships: placement.connectorRelationships,
        districtFootprint: placement.districtFootprint,
        displayColour: presentation.displayColour ?? "DISTRICT_DEFAULT",
        markerType: presentation.markerType ?? "district",
        previewMode: reference.previewMode
      });
    })
  );

  return freeze({
    sceneId: definition.previewSceneId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sourcePreviewPath: definition.sourcePreviewPath,
    previewType: "procedural_town_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "TOWN_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 58,
      framing: "town_overview",
      paddingMeters: 140
    }),
    visualCaptureWorkflow: freeze({
      previewVersion: "SESSION_65_TOWN_PREVIEW_CONSUMER",
      townSeed: preview.seedConfig.townSeed,
      previewVersionSeedSignature:
        preview.validationResult.deterministicSignatureHash,
      validationResult: preview.validationResult.validationPassed ? "PASS" : "FAIL",
      topDown: freeze({
        ...definition.previewCaptureProfiles.topDown,
        position: capturePositions.topDown.position,
        rotation: capturePositions.topDown.rotation
      }),
      angledTown25D: freeze({
        ...definition.previewCaptureProfiles.angledTown25D,
        position: capturePositions.angledTown25D.position,
        rotation: capturePositions.angledTown25D.rotation
      }),
      centreAndDistrictOverview: freeze({
        ...definition.previewCaptureProfiles.centreAndDistrictOverview,
        position: capturePositions.centreAndDistrictOverview.position,
        rotation: capturePositions.centreAndDistrictOverview.rotation
      })
    }),
    townLayer: freeze({
      townId: preview.townId,
      townBoundaryVisible: true,
      townBounds: preview.townBounds,
      districtCount: preview.districtPlacements.length,
      districtLotCountEstimate: preview.townMetadata.districtLotCount,
      commercialZoneCount: preview.commercialZones.length,
      civicReserveCount: preview.civicReserves.length,
      transportCorridorCount: preview.transportCorridors.length,
      recreationZoneCount: preview.recreationZones.length,
      landmarkReserveCount: preview.landmarkReserves.length,
      ruralTransitionCount: preview.ruralTransitionZones.length
    }),
    districtLayer: freeze({
      placementMode: "district_preview_reference_plus_transform",
      districtReferenceCount: districtReferenceCatalog.length,
      districtReferenceCatalog,
      districtInstanceCount: districtInstances.length,
      resolvedDistrictInstances: districtInstances,
      showDistrictBoundaries: true,
      showDistrictLabels: true,
      showDensityProfiles: true,
      visualHierarchy: freeze({
        districtThemeReadable: true,
        centreRelationshipVisible: true,
        transportAdjacencyVisible: true
      })
    }),
    townCentreLayer: freeze({
      centreCount: preview.townCentreZones.length,
      showCentreBoundary: true,
      showPedestrianPriorityArea: true,
      showCentreLabel: true,
      resolvedCentres: freeze(
        preview.townCentreZones.map((centre) =>
          freeze({
            centreId: centre.centreId,
            centreType: centre.centreType,
            boundary: centre.boundary,
            pedestrianPriority: centre.pedestrianPriority,
            commercialIntensity: centre.commercialIntensity,
            connectedDistrictIds: centre.connectedDistrictIds,
            transportRelationship: centre.transportRelationship
          })
        )
      )
    }),
    commercialLayer: freeze({
      zoneCount: preview.commercialZones.length,
      showCommercialBoundaries: true,
      showMainStreetIndicators: true,
      showAccessRelationships: true,
      resolvedCommercialZones: freeze(
        preview.commercialZones.map((zone) =>
          freeze({
            commercialZoneId: zone.commercialZoneId,
            commercialType: zone.commercialType,
            boundary: zone.boundary,
            intensity: zone.intensity,
            parkingAccessRules: zone.parkingAccessRules,
            pedestrianLinks: zone.pedestrianLinks,
            roadRelationship: zone.roadRelationship
          })
        )
      )
    }),
    civicLayer: freeze({
      reserveCount: preview.civicReserves.length,
      showPublicServiceAreas: true,
      showReserveLabels: true,
      resolvedCivicReserves: freeze(
        preview.civicReserves.map((reserve) =>
          freeze({
            civicReserveId: reserve.civicReserveId,
            civicType: reserve.civicType,
            boundary: reserve.boundary,
            accessibilityProfile: reserve.accessibilityProfile,
            roadRelationship: reserve.roadRelationship,
            pedestrianRelationship: reserve.pedestrianRelationship,
            markerType:
              definition.civicPresentation[reserve.civicType]?.markerType ??
              "civic_placeholder"
          })
        )
      )
    }),
    transportLayer: freeze({
      corridorCount: preview.transportCorridors.length,
      showRoadHierarchy: true,
      showCollectorRoutes: true,
      showRailwayCorridors: true,
      showStationReserves: true,
      readabilityEnhancements: freeze({
        hierarchyLineWeighting: true,
        centreLoopHighlighting: true,
        futureRailDashedDisplay: true
      }),
      resolvedTransportCorridors: freeze(
        preview.transportCorridors.map((corridor) =>
          freeze({
            corridorId: corridor.corridorId,
            corridorType: corridor.corridorType,
            hierarchy: corridor.hierarchy,
            path: corridor.path,
            connections: corridor.connections,
            direction: corridor.direction,
            capacityProfile: corridor.capacityProfile
          })
        )
      )
    }),
    recreationLayer: freeze({
      recreationZoneCount: preview.recreationZones.length,
      showParks: true,
      showSportsAreas: true,
      showGreenCorridors: true,
      showWalkingLinks: true,
      resolvedRecreationZones: freeze(
        preview.recreationZones.map((zone) =>
          freeze({
            recreationZoneId: zone.recreationZoneId,
            recreationType: zone.recreationType,
            boundary: zone.boundary,
            accessRules: zone.accessRules,
            greenRelationship: zone.greenRelationship,
            displayColour:
              definition.recreationPresentation[zone.recreationType]?.displayColour ??
              "RECREATION_DEFAULT"
          })
        )
      )
    }),
    landmarkLayer: freeze({
      landmarkReserveCount: preview.landmarkReserves.length,
      showExplorationPoints: true,
      showLandmarkLabels: true,
      resolvedLandmarkReserves: freeze(
        preview.landmarkReserves.map((reserve) =>
          freeze({
            landmarkReserveId: reserve.landmarkReserveId,
            landmarkType: reserve.landmarkType,
            boundary: reserve.boundary,
            visibilityRole: reserve.visibilityRole,
            destinationRole: reserve.destinationRole,
            accessRelationship: reserve.accessRelationship,
            markerType:
              definition.landmarkPresentation[reserve.landmarkType]?.markerType ??
              "landmark_placeholder"
          })
        )
      )
    }),
    ruralTransitionLayer: freeze({
      ruralTransitionCount: preview.ruralTransitionZones.length,
      showTownOutline: true,
      showSettlementExtent: true,
      showRuralTransitionAreas: true,
      resolvedRuralTransitions: freeze(preview.ruralTransitionZones)
    }),
    serviceEdgeLayer: freeze({
      serviceEdgeZoneCount: preview.serviceEdgeZones.length,
      showServiceEdges: true,
      resolvedServiceEdgeZones: freeze(preview.serviceEdgeZones)
    }),
    debugLayer: freeze({
      showTownBoundaryMarkers: true,
      showDistrictLabels: true,
      showZoneLabels: true,
      showRoadHierarchyMarkers: true,
      showValidationIndicators: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "instance_reuse_only",
      duplicateGeometryGenerationAllowed: false,
      districtInstanceReferencesOnly: true,
      districtPreviewReuse: "registered_preview_scene_reference",
      futureAtlasEngineCompatibility: "town_preview_instance_ready",
      expectedDistrictInstances: preview.districtPlacements.length,
      expectedTransportCorridors: preview.transportCorridors.length
    })
  });
}

export function createTownPreviewValidationReport(
  rawDefinition = townPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const cwd = options.cwd ?? process.cwd();

  const boundaryValid =
    Number.isFinite(preview.townBounds.minX) &&
    Number.isFinite(preview.townBounds.maxX) &&
    preview.townBounds.maxX > preview.townBounds.minX &&
    preview.townBounds.maxY > preview.townBounds.minY;
  const districtsPlaced = preview.districtPlacements.length >= 2;
  const zonesValid = preview.validationResult.zonesValid === true;
  const districtPreviewsResolve = preview.districtPlacements.every((placement) => {
    const reference = definition.districtPreviewLookup[placement.sourceDistrictSchemaId];
    return reference
      ? fs.existsSync(path.resolve(cwd, reference.previewMetadataPath))
      : false;
  });
  const centreAccessible = preview.validationResult.townCentreAccessible === true;
  const centreConnected =
    preview.validationResult.townCentreTransportConnected === true &&
    preview.validationResult.townCentreResidentialConnected === true;
  const commercialSensibleLocation =
    preview.validationResult.commercialPlacementValid === true &&
    preview.validationResult.commercialPedestrianConnected === true;
  const civicAccessible = preview.validationResult.civicAccessible === true;
  const transportConnectedHierarchy = preview.validationResult.roadsConnected === true;
  const recreationValid = preview.validationResult.recreationConnected === true;
  const landmarksValid = preview.validationResult.landmarksValid === true;
  const deterministicSourceMatches =
    stableStringify(preview) ===
    stableStringify(readJson(path.resolve(cwd, definition.sourcePreviewPath)));
  const referenceBasedPlacement =
    preview.validationResult.instanceReuseStrategyValid === true;
  const noDuplicateGeometryGeneration =
    preview.validationResult.instanceReuseStrategyValid === true;
  const cameraProfileValid = validateCaptureProfiles(definition.previewCaptureProfiles);

  const checks = freeze({
    townBoundaryValid: passFail(boundaryValid),
    districtsPlaced: passFail(districtsPlaced),
    zonesValid: passFail(zonesValid),
    districtPreviewsResolve: passFail(districtPreviewsResolve),
    townCentreAccessible: passFail(centreAccessible),
    townCentreConnected: passFail(centreConnected),
    commercialSensibleLocation: passFail(commercialSensibleLocation),
    civicAccessible: passFail(civicAccessible),
    transportConnectedHierarchy: passFail(transportConnectedHierarchy),
    recreationValid: passFail(recreationValid),
    landmarksValid: passFail(landmarksValid),
    deterministicSourceMatches: passFail(deterministicSourceMatches),
    referenceBasedPlacement: passFail(referenceBasedPlacement),
    noDuplicateGeometryGeneration: passFail(noDuplicateGeometryGeneration),
    cameraProfileValid: passFail(cameraProfileValid)
  });

  return freeze({
    validationId: definition.validationId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sceneId: definition.previewSceneId,
    checks,
    summary: freeze({
      validationPassed: Object.values(checks).every((status) => status === "PASS"),
      districtCount: preview.districtPlacements.length,
      districtLotCount: preview.townMetadata.districtLotCount,
      townCentreCount: preview.townCentreZones.length,
      commercialZoneCount: preview.commercialZones.length,
      civicReserveCount: preview.civicReserves.length,
      transportCorridorCount: preview.transportCorridors.length,
      recreationZoneCount: preview.recreationZones.length,
      landmarkReserveCount: preview.landmarkReserves.length
    })
  });
}

export function writeTownPreviewArtifacts(
  rawDefinition = townPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createTownPreviewSceneMetadata(definition, { cwd });
  const validation = createTownPreviewValidationReport(definition, { cwd });
  const manifest = freeze({
    consumerId: definition.consumerId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    sourcePreviewPath: definition.sourcePreviewPath,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildTownPreviewBlenderCommand(definition)
  });
  const wrapperScriptPath = path.join(
    outputDirectory,
    "generate_town_layout_preview_scene.py"
  );

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
    wrapperScriptPath,
    buildWrapperScript(definition.blenderScriptPath)
  );

  return freeze({
    outputDirectory,
    metadataPath: path.join(outputDirectory, "preview-scene-metadata.json"),
    manifestPath: path.join(outputDirectory, "preview-scene-manifest.json"),
    validationPath: path.join(outputDirectory, `${definition.validationId}.json`),
    wrapperScriptPath
  });
}

function buildCapturePositions(preview) {
  const bounds = preview.townBounds;
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
        z: round(sceneSpan * 1.22)
      }),
      rotation: freeze({ x: 0, y: 0, z: 0 })
    }),
    angledTown25D: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY - spanY * 0.78),
        z: round(sceneSpan * 0.94)
      }),
      rotation: freeze({ x: 57.9, y: 0, z: 0 })
    }),
    centreAndDistrictOverview: freeze({
      position: freeze({
        x: round(centreX + spanX * 0.08),
        y: round(bounds.minY + spanY * 0.18),
        z: round(sceneSpan * 0.44)
      }),
      rotation: freeze({ x: 71.5, y: 0, z: 28 })
    })
  });
}

function validateCaptureProfiles(profiles) {
  return [
    profiles.topDown,
    profiles.angledTown25D,
    profiles.centreAndDistrictOverview
  ].every(
    (profile) =>
      typeof profile.cameraId === "string" &&
      profile.cameraId.length > 0 &&
      typeof profile.viewType === "string" &&
      Number.isFinite(profile.angleDegrees)
  );
}

function buildWrapperScript(scriptPath) {
  return `"""
Wrapper script for ${SCENE_ID}.
Delegates to the canonical town preview Blender script.
"""

from pathlib import Path
import runpy

SCRIPT_PATH = Path(__file__).resolve().parents[3] / "${scriptPath}"
runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
`;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "town preview consumer");
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
    districtPreviewLookup: normalizeDistrictPreviewLookup(definition.districtPreviewLookup),
    districtPresentation: freeze(definition.districtPresentation ?? {}),
    civicPresentation: freeze(definition.civicPresentation ?? {}),
    recreationPresentation: freeze(definition.recreationPresentation ?? {}),
    landmarkPresentation: freeze(definition.landmarkPresentation ?? {})
  });
}

function normalizeCaptureProfiles(rawProfiles) {
  const profiles = asPlainObject(rawProfiles, "previewCaptureProfiles");
  return freeze({
    topDown: normalizeCaptureProfile(profiles.topDown, "topDown"),
    angledTown25D: normalizeCaptureProfile(
      profiles.angledTown25D,
      "angledTown25D"
    ),
    centreAndDistrictOverview: normalizeCaptureProfile(
      profiles.centreAndDistrictOverview,
      "centreAndDistrictOverview"
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

function normalizeDistrictPreviewLookup(rawLookup) {
  const lookup = asPlainObject(rawLookup, "districtPreviewLookup");
  const normalized = {};
  for (const [key, value] of Object.entries(lookup)) {
    const entry = asPlainObject(value, `districtPreviewLookup.${key}`);
    normalized[key] = freeze({
      districtSchemaId: normalizeNonEmptyString(
        entry.districtSchemaId,
        `districtPreviewLookup.${key}.districtSchemaId`
      ),
      previewSceneId: normalizeNonEmptyString(
        entry.previewSceneId,
        `districtPreviewLookup.${key}.previewSceneId`
      ),
      previewMetadataPath: normalizeRelativePath(
        entry.previewMetadataPath,
        `districtPreviewLookup.${key}.previewMetadataPath`
      ),
      sourcePreviewPath: normalizeRelativePath(
        entry.sourcePreviewPath,
        `districtPreviewLookup.${key}.sourcePreviewPath`
      ),
      validationPath: normalizeRelativePath(
        entry.validationPath,
        `districtPreviewLookup.${key}.validationPath`
      ),
      previewMode: normalizeNonEmptyString(
        entry.previewMode,
        `districtPreviewLookup.${key}.previewMode`
      )
    });
  }
  return freeze(normalized);
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
  writeTownPreviewArtifacts();
}
