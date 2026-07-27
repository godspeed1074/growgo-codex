import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetPublishingPipelineLayer,
  validateAssetPublishRecord
} from "./asset-publishing-pipeline.mjs";

export const assetAuditTrailLayerSchemaId = "ASSET_AUDIT_TRAIL_LAYER_001";
export const assetAuditRecordSchemaId = "ASSET_AUDIT_RECORD_001";
export const assetAuditValidationSchemaId = "ASSET_AUDIT_VALIDATION_001";

export const assetAuditEventTypes = deepFreeze([
  "ASSET_CREATED",
  "ASSET_SPECIFIED",
  "ASSET_AUTHORED",
  "ASSET_VALIDATED",
  "ASSET_APPROVED",
  "ASSET_PUBLISHED",
  "ASSET_VERSIONED",
  "ASSET_CHANGED",
  "ASSET_RETIRED"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const defaultActorSource = "asset_factory_system";
const defaultTimestampBase = "2026-07-27T00:00:00.000Z";

export function createAssetAuditTrailLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVersioningLayer = createAssetVersioningLayer(rawRegistry),
  rawPublishingLayer = createAssetPublishingPipelineLayer(rawRegistry)
) {
  const registry = normalizeRegistry(rawRegistry);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const publishingLayer = normalizePublishingLayer(rawPublishingLayer);

  const layer = deepFreeze({
    schemaId: assetAuditTrailLayerSchemaId,
    layerId: "ASSET_AUDIT_TRAIL_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    versioningLayerId: versioningLayer.layerId,
    publishingLayerId: publishingLayer.layerId,
    eventTypes: assetAuditEventTypes,
    createAuditRecord(rawInput = {}, rawExistingRecords = []) {
      return createAuditRecord(
        rawInput,
        rawExistingRecords,
        registry,
        versioningLayer,
        publishingLayer
      );
    },
    appendAuditRecord(rawExistingRecords = [], rawInput = {}) {
      const existingRecords = normalizeExistingRecords(rawExistingRecords);
      return deepFreeze([
        ...existingRecords,
        createAuditRecord(rawInput, existingRecords, registry, versioningLayer, publishingLayer)
      ]);
    },
    exportAuditTrail(rawRecords = []) {
      return exportAuditTrail(rawRecords);
    },
    validateAuditTrail(rawRecords = []) {
      return validateAssetAuditTrail(rawRecords);
    }
  });

  const checked = validateAssetAuditTrailLayer(layer);
  if (!checked.ok) {
    throw createAuditTrailError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAuditTrailLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetAuditTrailLayerSchemaId) {
      throw createAuditTrailError(
        "invalid_asset_audit_trail_layer_schema",
        `Expected ${assetAuditTrailLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    for (const key of ["createAuditRecord", "appendAuditRecord", "exportAuditTrail"]) {
      if (typeof rawLayer[key] !== "function") {
        throw createAuditTrailError(
          "invalid_asset_audit_trail_layer_api",
          `Asset audit trail layer must expose ${key}.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuditTrailLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_audit_trail_layer_validation_failed",
      message: error.message,
      assetAuditTrailLayer: null
    });
  }
}

