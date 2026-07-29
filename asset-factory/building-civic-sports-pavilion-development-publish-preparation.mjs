import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  assetPublishRecordSchemaId,
  assetPublishingPipelineLayerSchemaId
} from "./asset-publishing-pipeline.mjs";
import {
  assetEnvironmentRecordSchemaId,
  assetEnvironmentSeparationLayerSchemaId
} from "./asset-environment-separation.mjs";
import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import {
  buildingCivicSportsPavilionProductionRunDefinition,
  verifyBuildingCivicSportsPavilionOutputs
} from "./building-civic-sports-pavilion-production-run.mjs";

export const buildingCivicSportsPavilionDevelopmentPublishCandidateFilename =
  "building-civic-sports-pavilion-development-publish-candidate.json";
export const buildingCivicSportsPavilionDevelopmentCatalogFilename =
  "building-civic-sports-pavilion-development-catalog-entry.json";
export const buildingCivicSportsPavilionDevelopmentPreparationSchemaId =
  "ASSET_DEVELOPMENT_PUBLISH_PREPARATION_001";
export const buildingCivicSportsPavilionDevelopmentCatalogSchemaId =
  "ASSET_DEVELOPMENT_CATALOG_ENTRY_001";

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

export function inspectBuildingCivicSportsPavilionDevelopmentPublishInputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const manifest = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json"),
    "pavilion manifest"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json"),
    "pavilion metadata"
  );
  const validation = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-validation.json"),
    "pavilion validation"
  );
  const registration = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-registration.json"),
    "pavilion registration record"
  );
  const approval = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-approval.json"),
    "pavilion approval record"
  );
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, { cwd });
  const registry = createAssetFactoryRegistryLayer();
  const registeredAsset = registry.getAssetById(definition.assetId);

  if (!registeredAsset) {
    throw createDevelopmentPreparationError(
      "missing_registry_asset",
      `Asset ${definition.assetId} is not present in the Asset Factory registry.`
    );
  }

  const expectedHashes = deepFreeze({
    ...verifiedHashes,
    ...(options.expectedHashes ?? {})
  });

  const actualHashes = deepFreeze({
    close: manifest.verifiedOutputs?.close?.sha256 ?? null,
    gameplay: manifest.verifiedOutputs?.gameplay?.sha256 ?? null,
    map: manifest.verifiedOutputs?.map?.sha256 ?? null
  });

  const hashIntegrity = deepFreeze({
    close: actualHashes.close === expectedHashes.close,
    gameplay: actualHashes.gameplay === expectedHashes.gameplay,
    map: actualHashes.map === expectedHashes.map
  });

  const allHashesMatch = Object.values(hashIntegrity).every(Boolean);
  if (!allHashesMatch) {
    throw createDevelopmentPreparationError(
      "verified_hash_changed",
      `Verified pavilion hashes changed for ${definition.assetId}.`
    );
  }

  return deepFreeze({
    outputDirectory,
    manifest,
    metadata,
    validation,
    registration,
    approval,
    verification,
    registeredAsset,
    actualHashes,
    expectedHashes,
    hashIntegrity,
    approvalReady:
      approval.assetId === definition.assetId &&
      approval.recipeId === definition.recipeId &&
      approval.approvalStatus === "QUALITY_APPROVED" &&
      approval.publishStatus === "not_published",
    noTemporaryFilenames:
      !JSON.stringify({ manifest, metadata, validation, registration, approval }).includes(
        ".tmp."
      ),
    noExternalDependencies: validation.noExternalDependencies === true
  });
}

