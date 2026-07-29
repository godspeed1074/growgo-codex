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
import {
  buildingCivicSportsPavilionProductionRunDefinition,
  verifyBuildingCivicSportsPavilionOutputs
} from "./building-civic-sports-pavilion-production-run.mjs";
import {
  buildBuildingCivicSportsPavilionDevelopmentCatalogEntry,
  buildBuildingCivicSportsPavilionDevelopmentPublishCandidate,
  buildingCivicSportsPavilionDevelopmentCatalogFilename,
  buildingCivicSportsPavilionDevelopmentPublishCandidateFilename
} from "./building-civic-sports-pavilion-development-publish-preparation.mjs";

export const buildingCivicSportsPavilionDevelopmentPublishExecutionSchemaId =
  "ASSET_DEVELOPMENT_PUBLISH_EXECUTION_001";
export const buildingCivicSportsPavilionDevelopmentCatalogActivationSchemaId =
  "ASSET_DEVELOPMENT_CATALOG_ACTIVATION_001";
export const buildingCivicSportsPavilionDevelopmentPublishRecordFilename =
  "building-civic-sports-pavilion-development-publish-record.json";
export const buildingCivicSportsPavilionDevelopmentCatalogActivationFilename =
  "building-civic-sports-pavilion-development-catalog-activation.json";

const verifiedHashes = deepFreeze({
  close: "ee921ba10750ce0237f0ed13481145cbc383903afbbb61b1ca57e5695b4ddc06",
  gameplay: "e941dba8229c8d6158d132c6a1a5bcb241ea5ebb94ad702c63f9f12062dc0637",
  map: "38208a153ef605fcea6a8f17fd38d16702259fc698c3bcc83a7a05cfb5982ab1"
});

const runtimeSafetyFlags = deepFreeze({
  lifecycleExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  runtimeExecutionAuthorized: false
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

export function inspectBuildingCivicSportsPavilionDevelopmentPublishExecutionInputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const candidate = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentPublishCandidateFilename),
    "development publish candidate"
  );
  const catalog = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentCatalogFilename),
    "development catalog entry"
  );
  const approval = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-approval.json"),
    "approval record"
  );
  const registration = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-registration.json"),
    "registration record"
  );
  const validation = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-validation.json"),
    "validation record"
  );
  const manifest = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json"),
    "manifest"
  );
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, { cwd });

  const actualHashes = deepFreeze({
    close: manifest.verifiedOutputs?.close?.sha256 ?? null,
    gameplay: manifest.verifiedOutputs?.gameplay?.sha256 ?? null,
    map: manifest.verifiedOutputs?.map?.sha256 ?? null
  });

  const expectedHashes = deepFreeze({
    ...verifiedHashes,
    ...(options.expectedHashes ?? {})
  });

  const hashesMatch =
    actualHashes.close === expectedHashes.close &&
    actualHashes.gameplay === expectedHashes.gameplay &&
    actualHashes.map === expectedHashes.map;

  if (!hashesMatch) {
    throw createDevelopmentExecutionError(
      "verified_hash_changed",
      `Verified pavilion hashes changed for ${definition.assetId}.`
    );
  }

  return deepFreeze({
    outputDirectory,
    candidate,
    catalog,
    approval,
    registration,
    validation,
    manifest,
    verification,
    actualHashes,
    expectedHashes,
    runtimeSafetyFlags,
    checks: deepFreeze({
      assetIdPreserved: manifest.assetId === definition.assetId,
      recipeIdPreserved: manifest.recipeId === definition.recipeId,
      versionPreserved: manifest.version === "1.0.0",
      developmentTargetOnly: candidate.targetEnvironment === "DEVELOPMENT",
      betaBlocked: candidate.betaEligibility === false,
      productionBlocked: candidate.productionEligibility === false,
      noMissingFiles:
        Array.isArray(validation.missingOutputs) && validation.missingOutputs.length === 0,
      noTemporaryFilenames:
        !JSON.stringify({
          candidate,
          catalog,
          approval,
          registration,
          validation,
          manifest
        }).includes(".tmp."),
      noExternalDependencies: validation.noExternalDependencies === true
    })
  });
}