export function validateAssetAuditRecord(rawRecord, rawPreviousRecord = null) {
  try {
    const previousRecord = rawPreviousRecord ?? null;

    if (rawRecord?.schemaId !== assetAuditRecordSchemaId) {
      throw createAuditTrailError(
        "invalid_asset_audit_record_schema",
        `Expected ${assetAuditRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetAuditValidationSchemaId) {
      throw createAuditTrailError(
        "invalid_asset_audit_validation_schema",
        `Expected ${assetAuditValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetAuditEventTypes.includes(rawRecord.eventType)) {
      throw createAuditTrailError(
        "invalid_asset_audit_event_type",
        `Unsupported audit event type ${rawRecord.eventType}.`
      );
    }

    for (const key of [
      "eventTypeValid",
      "assetReferenceExists",
      "timestampValid",
      "appendOnlyOrdering",
      "deterministicExport",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createAuditTrailError(
          "asset_audit_record_validation_failed",
          `Asset audit validation flag ${key} must be true.`
        );
      }
    }

    if (previousRecord) {
      if (rawRecord.sequenceNumber !== previousRecord.sequenceNumber + 1) {
        throw createAuditTrailError(
          "invalid_asset_audit_sequence_number",
          "Audit record sequence numbers must be append-only increments."
        );
      }

      if (!(Date.parse(rawRecord.timestamp) > Date.parse(previousRecord.timestamp))) {
        throw createAuditTrailError(
          "invalid_asset_audit_timestamp_ordering",
          "Audit record timestamps must increase monotonically."
        );
      }

      if (rawRecord.previousEventId !== previousRecord.eventId) {
        throw createAuditTrailError(
          "invalid_asset_audit_previous_event_link",
          "Audit record previousEventId must link to the immediately preceding event."
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildAuditRecordSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicAuditHash) {
      throw createAuditTrailError(
        "asset_audit_hash_mismatch",
        "Asset audit record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuditRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_audit_record_validation_failed",
      message: error.message,
      assetAuditRecord: null
    });
  }
}

export function validateAssetAuditTrail(rawRecords) {
  try {
    const records = normalizeExistingRecords(rawRecords);
    for (let index = 0; index < records.length; index += 1) {
      const previousRecord = index > 0 ? records[index - 1] : null;
      const checked = validateAssetAuditRecord(records[index], previousRecord);
      if (!checked.ok) {
        throw createAuditTrailError(checked.errorCode, checked.message);
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      recordCount: records.length,
      deterministicExportHash: computeDeterministicHash(
        records.map((record) => buildAuditRecordSignature(record))
      )
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_audit_trail_validation_failed",
      message: error.message,
      recordCount: 0,
      deterministicExportHash: null
    });
  }
}

function createAuditRecord(
  rawInput,
  rawExistingRecords,
  registry,
  versioningLayer,
  publishingLayer
) {
  const existingRecords = normalizeExistingRecords(rawExistingRecords);
  const input = normalizeAuditInput(rawInput);
  const assetRecord = registry.getAssetById(input.assetId);
  if (!assetRecord) {
    throw createAuditTrailError(
      "missing_asset_audit_registry_record",
      `Asset ${input.assetId} is not registered in the Asset Factory registry.`
    );
  }

  const previousRecord = existingRecords.at(-1) ?? null;
  const sequenceNumber = previousRecord ? previousRecord.sequenceNumber + 1 : 1;
  const timestamp = input.timestamp ?? deriveTimestamp(sequenceNumber);
  const sourceRecord = input.sourceRecord ?? buildSourceRecord(input, versioningLayer, publishingLayer);

  const recordBase = deepFreeze({
    schemaId: assetAuditRecordSchemaId,
    eventId: `ASSET_AUDIT_${normalizeSlug(input.assetId)}_${String(sequenceNumber).padStart(4, "0")}_${input.eventType}`,
    assetId: input.assetId,
    eventType: input.eventType,
    timestamp,
    sourceRecord,
    actorSource: input.actorSource,
    eventSummary: input.eventSummary ?? buildDefaultEventSummary(input.eventType, input.assetId),
    sequenceNumber,
    previousEventId: previousRecord?.eventId ?? null,
    validation: null
  });

  const validation = buildAuditValidation(recordBase, assetRecord, previousRecord);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetAuditRecord(record, previousRecord);
  if (!checked.ok) {
    throw createAuditTrailError(checked.errorCode, checked.message);
  }

  return record;
}

function buildSourceRecord(input, versioningLayer, publishingLayer) {
  switch (input.eventType) {
    case "ASSET_VERSIONED": {
      const record = versioningLayer.createVersionRecord({
        assetId: input.assetId
      });
      validateSourceRecord(record);
      return deepFreeze({
        schemaId: record.schemaId,
        sourceRecordId: record.versionRecordId,
        sourceRecordType: "VERSION_RECORD",
        sourceVersion: record.versionNumber,
        sourceState: record.versionState
      });
    }
    case "ASSET_PUBLISHED":
    case "ASSET_RETIRED": {
      const ready = publishingLayer.createPublishRecord({
        assetId: input.assetId
      });
      const publishing = publishingLayer.advancePublishRecord(ready, "PUBLISHING");
      const published = publishingLayer.advancePublishRecord(publishing, "PUBLISHED");
      const record =
        input.eventType === "ASSET_RETIRED"
          ? publishingLayer.advancePublishRecord(published, "RETIRED")
          : published;
      validateSourceRecord(record);
      return deepFreeze({
        schemaId: record.schemaId,
        sourceRecordId: record.publishRecordId,
        sourceRecordType: "PUBLISH_RECORD",
        publishStatus: record.publishStatus,
        version: record.version
      });
    }
    default:
      return deepFreeze({
        schemaId: "ASSET_AUDIT_SOURCE_REFERENCE_001",
        sourceRecordId: `ASSET_SOURCE_${normalizeSlug(input.assetId)}_${input.eventType.toLowerCase()}`,
        sourceRecordType: "GENERIC_ASSET_EVENT",
        sourceVersion: null
      });
  }
}

function validateSourceRecord(rawRecord) {
  if (rawRecord.schemaId === "ASSET_VERSION_RECORD_001") {
    const checked = validateAssetVersionRecord(rawRecord);
    if (!checked.ok) {
      throw createAuditTrailError(checked.errorCode, checked.message);
    }
    return;
  }

  if (rawRecord.schemaId === "ASSET_PUBLISH_RECORD_001") {
    const checked = validateAssetPublishRecord(rawRecord);
    if (!checked.ok) {
      throw createAuditTrailError(checked.errorCode, checked.message);
    }
  }
}

function buildAuditValidation(record, assetRecord, previousRecord) {
  const eventTypeValid = assetAuditEventTypes.includes(record.eventType);
  const assetReferenceExists = Boolean(assetRecord?.assetId) && assetRecord.assetId === record.assetId;
  const timestampValid = isIsoTimestamp(record.timestamp);
  const appendOnlyOrdering = previousRecord
    ? record.sequenceNumber === previousRecord.sequenceNumber + 1 &&
      Date.parse(record.timestamp) > Date.parse(previousRecord.timestamp) &&
      record.previousEventId === previousRecord.eventId
    : record.sequenceNumber === 1 && record.previousEventId === null;
  const deterministicExport = true;
  const validationPassed =
    eventTypeValid &&
    assetReferenceExists &&
    timestampValid &&
    appendOnlyOrdering &&
    deterministicExport;

  return deepFreeze({
    schemaId: assetAuditValidationSchemaId,
    eventTypeValid,
    assetReferenceExists,
    timestampValid,
    appendOnlyOrdering,
    deterministicExport,
    validationPassed,
    deterministicAuditHash: computeDeterministicHash(buildAuditRecordSignature(record))
  });
}

function exportAuditTrail(rawRecords) {
  const records = normalizeExistingRecords(rawRecords);
  const validation = validateAssetAuditTrail(records);
  if (!validation.ok) {
    throw createAuditTrailError(validation.errorCode, validation.message);
  }

  return deepFreeze({
    schemaId: "ASSET_AUDIT_TRAIL_EXPORT_001",
    recordCount: records.length,
    records,
    exportTimestamp: defaultTimestampBase,
    deterministicExportHash: validation.deterministicExportHash
  });
}

function buildDefaultEventSummary(eventType, assetId) {
  return `${eventType.replaceAll("_", " ")} recorded for ${assetId}.`;
}

function deriveTimestamp(sequenceNumber) {
  const date = new Date(defaultTimestampBase);
  date.setUTCSeconds(date.getUTCSeconds() + sequenceNumber - 1);
  return date.toISOString();
}

function buildAuditRecordSignature(record) {
  return [
    record.eventId,
    record.assetId,
    record.eventType,
    record.timestamp,
    record.sourceRecord,
    record.actorSource,
    record.eventSummary,
    record.sequenceNumber,
    record.previousEventId
  ];
}

function normalizeAuditInput(rawInput) {
  const input = asPlainObject(rawInput, "assetAuditInput");
  const assetId =
    input.sourceRecord?.assetId ??
    input.assetId ??
    defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createAuditTrailError(
      "invalid_asset_audit_input",
      "Asset audit trail requires assetId or a linked source record asset ID."
    );
  }

  const eventType =
    typeof input.eventType === "string" && input.eventType.trim().length > 0
      ? input.eventType.trim().toUpperCase()
      : "ASSET_CREATED";

  if (!assetAuditEventTypes.includes(eventType)) {
    throw createAuditTrailError(
      "invalid_asset_audit_event_type_input",
      `Audit event type ${eventType} is not supported.`
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    eventType,
    timestamp:
      typeof input.timestamp === "string" && input.timestamp.trim().length > 0
        ? input.timestamp.trim()
        : null,
    sourceRecord: input.sourceRecord ?? null,
    actorSource:
      typeof input.actorSource === "string" && input.actorSource.trim().length > 0
        ? input.actorSource.trim()
        : defaultActorSource,
    eventSummary:
      typeof input.eventSummary === "string" && input.eventSummary.trim().length > 0
        ? input.eventSummary.trim()
        : null
  });
}

function normalizeExistingRecords(rawRecords) {
  if (rawRecords == null) {
    return deepFreeze([]);
  }
  if (!Array.isArray(rawRecords)) {
    throw createAuditTrailError(
      "invalid_asset_audit_record_collection",
      "Existing audit records must be an array when provided."
    );
  }
  return deepFreeze([...rawRecords]);
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createAuditTrailError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createAuditTrailError(
      "invalid_asset_audit_versioning_layer",
      "Asset audit trail requires a valid asset versioning layer."
    );
  }
  return rawLayer;
}

function normalizePublishingLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_PUBLISHING_PIPELINE_LAYER_001" ||
    typeof rawLayer.createPublishRecord !== "function" ||
    typeof rawLayer.advancePublishRecord !== "function"
  ) {
    throw createAuditTrailError(
      "invalid_asset_audit_publishing_layer",
      "Asset audit trail requires a valid asset publishing pipeline layer."
    );
  }
  return rawLayer;
}

function isIsoTimestamp(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createAuditTrailError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createAuditTrailError(code, message) {
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
