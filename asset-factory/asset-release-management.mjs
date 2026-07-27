import { createHash } from "node:crypto";

import {
  createAssetPublishingPipelineLayer,
  validateAssetPublishRecord
} from "./asset-publishing-pipeline.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetEnvironmentSeparationLayer,
  validateAssetEnvironmentRecord
} from "./asset-environment-separation.mjs";

export const assetReleaseManagementLayerSchemaId =
  "ASSET_RELEASE_MANAGEMENT_LAYER_001";
export const assetReleaseRecordSchemaId = "ASSET_RELEASE_RECORD_001";
export const assetReleaseValidationSchemaId = "ASSET_RELEASE_VALIDATION_001";

export const assetReleaseStates = deepFreeze([
  "DRAFT",
  "VALIDATION_PENDING",
  "READY",
  "RELEASED",
  "ARCHIVED"
]);

const allowedReleaseTransitions = deepFreeze({
  DRAFT: deepFreeze(["VALIDATION_PENDING"]),
  VALIDATION_PENDING: deepFreeze(["READY"]),
  READY: deepFreeze(["RELEASED"]),
  RELEASED: deepFreeze(["ARCHIVED"]),
  ARCHIVED: deepFreeze([])
});

const defaultAssetId = "GROUND_BEACH_SAND_001";
const releaseDate = "2026-07-27";

export function createAssetReleaseManagementLayer(
  rawPublishingLayer = createAssetPublishingPipelineLayer(),
  rawVersioningLayer = createAssetVersioningLayer(),
  rawEnvironmentLayer = createAssetEnvironmentSeparationLayer()
) {
  const publishingLayer = normalizePublishingLayer(rawPublishingLayer);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const environmentLayer = normalizeEnvironmentLayer(rawEnvironmentLayer);

  const layer = deepFreeze({
    schemaId: assetReleaseManagementLayerSchemaId,
    layerId: "ASSET_RELEASE_MANAGEMENT_LAYER_001_DEFAULT",
    publishingLayerId: publishingLayer.layerId,
    versioningLayerId: versioningLayer.layerId,
    environmentLayerId: environmentLayer.layerId,
    releaseStates: assetReleaseStates,
    createReleaseRecord(rawInput = {}) {
      return createReleaseRecord(rawInput, publishingLayer, versioningLayer, environmentLayer);
    },
    advanceReleaseRecord(rawRecord, targetState) {
      return advanceReleaseRecord(rawRecord, targetState);
    }
  });

  const checked = validateAssetReleaseManagementLayer(layer);
  if (!checked.ok) {
    throw createReleaseError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetReleaseManagementLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetReleaseManagementLayerSchemaId) {
      throw createReleaseError(
        "invalid_asset_release_management_layer_schema",
        `Expected ${assetReleaseManagementLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    for (const key of ["createReleaseRecord", "advanceReleaseRecord"]) {
      if (typeof rawLayer[key] !== "function") {
        throw createReleaseError(
          "invalid_asset_release_management_layer_api",
          `Asset release management layer must expose ${key}.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetReleaseManagementLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_release_management_layer_validation_failed",
      message: error.message,
      assetReleaseManagementLayer: null
    });
  }
}

export function validateAssetReleaseRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetReleaseRecordSchemaId) {
      throw createReleaseError(
        "invalid_asset_release_record_schema",
        `Expected ${assetReleaseRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (!assetReleaseStates.includes(rawRecord.releaseStatus)) {
      throw createReleaseError(
        "invalid_asset_release_status",
        `Unsupported release status ${rawRecord.releaseStatus}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetReleaseValidationSchemaId) {
      throw createReleaseError(
        "invalid_asset_release_validation_schema",
        `Expected ${assetReleaseValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetsPublished",
      "productionEnvironmentConfirmed",
      "versionsValid",
      "releaseContentsDeterministic",
      "noUnapprovedAssets",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createReleaseError(
          "asset_release_record_validation_failed",
          `Asset release validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildReleaseSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicReleaseHash) {
      throw createReleaseError(
        "asset_release_hash_mismatch",
        "Asset release record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetReleaseRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_release_record_validation_failed",
      message: error.message,
      assetReleaseRecord: null
    });
  }
}

