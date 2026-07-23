import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "first-visible-lighthouse-custom-25d-synthetic-scene.mjs"
  )
);

test("first visible lighthouse Custom 2.5D synthetic scene validates the controlled package-backed scene", () => {
  const result = sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene();

  assert.equal(result.ok, true);
  assert.equal(result.syntheticSceneVerification.worldId, "SYNTHETIC_COASTAL_WORLD_SCENE_001");
  assert.equal(result.syntheticSceneVerification.sceneAcceptanceState.accepted, true);
  assert.equal(result.syntheticSceneVerification.sceneAcceptanceState.receivedObjectCount, 4);
  assert.deepEqual(
    result.syntheticSceneVerification.assetReferences.map((entry) => entry.assetId),
    [
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});

test("first visible lighthouse Custom 2.5D synthetic scene records lighthouse placement, LOD, and appearance states", () => {
  const result = sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene();

  assert.equal(result.ok, true);
  const lighthousePlacement = result.syntheticSceneVerification.placements.find(
    (entry) => entry.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  const lighthouseLod = result.syntheticSceneVerification.lodProfiles.find(
    (entry) => entry.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
  );

  assert.deepEqual(lighthousePlacement, {
    assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    locationId: "LANDMARK_LIGHTHOUSE_ISLAND_001",
    placementRuleId: "PLACEMENT_LANDMARK_COASTAL_001",
    orientation: "east"
  });
  assert.deepEqual(lighthouseLod, {
    assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    lodProfile: "close"
  });
  assert.deepEqual(result.syntheticSceneVerification.appearanceProfiles, {
    day: "DAY_COASTAL_LIGHTHOUSE",
    sunset: "SUNSET_COASTAL_LIGHTHOUSE",
    night: "NIGHT_COASTAL_LIGHTHOUSE",
    defaultAppearanceProfile: "DAY_COASTAL_LIGHTHOUSE"
  });
});

test("same lighthouse synthetic scene definition produces identical passive visible output", () => {
  const first = sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene();
  const second = sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.syntheticSceneVerification, second.syntheticSceneVerification);
});

test("first visible lighthouse Custom 2.5D synthetic scene session remains manual-only, isolated, and safely cleanable", () => {
  const blockedManual =
    sceneModule.createFirstVisibleLighthouseCustom25DSyntheticSceneSession();
  const blockedIsolation =
    sceneModule.createFirstVisibleLighthouseCustom25DSyntheticSceneSession(
      undefined,
      { manual: true }
    );
  const sessionResult =
    sceneModule.createFirstVisibleLighthouseCustom25DSyntheticSceneSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(blockedManual.ok, false);
  assert.equal(blockedManual.errorCode, "manual_verification_required");
  assert.equal(blockedIsolation.ok, false);
  assert.equal(blockedIsolation.errorCode, "isolated_verification_required");

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.verificationSession.sceneAcceptanceState.manualOnly, true);
  assert.equal(sessionResult.verificationSession.sceneAcceptanceState.isolated, true);

  const firstCleanup = sessionResult.verificationSession.cleanupVerificationSession();
  const secondCleanup = sessionResult.verificationSession.cleanupVerificationSession();

  assert.equal(firstCleanup.ok, true);
  assert.equal(firstCleanup.cleanupPerformed, true);
  assert.equal(firstCleanup.cleanupStatus, "synthetic-lighthouse-scene-cleared");
  assert.equal(firstCleanup.affectedLiveRuntime, false);
  assert.equal(firstCleanup.removedRuntimeObjects, false);

  assert.equal(secondCleanup.ok, true);
  assert.equal(secondCleanup.cleanupPerformed, false);
  assert.equal(secondCleanup.cleanupStatus, "already-clean");
});

test("first visible lighthouse Custom 2.5D synthetic scene rejects incomplete appearance profiles safely and remains passive", () => {
  const invalidAppearanceProfiles =
    sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene({
      ...sceneModule.firstVisibleLighthouseCustom25DSyntheticSceneDefinition,
      supportedAppearanceProfiles: [
        "DAY_COASTAL_LIGHTHOUSE",
        "NIGHT_COASTAL_LIGHTHOUSE"
      ]
    });

  const result = sceneModule.validateFirstVisibleLighthouseCustom25DSyntheticScene();

  assert.equal(invalidAppearanceProfiles.ok, false);
  assert.equal(invalidAppearanceProfiles.errorCode, "appearance_profile_mismatch");
  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.syntheticSceneVerification, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.syntheticSceneVerification.rendererPayloads[0], "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.syntheticSceneVerification, "runtimeRenderer"),
    false
  );
});