export function buildBuildingCivicSportsPavilionDevelopmentPublishRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection =
    inspectBuildingCivicSportsPavilionDevelopmentPublishExecutionInputs(rawDefinition, options);

  assertExecutionReadiness(definition, inspection);

  const publishRecord = deepFreeze({
    schemaId: buildingCivicSportsPavilionDevelopmentPublishExecutionSchemaId,
    sourcePublishingContract: deepFreeze({
      publishRecordSchemaId: assetPublishRecordSchemaId,
      publishingLayerSchemaId: assetPublishingPipelineLayerSchemaId,
      environmentRecordSchemaId: assetEnvironmentRecordSchemaId,
      environmentLayerSchemaId: assetEnvironmentSeparationLayerSchemaId
    }),
    publishRecordId: `ASSET_DEV_PUBLISH_RECORD_${definition.assetId}`,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    version: inspection.manifest.version,
    sourceCandidateRecord: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentPublishCandidateFilename,
      candidateId: inspection.candidate.candidateId,
      deterministicCandidateHash: inspection.candidate.validation.deterministicCandidateHash
    }),
    sourceApprovalRecord: deepFreeze({
      filename: "building-civic-sports-pavilion-approval.json",
      approvalRecordId: inspection.approval.approvalRecordId,
      approvalStatus: inspection.approval.approvalStatus
    }),
    sourceRegistrationRecord: deepFreeze({
      filename: "building-civic-sports-pavilion-registration.json",
      registrationStatus: inspection.registration.registrationStatus,
      deterministicFingerprint: inspection.registration.deterministicFingerprint
    }),
    targetEnvironment: "DEVELOPMENT",
    publishStatus: "PUBLISHED_DEVELOPMENT",
    publishTimestamp: options.publishTimestamp ?? "2026-07-29T12:00:00.000Z",
    lodFileReferences: deepFreeze({
      close: buildLodReference(inspection.outputDirectory, inspection.manifest.verifiedOutputs.close),
      gameplay: buildLodReference(
        inspection.outputDirectory,
        inspection.manifest.verifiedOutputs.gameplay
      ),
      map: buildLodReference(inspection.outputDirectory, inspection.manifest.verifiedOutputs.map)
    }),
    verifiedHashes: inspection.actualHashes,
    catalogEntryReference: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentCatalogFilename,
      catalogEntryId: inspection.catalog.catalogEntryId
    }),
    visibility: deepFreeze({
      developmentPreviewTools: true,
      assetFactoryInspectionTools: true,
      futureAtlasDevelopmentPreviewWork: true,
      beta: false,
      production: false,
      livePlayers: false,
      automaticMapPlacement: false
    }),
    runtimeSafetyFlags,
    validation: deepFreeze({
      derivesFromPreparedCandidate: true,
      targetEnvironmentIsDevelopment: true,
      hashesMatch: true,
      developmentOnlyVisibility: true,
      noReleaseRecordCreated: true,
      noBetaSideEffects: true,
      noProductionSideEffects: true,
      noRendererActivation: true,
      noMapAttachment: true,
      deterministicOutput: true,
      lifecycleConsistent: true,
      validationPassed: true,
      deterministicPublishExecutionHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            recipeId: definition.recipeId,
            version: inspection.manifest.version,
            targetEnvironment: "DEVELOPMENT",
            publishStatus: "PUBLISHED_DEVELOPMENT",
            hashes: inspection.actualHashes
          })
        )
        .digest("hex")
    })
  });

  return publishRecord;
}

