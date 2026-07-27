import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const documentationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-release-documentation.mjs"
  )
);
const releaseModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-release-management.mjs"
  )
);
const changeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "asset-change-management.mjs"
  )
);
const auditModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-audit-trail.mjs")
);
const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);

test("generate release notes builds structured documentation from release history", () => {
  const layer = documentationModule.createAssetReleaseDocumentationLayer();
  const record = layer.createDocumentationRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });

  assert.equal(record.releaseId.startsWith("ASSET_RELEASE_"), true);
  assert.equal(record.includedAssets.includes("GROUND_BEACH_SAND_001"), true);
  assert.equal(record.sections.some((section) => section.sectionType === "RELEASE_SUMMARY"), true);
});

test("include changes carries documented change records into release notes", () => {
  const releaseLayer = releaseModule.createAssetReleaseManagementLayer();
  const changeLayer = changeModule.createAssetChangeManagementLayer();
  const auditLayer = auditModule.createAssetAuditTrailLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const layer = documentationModule.createAssetReleaseDocumentationLayer(
    releaseLayer,
    changeLayer,
    auditLayer,
    versioningLayer
  );
  const record = layer.createDocumentationRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });

  assert.equal(record.changes.length > 0, true);
  assert.equal(record.impactSummary.totalChanges, record.changes.length);
  assert.equal(record.auditReferences.length > 0, true);
});

test("missing record handling rejects unsupported claims from incomplete source coverage", () => {
  const layer = documentationModule.createAssetReleaseDocumentationLayer();
  const releaseLayer = releaseModule.createAssetReleaseManagementLayer();
  const released = releaseLayer.advanceReleaseRecord(
    releaseLayer.advanceReleaseRecord(
      releaseLayer.advanceReleaseRecord(
        releaseLayer.createReleaseRecord({
          assetIds: ["GROUND_BEACH_SAND_001"]
        }),
        "VALIDATION_PENDING"
      ),
      "READY"
    ),
    "RELEASED"
  );

  assert.throws(
    () =>
      layer.createDocumentationRecord({
        releaseRecord: released,
        changeRecords: []
      }),
    /sourceRecordsExist must be true/
  );
});

test("same input produces deterministic documentation output", () => {
  const layer = documentationModule.createAssetReleaseDocumentationLayer();
  const first = layer.createDocumentationRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });
  const second = layer.createDocumentationRecord({
    assetIds: ["GROUND_BEACH_SAND_001"]
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicDocumentationHash,
    second.validation.deterministicDocumentationHash
  );
});
