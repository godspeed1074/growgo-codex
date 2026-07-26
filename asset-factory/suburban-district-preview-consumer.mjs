import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "SUBURBAN_DISTRICT_001_PREVIEW_001";
const SCENE_ID = "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "SUBURBAN_DISTRICT_001_PREVIEW_CONSUMER_001";

export const suburbanDistrictPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "TOP_DOWN_DISTRICT_INSPECTION",
      viewType: "top_down_district",
      angleDegrees: 90
    }),
    angled25D: deepFreeze({
      cameraId: "ANGLED_DISTRICT_2_5D_INSPECTION",
      viewType: "angled_25d_district",
      angleDegrees: 58
    }),
    streetBlockOverview: deepFreeze({
      cameraId: "STREET_BLOCK_OVERVIEW_INSPECTION",
      viewType: "street_block_overview",
      angleDegrees: 34
    })
  }),
  streetBlockLookup: deepFreeze({
    SUBURBAN_STREET_BLOCK_001: deepFreeze({
      streetBlockType: "SUBURBAN_STREET_BLOCK_001",
      previewSceneId: "SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001",
      previewMetadataPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json",
      sourcePreviewPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json",
      validationPath:
        "asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json",
      previewMode: "instance_reference_only"
    })
  }),
  zonePresentation: deepFreeze({
    RESIDENTIAL_LOW_DENSITY: deepFreeze({
      displayColour: "RESIDENTIAL_GREEN",
      previewMode: "zone_overlay"
    }),
    OPEN_SPACE: deepFreeze({
      displayColour: "OPEN_SPACE_GREEN",
      previewMode: "zone_overlay"
    }),
    PARK_RESERVE: deepFreeze({
      displayColour: "PARK_GREEN",
      previewMode: "zone_overlay"
    }),
    COMMUNITY_ZONE: deepFreeze({
      displayColour: "COMMUNITY_GOLD",
      previewMode: "zone_overlay"
    }),
    COMMERCIAL_EDGE_ZONE: deepFreeze({
      displayColour: "COMMERCIAL_ORANGE",
      previewMode: "zone_overlay"
    })
  }),
  reservePresentation: deepFreeze({
    school_reserve: deepFreeze({ markerType: "school_placeholder" }),
    shopping_reserve: deepFreeze({ markerType: "shopping_placeholder" }),
    sports_field_reserve: deepFreeze({ markerType: "sports_placeholder" }),
    railway_station_reserve: deepFreeze({ markerType: "transport_placeholder" }),
    civic_building_reserve: deepFreeze({ markerType: "civic_placeholder" })
  })
});

