import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import {
  buildingCivicSportsPavilionProductionRunDefinition,
  verifyBuildingCivicSportsPavilionOutputs
} from "./building-civic-sports-pavilion-production-run.mjs";

export const buildingCivicSportsPavilionApprovalFilename =
  "building-civic-sports-pavilion-approval.json";
export const buildingCivicSportsPavilionStrayTempExportFilename =
  "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb";

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

export function inspectBuildingCivicSportsPavilionApprovalReadiness(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, { cwd });
  const registration = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-registration.json"),
    "pavilion registration record"
  );
  const manifest = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json"),
    "pavilion manifest"
  );

  return deepFreeze({
    outputDirectory,
    verification,
    registration,
    approvalReady:
      verification.registrationGate.ready &&
      registration.readyForApproval === true &&
      registration.publishStatus === "not_published",
    preservedHashes: deepFreeze({
      close: manifest.verifiedOutputs?.close?.sha256 ?? null,
      gameplay: manifest.verifiedOutputs?.gameplay?.sha256 ?? null,
      map: manifest.verifiedOutputs?.map?.sha256 ?? null
    })
  });
}

export function buildBuildingCivicSportsPavilionApprovalRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const readiness = inspectBuildingCivicSportsPavilionApprovalReadiness(rawDefinition, {
    cwd
  });

  if (!readiness.approvalReady) {
    throw createPavilionApprovalError(
      "pavilion_approval_not_ready",
      `Asset ${definition.assetId} is not ready for approval.`
    );
  }

  const registration = readiness.registration;
  const manifest = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json"),
    "pavilion manifest"
  );
  const validation = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-validation.json"),
    "pavilion validation record"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json"),
    "pavilion metadata record"
  );

  const registry = createAssetFactoryRegistryLayer();
  const customLayer = createAssetApprovalRegistrationLayer(
    registry,
    buildPavilionSpecificationLayer(),
    buildPavilionAuthoringWorkflow(definition, registration),
    buildPavilionQualityLayer(definition)
  );

  const pending = customLayer.createApprovalRecord({ assetId: definition.assetId });
  const approvedCore = customLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");

  const approved = deepFreeze({
    ...approvedCore,
    publishStatus: "not_published",
    releaseStatus: "not_released",
    sourceBlendReference: registration.sourceBlend,
    registrationRecordReference: deepFreeze({
      filename: "building-civic-sports-pavilion-registration.json",
      relativePath:
        "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/building-civic-sports-pavilion-registration.json",
      deterministicFingerprint: registration.deterministicFingerprint,
      linkedRegistrationStatus: registration.registrationStatus
    }),
    verifiedOutputs: registration.verifiedOutputs,
    outputVerification: validation.outputVerification,
    metadataValidationStatus: metadata.validationStatus,
    lifecycleSummary: deepFreeze({
      assetStatus: "registered_validated_approved",
      approvalStatus: approvedCore.approvalStatus,
      linkedRegistrationStatus: registration.registrationStatus,
      publishStatus: "not_published"
    }),
    preservedContracts: deepFreeze({
      assetId: definition.assetId,
      recipeId: definition.recipeId,
      version: approvedCore.version,
      closeHash: manifest.verifiedOutputs.close.sha256,
      gameplayHash: manifest.verifiedOutputs.gameplay.sha256,
      mapHash: manifest.verifiedOutputs.map.sha256
    }),
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: approvedCore.assetId,
          approvalStatus: approvedCore.approvalStatus,
          registrationReference: registration.deterministicFingerprint,
          preservedContracts: {
            closeHash: manifest.verifiedOutputs.close.sha256,
            gameplayHash: manifest.verifiedOutputs.gameplay.sha256,
            mapHash: manifest.verifiedOutputs.map.sha256
          }
        })
      )
      .digest("hex")
  });

  const checked = validateAssetApprovalRecord(approved);
  if (!checked.ok) {
    throw createPavilionApprovalError(checked.errorCode, checked.message);
  }

  return approved;
}

export function writeBuildingCivicSportsPavilionApprovalRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const record = buildBuildingCivicSportsPavilionApprovalRecord(rawDefinition, options);
  const approvalPath = path.join(outputDirectory, buildingCivicSportsPavilionApprovalFilename);
  fs.writeFileSync(approvalPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return deepFreeze({
    approvalPath,
    record
  });
}

export function cleanupBuildingCivicSportsPavilionStrayTempExport(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const targetPath = path.join(outputDirectory, buildingCivicSportsPavilionStrayTempExportFilename);
  const existed = fs.existsSync(targetPath);
  if (existed) {
    fs.unlinkSync(targetPath);
  }
  return deepFreeze({
    targetPath,
    removed: existed,
    existsAfterCleanup: fs.existsSync(targetPath)
  });
}

function buildPavilionSpecificationLayer() {
  return deepFreeze({
    schemaId: "ASSET_CREATION_SPECIFICATION_LAYER_001",
    layerId: "ASSET_CREATION_SPECIFICATION_LAYER_001_PAVILION_APPROVAL"
  });
}

function buildPavilionAuthoringWorkflow(definition, registration) {
  const baseRecord = deepFreeze({
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    specificationId: `ASSET_CREATION_SPECIFICATION_${definition.assetId}`,
    workflowState: "REGISTERED",
    validationStatus: "validated",
    registrationStatus: registration.registrationStatus
  });

  return deepFreeze({
    schemaId: "ASSET_AUTHORING_WORKFLOW_LAYER_001",
    layerId: "ASSET_AUTHORING_WORKFLOW_LAYER_001_PAVILION_APPROVAL",
    createRecord(rawInput = {}) {
      const assetId = rawInput.assetId ?? definition.assetId;
      if (assetId !== definition.assetId) {
        throw createPavilionApprovalError(
          "pavilion_authoring_asset_mismatch",
          `Expected ${definition.assetId} but received ${assetId}.`
        );
      }
      return baseRecord;
    },
    advanceRecord(rawRecord, targetState) {
      return deepFreeze({
        ...baseRecord,
        workflowState: targetState
      });
    }
  });
}

function buildPavilionQualityLayer(definition) {
  return deepFreeze({
    schemaId: "ASSET_QUALITY_VALIDATION_LAYER_001",
    layerId: "ASSET_QUALITY_VALIDATION_LAYER_001_PAVILION_APPROVAL",
    validateAsset(rawInput = {}) {
      const assetId = rawInput.authoringRecord?.assetId ?? rawInput.assetId ?? definition.assetId;
      if (assetId !== definition.assetId) {
        throw createPavilionApprovalError(
          "pavilion_quality_asset_mismatch",
          `Expected ${definition.assetId} but received ${assetId}.`
        );
      }
      return deepFreeze({
        report: deepFreeze({
          schemaId: "ASSET_QUALITY_REPORT_001",
          reportId: `ASSET_QUALITY_REPORT_${definition.assetId}`,
          assetId: definition.assetId,
          warnings: deepFreeze([]),
          approvalReadiness: "READY_FOR_APPROVAL"
        })
      });
    }
  });
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
    throw createPavilionApprovalError(
      "invalid_pavilion_approval_definition",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function readJsonRequired(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createPavilionApprovalError(
      "missing_pavilion_approval_record",
      `Missing ${label} at ${absolutePath}.`
    );
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function createPavilionApprovalError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionApprovalError";
  error.code = code;
  return error;
}
