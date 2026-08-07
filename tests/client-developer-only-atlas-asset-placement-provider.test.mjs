import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  clearDeveloperOnlyAtlasAssetPlacement,
  createDeveloperOnlyAtlasAssetPlacementProvider,
  getDeveloperOnlyAtlasAssetPlacementStatus,
  resolveDeveloperOnlyAtlasAssetPlacement,
  submitDeveloperOnlyAtlasAssetRenderCommand
} from "../client/developer-only-atlas-asset-placement-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client/developer-only-atlas-asset-placement-provider.mjs"
);
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_0_ATLAS_ASSET_INTEGRATION_PIPELINE.md"
);

function createInput(overrides = {}) {
  return {
    assetId: "TREE_EUCALYPTUS_001",
    assetVersion: "v001",
    assetCategory: "nature",
    geographicCoordinate: {
      latitude: -38.1487,
      longitude: 144.3607
    },
    placementSeed: "PLACEMENT_SEED_001",
    selectorSeed: "SELECTOR_SEED_001",
    scaleRule: "atlas_eucalyptus_scale_v1",
    rotationRule: "atlas_seeded_rotation_v1",
    lodRule: "atlas_eucalyptus_lod_v1",
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "TREE_EUCALYPTUS_RECIPE_001",
    ...overrides
  };
}

function createHarness(overrides = {}) {
  const submissions = [];
  const provider = createDeveloperOnlyAtlasAssetPlacementProvider({
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
      (({ geographicCoordinate }) => ({
        x: Number((geographicCoordinate.longitude * 1000).toFixed(3)),
        y: Number((-geographicCoordinate.latitude * 1000).toFixed(3)),
        projectionPath: "test_projection_v1"
      })),
    approvedRegions: overrides.approvedRegions ?? ["BELLARINE"],
    approvedPackages: overrides.approvedPackages ?? ["ATLAS_DEVELOPER_PACKAGE"]
  });

  return {
    provider,
    submissions
  };
}

test("1. provider status starts frozen, serializable, and safety flags remain false", () => {
  const harness = createHarness();
  const status = getDeveloperOnlyAtlasAssetPlacementStatus(harness.provider);

  assert.equal(status.placementStatus, "idle");
  assert.equal(status.renderCommandCreated, false);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.canonicalSafetyFlags), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.deepEqual(status.canonicalSafetyFlags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});

test("2. TREE_EUCALYPTUS_001 resolves into a deterministic asset instance and render command", () => {
  const harness = createHarness();
  const result = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );

  assert.equal(result.assetInstanceDescription.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.assetReference.assetReferenceId, "TREE_EUCALYPTUS_001@v001");
  assert.equal(result.renderCommand.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.renderCommand.lod, "gameplay");
  assert.equal(result.renderCommandCreated, true);
  assert.equal(Object.isFrozen(result), true);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("3. same input produces identical deterministic output", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );
  clearDeveloperOnlyAtlasAssetPlacement(harness.provider);
  const second = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );

  assert.deepEqual(first, second);
});

test("4. different seed produces different valid output", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );
  const second = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput({
      placementSeed: "PLACEMENT_SEED_002",
      selectorSeed: "SELECTOR_SEED_002"
    })
  );

  assert.notEqual(first.instanceId, second.instanceId);
  assert.notEqual(first.renderCommand.rotation, second.renderCommand.rotation);
  assert.notEqual(first.renderCommand.scale, second.renderCommand.scale);
  assert.equal(second.renderCommand.assetId, "TREE_EUCALYPTUS_001");
});

test("5. different coordinate produces a different instance id", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );
  const second = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput({
      geographicCoordinate: {
        latitude: -38.1488,
        longitude: 144.3608
      }
    })
  );

  assert.notEqual(first.instanceId, second.instanceId);
});

test("6. same asset appears identical between independent sessions", () => {
  const firstHarness = createHarness();
  const secondHarness = createHarness();

  const first = resolveDeveloperOnlyAtlasAssetPlacement(
    firstHarness.provider,
    createInput()
  );
  const second = resolveDeveloperOnlyAtlasAssetPlacement(
    secondHarness.provider,
    createInput()
  );

  assert.deepEqual(first.renderCommand, second.renderCommand);
  assert.equal(first.instanceId, second.instanceId);
});

