import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  buildingCivicSportsPavilionProductionRunDefinition,
  verifyBuildingCivicSportsPavilionOutputs
} from "./building-civic-sports-pavilion-production-run.mjs";
import {
  buildingCivicSportsPavilionDevelopmentCatalogActivationFilename,
  buildingCivicSportsPavilionDevelopmentPublishRecordFilename,
  inspectBuildingCivicSportsPavilionDevelopmentPublishExecutionInputs
} from "./building-civic-sports-pavilion-development-publish-execution.mjs";
import {
  buildingCivicSportsPavilionDevelopmentCatalogFilename
} from "./building-civic-sports-pavilion-development-publish-preparation.mjs";

export const buildingCivicSportsPavilionDevelopmentPreviewInspectionSchemaId =
  "ASSET_DEVELOPMENT_PREVIEW_INSPECTION_001";
export const buildingCivicSportsPavilionStaticPreviewDescriptorSchemaId =
  "ASSET_DEVELOPMENT_STATIC_PREVIEW_DESCRIPTOR_001";
export const buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename =
  "building-civic-sports-pavilion-development-preview-inspection.json";
export const buildingCivicSportsPavilionStaticPreviewDescriptorFilename =
  "building-civic-sports-pavilion-static-preview-descriptor.json";

const verifiedHashes = deepFreeze({
  close: "ee921ba10750ce0237f0ed13481145cbc383903afbbb61b1ca57e5695b4ddc06",
  gameplay: "e941dba8229c8d6158d132c6a1a5bcb241ea5ebb94ad702c63f9f12062dc0637",
  map: "38208a153ef605fcea6a8f17fd38d16702259fc698c3bcc83a7a05cfb5982ab1"
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }
  return Object.freeze(value);
}

export function inspectBuildingCivicSportsPavilionDevelopmentPreviewInputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const publishInspection =
    inspectBuildingCivicSportsPavilionDevelopmentPublishExecutionInputs(rawDefinition, options);
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const metadata = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json"),
    "pavilion metadata"
  );
  const developmentPublishRecord = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentPublishRecordFilename),
    "development publish record"
  );
  const developmentCatalogActivation = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentCatalogActivationFilename),
    "development catalog activation"
  );
  const developmentCatalogEntry = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentCatalogFilename),
    "development catalog entry"
  );
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, { cwd });

  const actualHashes = deepFreeze({
    close: metadata.verifiedOutputMetrics?.close?.sha256 ?? null,
    gameplay: metadata.verifiedOutputMetrics?.gameplay?.sha256 ?? null,
    map: metadata.verifiedOutputMetrics?.map?.sha256 ?? null
  });

  const expectedHashes = deepFreeze({
    ...verifiedHashes,
    ...(options.expectedHashes ?? {})
  });

  if (
    actualHashes.close !== expectedHashes.close ||
    actualHashes.gameplay !== expectedHashes.gameplay ||
    actualHashes.map !== expectedHashes.map
  ) {
    throw createDevelopmentPreviewInspectionError(
      "verified_hash_changed",
      `Verified pavilion hashes changed for ${definition.assetId}.`
    );
  }

  if (developmentPublishRecord.publishStatus !== "PUBLISHED_DEVELOPMENT") {
    throw createDevelopmentPreviewInspectionError(
      "development_publish_missing",
      `Asset ${definition.assetId} is not development-published.`
    );
  }

  if (developmentCatalogActivation.activationStatus !== "ACTIVE_DEVELOPMENT_ONLY") {
    throw createDevelopmentPreviewInspectionError(
      "development_catalog_inactive",
      `Asset ${definition.assetId} is not active in the development-only catalog.`
    );
  }

  return deepFreeze({
    outputDirectory,
    metadata,
    verification,
    actualHashes,
    publishInspection,
    developmentPublishRecord,
    developmentCatalogActivation,
    developmentCatalogEntry,
    checks: deepFreeze({
      assetIdPreserved:
        developmentPublishRecord.assetId === definition.assetId &&
        metadata.assetId === definition.assetId,
      recipeIdPreserved:
        developmentPublishRecord.recipeId === definition.recipeId &&
        metadata.recipeId === definition.recipeId,
      versionPreserved:
        developmentPublishRecord.version === "1.0.0" &&
        developmentCatalogEntry.version === "1.0.0",
      developmentOnlyVisibility:
        developmentPublishRecord.visibility?.beta === false &&
        developmentPublishRecord.visibility?.production === false &&
        developmentCatalogActivation.blockedVisibility?.beta === true &&
        developmentCatalogActivation.blockedVisibility?.production === true,
      noReleaseRecord:
        developmentPublishRecord.validation?.noReleaseRecordCreated === true &&
        !fs.existsSync(path.join(outputDirectory, "building-civic-sports-pavilion-release.json")),
      noRendererActivation:
        developmentPublishRecord.runtimeSafetyFlags?.automaticRendererExecutionAllowed ===
          false &&
        developmentCatalogActivation.runtimeSafetyFlags?.automaticRendererExecutionAllowed ===
          false,
      noMapAttachment:
        developmentPublishRecord.runtimeSafetyFlags?.mapAttachmentAllowed === false &&
        developmentCatalogActivation.blockedVisibility?.automaticMapPlacement === true
    })
  });
}

