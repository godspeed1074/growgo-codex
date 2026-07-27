import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const auditModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-audit-trail.mjs")
);

test("create audit event records deterministic Asset Factory lifecycle history", () => {
  const layer = auditModule.createAssetAuditTrailLayer();
  const record = layer.createAuditRecord({
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_CREATED"
  });

  assert.equal(record.assetId, "GROUND_BEACH_SAND_001");
  assert.equal(record.eventType, "ASSET_CREATED");
  assert.equal(record.sequenceNumber, 1);
  assert.equal(record.previousEventId, null);
});

test("lifecycle sequence appends records in deterministic order", () => {
  const layer = auditModule.createAssetAuditTrailLayer();
  let records = [];

  records = layer.appendAuditRecord(records, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_CREATED"
  });
  records = layer.appendAuditRecord(records, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_VERSIONED"
  });
  records = layer.appendAuditRecord(records, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_PUBLISHED"
  });
  records = layer.appendAuditRecord(records, {
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_RETIRED"
  });

  assert.equal(records.length, 4);
  assert.deepEqual(
    records.map((record) => record.sequenceNumber),
    [1, 2, 3, 4]
  );
  assert.equal(records[1].previousEventId, records[0].eventId);
  assert.equal(records[3].sourceRecord.publishStatus, "RETIRED");
});

test("invalid event handling rejects unsupported audit event types", () => {
  const layer = auditModule.createAssetAuditTrailLayer();

  assert.throws(
    () =>
      layer.createAuditRecord({
        assetId: "GROUND_BEACH_SAND_001",
        eventType: "ASSET_TELEPORTED"
      }),
    /not supported/
  );
});

test("ordering validation rejects append-only violations", () => {
  const layer = auditModule.createAssetAuditTrailLayer();
  const first = layer.createAuditRecord({
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_CREATED"
  });
  const invalidSecond = {
    ...layer.createAuditRecord(
      {
        assetId: "GROUND_BEACH_SAND_001",
        eventType: "ASSET_PUBLISHED"
      },
      [first]
    ),
    timestamp: first.timestamp,
    validation: {
      schemaId: auditModule.assetAuditValidationSchemaId,
      eventTypeValid: true,
      assetReferenceExists: true,
      timestampValid: true,
      appendOnlyOrdering: true,
      deterministicExport: true,
      validationPassed: true,
      deterministicAuditHash: "invalid"
    }
  };

  const validation = auditModule.validateAssetAuditTrail([first, invalidSecond]);
  assert.equal(validation.ok, false);
});

test("same input produces deterministic same audit export", () => {
  const layer = auditModule.createAssetAuditTrailLayer();
  let firstRecords = [];
  let secondRecords = [];

  for (const eventType of ["ASSET_CREATED", "ASSET_VERSIONED", "ASSET_PUBLISHED"]) {
    firstRecords = layer.appendAuditRecord(firstRecords, {
      assetId: "GROUND_BEACH_SAND_001",
      eventType
    });
    secondRecords = layer.appendAuditRecord(secondRecords, {
      assetId: "GROUND_BEACH_SAND_001",
      eventType
    });
  }

  const firstExport = layer.exportAuditTrail(firstRecords);
  const secondExport = layer.exportAuditTrail(secondRecords);

  assert.deepEqual(firstExport.records, secondExport.records);
  assert.equal(firstExport.deterministicExportHash, secondExport.deterministicExportHash);
});

test("explicit audit validation passes contract checks", () => {
  const layer = auditModule.createAssetAuditTrailLayer();
  const first = layer.createAuditRecord({
    assetId: "GROUND_BEACH_SAND_001",
    eventType: "ASSET_CREATED"
  });
  const second = layer.createAuditRecord(
    {
      assetId: "GROUND_BEACH_SAND_001",
      eventType: "ASSET_VERSIONED"
    },
    [first]
  );

  const validation = auditModule.validateAssetAuditRecord(second, first);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetAuditRecord.validation.eventTypeValid, true);
  assert.equal(validation.assetAuditRecord.validation.assetReferenceExists, true);
  assert.equal(validation.assetAuditRecord.validation.appendOnlyOrdering, true);
});