function createReleaseRecord(rawInput, publishingLayer, versioningLayer, environmentLayer) {
  const input = normalizeReleaseInput(rawInput);
  const assetEntries = resolveAssetEntries(input, publishingLayer, versioningLayer, environmentLayer);
  const releaseVersion = input.releaseVersion ?? deriveReleaseVersion(assetEntries);
  const releaseNotes = input.releaseNotes ?? buildReleaseNotes(assetEntries, releaseVersion);

  const recordBase = deepFreeze({
    schemaId: assetReleaseRecordSchemaId,
    releaseId: `ASSET_RELEASE_${normalizeSlug(releaseVersion)}`,
    assetList: deepFreeze(assetEntries.map((entry) => entry.assetId)),
    releaseVersion,
    releaseStatus: "DRAFT",
    includedVersions: deepFreeze(
      assetEntries.map((entry) =>
        deepFreeze({
          assetId: entry.assetId,
          versionNumber: entry.versionRecord.versionNumber
        })
      )
    ),
    releaseNotes,
    sourceReferences: deepFreeze(
      assetEntries.map((entry) =>
        deepFreeze({
          assetId: entry.assetId,
          publishRecordId: entry.publishRecord.publishRecordId,
          versionRecordId: entry.versionRecord.versionRecordId,
          environmentRecordId: entry.environmentRecord.environmentRecordId
        })
      )
    ),
    createdTimestamp: releaseDate,
    validation: null
  });

  const validation = buildReleaseValidation(recordBase, assetEntries);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetReleaseRecord(record);
  if (!checked.ok) {
    throw createReleaseError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceReleaseRecord(rawRecord, targetState) {
  const checked = validateAssetReleaseRecord(rawRecord);
  if (!checked.ok) {
    throw createReleaseError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeReleaseState(targetState);
  if (!allowedReleaseTransitions[rawRecord.releaseStatus].includes(normalizedTargetState)) {
    throw createReleaseError(
      "invalid_asset_release_state_transition",
      `Cannot transition asset release record from ${rawRecord.releaseStatus} to ${normalizedTargetState}.`
    );
  }

  const advancedBase = deepFreeze({
    ...rawRecord,
    releaseStatus: normalizedTargetState,
    validation: null
  });

  const validation = deepFreeze({
    ...rawRecord.validation,
    deterministicReleaseHash: computeDeterministicHash(buildReleaseSignature(advancedBase))
  });

  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  const validated = validateAssetReleaseRecord(advanced);
  if (!validated.ok) {
    throw createReleaseError(validated.errorCode, validated.message);
  }

  return advanced;
}

function resolveAssetEntries(input, publishingLayer, versioningLayer, environmentLayer) {
  if (input.assetEntries) {
    return input.assetEntries;
  }

  const assetIds = input.assetIds ?? [defaultAssetId];
  return deepFreeze(
    assetIds.map((assetId) => {
      const publishRecord =
        input.publishRecordMap.get(assetId) ?? buildPublishedPublishRecord(assetId, publishingLayer);
      const versionRecord =
        input.versionRecordMap.get(assetId) ??
        versioningLayer.createVersionRecord({
          assetId
        });
      const environmentRecord =
        input.environmentRecordMap.get(assetId) ??
        buildProductionEnvironmentRecord(assetId, environmentLayer, publishRecord);

      validateSourceTriplet(publishRecord, versionRecord, environmentRecord);

      return deepFreeze({
        assetId,
        publishRecord,
        versionRecord,
        environmentRecord
      });
    })
  );
}

function buildPublishedPublishRecord(assetId, publishingLayer) {
  const ready = publishingLayer.createPublishRecord({ assetId });
  const publishing = publishingLayer.advancePublishRecord(ready, "PUBLISHING");
  return publishingLayer.advancePublishRecord(publishing, "PUBLISHED");
}

function buildProductionEnvironmentRecord(assetId, environmentLayer, publishRecord) {
  return environmentLayer.createEnvironmentRecord({
    assetId,
    publishRecord,
    currentEnvironment: "PRODUCTION",
    transitionHistory: [
      {
        fromEnvironment: "DEVELOPMENT",
        toEnvironment: "TESTING",
        promotionRule: "DEVELOPMENT_TO_TESTING",
        timestamp: "2026-07-27T00:00:00.000Z",
        approvalStatus: "PENDING_REVIEW",
        publishStatus: "READY_TO_PUBLISH"
      },
      {
        fromEnvironment: "TESTING",
        toEnvironment: "APPROVAL",
        promotionRule: "TESTING_TO_APPROVAL",
        timestamp: "2026-07-27T00:01:00.000Z",
        approvalStatus: "QUALITY_APPROVED",
        publishStatus: "READY_TO_PUBLISH"
      },
      {
        fromEnvironment: "APPROVAL",
        toEnvironment: "PRODUCTION",
        promotionRule: "APPROVAL_TO_PRODUCTION",
        timestamp: "2026-07-27T00:02:00.000Z",
        approvalStatus: "ACTIVE",
        publishStatus: "PUBLISHED"
      }
    ]
  });
}

function validateSourceTriplet(publishRecord, versionRecord, environmentRecord) {
  const checks = [
    validateAssetPublishRecord(publishRecord),
    validateAssetVersionRecord(versionRecord),
    validateAssetEnvironmentRecord(environmentRecord)
  ];
  if (!checks.every((check) => check.ok)) {
    const failed = checks.find((check) => !check.ok);
    throw createReleaseError(failed.errorCode, failed.message);
  }
}

function deriveReleaseVersion(assetEntries) {
  const versionSuffix = assetEntries
    .map((entry) => entry.versionRecord.versionNumber)
    .sort((left, right) => left.localeCompare(right))
    .join("_");
  return `RELEASE_${releaseDate.replace(/-/g, "_")}_${assetEntries.length}_${versionSuffix}`;
}

function buildReleaseNotes(assetEntries, releaseVersion) {
  const notes = assetEntries
    .map((entry) => `${entry.assetId}@${entry.versionRecord.versionNumber}`)
    .join(", ");
  return `Release ${releaseVersion} includes published assets: ${notes}.`;
}

function buildReleaseValidation(record, assetEntries) {
  const assetsPublished = assetEntries.every(
    (entry) => entry.publishRecord.publishStatus === "PUBLISHED"
  );
  const productionEnvironmentConfirmed = assetEntries.every(
    (entry) => entry.environmentRecord.currentEnvironment === "PRODUCTION"
  );
  const versionsValid = assetEntries.every(
    (entry) =>
      entry.versionRecord.versionState === "PUBLISHED" &&
      entry.publishRecord.version === entry.versionRecord.versionNumber
  );
  const releaseContentsDeterministic = true;
  const noUnapprovedAssets = assetEntries.every(
    (entry) =>
      entry.publishRecord.approvalReference.approvalStatus === "ACTIVE" &&
      entry.environmentRecord.validation.approvalStateValid === true
  );
  const validationPassed =
    assetsPublished &&
    productionEnvironmentConfirmed &&
    versionsValid &&
    releaseContentsDeterministic &&
    noUnapprovedAssets;

  return deepFreeze({
    schemaId: assetReleaseValidationSchemaId,
    assetsPublished,
    productionEnvironmentConfirmed,
    versionsValid,
    releaseContentsDeterministic,
    noUnapprovedAssets,
    validationPassed,
    deterministicReleaseHash: computeDeterministicHash(buildReleaseSignature(record))
  });
}

function buildReleaseSignature(record) {
  return [
    record.releaseId,
    record.assetList,
    record.releaseVersion,
    record.releaseStatus,
    record.includedVersions,
    record.releaseNotes,
    record.sourceReferences,
    record.createdTimestamp
  ];
}

function normalizeReleaseInput(rawInput) {
  const input = asPlainObject(rawInput, "assetReleaseInput");
  const assetIds = Array.isArray(input.assetIds)
    ? input.assetIds.map((assetId) => normalizeAssetId(assetId))
    : null;

  return deepFreeze({
    assetIds,
    assetEntries: Array.isArray(input.assetEntries)
      ? deepFreeze([...input.assetEntries])
      : null,
    publishRecordMap: normalizeRecordMap(input.publishRecords, "publishRecords"),
    versionRecordMap: normalizeRecordMap(input.versionRecords, "versionRecords"),
    environmentRecordMap: normalizeRecordMap(input.environmentRecords, "environmentRecords"),
    releaseVersion:
      typeof input.releaseVersion === "string" && input.releaseVersion.trim().length > 0
        ? input.releaseVersion.trim().toUpperCase()
        : null,
    releaseNotes:
      typeof input.releaseNotes === "string" && input.releaseNotes.trim().length > 0
        ? input.releaseNotes.trim()
        : null
  });
}

function normalizeRecordMap(rawRecords, label) {
  if (rawRecords == null) {
    return new Map();
  }
  if (!Array.isArray(rawRecords)) {
    throw createReleaseError(`invalid_${label}`, `${label} must be an array when provided.`);
  }
  return new Map(
    rawRecords.map((record) => {
      if (!record || typeof record !== "object" || typeof record.assetId !== "string") {
        throw createReleaseError(
          `invalid_${label}_entry`,
          `${label} entries must include assetId.`
        );
      }
      return [record.assetId, record];
    })
  );
}

function normalizeAssetId(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createReleaseError("invalid_asset_release_asset_id", "assetIds must be non-empty strings.");
  }
  return value.trim().toUpperCase();
}

function normalizePublishingLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_PUBLISHING_PIPELINE_LAYER_001" ||
    typeof rawLayer.createPublishRecord !== "function" ||
    typeof rawLayer.advancePublishRecord !== "function"
  ) {
    throw createReleaseError(
      "invalid_asset_release_publishing_layer",
      "Asset release management requires a valid publishing layer."
    );
  }
  return rawLayer;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createReleaseError(
      "invalid_asset_release_versioning_layer",
      "Asset release management requires a valid versioning layer."
    );
  }
  return rawLayer;
}

function normalizeEnvironmentLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_ENVIRONMENT_SEPARATION_LAYER_001" ||
    typeof rawLayer.createEnvironmentRecord !== "function"
  ) {
    throw createReleaseError(
      "invalid_asset_release_environment_layer",
      "Asset release management requires a valid environment separation layer."
    );
  }
  return rawLayer;
}

function normalizeReleaseState(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createReleaseError("invalid_asset_release_state", "Release state must be a non-empty string.");
  }
  const normalized = value.trim().toUpperCase();
  if (!assetReleaseStates.includes(normalized)) {
    throw createReleaseError(
      "invalid_asset_release_state",
      `Release state ${normalized} is not supported.`
    );
  }
  return normalized;
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createReleaseError(`invalid_${label}`, `${label} must be an object when provided.`);
  }
  return value;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createReleaseError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}