export function buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectBuildingCivicSportsPavilionDevelopmentPublishInputs(
    rawDefinition,
    options
  );

  if (!inspection.approvalReady) {
    throw createDevelopmentPreparationError(
      "approval_not_ready",
      `Asset ${definition.assetId} is not ready for development publish preparation.`
    );
  }

  if (!inspection.verification.registrationGate.ready) {
    throw createDevelopmentPreparationError(
      "verification_gate_blocked",
      `Asset ${definition.assetId} failed development publish preparation verification.`
    );
  }

  if (!inspection.noTemporaryFilenames) {
    throw createDevelopmentPreparationError(
      "temporary_filename_detected",
      `Temporary filenames remain in pavilion records for ${definition.assetId}.`
    );
  }

  const manifest = inspection.manifest;
  const metadata = inspection.metadata;
  const validation = inspection.validation;
  const registration = inspection.registration;
  const approval = inspection.approval;
  const registeredAsset = inspection.registeredAsset;
  const outputDirectory = inspection.outputDirectory;

  const candidate = deepFreeze({
    schemaId: buildingCivicSportsPavilionDevelopmentPreparationSchemaId,
    candidateId: `ASSET_DEV_PUBLISH_${definition.assetId}`,
    sourcePublishingContract: deepFreeze({
      publishRecordSchemaId: assetPublishRecordSchemaId,
      publishingLayerSchemaId: assetPublishingPipelineLayerSchemaId,
      environmentRecordSchemaId: assetEnvironmentRecordSchemaId,
      environmentLayerSchemaId: assetEnvironmentSeparationLayerSchemaId
    }),
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    version: manifest.version,
    sourceRegistrationRecord: deepFreeze({
      filename: "building-civic-sports-pavilion-registration.json",
      registrationStatus: registration.registrationStatus,
      deterministicFingerprint: registration.deterministicFingerprint
    }),
    sourceApprovalRecord: deepFreeze({
      filename: "building-civic-sports-pavilion-approval.json",
      approvalRecordId: approval.approvalRecordId,
      approvalStatus: approval.approvalStatus,
      deterministicHash: approval.validation?.deterministicApprovalHash ?? null
    }),
    lodFiles: deepFreeze({
      close: {
        filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb",
        absolutePath: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
        sha256: manifest.verifiedOutputs.close.sha256,
        metrics: metricSnapshot(manifest.verifiedOutputs.close)
      },
      gameplay: {
        filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
        absolutePath: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
        sha256: manifest.verifiedOutputs.gameplay.sha256,
        metrics: metricSnapshot(manifest.verifiedOutputs.gameplay)
      },
      map: {
        filename: "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb",
        absolutePath: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"),
        sha256: manifest.verifiedOutputs.map.sha256,
        metrics: metricSnapshot(manifest.verifiedOutputs.map)
      }
    }),
    targetEnvironment: "DEVELOPMENT",
    publishStatus: "PREPARED",
    betaEligibility: false,
    productionEligibility: false,
    environmentGuards: deepFreeze({
      developmentAllowed: true,
      testingActivated: false,
      betaBlocked: true,
      productionBlocked: true,
      automaticPublishingDisabled: true,
      releaseCreationDisabled: true,
      preservedPromotionRules: deepFreeze([
        "DEVELOPMENT_TO_TESTING",
        "TESTING_TO_APPROVAL",
        "APPROVAL_TO_PRODUCTION"
      ])
    }),
    lifecycle: deepFreeze({
      registrationStatus: registration.registrationStatus,
      approvalStatus: approval.approvalStatus,
      publishStatus: approval.publishStatus,
      releaseStatus: approval.releaseStatus
    }),
    atlasCompatibility: registeredAsset.atlasCompatibility,
    validation: deepFreeze({
      candidateDerivesFromApprovedRecords: true,
      developmentOnlyTarget: true,
      hashesMatchVerifiedTruth: true,
      requiredFilesExist: true,
      betaBlocked: true,
      productionBlocked: true,
      noPublishSideEffects: true,
      noReleaseSideEffects: true,
      deterministicOutput: true,
      validationPassed: true,
      deterministicCandidateHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            recipeId: definition.recipeId,
            version: manifest.version,
            hashes: inspection.actualHashes,
            targetEnvironment: "DEVELOPMENT",
            publishStatus: "PREPARED"
          })
        )
        .digest("hex")
    })
  });

  return candidate;
}

export function buildBuildingCivicSportsPavilionDevelopmentCatalogEntry(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectBuildingCivicSportsPavilionDevelopmentPublishInputs(
    rawDefinition,
    options
  );
  const manifest = inspection.manifest;
  const metadata = inspection.metadata;
  const registeredAsset = inspection.registeredAsset;
  const outputDirectory = inspection.outputDirectory;

  return deepFreeze({
    schemaId: buildingCivicSportsPavilionDevelopmentCatalogSchemaId,
    catalogEntryId: `ASSET_DEV_CATALOG_${definition.assetId}`,
    assetId: definition.assetId,
    category: definition.category,
    family: registeredAsset.assetFamily,
    version: manifest.version,
    approvedPalette: metadata.palette,
    availableLods: deepFreeze([
      buildCatalogLodEntry("close", manifest.verifiedOutputs.close, outputDirectory),
      buildCatalogLodEntry("gameplay", manifest.verifiedOutputs.gameplay, outputDirectory),
      buildCatalogLodEntry("map", manifest.verifiedOutputs.map, outputDirectory)
    ]),
    performanceMetrics: deepFreeze({
      close: metricSnapshot(manifest.verifiedOutputs.close),
      gameplay: metricSnapshot(manifest.verifiedOutputs.gameplay),
      map: metricSnapshot(manifest.verifiedOutputs.map)
    }),
    atlasCompatibility: registeredAsset.atlasCompatibility,
    localDevelopmentFileReferences: deepFreeze({
      sourceBlend: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"),
      closeGlb: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb"),
      gameplayGlb: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"),
      mapGlb: path.join(outputDirectory, "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb")
    }),
    usageConstraints: deepFreeze({
      rendererActivationAllowed: false,
      liveMapAttachmentAllowed: false,
      developmentPreviewOnly: true
    })
  });
}

export function writeBuildingCivicSportsPavilionDevelopmentPublishPreparation(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const candidate = buildBuildingCivicSportsPavilionDevelopmentPublishCandidate(
    rawDefinition,
    options
  );
  const catalogEntry = buildBuildingCivicSportsPavilionDevelopmentCatalogEntry(
    rawDefinition,
    options
  );
  const candidatePath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionDevelopmentPublishCandidateFilename
  );
  const catalogPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionDevelopmentCatalogFilename
  );

  fs.writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`, "utf8");
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalogEntry, null, 2)}\n`, "utf8");

  return deepFreeze({
    candidatePath,
    catalogPath,
    candidate,
    catalogEntry
  });
}

function buildCatalogLodEntry(lodKey, record, outputDirectory) {
  return deepFreeze({
    lod: lodKey.toUpperCase(),
    filename: record.filename,
    absolutePath: path.join(outputDirectory, record.filename),
    sha256: record.sha256,
    metrics: metricSnapshot(record)
  });
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

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  return deepFreeze({
    assetId: normalizeString(definition.assetId, "assetId"),
    recipeId: normalizeString(definition.recipeId, "recipeId"),
    category: normalizeString(definition.category, "category"),
    outputLocation: normalizeString(definition.outputLocation, "outputLocation")
  });
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDevelopmentPreparationError(
      "invalid_development_publish_definition",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function readJsonRequired(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createDevelopmentPreparationError(
      "missing_development_publish_record",
      `Missing ${label} at ${absolutePath}.`
    );
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function createDevelopmentPreparationError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionDevelopmentPublishPreparationError";
  error.code = code;
  return error;
}
