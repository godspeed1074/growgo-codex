import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAssetRegistry,
  DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES,
  getDeveloperOnlyAtlasAssetRegistryStatus,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "../client/developer-only-atlas-asset-registry.mjs";
import {
  createDeveloperOnlyAtlasAssetBatch,
  createDeveloperOnlyAtlasMultiAssetPlacementProvider,
  getDeveloperOnlyAtlasMultiAssetPlacementStatus,
  resolveDeveloperOnlyAtlasMultiAssetPlacement,
  submitDeveloperOnlyAtlasAssetBatch
} from "../client/developer-only-atlas-multi-asset-placement-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const registryModulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-asset-registry.mjs"
);
const providerModulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-multi-asset-placement-provider.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_1_ATLAS_MULTI_ASSET_PLACEMENT_SYSTEM.md"
);

function createInput(overrides = {}) {
  return {
    assetId: "TREE_EUCALYPTUS_001",
    version: "v001",
    coordinate: {
      latitude: -38.1487,
      longitude: 144.3607
    },
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "TREE_EUCALYPTUS_RECIPE_001",
    selectorSeed: "SELECTOR_SEED_001",
    ...overrides
  };
}

function createHarness(overrides = {}) {
  const submissions = [];
  const registry = createDeveloperOnlyAtlasAssetRegistry({
    entries: overrides.entries ?? DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES
  });
  const provider = createDeveloperOnlyAtlasMultiAssetPlacementProvider({
    registry,
    atlasRenderSubmissionProvider:
      overrides.atlasRenderSubmissionProvider ??
      ((payload) => {
        submissions.push(payload);
        return {
          accepted: true,
          reasonCode: "ATLAS_RENDER_COMMAND_ACCEPTED"
        };
      }),
    coordinateProjectionProvider:
      overrides.coordinateProjectionProvider ??
      (({ geographicCoordinate, registryEntry }) => ({
        x: Number((geographicCoordinate.longitude * 1000).toFixed(3)),
        y: Number((-geographicCoordinate.latitude * 1000).toFixed(3)),
        projectionPath: `projection_${registryEntry.assetCategory}`
      }))
  });

  return {
    registry,
    provider,
    submissions
  };
}

test("1. registry loads the approved asset set", () => {
  const harness = createHarness();
  const status = getDeveloperOnlyAtlasAssetRegistryStatus(harness.registry);

  assert.equal(status.registeredAssetCount, 4);
  assert.equal(status.registryReady, true);
  assert.doesNotThrow(() => JSON.stringify(status));

  const eucalyptus = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    harness.registry,
    "TREE_EUCALYPTUS_001"
  );
  const bottlebrush = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    harness.registry,
    "TREE_BOTTLEBRUSH_001"
  );
  const shrub = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    harness.registry,
    "SHRUB_COASTAL_LOW_001"
  );
  const pavilion = resolveDeveloperOnlyAtlasAssetRegistryEntry(
    harness.registry,
    "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );

  assert.equal(eucalyptus.assetReferenceId, "TREE_EUCALYPTUS_001@v001");
  assert.equal(bottlebrush.assetVersion, "v002");
  assert.equal(shrub.assetFamily, "COASTAL_SHRUB_FAMILY_001");
  assert.equal(pavilion.assetCategory, "building");
});

test("2. unknown asset is rejected", () => {
  const harness = createHarness();
  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput({
        assetId: "UNKNOWN_ASSET_001",
        version: "v001"
      })),
    /UNKNOWN_ASSET_ID/
  );
});

test("3. duplicate registry asset is rejected", () => {
  assert.throws(
    () =>
      createDeveloperOnlyAtlasAssetRegistry({
        entries: [
          ...DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES,
          DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_REGISTRY_ENTRIES[0]
        ]
      }),
    /DUPLICATE_ASSET_REGISTRY_ENTRY/
  );
});

test("4. asset version mismatch is rejected", () => {
  const harness = createHarness();
  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput({
        assetId: "TREE_BOTTLEBRUSH_001",
        version: "v001",
        recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
      })),
    /INVALID_ASSET_VERSION/
  );
});

test("5. vegetation placement is deterministic", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "TREE_BOTTLEBRUSH_001",
      version: "v002",
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
    })
  );
  const second = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "TREE_BOTTLEBRUSH_001",
      version: "v002",
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
    })
  );

  assert.deepEqual(first.renderCommand, second.renderCommand);
  assert.equal(first.assetCategory, "vegetation");
});

test("6. building placement is deterministic and uses stricter orientation", () => {
  const harness = createHarness();
  const result = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      version: "1.0.0",
      recipeId: "SPORTS_OVAL_RECIPE_001"
    })
  );

  assert.equal(result.assetCategory, "building");
  assert.equal([0, 90, 180, 270].includes(result.rotation), true);
  assert.equal(result.lod, "gameplay");
});