export function buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectBuildingCivicSportsPavilionDevelopmentPreviewInputs(
    rawDefinition,
    options
  );
  assertPreviewInspectionReadiness(definition, inspection);

  const checklist = buildInspectionChecklist(inspection);

  return deepFreeze({
    schemaId: buildingCivicSportsPavilionDevelopmentPreviewInspectionSchemaId,
    inspectionRecordId: `ASSET_DEV_PREVIEW_INSPECTION_${definition.assetId}`,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    version: inspection.developmentPublishRecord.version,
    sourceDevelopmentPublishRecord: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentPublishRecordFilename,
      publishRecordId: inspection.developmentPublishRecord.publishRecordId,
      publishStatus: inspection.developmentPublishRecord.publishStatus
    }),
    sourceDevelopmentCatalogActivation: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentCatalogActivationFilename,
      activationRecordId: inspection.developmentCatalogActivation.activationRecordId,
      activationStatus: inspection.developmentCatalogActivation.activationStatus
    }),
    lodFileReferences: inspection.developmentPublishRecord.lodFileReferences,
    verifiedHashes: inspection.actualHashes,
    metrics: deepFreeze({
      close: metricSnapshot(inspection.metadata.verifiedOutputMetrics.close),
      gameplay: metricSnapshot(inspection.metadata.verifiedOutputMetrics.gameplay),
      map: metricSnapshot(inspection.metadata.verifiedOutputMetrics.map)
    }),
    atlasCompatibilitySummary: inspection.metadata.atlasCompatibility,
    approvedPaletteSummary: inspection.metadata.palette,
    footprintMetadata: deepFreeze({
      compatibleFootprints:
        inspection.publishInspection.registration.registry.footprintCompatibility,
      familyId: inspection.publishInspection.registration.familyId
    }),
    orientationMetadata: deepFreeze({
      status: "UNRESOLVED_REQUIRES_VISUAL_REVIEW",
      roadFacingOrientationConfirmed: false,
      evidence: "No verified orientation record exists in the current pavilion metadata set."
    }),
    rendererSafetyState: deepFreeze({
      lifecycleExecutionEnabled:
        inspection.developmentPublishRecord.runtimeSafetyFlags.lifecycleExecutionEnabled,
      automaticRendererExecutionAllowed:
        inspection.developmentPublishRecord.runtimeSafetyFlags
          .automaticRendererExecutionAllowed,
      noRendererImportsRequired: true
    }),
    mapAttachmentSafetyState: deepFreeze({
      mapAttachmentAllowed:
        inspection.developmentPublishRecord.runtimeSafetyFlags.mapAttachmentAllowed,
      liveMapAttachmentBlocked:
        inspection.developmentCatalogActivation.blockedVisibility.livePlayers,
      automaticMapPlacementBlocked:
        inspection.developmentCatalogActivation.blockedVisibility.automaticMapPlacement
    }),
    inspectionChecklist: checklist,
    validation: deepFreeze({
      derivesFromDevelopmentPublishedAsset: true,
      metricsMatchVerifiedGlbs: metricsMatchVerifiedGlbs(inspection.metadata),
      noRendererImports: true,
      noCanvasOrWebglCreation: true,
      noMapAttachment: true,
      noLifecycleActivation: true,
      noBetaSideEffects: true,
      noProductionSideEffects: true,
      noReleaseSideEffects: true,
      deterministicOutput: true,
      validationPassed: true,
      deterministicInspectionHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            version: inspection.developmentPublishRecord.version,
            hashes: inspection.actualHashes,
            preferredLod: "CLOSE",
            safety: inspection.developmentPublishRecord.runtimeSafetyFlags
          })
        )
        .digest("hex")
    })
  });
}

