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
  assert.equal(
    result.activeDeveloperScopeId,
    "DEVELOPER_SCOPE_BELLARINE_COASTAL_EXPLORATION"
  );
  assert.equal(result.matchedScopeReason, "SCOPE_BUCKET_MATCH_RESOLVED");
  assert.equal(result.coordinateMatchResult?.matched, true);
  assert.equal(
    result.coordinateMatchResult?.matchedScopeId,
    "DEVELOPER_SCOPE_BELLARINE_COASTAL_EXPLORATION"
  );
  assert.deepEqual(result.approvedScopeList, [
    "DEVELOPER_SCOPE_BELLARINE_COASTAL_EXPLORATION",
    "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA"
  ]);
});

test("populated developer verification coordinate resolves the additional developer-only scope", async () => {
  const browserContract = await import(
    path.resolve(
      import.meta.dirname,
      "..",
      "client",
      "developer-only-atlas-browser-contract.mjs"
    )
  );
  const adapter = browserContract.createBrowserReadyDeveloperOnlyAtlasMapAdapter();
  const result = adapter.getAtlasMapDiagnostic({
    latitude: -38.13565,
    longitude: 144.34905
  });

  assert.equal(result.diagnosticStatus, "resolved");
  assert.equal(
    result.resolvedRegion.regionId,
    "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.resolvedPackage.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001"
  );
  assert.equal(result.resolvedRecipe.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(
    result.activeDeveloperScopeId,
    "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA"
  );
  assert.equal(result.matchedScopeReason, "SCOPE_BUCKET_MATCH_RESOLVED");
  assert.equal(result.coordinateMatchResult?.matched, true);
  assert.equal(
    result.coordinateMatchResult?.matchedScopeId,
    "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA"
  );
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
  assert.equal(result.activeDeveloperScopeId, null);
  assert.equal(result.matchedScopeReason, "NO_APPROVED_SCOPE_BUCKET_MATCH");
  assert.equal(result.coordinateMatchResult?.matched, false);
});

test("unsupported package fails closed", () => {
  const adapter = buildDefaultAdapter({
    approvedScopeOverride: {
      scopeId: "DEVELOPER_SCOPE_UNSUPPORTED_PACKAGE_TEST",
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_UNSUPPORTED_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    },
    approvedScopeEntriesOverride: [
      {
        scope: {
          scopeId: "DEVELOPER_SCOPE_UNSUPPORTED_PACKAGE_TEST",
          regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
          packageId: "ATLAS_REGION_PACKAGE_UNSUPPORTED_NEG_38_12_144_61_v001",
          recipeId: "COASTAL_LOCATION_RECIPE_001",
          internalDeveloperOnly: true
        },
        representativePackage: null
      }
    ]
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
