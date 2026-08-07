import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasLiveFeatureInputAdapter,
  extractDeveloperOnlyAtlasLiveViewportFeatures,
  getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus
} from "../client/developer-only-atlas-live-feature-input-adapter.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-live-feature-input-adapter.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_BELLARINE_001",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    ...overrides
  };
}

function createViewport(overrides = {}) {
  const identity = createIdentity();
  return {
    viewportIdentity: "ATLAS_LIVE_VIEWPORT_001",
    mapIdentityId: identity.mapIdentityId,
    regionId: identity.regionId,
    packageId: identity.packageId,
    recipeId: identity.recipeId,
    selectorSeed: identity.selectorSeed,
    zoom: 16,
    bounds: {
      north: -38.11,
      south: -38.14,
      east: 144.64,
      west: 144.6
    },
    ...overrides
  };
}

function createFeatureSource() {
  return {
    schemaId: "GROWGO_CUSTOM25D_CURRENT_VIEWPORT_FEATURE_SOURCE_001",
    zoneFeatures: [
      {
        id: "zone-coastal-001",
        zoneType: "park",
        coords: [
          [-38.1205, 144.612],
          [-38.1205, 144.6132],
          [-38.1213, 144.6132],
          [-38.1213, 144.612]
        ],
        closed: true,
        leisure: "park",
        landuse: null,
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-water-001",
        zoneType: "water",
        coords: [
          [-38.1206, 144.6135],
          [-38.1206, 144.6146],
          [-38.1214, 144.6146],
          [-38.1214, 144.6135]
        ],
        closed: true,
        leisure: null,
        landuse: null,
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-roadside-001",
        zoneType: "grass",
        coords: [
          [-38.125, 144.622],
          [-38.125, 144.623],
          [-38.126, 144.623],
          [-38.126, 144.622]
        ],
        closed: true,
        leisure: null,
        landuse: "grass",
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-reserve-001",
        zoneType: "reserve",
        coords: [
          [-38.129, 144.631],
          [-38.129, 144.632],
          [-38.13, 144.632],
          [-38.13, 144.631]
        ],
        closed: true,
        leisure: "nature_reserve",
        landuse: null,
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-unsupported-001",
        zoneType: "industrial",
        coords: [
          [-38.123, 144.618],
          [-38.123, 144.619],
          [-38.124, 144.619],
          [-38.124, 144.618]
        ],
        closed: true,
        leisure: null,
        landuse: "industrial",
        natural: null,
        waterway: null,
        boundary: null
      },
      {
        id: "zone-outside-001",
        zoneType: "park",
        coords: [
          [-38.3, 144.9],
          [-38.3, 144.91],
          [-38.31, 144.91],
          [-38.31, 144.9]
        ],
        closed: true,
        leisure: "park",
        landuse: null,
        natural: null,
        waterway: null,
        boundary: null
      }
    ],
    buildingFeatures: [
      {
        id: "building-civic-001",
        coords: [
          [-38.122, 144.621],
          [-38.122, 144.6214],
          [-38.1226, 144.6214],
          [-38.1226, 144.621]
        ],
        center: { latitude: -38.1223, longitude: 144.6212 },
        buildingType: "civic",
        shopTag: null,
        amenity: "library",
        office: null,
        cuisine: null,
        tourism: null,
        leisure: null,
        landuse: null,
        buildingArea: 180,
        nearCoast: false
      },
      {
        id: "building-sports-001",
        coords: [
          [-38.127, 144.626],
          [-38.127, 144.6265],
          [-38.1277, 144.6265],
          [-38.1277, 144.626]
        ],
        center: { latitude: -38.1273, longitude: 144.6262 },
        buildingType: "stadium",
        shopTag: null,
        amenity: null,
        office: null,
        cuisine: null,
        tourism: null,
        leisure: "stadium",
        landuse: null,
        buildingArea: 340,
        nearCoast: false
      },
      {
        id: "building-generic-001",
        coords: [
          [-38.128, 144.627],
          [-38.128, 144.6275],
          [-38.1286, 144.6275],
          [-38.1286, 144.627]
        ],
        center: { latitude: -38.1283, longitude: 144.6272 },
        buildingType: "yes",
        shopTag: null,
        amenity: null,
        office: null,
        cuisine: null,
        tourism: null,
        leisure: null,
        landuse: null,
        buildingArea: 150,
        nearCoast: false
      }
    ],
    roadWays: [
      {
        id: "road-near-roadside-001",
        highway: "residential",
        coords: [
          [-38.1254, 144.6222],
          [-38.1256, 144.6228]
        ]
      }
    ]
  };
}

function createAdapter(overrides = {}) {
  return createDeveloperOnlyAtlasLiveFeatureInputAdapter({
    featureSourceProvider: () => createFeatureSource(),
    viewportProvider: () => createViewport(),
    identityProvider: () => createIdentity(),
    ...overrides
  });
}

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