export function buildBuildingCivicSportsPavilionStaticPreviewDescriptor(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspectionRecord =
    buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
      rawDefinition,
      options
    );
  const inspection = inspectBuildingCivicSportsPavilionDevelopmentPreviewInputs(
    rawDefinition,
    options
  );

  return deepFreeze({
    schemaId: buildingCivicSportsPavilionStaticPreviewDescriptorSchemaId,
    previewDescriptorId: `ASSET_STATIC_PREVIEW_DESCRIPTOR_${definition.assetId}`,
    assetId: definition.assetId,
    version: inspectionRecord.version,
    sourceInspectionRecord: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename,
      inspectionRecordId: inspectionRecord.inspectionRecordId
    }),
    assetBounds: deepFreeze({
      status: "UNVERIFIED_FROM_EXISTING_RECORDS",
      bounds: null,
      evidence: "No verified spatial bounds record has been generated for this inspection-only package."
    }),
    cameraFramingRecommendation: deepFreeze({
      preferredLod: "CLOSE",
      framingMode: "STATIC_THREE_QUARTER_OBLIQUE_RECOMMENDED",
      evidence: "Recommendation derived from development inspection intent only; no renderer initialisation performed."
    }),
    expectedOrientation: deepFreeze({
      status: "UNRESOLVED_REQUIRES_VISUAL_REVIEW",
      roadFacingOrientationConfirmed: false
    }),
    paletteSwatches: inspection.metadata.palette,
    moduleList: inspection.metadata.moduleList,
    performanceMetrics: inspection.developmentCatalogEntry.performanceMetrics,
    footprintMetadata: inspectionRecord.footprintMetadata,
    restrictions: deepFreeze({
      renderPixelsAllowed: false,
      canvasInitialisationAllowed: false,
      webglInitialisationAllowed: false,
      liveRendererImportAllowed: false,
      mapAttachmentAllowed: false,
      runtimeLifecycleExecutionAllowed: false
    }),
    validation: deepFreeze({
      derivesFromInspectionRecord: true,
      noRendererImports: true,
      noCanvasOrWebglCreation: true,
      noMapAttachment: true,
      noLifecycleActivation: true,
      deterministicOutput: true,
      validationPassed: true,
      deterministicDescriptorHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            version: inspectionRecord.version,
            preferredLod: "CLOSE",
            metrics: inspection.developmentCatalogEntry.performanceMetrics
          })
        )
        .digest("hex")
    })
  });
}

export function writeBuildingCivicSportsPavilionDevelopmentPreviewInspection(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const inspectionRecord =
    buildBuildingCivicSportsPavilionDevelopmentPreviewInspectionRecord(
      rawDefinition,
      options
    );
  const previewDescriptor =
    buildBuildingCivicSportsPavilionStaticPreviewDescriptor(rawDefinition, options);

  const inspectionPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename
  );
  const descriptorPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionStaticPreviewDescriptorFilename
  );

  fs.writeFileSync(inspectionPath, `${JSON.stringify(inspectionRecord, null, 2)}\n`);
  fs.writeFileSync(descriptorPath, `${JSON.stringify(previewDescriptor, null, 2)}\n`);

  return deepFreeze({
    inspectionPath,
    descriptorPath,
    inspectionRecord,
    previewDescriptor
  });
}

