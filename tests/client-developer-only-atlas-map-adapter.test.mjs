import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "developer-only-atlas-map-adapter.mjs"
  )
);

function buildDefaultAdapter(overrides = {}) {
  return moduleUnderTest.createDeveloperOnlyAtlasMapAdapter({
    cwd: repoRoot,
    ...overrides
  });
}

test("approved coordinate resolves expected region, package, and recipe", () => {
  const adapter = buildDefaultAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.diagnosticStatus, "resolved");
  assert.equal(
    result.resolvedRegion.regionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.resolvedPackage.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
  );
  assert.equal(result.resolvedRecipe.recipeId, "COASTAL_LOCATION_RECIPE_001");
});

test("repeated coordinate gives identical output", () => {
  const adapter = buildDefaultAdapter();
  const first = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });
  const second = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.deepEqual(first, second);
});

test("invalid latitude fails closed", () => {
  const adapter = buildDefaultAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -91,
    longitude: 144.61
  });

  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "INVALID_LATITUDE");
});

test("invalid longitude fails closed", () => {
  const adapter = buildDefaultAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 181
  });

  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "INVALID_LONGITUDE");
});

test("coordinate outside approved region fails closed", () => {
  const adapter = buildDefaultAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.13,
    longitude: 144.62
  });

  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "REGION_OUT_OF_SCOPE");
});

test("unsupported package fails closed", () => {
  const adapter = buildDefaultAdapter({
    approvedScopeOverride: {
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_UNSUPPORTED_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }
  });
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "UNSUPPORTED_PACKAGE");
});

test("unsupported recipe fails closed", () => {
  const adapter = buildDefaultAdapter({
    approvedScopeOverride: {
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "FOREST_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }
  });
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "UNSUPPORTED_RECIPE");
});

test("no runtime or attachment flags are changed", () => {
  const adapter = buildDefaultAdapter();
  const before = adapter.getSafetyFlags();

  adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  const after = adapter.getSafetyFlags();
  assert.deepEqual(after, before);
  assert.equal(after.runtimeExecutionEnabled, false);
  assert.equal(after.mapAttachmentAllowed, false);
  assert.equal(after.automaticRendererExecutionAllowed, false);
  assert.equal(after.lifecycleExecutionEnabled, false);
});

test("no renderer or map mutation occurs", () => {
  const adapter = buildDefaultAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.executionBoundaries.liveMapInvocationPerformed, false);
  assert.equal(result.executionBoundaries.listenersAttached, false);
  assert.equal(result.executionBoundaries.mapMutated, false);
  assert.equal(result.executionBoundaries.rendererAttached, false);
  assert.equal(result.executionBoundaries.domMutated, false);
});