test("7. different seeds create valid deterministic differences", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "SHRUB_COASTAL_LOW_001",
      version: "v002",
      recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
      selectorSeed: "SELECTOR_SEED_001"
    })
  );
  const second = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "SHRUB_COASTAL_LOW_001",
      version: "v002",
      recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
      selectorSeed: "SELECTOR_SEED_002"
    })
  );

  assert.notEqual(first.instanceId, second.instanceId);
  assert.notEqual(first.rotation, second.rotation);
});

test("8. multi-asset batch creation works", () => {
  const harness = createHarness();
  const batch = createDeveloperOnlyAtlasAssetBatch(harness.provider, [
    createInput(),
    createInput({
      assetId: "TREE_BOTTLEBRUSH_001",
      version: "v002",
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
    }),
    createInput({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      version: "1.0.0",
      recipeId: "SPORTS_OVAL_RECIPE_001"
    })
  ]);

  assert.equal(batch.commands.length, 3);
  assert.match(batch.batchId, /^ATLAS_ASSET_BATCH_/);
});

test("9. duplicate instance removal works", () => {
  const harness = createHarness();
  const duplicated = createInput();
  const batch = createDeveloperOnlyAtlasAssetBatch(harness.provider, [
    duplicated,
    duplicated
  ]);

  assert.equal(batch.commands.length, 1);
});

test("10. batch ordering is deterministic", () => {
  const harness = createHarness();
  const inputs = [
    createInput({
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      version: "1.0.0",
      recipeId: "SPORTS_OVAL_RECIPE_001"
    }),
    createInput(),
    createInput({
      assetId: "TREE_BOTTLEBRUSH_001",
      version: "v002",
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
    })
  ];

  const first = createDeveloperOnlyAtlasAssetBatch(harness.provider, inputs);
  const second = createDeveloperOnlyAtlasAssetBatch(harness.provider, [...inputs].reverse());

  assert.deepEqual(first, second);
});

test("11. command output stays lightweight", () => {
  const harness = createHarness();
  const result = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput()
  );

  assert.equal("geometry" in result, false);
  assert.equal("textures" in result, false);
  assert.equal("blend" in result, false);
  assert.equal("rawModel" in result, false);
});

test("12. no geometry payload and no texture payload are exposed", () => {
  const harness = createHarness();
  const result = resolveDeveloperOnlyAtlasMultiAssetPlacement(
    harness.provider,
    createInput({
      assetId: "TREE_BOTTLEBRUSH_001",
      version: "v002",
      recipeId: "TREE_BOTTLEBRUSH_RECIPE_001"
    })
  );

  assert.equal("geometry" in result.renderCommand, false);
  assert.equal("texture" in result.renderCommand, false);
  assert.equal("geometry" in result, false);
  assert.equal("texture" in result, false);
});

test("13. Atlas render-command handoff works with one batch", () => {
  const harness = createHarness();
  const batch = createDeveloperOnlyAtlasAssetBatch(harness.provider, [
    createInput(),
    createInput({
      assetId: "SHRUB_COASTAL_LOW_001",
      version: "v002",
      recipeId: "SHRUB_COASTAL_LOW_RECIPE_001"
    })
  ]);
  const submission = submitDeveloperOnlyAtlasAssetBatch(harness.provider, batch);

  assert.equal(submission.accepted, true);
  assert.equal(harness.submissions.length, 1);
  assert.deepEqual(harness.submissions[0], batch);
});

test("14. invalid region package and recipe are rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput({
        regionId: "OUTSIDE_SCOPE"
      })),
    /INVALID_REGION_ID/
  );

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput({
        packageId: "WRONG_PACKAGE"
      })),
    /INVALID_PACKAGE_ID/
  );

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput({
        recipeId: "WRONG_RECIPE"
      })),
    /INVALID_RECIPE_ID/
  );
});

test("15. status is immutable and exposes no raw references", () => {
  const harness = createHarness();
  resolveDeveloperOnlyAtlasMultiAssetPlacement(harness.provider, createInput());
  createDeveloperOnlyAtlasAssetBatch(harness.provider, [createInput()]);
  const status = getDeveloperOnlyAtlasMultiAssetPlacementStatus(harness.provider);

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("renderer" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("leaflet" in status, false);
  assert.equal("model" in status, false);
});

test("16. no startup activation automatic spawning or renderer bypass exists", () => {
  const registrySource = fs.readFileSync(registryModulePath, "utf8");
  const providerSource = fs.readFileSync(providerModulePath, "utf8");
  const combined = `${registrySource}\n${providerSource}`;

  assert.doesNotMatch(combined, /\bwindow\b/);
  assert.doesNotMatch(combined, /\bdocument\b/);
  assert.doesNotMatch(combined, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(combined, /\bLeaflet\b/);
  assert.doesNotMatch(combined, /\bcreateElement\b/);
});

test("17. all safety flags remain false and session documentation exists", () => {
  const harness = createHarness();
  const status = getDeveloperOnlyAtlasMultiAssetPlacementStatus(harness.provider);

  assert.deepEqual(status.canonicalSafetyFlags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.equal(fs.existsSync(sessionDocPath), true);
});