export function createSuburbanDistrictPreviewConsumer(
  rawDefinition = suburbanDistrictPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildSuburbanDistrictPreviewBlenderCommand(
  rawDefinition = suburbanDistrictPreviewConsumerDefinition
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

export function createSuburbanDistrictPreviewSceneMetadata(
  rawDefinition = suburbanDistrictPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const capturePositions = buildCapturePositions(preview);
  const blockReferenceCatalog = freeze(
    Object.values(definition.streetBlockLookup).map((entry) =>
      freeze({
        streetBlockType: entry.streetBlockType,
        previewSceneId: entry.previewSceneId,
        previewMetadataPath: entry.previewMetadataPath,
        sourcePreviewPath: entry.sourcePreviewPath,
        validationPath: entry.validationPath,
        previewMode: entry.previewMode
      })
    )
  );
  const blockInstances = freeze(
    preview.blockPlacements.map((placement) => {
      const reference = definition.streetBlockLookup[placement.streetBlockType];
      return freeze({
        blockId: placement.blockInstanceId,
        streetBlockType: placement.streetBlockType,
        previewSceneId: reference.previewSceneId,
        previewMetadataPath: reference.previewMetadataPath,
        sourcePreviewPath: reference.sourcePreviewPath,
        validationPath: reference.validationPath,
        sourcePreviewId: placement.sourcePreviewId,
        sourceStreetBlockId: placement.sourceStreetBlockId,
        seed: placement.sourceBlockSeed,
        position: placement.position,
        rotation: placement.rotation,
        estimatedLotCount: placement.estimatedLotCount,
        streamingCellId: placement.streamingCellId,
        previewMode: reference.previewMode
      });
    })
  );

  return freeze({
    sceneId: definition.previewSceneId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sourcePreviewPath: definition.sourcePreviewPath,
    previewType: "suburban_district_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "SUBURBAN_DISTRICT_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 58,
      framing: "district_overview",
      paddingMeters: 28
    }),
    visualCaptureWorkflow: freeze({
      previewVersion: "SESSION_58_DISTRICT_PREVIEW_CONSUMER",
      districtSeed: preview.seedConfig.districtSeed,
      previewVersionSeedSignature:
        preview.validationResult.deterministicSignatureHash,
      validationResult: preview.validationResult.validationPassed ? "PASS" : "FAIL",
      topDown: freeze({
        ...definition.previewCaptureProfiles.topDown,
        position: capturePositions.topDown.position,
        rotation: capturePositions.topDown.rotation
      }),
      angled25D: freeze({
        ...definition.previewCaptureProfiles.angled25D,
        position: capturePositions.angled25D.position,
        rotation: capturePositions.angled25D.rotation
      }),
      streetBlockOverview: freeze({
        ...definition.previewCaptureProfiles.streetBlockOverview,
        position: capturePositions.streetBlockOverview.position,
        rotation: capturePositions.streetBlockOverview.rotation
      })
    }),
    themeProfile: freeze(preview.themeProfile),
    districtLayer: freeze({
      districtId: preview.districtId,
      districtBoundaryVisible: true,
      districtBounds: preview.districtBounds,
      blockCount: preview.blockPlacements.length,
      lotCountEstimate: preview.lotCount,
      zoneCount: preview.landUseZones.length,
      openSpaceCount: preview.openSpacePlacements.length,
      destinationReserveCount: preview.destinationReserves.length
    }),
    blockLayer: freeze({
      placementMode: "block_preview_reference_plus_transform",
      blockReferenceCount: blockReferenceCatalog.length,
      blockReferenceCatalog,
      blockInstanceCount: blockInstances.length,
      resolvedBlockInstances: blockInstances,
      showBlockBoundaries: true,
      showBlockLabels: true
    }),
    roadConnectorLayer: freeze({
      connectorCount: preview.roadConnectors.length,
      hierarchySummary: preview.roadHierarchy.connectorCounts,
      showLocalRoads: true,
      showCollectorConnectors: true,
      showFutureArterialPlaceholders: true,
      resolvedConnectors: freeze(
        preview.roadConnectors.map((connector) =>
          freeze({
            connectorId: connector.connectorId,
            sourceBlockId: connector.startBlockId,
            targetBlockId: connector.endBlockId,
            roadType: connector.roadType,
            direction: connector.direction,
            width: connector.width,
            hierarchy: connector.hierarchy
          })
        )
      )
    }),
    landUseLayer: freeze({
      zoneCount: preview.landUseZones.length,
      showZoneBoundaries: true,
      showZoneLabels: true,
      resolvedZones: freeze(
        preview.landUseZones.map((zone) =>
          freeze({
            zoneId: zone.zoneId,
            zoneType: zone.zoneType,
            purpose: zone.purpose,
            boundary: zone.boundary,
            placementRules: zone.placementRules,
            displayColour:
              definition.zonePresentation[zone.zoneType]?.displayColour ?? "ZONE_DEFAULT",
            previewMode:
              definition.zonePresentation[zone.zoneType]?.previewMode ??
              "zone_overlay"
          })
        )
      )
    }),
    openSpaceLayer: freeze({
      openSpaceCount: preview.openSpacePlacements.length,
      showParks: true,
      showReserves: true,
      showGreenCorridors: true,
      showWalkingLinks: true,
      resolvedOpenSpaces: freeze(
        preview.openSpacePlacements.map((openSpace) =>
          freeze({
            openSpaceId: openSpace.openSpaceId,
            openSpaceType: openSpace.openSpaceType,
            position: openSpace.position,
            size: openSpace.size,
            connectionRules: openSpace.connectionRules
          })
        )
      )
    }),
    destinationReserveLayer: freeze({
      reserveCount: preview.destinationReserves.length,
      showSchoolPlaceholders: true,
      showShoppingPlaceholders: true,
      showCommunityPlaceholders: true,
      showTransportPlaceholders: true,
      resolvedReserves: freeze(
        preview.destinationReserves.map((reserve) =>
          freeze({
            reserveId: reserve.reserveId,
            reserveType: reserve.reserveType,
            boundary: reserve.boundary,
            futureUse: reserve.futureUse,
            markerType:
              definition.reservePresentation[reserve.reserveType]?.markerType ??
              "reserve_placeholder"
          })
        )
      )
    }),
    debugLayer: freeze({
      showDistrictBoundaryMarkers: true,
      showBlockLabels: true,
      showRoadGraphMarkers: true,
      showZoneLabels: true,
      showValidationIndicators: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "instance_reuse_only",
      duplicateGeometryGenerationAllowed: false,
      blockInstanceReferencesOnly: true,
      streetBlockPreviewReuse: "registered_preview_scene_reference",
      futureAtlasEngineCompatibility: "district_preview_instance_ready",
      expectedBlockInstances: preview.blockPlacements.length,
      expectedConnectorInstances: preview.roadConnectors.length
    })
  });
}