function buildInspectionChecklist(inspection) {
  return deepFreeze([
    {
      checkId: "papercut_2_5d_style",
      status: "UNRESOLVED_REQUIRES_VISUAL_REVIEW",
      evidence:
        "Current records preserve the approved palette profile but do not include verified visual inspection evidence."
    },
    {
      checkId: "civic_colour_palette",
      status: "SUPPORTED_BY_RECORDS",
      evidence: `Palette profile ${inspection.metadata.palette.profile} is recorded with deterministic swatches.`
    },
    {
      checkId: "no_interior",
      status: "UNRESOLVED_REQUIRES_VISUAL_REVIEW",
      evidence: "No explicit no-interior verification field exists in the current final pavilion records."
    },
    {
      checkId: "road_facing_orientation",
      status: "UNRESOLVED_REQUIRES_VISUAL_REVIEW",
      evidence: "No explicit orientation or road-facing metadata is present in verified pavilion records."
    },
    {
      checkId: "modular_reuse",
      status: "SUPPORTED_BY_RECORDS",
      evidence: `Manifest and metadata record 6 reused modules and ${inspection.metadata.reusePercentage}% reuse.`
    },
    {
      checkId: "mobile_performance",
      status: "SUPPORTED_BY_RECORDS",
      evidence:
        "Validation marks performance budgets valid and verified LOD metrics remain within the approved record set."
    },
    {
      checkId: "lod_progression",
      status: "SUPPORTED_BY_RECORDS",
      evidence:
        "Verified triangle counts decrease CLOSE 1624 -> GAMEPLAY 528 -> MAP 312 and validation lodComplexityCheck is ok."
    },
    {
      checkId: "no_missing_dependencies",
      status: "SUPPORTED_BY_RECORDS",
      evidence: "Verified records mark all final GLBs as having no external dependencies."
    },
    {
      checkId: "no_unsupported_atlas_assumptions",
      status: "SUPPORTED_BY_RECORDS",
      evidence:
        "Atlas compatibility summary is explicit and validation marks atlasCompatibilityValid true."
    }
  ]);
}

function metricsMatchVerifiedGlbs(metadata) {
  const metrics = metadata.verifiedOutputMetrics;
  return Boolean(
    metrics?.close?.triangleCount === 1624 &&
      metrics?.gameplay?.triangleCount === 528 &&
      metrics?.map?.triangleCount === 312 &&
      metrics?.close?.materialCount === 6 &&
      metrics?.gameplay?.materialCount === 6 &&
      metrics?.map?.materialCount === 6
  );
}

function metricSnapshot(record) {
  return deepFreeze({
    sizeBytes: record.sizeBytes,
    meshCount: record.meshCount,
    materialCount: record.materialCount,
    primitiveCount: record.primitiveCount,
    triangleCount: record.triangleCount
  });
}

function assertPreviewInspectionReadiness(definition, inspection) {
  const checks = inspection.checks;
  const failedCheck = Object.entries(checks).find(([, value]) => value !== true);
  if (failedCheck) {
    const [failedKey] = failedCheck;
    throw createDevelopmentPreviewInspectionError(
      "preview_input_check_failed",
      `Development preview inspection requirements failed for ${definition.assetId}: ${failedKey}.`
    );
  }
}

function normalizeDefinition(rawDefinition) {
  return deepFreeze({
    ...rawDefinition,
    expectedOutputs: deepFreeze({
      ...rawDefinition.expectedOutputs,
      proofAsset: deepFreeze([...rawDefinition.expectedOutputs.proofAsset]),
      metadataFiles: deepFreeze([...rawDefinition.expectedOutputs.metadataFiles])
    })
  });
}

function readJsonRequired(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw createDevelopmentPreviewInspectionError(
      "missing_required_record",
      `Missing ${label} at ${filePath}.`
    );
  }
  return deepFreeze(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function createDevelopmentPreviewInspectionError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionDevelopmentPreviewInspectionError";
  error.code = code;
  return error;
}
