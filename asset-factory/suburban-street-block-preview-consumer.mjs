import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "SUBURBAN_STREET_BLOCK_001_PREVIEW_001";
const SCENE_ID = "SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "SUBURBAN_STREET_BLOCK_001_PREVIEW_CONSUMER_001";
const ADAPTER_ID = "SUBURBAN_STREET_BLOCK_PREVIEW_ADAPTER_001";

export const suburbanStreetBlockPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  adapterId: ADAPTER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_suburban_street_block_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "TOP_DOWN_BLOCK_INSPECTION",
      viewType: "top_down_block",
      angleDegrees: 90
    }),
    angled25D: deepFreeze({
      cameraId: "ANGLED_2_5D_BLOCK_INSPECTION",
      viewType: "angled_25d_block",
      angleDegrees: 58
    }),
    streetLevel: deepFreeze({
      cameraId: "STREET_LEVEL_BLOCK_INSPECTION",
      viewType: "street_level_block",
      angleDegrees: 18
    })
  }),
  siteAssetLookup: deepFreeze({
    MOD_GROUND_GRASS_STANDARD_001: deepFreeze({
      assetId: "MOD_GROUND_GRASS_STANDARD_001",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export/MOD_GROUND_GRASS_STANDARD_001_LOD_GAMEPLAY.glb"
    }),
    MOD_PATH_STANDARD_001: deepFreeze({
      assetId: "MOD_PATH_STANDARD_001",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export/MOD_PATH_STANDARD_001_LOD_GAMEPLAY.glb"
    }),
    MOD_TREE_EUCALYPTUS_STANDARD_001: deepFreeze({
      assetId: "MOD_TREE_EUCALYPTUS_STANDARD_001",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export/MOD_TREE_EUCALYPTUS_STANDARD_001_LOD_GAMEPLAY.glb"
    })
  }),
  featurePresentationLookup: deepFreeze({
    STREET_FEATURE_SIGN_STANDARD_001: deepFreeze({
      assetId: "STREET_FEATURE_SIGN_STANDARD_001",
      presentationMode: "preview_marker"
    }),
    MAILBOX_PREVIEW_001: deepFreeze({
      assetId: "MAILBOX_PREVIEW_001",
      presentationMode: "preview_marker"
    })
  }),
  buildingAssetLookup: deepFreeze({
    BUILDING_HOUSE_SUBURBAN_BRICK_001: deepFreeze({
      assetId: "BUILDING_HOUSE_SUBURBAN_BRICK_001",
      familyId: "FAMILY_HOUSE_SUBURBAN_BRICK",
      defaultPreviewLod: "LOD_GAMEPLAY",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_SUBURBAN_BRICK_FAMILY_001/export/BUILDING_HOUSE_SUBURBAN_BRICK_001_LOD_GAMEPLAY.glb"
    }),
    BUILDING_HOUSE_COASTAL_COTTAGE_001: deepFreeze({
      assetId: "BUILDING_HOUSE_COASTAL_COTTAGE_001",
      familyId: "FAMILY_HOUSE_COASTAL",
      defaultPreviewLod: "LOD_GAMEPLAY",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export/BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb"
    }),
    BUILDING_HOUSE_BEACH_BUNGALOW_001: deepFreeze({
      assetId: "BUILDING_HOUSE_BEACH_BUNGALOW_001",
      familyId: "FAMILY_HOUSE_COASTAL",
      defaultPreviewLod: "LOD_GAMEPLAY",
      gameplayAssetPath:
        "asset-factory-workspace/production/HOUSE_BEACH_BUNGALOW_FAMILY_001/export/BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_GAMEPLAY.glb"
    })
  })
});