export function buildBuildingCivicSportsPavilionDevelopmentCatalogActivation(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection =
    inspectBuildingCivicSportsPavilionDevelopmentPublishExecutionInputs(rawDefinition, options);
  assertExecutionReadiness(definition, inspection);

  return deepFreeze({
    schemaId: buildingCivicSportsPavilionDevelopmentCatalogActivationSchemaId,
    activationRecordId: `ASSET_DEV_CATALOG_ACTIVATION_${definition.assetId}`,
    assetId: definition.assetId,
    catalogEntryReference: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentCatalogFilename,
      catalogEntryId: inspection.catalog.catalogEntryId
    }),
    targetEnvironment: "DEVELOPMENT",
    activationStatus: "ACTIVE_DEVELOPMENT_ONLY",
    developmentVisibility: deepFreeze({
      enabled: true,
      developmentPreviewTools: true,
      assetFactoryInspectionTools: true,
      futureAtlasDevelopmentPreviewWork: true
    }),
    blockedVisibility: deepFreeze({
      testing: true,
      beta: true,
      production: true,
      livePlayers: true,
      automaticMapPlacement: true
    }),
    runtimeSafetyFlags,
    validation: deepFreeze({
      developmentOnlyActivation: true,
      rendererActivationBlocked: true,
      mapAttachmentBlocked: true,
      runtimeExecutionBlocked: true,
      validationPassed: true,
      deterministicActivationHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            catalogEntryId: inspection.catalog.catalogEntryId,
            targetEnvironment: "DEVELOPMENT",
            activationStatus: "ACTIVE_DEVELOPMENT_ONLY"
          })
        )
        .digest("hex")
    })
  });
}

export function writeBuildingCivicSportsPavilionDevelopmentPublishExecution(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const publishRecord = buildBuildingCivicSportsPavilionDevelopmentPublishRecord(
    rawDefinition,
    options
  );
  const activationRecord = buildBuildingCivicSportsPavilionDevelopmentCatalogActivation(
    rawDefinition,
    options
  );
  const publishPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionDevelopmentPublishRecordFilename
  );
  const activationPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionDevelopmentCatalogActivationFilename
  );
  fs.writeFileSync(publishPath, `${JSON.stringify(publishRecord, null, 2)}\n`, "utf8");
  fs.writeFileSync(activationPath, `${JSON.stringify(activationRecord, null, 2)}\n`, "utf8");

  return deepFreeze({
    publishPath,
    activationPath,
    publishRecord,
    activationRecord
  });
}

function buildLodReference(outputDirectory, record) {
  return deepFreeze({
    filename: record.filename,
    absolutePath: path.join(outputDirectory, record.filename),
    sha256: record.sha256,
    metrics: deepFreeze({
      sizeBytes: record.sizeBytes,
      meshCount: record.meshCount,
      materialCount: record.materialCount,
      primitiveCount: record.primitiveCount,
      triangleCount: record.triangleCount
    })
  });
}

function assertExecutionReadiness(definition, inspection) {
  const checks = inspection.checks;
  for (const [key, value] of Object.entries(checks)) {
    if (value !== true) {
      throw createDevelopmentExecutionError(
        "development_publish_input_invalid",
        `Development publish execution check ${key} failed for ${definition.assetId}.`
      );
    }
  }
  if (inspection.candidate.publishStatus !== "PREPARED") {
    throw createDevelopmentExecutionError(
      "candidate_not_prepared",
      `Development publish candidate for ${definition.assetId} must be PREPARED.`
    );
  }
  if (inspection.approval.approvalStatus !== "QUALITY_APPROVED") {
    throw createDevelopmentExecutionError(
      "approval_not_quality_approved",
      `Approval record for ${definition.assetId} must be QUALITY_APPROVED.`
    );
  }
  if (inspection.registration.registrationStatus !== "registered") {
    throw createDevelopmentExecutionError(
      "registration_not_registered",
      `Registration record for ${definition.assetId} must remain registered.`
    );
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  return deepFreeze({
    assetId: normalizeString(definition.assetId, "assetId"),
    recipeId: normalizeString(definition.recipeId, "recipeId"),
    outputLocation: normalizeString(definition.outputLocation, "outputLocation")
  });
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDevelopmentExecutionError(
      "invalid_development_publish_execution_definition",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function readJsonRequired(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createDevelopmentExecutionError(
      "missing_development_publish_execution_input",
      `Missing ${label} at ${absolutePath}.`
    );
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function createDevelopmentExecutionError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionDevelopmentPublishExecutionError";
  error.code = code;
  return error;
}
