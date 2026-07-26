import fs from "node:fs";
import path from "node:path";

const PREVIEW_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001";
const SCENE_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001";
const VALIDATION_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001";
const CONSUMER_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_CONSUMER_001";
const ADAPTER_ID = "NEIGHBOURHOOD_PREVIEW_ADAPTER_001";

export const suburbanNeighbourhoodPreviewConsumerDefinition = deepFreeze({
  consumerId: CONSUMER_ID,
  adapterId: ADAPTER_ID,
  sourcePreviewId: PREVIEW_ID,
  sourcePreviewPath:
    "asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json",
  blenderScriptPath:
    "asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py",
  outputDirectory:
    "asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001",
  previewSceneId: SCENE_ID,
  validationId: VALIDATION_ID,
  previewCaptureProfiles: deepFreeze({
    topDown: deepFreeze({
      cameraId: "SUBURBAN_CAPTURE_TOP_DOWN_001",
      viewType: "top_down",
      angleDegrees: 90
    }),
    angled25D: deepFreeze({
      cameraId: "SUBURBAN_CAPTURE_ANGLED_25D_001",
      viewType: "angled_25d",
      angleDegrees: 58
    }),
    streetLevel: deepFreeze({
      cameraId: "SUBURBAN_CAPTURE_STREET_LEVEL_001",
      viewType: "street_level",
      angleDegrees: 18
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

export function createSuburbanNeighbourhoodPreviewConsumer(
  rawDefinition = suburbanNeighbourhoodPreviewConsumerDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildSuburbanNeighbourhoodPreviewBlenderCommand(
  rawDefinition = suburbanNeighbourhoodPreviewConsumerDefinition
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

export function createSuburbanNeighbourhoodPreviewSceneMetadata(
  rawDefinition = suburbanNeighbourhoodPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
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

  return freeze({
    sceneId: definition.previewSceneId,
    consumerId: definition.consumerId,
    adapterId: definition.adapterId,
    sourcePreviewId: definition.sourcePreviewId,
    sourcePreviewPath: definition.sourcePreviewPath,
    previewType: "suburban_neighbourhood_visual_inspection",
    sourceSeed: preview.seed,
    cameraProfile: freeze({
      profileId: "SUBURBAN_NEIGHBOURHOOD_OVERVIEW_001",
      orientation: "north_up",
      tiltDegrees: 58,
      framing: "full_block_overview",
      paddingMeters: 6
    }),
    visualCaptureWorkflow: freeze({
      previewVersion: "SESSION_42_RULE_CORRECTION_PASS",
      seed: preview.seed,
      topDown: definition.previewCaptureProfiles.topDown,
      angled25D: definition.previewCaptureProfiles.angled25D,
      streetLevel: definition.previewCaptureProfiles.streetLevel
    }),
    themeProfile: freeze(preview.themeProfile),
    resolvedBuildingAssets: freeze(buildingInstances),
    roadLayer: freeze({
      roadSegmentId: preview.roadLayout.roadSegmentId,
      orientation: "north_up",
      roadWidth: preview.roadLayout.roadWidth,
      sidewalkWidth: preview.roadLayout.sidewalkWidth,
      vergeWidth: preview.roadLayout.vergeWidth,
      streetLength: preview.roadLayout.streetLength
    }),
    lotLayer: freeze({
      lotCount: preview.lots.length,
      showLotBoundaries: true,
      showLotLabels: true
    }),
    drivewayLayer: freeze({
      drivewayCount: preview.roadFrontageConnections.length,
      showDrivewayPaths: true,
      useDrivewaySideOffsets: true
    }),
    fenceLayer: freeze({
      fenceLotCount: preview.lots.length,
      showFenceBoundaries: true,
      showDrivewayOpenings: true,
      showPedestrianOpenings: true
    }),
    landscapeLayer: freeze({
      landscapeInstanceCount: preview.landscapePlacements.length,
      showTrees: true,
      showBushes: true,
      showLawns: true,
      useRegisteredLandscapeAssets: true
    }),
    debugLayer: freeze({
      showLotBoundaryOutlines: true,
      showOrientationArrows: true,
      showDrivewayMarkers: true,
      showValidationMarkers: true,
      passColour: "GREEN",
      failColour: "RED"
    }),
    performanceProfile: freeze({
      reuseMode: "instance_reuse_only",
      duplicateBuildingGenerationAllowed: false,
      controlledSceneSize: true,
      expectedBuildingInstances: preview.buildingPlacements.length
    })
  });
}

export function createSuburbanNeighbourhoodPreviewValidationReport(
  rawDefinition = suburbanNeighbourhoodPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const preview = readSourcePreview(definition, options.cwd);
  const cwd = options.cwd ?? process.cwd();

  const allBuildingIdsResolve = preview.buildingPlacements.every((placement) => {
    const lookup = definition.buildingAssetLookup[placement.assetId];
    if (!lookup) {
      return false;
    }
    return fs.existsSync(path.resolve(cwd, lookup.gameplayAssetPath));
  });

  const allLotsContainBuildings = preview.lots.every((lot) =>
    preview.buildingPlacements.some((placement) => placement.lotId === lot.lotId)
  );

  const noPlacementOverlap = preview.validationResult.noOverlap === true;
  const allDrivewaysConnect =
    preview.validationResult.drivewayAssignments === true &&
    preview.validationResult.validDrivewayConnections === true &&
    preview.roadFrontageConnections.every(
      (connection) => connection.drivewayLink?.roadAligned === true
    );
  const orientationValid = preview.validationResult.validBuildingOrientation === true;
  const deterministicSourceMatches = stableStringify(preview) === stableStringify(readJson(path.resolve(cwd, definition.sourcePreviewPath)));

  const checks = freeze({
    allBuildingIdsResolve: passFail(allBuildingIdsResolve),
    allLotsPopulated: passFail(allLotsContainBuildings),
    noPlacementOverlap: passFail(noPlacementOverlap),
    drivewayConnectionsValid: passFail(allDrivewaysConnect),
    orientationValid: passFail(orientationValid),
    fenceOpeningsValid: passFail(preview.validationResult.fenceOpeningsValid === true),
    landscapeContainmentValid: passFail(
      preview.validationResult.landscapeContainment === true
    ),
    themeWeightingValid: passFail(preview.validationResult.themeWeightingValid === true),
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
      buildingInstanceCount: preview.buildingPlacements.length,
      lotCount: preview.lots.length,
      drivewayConnectionCount: preview.roadFrontageConnections.length
    })
  });
}

export function writeSuburbanNeighbourhoodPreviewPrototypeArtifacts(
  rawDefinition = suburbanNeighbourhoodPreviewConsumerDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputDirectory);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const metadata = createSuburbanNeighbourhoodPreviewSceneMetadata(definition, { cwd });
  const validation = createSuburbanNeighbourhoodPreviewValidationReport(definition, {
    cwd
  });
  const manifest = freeze({
    consumerId: definition.consumerId,
    adapterId: definition.adapterId,
    sceneId: definition.previewSceneId,
    validationId: definition.validationId,
    sourcePreviewPath: definition.sourcePreviewPath,
    blenderScriptPath: definition.blenderScriptPath,
    blenderCommand: buildSuburbanNeighbourhoodPreviewBlenderCommand(definition)
  });
  const wrapperScriptPath = path.join(
    outputDirectory,
    "generate_suburban_neighbourhood_preview_scene.py"
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

function buildWrapperScript(scriptPath) {
  return `"""
Wrapper script for ${SCENE_ID}.
Delegates to the canonical neighbourhood preview Blender script.
"""

from pathlib import Path
import runpy

SCRIPT_PATH = Path(__file__).resolve().parents[3] / "${scriptPath}"
runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
`;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "suburban neighbourhood preview consumer");
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
      topDown: freeze({
        cameraId: normalizeNonEmptyString(
          definition.previewCaptureProfiles.topDown.cameraId,
          "previewCaptureProfiles.topDown.cameraId"
        ),
        viewType: normalizeNonEmptyString(
          definition.previewCaptureProfiles.topDown.viewType,
          "previewCaptureProfiles.topDown.viewType"
        ),
        angleDegrees: normalizeNumber(
          definition.previewCaptureProfiles.topDown.angleDegrees,
          "previewCaptureProfiles.topDown.angleDegrees"
        )
      }),
      angled25D: freeze({
        cameraId: normalizeNonEmptyString(
          definition.previewCaptureProfiles.angled25D.cameraId,
          "previewCaptureProfiles.angled25D.cameraId"
        ),
        viewType: normalizeNonEmptyString(
          definition.previewCaptureProfiles.angled25D.viewType,
          "previewCaptureProfiles.angled25D.viewType"
        ),
        angleDegrees: normalizeNumber(
          definition.previewCaptureProfiles.angled25D.angleDegrees,
          "previewCaptureProfiles.angled25D.angleDegrees"
        )
      }),
      streetLevel: freeze({
        cameraId: normalizeNonEmptyString(
          definition.previewCaptureProfiles.streetLevel.cameraId,
          "previewCaptureProfiles.streetLevel.cameraId"
        ),
        viewType: normalizeNonEmptyString(
          definition.previewCaptureProfiles.streetLevel.viewType,
          "previewCaptureProfiles.streetLevel.viewType"
        ),
        angleDegrees: normalizeNumber(
          definition.previewCaptureProfiles.streetLevel.angleDegrees,
          "previewCaptureProfiles.streetLevel.angleDegrees"
        )
      })
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
    )
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