export function createSuburbanDistrictPreviewValidationReport(
  rawDefinition = suburbanDistrictPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const cwd = options.cwd ?? process.cwd();

  const blocksInsideBoundary = preview.validationResult.blocksInsideBoundary === true;
  const blocksResolve = preview.blockPlacements.every((placement) => {
    const reference = definition.streetBlockLookup[placement.streetBlockType];
    return reference
      ? fs.existsSync(path.resolve(cwd, reference.previewMetadataPath))
      : false;
  });
  const blocksDoNotOverlap = preview.validationResult.blocksDoNotOverlap === true;
  const roadsConnected = preview.validationResult.roadsConnected === true;
  const zonesValid = preview.validationResult.landUseDistributionValid === true;
  const openSpaceConnected = preview.validationResult.openSpaceValid === true;
  const destinationReservesValid =
    preview.validationResult.destinationReservesValid === true;
  const cameraProfileValid = validateCaptureProfiles(definition.previewCaptureProfiles);
  const deterministicSourceMatches =
    stableStringify(preview) ===
    stableStringify(readJson(path.resolve(cwd, definition.sourcePreviewPath)));
  const instanceReferenceModeValid =
    preview.validationResult.instanceReuseStrategyValid === true;

  const checks = freeze({
    blocksInsideBoundary: passFail(blocksInsideBoundary),
    streetBlocksResolve: passFail(blocksResolve),
    blocksDoNotOverlap: passFail(blocksDoNotOverlap),
    roadsConnected: passFail(roadsConnected),
    zonesValid: passFail(zonesValid),
    openSpaceConnected: passFail(openSpaceConnected),
    destinationReservesValid: passFail(destinationReservesValid),
    cameraProfileValid: passFail(cameraProfileValid),
    deterministicSourceMatches: passFail(deterministicSourceMatches),
    instanceReferenceModeValid: passFail(instanceReferenceModeValid)
  });

  return freeze({
    validationId: definition.validationId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sceneId: definition.previewSceneId,
    checks,
    summary: freeze({
      validationPassed: Object.values(checks).every((status) => status === "PASS"),
      blockCount: preview.blockPlacements.length,
      lotCount: preview.lotCount,
      roadConnectorCount: preview.roadConnectors.length,
      zoneCount: preview.landUseZones.length,
      openSpaceCount: preview.openSpacePlacements.length,
      destinationReserveCount: preview.destinationReserves.length
    })
  });
}

