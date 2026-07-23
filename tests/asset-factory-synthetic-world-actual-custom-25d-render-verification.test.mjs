import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const renderVerificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-world-actual-custom-25d-render-verification.mjs"
  )
);

test("synthetic world actual Custom 2.5D render verification validates the controlled render result", () => {
  const result =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification();

  assert.equal(result.ok, true);
  assert.equal(result.renderVerification.worldId, "SYNTHETIC_COASTAL_WORLD_SCENE_001");
  assert.equal(result.renderVerification.verificationResult.drawAccepted, true);
  assert.equal(result.renderVerification.verificationResult.objectCount, 4);
  assert.deepEqual(result.renderVerification.verificationResult.orderedAssetIds, [
    "LIGHTHOUSE_ISLAND_ROCKY_001",
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "ROAD_STRAIGHT_SMALL_001",
    "TREE_EUCALYPTUS_001"
  ]);
});

test("synthetic world actual Custom 2.5D render verification validates ordering, placement transforms, and LOD selection", () => {
  const result =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification();

  assert.equal(result.ok, true);
  assert.equal(result.renderVerification.verificationResult.placementTransformsVerified, true);
  assert.equal(result.renderVerification.verificationResult.lodSelectionVerified, true);

  const lighthousePayload = result.renderVerification.rendererPayloads.find(
    (entry) => entry.rendererAssetReference.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  assert.deepEqual(lighthousePayload.transformData, {
    position: {
      x: 11.5,
      y: 6.5
    },
    orientation: "east",
    placementRuleId: "PLACEMENT_LANDMARK_COASTAL_001",
    locationId: "LANDMARK_LIGHTHOUSE_ISLAND_001"
  });
});

test("same synthetic world seed and location produce identical render verification output", () => {
  const first =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification();
  const second =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.renderVerification, second.renderVerification);
});

test("synthetic world actual Custom 2.5D render verification session remains manual-only, isolated, and safely closable without duplicates", () => {
  const blockedManual =
    renderVerificationModule.createSyntheticWorldActualCustom25DRenderVerificationSession();
  const blockedIsolation =
    renderVerificationModule.createSyntheticWorldActualCustom25DRenderVerificationSession(
      undefined,
      { manual: true }
    );
  const sessionResult =
    renderVerificationModule.createSyntheticWorldActualCustom25DRenderVerificationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(blockedManual.ok, false);
  assert.equal(blockedManual.errorCode, "manual_verification_required");
  assert.equal(blockedIsolation.ok, false);
  assert.equal(blockedIsolation.errorCode, "isolated_verification_required");

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.renderSession.renderRequest.manualOnly, true);
  assert.equal(sessionResult.renderSession.renderRequest.isolated, true);

  const firstClose = sessionResult.renderSession.closeRenderSession();
  const secondClose = sessionResult.renderSession.closeRenderSession();

  assert.equal(firstClose.ok, true);
  assert.equal(firstClose.cleanupPerformed, true);
  assert.equal(firstClose.cleanupStatus, "synthetic-render-session-closed");
  assert.equal(firstClose.duplicateSessionCreated, false);
  assert.equal(firstClose.affectedLiveRuntime, false);

  assert.equal(secondClose.ok, true);
  assert.equal(secondClose.cleanupPerformed, false);
  assert.equal(secondClose.cleanupStatus, "already-closed");
});

test("synthetic world actual Custom 2.5D render verification rejects ordering mismatches safely and remains passive", () => {
  const invalidOrdering =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification({
      ...renderVerificationModule.syntheticWorldActualCustom25DRenderVerificationDefinition,
      expectedOrderedAssetIds: [
        "BUILDING_HOUSE_SMALL_COASTAL_001",
        "LIGHTHOUSE_ISLAND_ROCKY_001",
        "ROAD_STRAIGHT_SMALL_001",
        "TREE_EUCALYPTUS_001"
      ]
    });

  const result =
    renderVerificationModule.validateSyntheticWorldActualCustom25DRenderVerification();

  assert.equal(invalidOrdering.ok, false);
  assert.equal(invalidOrdering.errorCode, "asset_ordering_mismatch");
  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.renderVerification, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.renderVerification.rendererPayloads[0], "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.renderVerification, "runtimeRenderer"),
    false
  );
});