export function createSuburbanStreetBlockPreviewConsumer(
  rawDefinition = suburbanStreetBlockPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildSuburbanStreetBlockPreviewBlenderCommand(
  rawDefinition = suburbanStreetBlockPreviewConsumerDefinition
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

export function createSuburbanStreetBlockPreviewSceneMetadata(
  rawDefinition = suburbanStreetBlockPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const capturePositions = buildCapturePositions(preview);
  const buildingInstances = preview.buildingPlacements.map((placement) =>
    freeze({
      instanceId: placement.placementId,
      assetId: placement.assetId,
      lotId: placement.lotId,
      position: placement.position,
      rotation: placement.rotation,
      scale: placement.scale,
      lodProfile:
        definition.buildingAssetLookup[placement.assetId].defaultPreviewLod,
      gameplayAssetPath:
        definition.buildingAssetLookup[placement.assetId].gameplayAssetPath
    })
  );
  const featurePresentation = buildStreetFeaturePresentation(preview, definition);

  return freeze({
    sceneId: definition.previewSceneId,
    consumerId: definition.consumerId,
    adapterId: definition.adapterId,
    sourcePreviewId: definition.sourcePreviewId,
    sourcePreviewPath: definition.sourcePreviewPath,
    previewType: "suburban_street_block_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "SUBURBAN_STREET_BLOCK_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 58,
      framing: "multi_street_block_overview",
      paddingMeters: 12
    }),
    visualCaptureWorkflow: freeze({
      previewVersion: "SESSION_49_BLOCK_PREVIEW_INTEGRATION",
      seed: preview.seed,
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
      streetLevel: freeze({
        ...definition.previewCaptureProfiles.streetLevel,
        position: capturePositions.streetLevel.position,
        rotation: capturePositions.streetLevel.rotation
      })
    }),
    themeProfile: freeze(preview.themeProfile),
    roadLayer: freeze({
      roadSegmentCount: preview.roadSegments.length,
      intersectionCount: preview.intersections.length,
      nodeCount: preview.roadNodes.length,
      graphType: preview.roadGraph.graphType,
      connectedComponentCount: preview.roadGraph.connectedComponentCount,
      resolvedSegments: freeze(
        preview.roadSegments.map((segment) =>
          freeze({
            roadSegmentId: segment.roadSegmentId,
            roadType: segment.roadType,
            direction: segment.direction,
            length: segment.length,
            roadWidth: segment.roadWidth,
            sidewalkWidth: segment.sidewalkWidth,
            vergeWidth: segment.vergeWidth,
            x: segment.x,
            y: segment.y,
            centerX: segment.centerX,
            centerY: segment.centerY,
            startX: segment.startX,
            startY: segment.startY
          })
        )
      ),
      resolvedIntersections: freeze(
        preview.intersections.map((intersection) =>
          freeze({
            intersectionId: intersection.intersectionId,
            nodeId: intersection.nodeId,
            intersectionType: intersection.intersectionType,
            connectedSegmentIds: intersection.connectedSegmentIds,
            lotVisibilityBuffer: intersection.lotVisibilityBuffer
          })
        )
      )
    }),
    lotLayer: freeze({
      lotCount: preview.lots.length,
      cornerLotCount: preview.lots.filter((lot) => lot.cornerStatus !== "interior")
        .length,
      showLotBoundaries: true,
      showLotLabels: true,
      showSetbacks: true
    }),
    buildingLayer: freeze({
      buildingInstanceCount: buildingInstances.length,
      resolvedBuildingAssets: freeze(buildingInstances)
    }),
    drivewayLayer: freeze({
      drivewayCount: preview.roadFrontageConnections.length,
      showDrivewayPaths: true,
      showGarageRelationship: true,
      showRoadConnections: true
    }),
    fenceLayer: freeze({
      fenceLotCount: preview.lots.length,
      showFenceBoundaries: true,
      showDrivewayOpenings: true,
      showPedestrianOpenings: true
    }),
    streetFeatureLayer: freeze({
      featureCount: preview.streetFeaturePlacements.length,
      showSidewalks: true,
      showGrassVerges: true,
      showStreetTrees: true,
      showStreetSigns: true,
      showMailboxes: true,
      featurePresentation
    }),
    debugLayer: freeze({
      showRoadGraphMarkers: true,
      showLotOutlines: true,
      showOrientationArrows: true,
      showValidationIndicators: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "instance_reuse_only",
      duplicateBuildingGenerationAllowed: false,
      previewOnlyAssetsAllowed: true,
      expectedBuildingInstances: preview.buildingPlacements.length,
      expectedStreetFeatureInstances: preview.streetFeaturePlacements.length
    })
  });
}