export function writeSuburbanDistrictPreviewArtifacts(
  rawDefinition = suburbanDistrictPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createSuburbanDistrictPreviewSceneMetadata(definition, { cwd });
  const validation = createSuburbanDistrictPreviewValidationReport(definition, { cwd });
  const manifest = freeze({
    consumerId: definition.consumerId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    sourcePreviewPath: definition.sourcePreviewPath,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildSuburbanDistrictPreviewBlenderCommand(definition)
  });
  const wrapperScriptPath = path.join(
    outputDirectory,
    "generate_suburban_district_preview_scene.py"
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
  const bounds = preview.districtBounds;
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
        z: round(sceneSpan * 1.42)
      }),
      rotation: freeze({ x: 0, y: 0, z: 0 })
    }),
    angled25D: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY - spanY * 0.72),
        z: round(sceneSpan * 0.88)
      }),
      rotation: freeze({ x: 57.9, y: 0, z: 0 })
    }),
    streetBlockOverview: freeze({
      position: freeze({
        x: round(centreX - spanX * 0.14),
        y: round(bounds.minY + spanY * 0.18),
        z: round(sceneSpan * 0.36)
      }),
      rotation: freeze({ x: 73.5, y: 0, z: 34 })
    })
  });
}

function validateCaptureProfiles(profiles) {
  return [
    profiles.topDown,
    profiles.angled25D,
    profiles.streetBlockOverview
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
Delegates to the canonical district preview Blender script.
"""

from pathlib import Path
import runpy

SCRIPT_PATH = Path(__file__).resolve().parents[3] / "${scriptPath}"
runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
`;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "suburban district preview consumer");
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
    streetBlockLookup: normalizeStreetBlockLookup(definition.streetBlockLookup),
    zonePresentation: freeze(definition.zonePresentation ?? {}),
    reservePresentation: freeze(definition.reservePresentation ?? {})
  });
}

function normalizeCaptureProfiles(rawProfiles) {
  const profiles = asPlainObject(rawProfiles, "previewCaptureProfiles");
  return freeze({
    topDown: normalizeCaptureProfile(profiles.topDown, "topDown"),
    angled25D: normalizeCaptureProfile(profiles.angled25D, "angled25D"),
    streetBlockOverview: normalizeCaptureProfile(
      profiles.streetBlockOverview,
      "streetBlockOverview"
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

function normalizeStreetBlockLookup(rawLookup) {
  const lookup = asPlainObject(rawLookup, "streetBlockLookup");
  const normalized = {};
  for (const [key, value] of Object.entries(lookup)) {
    const entry = asPlainObject(value, `streetBlockLookup.${key}`);
    normalized[key] = freeze({
      streetBlockType: normalizeNonEmptyString(
        entry.streetBlockType,
        `streetBlockLookup.${key}.streetBlockType`
      ),
      previewSceneId: normalizeNonEmptyString(
        entry.previewSceneId,
        `streetBlockLookup.${key}.previewSceneId`
      ),
      previewMetadataPath: normalizeRelativePath(
        entry.previewMetadataPath,
        `streetBlockLookup.${key}.previewMetadataPath`
      ),
      sourcePreviewPath: normalizeRelativePath(
        entry.sourcePreviewPath,
        `streetBlockLookup.${key}.sourcePreviewPath`
      ),
      validationPath: normalizeRelativePath(
        entry.validationPath,
        `streetBlockLookup.${key}.validationPath`
      ),
      previewMode: normalizeNonEmptyString(
        entry.previewMode,
        `streetBlockLookup.${key}.previewMode`
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
