import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const outputPackageModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-showcase-output-package-foundation.mjs"
  )
);

test("Atlas Engine showcase output package foundation validates a deterministic portable result package", () => {
  const result =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    result.atlasShowcaseOutputPackage.executionId.startsWith(
      "ATLAS_SHOWCASE_EXECUTION_001_"
    ),
    true
  );
  assert.equal(
    result.atlasShowcaseOutputPackage.rendererSummary.payloadStatus.payloadCount,
    11
  );
  assert.equal(
    result.atlasShowcaseOutputPackage.metadata.exportReadiness
      .portablePackageReady,
    true
  );
});

test("Atlas Engine showcase output package includes biome, terrain, quality, and density world summary data", () => {
  const result =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.worldSummary.biome,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.worldSummary.terrain,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.worldSummary.qualityProfile,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.worldSummary.densityProfile
      .structureDensity,
    "number"
  );
  assert.equal(
    Number.isInteger(
      result.atlasShowcaseOutputPackage.worldSummary.generatedCounts.landmarks
    ),
    true
  );
});

test("same execution input produces identical deterministic Atlas showcase output packages", () => {
  const first =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();
  const second =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasShowcaseOutputPackage,
    second.atlasShowcaseOutputPackage
  );
});

test("Atlas Engine showcase output package includes presentation and renderer summaries", () => {
  const result =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();

  assert.equal(result.ok, true);
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.presentationSummary.cameraProfile,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.presentationSummary.focusTarget,
    "string"
  );
  assert.equal(
    typeof result.atlasShowcaseOutputPackage.presentationSummary.renderMode,
    "string"
  );
  assert.equal(
    result.atlasShowcaseOutputPackage.rendererSummary.rendererStatus
      .compatibilityVerified,
    true
  );
});

test("Atlas Engine showcase output package remains passive and exposes no live runtime handles", () => {
  const result =
    outputPackageModule.validateAtlasEngineShowcaseOutputPackageFoundation();

  assert.equal(result.ok, true);
  assert.equal(result.atlasShowcaseOutputPackage.compatibility.passiveOnly, true);
  assert.equal(
    result.atlasShowcaseOutputPackage.compatibility.gpsConnected,
    false
  );
  assert.equal(
    result.atlasShowcaseOutputPackage.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseOutputPackage,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasShowcaseOutputPackage.metadata,
      "realMapAttachment"
    ),
    false
  );
});