export function createSuburbanStreetBlockPreviewValidationReport(
  rawDefinition = suburbanStreetBlockPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const cwd = options.cwd ?? process.cwd();

  const roadConnectedNetworkValid =
    preview.validationResult.roadConnectivityValid === true &&
    preview.roadGraph.connectedComponentCount === 1;
  const validIntersections = preview.validationResult.intersectionValidity === true;
  const allLotsPopulated =
    preview.validationResult.allLotsGenerated === true &&
    preview.lots.length === 24 &&
    preview.lots.every((lot) =>
      preview.buildingPlacements.some((placement) => placement.lotId === lot.lotId)
    );
  const lotBoundariesValid = preview.validationResult.lotBoundaryValidity === true;
  const allBuildingIdsResolve = preview.buildingPlacements.every((placement) => {
    const lookup = definition.buildingAssetLookup[placement.assetId];
    return lookup
      ? fs.existsSync(path.resolve(cwd, lookup.gameplayAssetPath))
      : false;
  });
  const noBuildingOverlap = preview.validationResult.buildingPlacementValidity === true;
  const orientationValid = preview.buildingPlacements.every(
    (placement) =>
      facingDirectionToYaw(placement.rotation.facingDirection) ===
      placement.rotation.yawDegrees
  );
  const drivewaysConnected =
    preview.validationResult.drivewayConnectionValidity === true &&
    preview.roadFrontageConnections.every(
      (connection) =>
        connection.drivewayLink?.roadAligned === true &&
        connection.drivewayLink?.crossingNeighbouringLots === false
    );
  const streetFeaturesContained =
    preview.validationResult.streetFeatureContainmentValidity === true;
  const cameraProfileValid = validateCaptureProfiles(definition.previewCaptureProfiles);
  const deterministicSourceMatches =
    stableStringify(preview) ===
    stableStringify(readJson(path.resolve(cwd, definition.sourcePreviewPath)));

  const checks = freeze({
    roadConnectedNetworkValid: passFail(roadConnectedNetworkValid),
    validIntersections: passFail(validIntersections),
    allLotsPopulated: passFail(allLotsPopulated),
    lotBoundariesValid: passFail(lotBoundariesValid),
    allBuildingIdsResolve: passFail(allBuildingIdsResolve),
    noBuildingOverlap: passFail(noBuildingOverlap),
    orientationValid: passFail(orientationValid),
    drivewaysConnected: passFail(drivewaysConnected),
    streetFeaturesContained: passFail(streetFeaturesContained),
    cameraProfileValid: passFail(cameraProfileValid),
    deterministicSourceMatches: passFail(deterministicSourceMatches)
  });

  return freeze({
    validationId: definition.validationId,
    consumerId: definition.consumerId,
    sourcePreviewId: definition.sourcePreviewId,
    sceneId: definition.previewSceneId,
    checks,
    summary: freeze({
      validationPassed: Object.values(checks).every((status) => status === "PASS"),
      roadSegmentCount: preview.roadSegments.length,
      intersectionCount: preview.intersections.length,
      lotCount: preview.lots.length,
      buildingInstanceCount: preview.buildingPlacements.length,
      streetFeatureCount: preview.streetFeaturePlacements.length
    })
  });
}

export function writeSuburbanStreetBlockPreviewArtifacts(
  rawDefinition = suburbanStreetBlockPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createSuburbanStreetBlockPreviewSceneMetadata(definition, { cwd });
  const validation = createSuburbanStreetBlockPreviewValidationReport(definition, {
    cwd
  });
  const manifest = freeze({
    consumerId: definition.consumerId,
    adapterId: definition.adapterId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    sourcePreviewPath: definition.sourcePreviewPath,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildSuburbanStreetBlockPreviewBlenderCommand(definition)
  });
  const wrapperScriptPath = path.join(
    outputDirectory,
    "generate_suburban_street_block_preview_scene.py"
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

function buildStreetFeaturePresentation(preview, definition) {
  return freeze(
    preview.streetFeaturePlacements.map((feature) => {
      const registeredAsset = definition.siteAssetLookup[feature.assetId];
      const previewMarker = definition.featurePresentationLookup[feature.assetId];
      return freeze({
        featurePlacementId: feature.featurePlacementId,
        featureType: feature.featureType,
        assetId: feature.assetId,
        streetSegmentId: feature.streetSegmentId,
        relatedLotId: feature.relatedLotId,
        position: feature.position,
        rotation: feature.rotation,
        variationSeed: feature.variationSeed,
        placementRule: feature.placementRule,
        publicAreaClass: feature.publicAreaClass,
        gameplayAssetPath: registeredAsset?.gameplayAssetPath ?? null,
        presentationMode: registeredAsset
          ? "registered_asset"
          : previewMarker?.presentationMode ?? "preview_marker"
      });
    })
  );
}

function buildCapturePositions(preview) {
  const bounds = preview.blockBounds;
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
        z: round(sceneSpan * 1.55)
      }),
      rotation: freeze({ x: 0, y: 0, z: 0 })
    }),
    angled25D: freeze({
      position: freeze({
        x: round(centreX),
        y: round(centreY - spanY * 0.68),
        z: round(sceneSpan * 1.02)
      }),
      rotation: freeze({ x: 57.9, y: 0, z: 0 })
    }),
    streetLevel: freeze({
      position: freeze({
        x: round(bounds.minX + 10),
        y: round(centreY - 6),
        z: 5.2
      }),
      rotation: freeze({ x: 72.2, y: 0, z: 38.5 })
    })
  });
}