test("adapter defaults unavailable", () => {
  const adapter = createDeveloperOnlyAtlasLiveFeatureInputAdapter();
  const status = getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus(adapter);

  assert.equal(status.adapterReady, false);
  assert.equal(status.lastFailureReason, null);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("valid lightweight source is accepted and classified deterministically", () => {
  const adapter = createAdapter();
  const result = extractDeveloperOnlyAtlasLiveViewportFeatures(adapter);

  assert.equal(result.adapterReady, true);
  assert.equal(result.featureSourceAvailable, true);
  assert.equal(result.sourceFeatureCount, 8);
  assert.equal(result.normalizedFeatureCount, 8);
  assert.equal(result.unsupportedFeatureCount, 2);
  assert.equal(result.classificationCounts.coastal_green, 1);
  assert.equal(result.classificationCounts.vegetation_area, 1);
  assert.equal(result.classificationCounts.roadside_green, 0);
  assert.equal(result.classificationCounts.park, 0);
  assert.equal(result.classificationCounts.reserve, 1);
  assert.equal(result.classificationCounts.civic_site, 1);
  assert.equal(result.classificationCounts.sports_ground, 1);
  assert.equal(result.classificationCounts.building_footprint, 1);
  assert.equal(result.classificationCounts.unsupported, 2);
  assert.deepEqual(
    result.normalizedFeatures.map((feature) => feature.featureClass),
    [
      "civic_site",
      "building_footprint",
      "sports_ground",
      "coastal_green",
      "reserve",
      "vegetation_area",
      "unsupported",
      "unsupported",
    ]
  );
  assert.equal(
    result.plannerFeatures.some((feature) => feature.featureClass === "unsupported"),
    false
  );
  assert.equal(Object.isFrozen(result), true);
  assert.doesNotThrow(() => JSON.stringify(result));
  assertCanonicalFlags(result.canonicalSafetyFlags);
});

test("raw OSM shaped object is rejected", () => {
  const adapter = createAdapter({
    featureSourceProvider: () => ({
      ...createFeatureSource(),
      zoneFeatures: [
        {
          ...createFeatureSource().zoneFeatures[0],
          rawRelation: { id: "relation-1" }
        }
      ]
    })
  });

  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(adapter),
    /RAW_OSM_FEATURE_DETECTED/
  );
});

test("raw Leaflet style object is rejected", () => {
  const adapter = createAdapter({
    featureSourceProvider: () => ({
      ...createFeatureSource(),
      buildingFeatures: [
        {
          ...createFeatureSource().buildingFeatures[0],
          center: { lat: -38.1223, lng: 144.6212, map: { id: "leaflet-map" } }
        }
      ]
    })
  });

  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(adapter),
    /RAW_LEAFLET_REFERENCE_DETECTED/
  );
});

test("viewport filtering excludes out of bounds features", () => {
  const adapter = createAdapter({
    viewportProvider: () =>
      createViewport({
        bounds: {
          north: -38.119,
          south: -38.1216,
          east: 144.615,
          west: 144.611
        }
      })
  });
  const result = extractDeveloperOnlyAtlasLiveViewportFeatures(adapter);

  assert.deepEqual(
    result.normalizedFeatures.map((feature) => feature.featureId),
    ["zone-coastal-001", "zone-water-001"]
  );
});

test("stale viewport and identity mismatches fail closed", () => {
  const staleMap = createAdapter({
    viewportProvider: () =>
      createViewport({
        mapIdentityId: "MAP_STALE"
      })
  });
  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(staleMap),
    /STALE_VIEWPORT_IDENTITY/
  );

  const regionMismatch = createAdapter({
    viewportProvider: () =>
      createViewport({
        regionId: "REGION_OTHER"
      })
  });
  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(regionMismatch),
    /REGION_IDENTITY_MISMATCH/
  );

  const packageMismatch = createAdapter({
    viewportProvider: () =>
      createViewport({
        packageId: "PACKAGE_OTHER"
      })
  });
  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(packageMismatch),
    /PACKAGE_IDENTITY_MISMATCH/
  );

  const recipeMismatch = createAdapter({
    viewportProvider: () =>
      createViewport({
        recipeId: "RECIPE_OTHER"
      })
  });
  assert.throws(
    () => extractDeveloperOnlyAtlasLiveViewportFeatures(recipeMismatch),
    /RECIPE_IDENTITY_MISMATCH/
  );
});

test("feature budget enforcement is deterministic", () => {
  const adapter = createAdapter();
  const result = extractDeveloperOnlyAtlasLiveViewportFeatures(adapter, {
    budget: {
      maxExtractedFeatures: 5,
      maxNormalizedFeatures: 3,
      maxPopulationCommands: 2
    }
  });

  assert.equal(result.normalizedFeatureCount, 3);
  assert.equal(result.truncatedFeatureCount, 5);
  assert.deepEqual(
    result.normalizedFeatures.map((feature) => feature.featureId),
    ["building-civic-001", "building-generic-001", "building-sports-001"]
  );
  assert.equal(result.budget.maxPopulationCommands, 2);
});

test("same input produces same normalized list and deterministic signature", () => {
  const adapter = createAdapter();
  const first = extractDeveloperOnlyAtlasLiveViewportFeatures(adapter);
  const second = extractDeveloperOnlyAtlasLiveViewportFeatures(adapter);

  assert.deepEqual(first.normalizedFeatures, second.normalizedFeatures);
  assert.equal(first.deterministicSignature, second.deterministicSignature);
});

test("status is frozen and serializable with no raw refs", () => {
  const adapter = createAdapter();
  extractDeveloperOnlyAtlasLiveViewportFeatures(adapter);
  const status = getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus(adapter);

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("zoneFeatures" in status, false);
  assert.equal("buildingFeatures" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("module and live seam wiring stay local, manual, and overpass-free", () => {
  const moduleSource = fs.readFileSync(modulePath, "utf8");
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");

  assert.doesNotMatch(
    moduleSource,
    /\bwindow\.\b|\bdocument\.\b|\bglobalThis\.\b|\bfetch\s*\(|Overpass/i
  );
  assert.match(appSource, /createDeveloperOnlyAtlasLiveFeatureInputAdapter/);
  assert.match(
    appSource,
    /getCustom25DCurrentViewportFeatureSourceFromScriptDiagnostics/
  );
  assert.match(
    appSource,
    /createDeveloperOnlyAtlasControlledViewportPopulationPreview|installDeveloperOnlyAtlasControlledViewportPopulationPreview/
  );
  assert.match(scriptSource, /getCustom25DCurrentViewportFeatureSource/);
});