test("7. missing asset id fails closed", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        assetId: null
      })),
    /MISSING_ASSET_ID/
  );
  assert.equal(
    getDeveloperOnlyAtlasAssetPlacementStatus(harness.provider).failureReason,
    "MISSING_ASSET_ID"
  );
});

test("8. unknown asset id is rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        assetId: "TREE_UNKNOWN_001"
      })),
    /UNKNOWN_ASSET_ID/
  );
});

test("9. invalid asset version is rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        assetVersion: "v999"
      })),
    /INVALID_ASSET_VERSION/
  );
});

test("10. missing coordinate is rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        geographicCoordinate: null
      })),
    /MISSING_GEOGRAPHIC_COORDINATE/
  );
});

test("11. invalid region and package are rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        regionId: "OUTSIDE_SCOPE"
      })),
    /INVALID_REGION_ID/
  );

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        packageId: "OTHER_PACKAGE"
      })),
    /INVALID_PACKAGE_ID/
  );
});

test("12. missing placement seed is rejected", () => {
  const harness = createHarness();

  assert.throws(
    () =>
      resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput({
        placementSeed: null
      })),
    /MISSING_PLACEMENT_SEED/
  );
});

test("13. asset reference is reused without duplicating asset data", () => {
  const harness = createHarness();
  const first = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );
  const second = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput({
      geographicCoordinate: {
        latitude: -38.1555,
        longitude: 144.3666
      }
    })
  );

  assert.equal(first.assetReference, second.assetReference);
  assert.equal("geometry" in first.assetReference, false);
  assert.equal("blend" in first.assetReference, false);
  assert.equal("texture" in first.assetReference, false);
});

test("14. render submission uses render commands only and is accepted by the Atlas seam", () => {
  const harness = createHarness();
  const resolved = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );
  const submission = submitDeveloperOnlyAtlasAssetRenderCommand(
    harness.provider,
    resolved
  );

  assert.equal(submission.accepted, true);
  assert.equal(harness.submissions.length, 1);
  assert.deepEqual(harness.submissions[0], {
    renderCommands: [resolved.renderCommand],
    assetReferenceId: "TREE_EUCALYPTUS_001@v001",
    instanceId: resolved.instanceId,
    lod: resolved.lodSelected
  });
});

test("15. rejected render submission fails closed", () => {
  const harness = createHarness({
    atlasRenderSubmissionProvider() {
      return {
        accepted: false,
        reasonCode: "DRAW_INTEGRATION_REJECTED"
      };
    }
  });
  const resolved = resolveDeveloperOnlyAtlasAssetPlacement(
    harness.provider,
    createInput()
  );

  assert.throws(
    () =>
      submitDeveloperOnlyAtlasAssetRenderCommand(harness.provider, resolved),
    /DRAW_INTEGRATION_REJECTED/
  );
});

test("16. cleanup clears placement state without affecting safety flags", () => {
  const harness = createHarness();
  resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput());

  const status = clearDeveloperOnlyAtlasAssetPlacement(harness.provider, {
    reasonCode: "MANUAL_CLEAR"
  });

  assert.equal(status.placementStatus, "cleared");
  assert.equal(status.assetId, null);
  assert.equal(status.instanceId, null);
  assert.equal(status.renderCommandCreated, false);
  assert.deepEqual(status.canonicalSafetyFlags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
});

test("17. status remains frozen and exposes no raw model or browser objects", () => {
  const harness = createHarness();
  resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput());
  submitDeveloperOnlyAtlasAssetRenderCommand(
    harness.provider,
    resolveDeveloperOnlyAtlasAssetPlacement(harness.provider, createInput())
  );

  const status = getDeveloperOnlyAtlasAssetPlacementStatus(harness.provider);

  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("renderer" in status, false);
  assert.equal("leaflet" in status, false);
  assert.equal(status.renderSubmissionAccepted, true);
});

test("18. module stays planning-safe with no startup activation or browser globals", () => {
  const source = fs.readFileSync(modulePath, "utf8");

  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bdocument\b/);
  assert.doesNotMatch(source, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(source, /\bsetInterval\b/);
  assert.doesNotMatch(source, /\bLeaflet\b/);
});

test("19. session documentation exists for phase 212.0", () => {
  assert.equal(fs.existsSync(sessionDocPath), true);
});