function validateCaptureProfiles(profiles) {
  return [profiles.topDown, profiles.angled25D, profiles.streetLevel].every(
    (profile) =>
      typeof profile.cameraId === "string" &&
      profile.cameraId.length > 0 &&
      typeof profile.viewType === "string" &&
      Number.isFinite(profile.angleDegrees)
  );
}

function facingDirectionToYaw(direction) {
  if (direction === "NORTH") {
    return 180;
  }
  if (direction === "SOUTH") {
    return 0;
  }
  if (direction === "EAST") {
    return 270;
  }
  return 90;
}

function buildWrapperScript(scriptPath) {
  return `"""
Wrapper script for ${SCENE_ID}.
Delegates to the canonical street block preview Blender script.
"""

from pathlib import Path
import runpy

SCRIPT_PATH = Path(__file__).resolve().parents[3] / "${scriptPath}"
runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
`;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "suburban street block preview consumer");
  return freeze({
    consumerId: normalizeNonEmptyString(definition.consumerId, "consumerId"),
    adapterId: normalizeNonEmptyString(definition.adapterId, "adapterId"),
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
    previewCaptureProfiles: freeze({
      topDown: normalizeCaptureProfile(
        definition.previewCaptureProfiles.topDown,
        "previewCaptureProfiles.topDown"
      ),
      angled25D: normalizeCaptureProfile(
        definition.previewCaptureProfiles.angled25D,
        "previewCaptureProfiles.angled25D"
      ),
      streetLevel: normalizeCaptureProfile(
        definition.previewCaptureProfiles.streetLevel,
        "previewCaptureProfiles.streetLevel"
      )
    }),
    buildingAssetLookup: freeze(
      Object.fromEntries(
        Object.entries(definition.buildingAssetLookup).map(([assetId, entry]) => [
          assetId,
          freeze({
            assetId: normalizeNonEmptyString(entry.assetId, `${assetId}.assetId`),
            familyId: normalizeNonEmptyString(entry.familyId, `${assetId}.familyId`),
            defaultPreviewLod: normalizeNonEmptyString(
              entry.defaultPreviewLod,
              `${assetId}.defaultPreviewLod`
            ),
            gameplayAssetPath: normalizeRelativePath(
              entry.gameplayAssetPath,
              `${assetId}.gameplayAssetPath`
            )
          })
        ])
      )
    ),
    siteAssetLookup: freeze(
      Object.fromEntries(
        Object.entries(definition.siteAssetLookup).map(([assetId, entry]) => [
          assetId,
          freeze({
            assetId: normalizeNonEmptyString(entry.assetId, `${assetId}.assetId`),
            gameplayAssetPath: normalizeRelativePath(
              entry.gameplayAssetPath,
              `${assetId}.gameplayAssetPath`
            )
          })
        ])
      )
    ),
    featurePresentationLookup: freeze(
      Object.fromEntries(
        Object.entries(definition.featurePresentationLookup).map(
          ([assetId, entry]) => [
            assetId,
            freeze({
              assetId: normalizeNonEmptyString(entry.assetId, `${assetId}.assetId`),
              presentationMode: normalizeNonEmptyString(
                entry.presentationMode,
                `${assetId}.presentationMode`
              )
            })
          ]
        )
      )
    )
  });
}

function normalizeCaptureProfile(profile, fieldName) {
  return freeze({
    cameraId: normalizeNonEmptyString(profile.cameraId, `${fieldName}.cameraId`),
    viewType: normalizeNonEmptyString(profile.viewType, `${fieldName}.viewType`),
    angleDegrees: normalizeNumber(profile.angleDegrees, `${fieldName}.angleDegrees`)
  });
}

function readSourcePreview(definition, cwd = process.cwd()) {
  return readJson(path.resolve(cwd, definition.sourcePreviewPath));
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function passFail(value) {
  return value ? "PASS" : "FAIL";
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (normalized.startsWith("/")) {
    throw new Error(`${fieldName} must remain repository-relative.`);
  }
  return normalized;
}

function normalizeNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number.`);
  }
  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value;
}

function round(value) {
  return Math.round(value * 100) / 100;
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

function freeze(value) {
  return Object.freeze(value);
}
