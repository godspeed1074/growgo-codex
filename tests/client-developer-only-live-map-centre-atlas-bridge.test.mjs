import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const bridgeModule = await import(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs")
);

const bridgeSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs"),
  "utf8"
);

const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function buildMapStub({ centre = { lat: -38.12, lng: 144.61 } } = {}) {
  let getCenterCallCount = 0;

  return {
    getCenter() {
      getCenterCallCount += 1;
      return centre;
    },
    get getCenterCallCount() {
      return getCenterCallCount;
    }
  };
}

test("explicit bridge function exists", () => {
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => null
  });

  assert.equal(typeof bridge.getAtlasDiagnosticForCurrentMapCentre, "function");
});

test("no-map state fails closed", () => {
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => null
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "LIVE_MAP_UNAVAILABLE");
});

test("malformed map centre fails closed", () => {
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => ({
      getCenter() {
        return { lat: "bad", lng: null };
      }
    })
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
  assert.equal(result.diagnosticStatus, "blocked");
  assert.equal(result.reasonCode, "MALFORMED_MAP_CENTER");
});

test("approved live-map centre resolves expected canonical region package and recipe", () => {
  const mapStub = buildMapStub();
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
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
});

test("populated verification centre resolves the additional developer-only scope", () => {
  const mapStub = buildMapStub({
    centre: { lat: -38.13565, lng: 144.34905 }
  });
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
  assert.equal(result.diagnosticStatus, "resolved");
  assert.equal(
    result.resolvedRegion.regionId,
    "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.resolvedPackage.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001"
  );
  assert.equal(
    result.activeDeveloperScopeId,
    "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA"
  );
  assert.equal(result.matchedScopeReason, "SCOPE_BUCKET_MATCH_RESOLVED");
  assert.equal(result.coordinateMatchResult?.matched, true);
});

test("repeated calls at the same centre return identical diagnostic results", () => {
  const mapStub = buildMapStub();
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub
  });

  const first = bridge.getAtlasDiagnosticForCurrentMapCentre();
  const second = bridge.getAtlasDiagnosticForCurrentMapCentre();

  assert.deepEqual(first, second);
});

test("map.getCenter is called exactly once per invocation", () => {
  const mapStub = buildMapStub();
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub
  });

  bridge.getAtlasDiagnosticForCurrentMapCentre();
  bridge.getAtlasDiagnosticForCurrentMapCentre();

  assert.equal(mapStub.getCenterCallCount, 2);
});

test("bridge uses the existing Atlas diagnostic adapter seam", () => {
  const mapStub = buildMapStub({
    centre: { lat: -38.12, lng: 144.61 }
  });
  let atlasCallCount = 0;
  let receivedCoordinates = null;
  const fakeAtlasResult = Object.freeze({
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    coordinate: {
      latitude: -38.12,
      longitude: 144.61,
      latBucket: -38.12,
      lngBucket: 144.61
    },
    approvedScope: {
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001"
    },
    resolvedRegion: {
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
    },
    resolvedPackage: {
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
    },
    resolvedRecipe: {
      recipeId: "COASTAL_LOCATION_RECIPE_001"
    },
    safetyFlags: {
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    },
    executionBoundaries: {
      liveMapGetterImplemented: true,
      liveMapInvocationPerformed: true,
      listenersAttached: false,
      mapMutated: false,
      rendererAttached: false,
      domMutated: false
    }
  });
  const fakeAtlasAdapter = {
    getAtlasMapDiagnostic(input) {
      atlasCallCount += 1;
      receivedCoordinates = input;
      return fakeAtlasResult;
    },
    getSafetyFlags() {
      return fakeAtlasResult.safetyFlags;
    }
  };

  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub,
    atlasAdapter: fakeAtlasAdapter
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
  assert.equal(atlasCallCount, 1);
  assert.deepEqual(receivedCoordinates, {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.equal(result.atlasDiagnostic, fakeAtlasResult);
});

test("bridge installs the developer-facing function into the developer diagnostics namespace", () => {
  const globalObject = {
    GrowGoDeveloperDiagnostics: {
      getGrowGoMap() {
        return null;
      }
    }
  };
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => null
  });

  const namespace = bridgeModule.installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge({
    globalObject,
    bridge
  });

  assert.equal(namespace, globalObject.GrowGoDeveloperDiagnostics);
  assert.equal(
    typeof globalObject.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre,
    "function"
  );
});

test("bridge adds no event listeners and development alpha uses only explicit diagnostic reads with no renderer or network side effects", () => {
  assert.doesNotMatch(bridgeSource, /addEventListener/);
  assert.doesNotMatch(bridgeSource, /\.on\(/);
  assert.doesNotMatch(bridgeSource, /fetch\(/);
  assert.doesNotMatch(bridgeSource, /XMLHttpRequest/);
  assert.doesNotMatch(bridgeSource, /setInterval\(/);
  assert.doesNotMatch(bridgeSource, /setTimeout\(/);
  assert.match(
    developmentAlphaAppSource,
    /installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge/
  );
  assert.match(
    developmentAlphaAppSource,
    /getAtlasDiagnosticForCurrentMapCentre\(\)/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /runAtlasRendererHandoffLiveOneFrameAttempt|executeGatedLiveOneFrameIntegration|drawCustom25DMapCanvas\(/
  );
});

test("all safety flags remain false and no map mutation occurs", () => {
  const mapStub = buildMapStub();
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => mapStub
  });

  const result = bridge.getAtlasDiagnosticForCurrentMapCentre();
  assert.equal(result.safetyFlags.runtimeExecutionEnabled, false);
  assert.equal(result.safetyFlags.mapAttachmentAllowed, false);
  assert.equal(result.safetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(result.safetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(result.executionBoundaries.listenersAttached, false);
  assert.equal(result.executionBoundaries.mapMutated, false);
  assert.equal(result.executionBoundaries.rendererAttached, false);
  assert.equal(result.executionBoundaries.networkRequested, false);
});
