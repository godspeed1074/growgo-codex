import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const verificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "synthetic-world-custom-25d-visual-verification.mjs"
  )
);

test("synthetic world Custom 2.5D visual verification accepts the controlled synthetic renderer scene", () => {
  const result = verificationModule.validateSyntheticWorldCustom25DVisualVerification();

  assert.equal(result.ok, true);
  assert.equal(
    result.visualVerification.worldId,
    "SYNTHETIC_COASTAL_WORLD_SCENE_001"
  );
  assert.equal(result.visualVerification.renderAcceptanceState.accepted, true);
  assert.equal(result.visualVerification.renderAcceptanceState.receivedObjectCount, 4);
  assert.deepEqual(
    result.visualVerification.renderAcceptanceState.receivedAssetIds,
    [
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});

test("same synthetic world seed, location, and assets produce identical visual verification payloads", () => {
  const first = verificationModule.validateSyntheticWorldCustom25DVisualVerification();
  const second = verificationModule.validateSyntheticWorldCustom25DVisualVerification();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.visualVerification.rendererPayloads, second.visualVerification.rendererPayloads);
  assert.deepEqual(first.visualVerification.renderAcceptanceState, second.visualVerification.renderAcceptanceState);
});

test("synthetic world visual verification session remains manual-only, isolated, and safely cleanable", () => {
  const blockedManual =
    verificationModule.createSyntheticWorldCustom25DVisualVerificationSession();
  const blockedIsolation =
    verificationModule.createSyntheticWorldCustom25DVisualVerificationSession(
      undefined,
      { manual: true }
    );
  const sessionResult =
    verificationModule.createSyntheticWorldCustom25DVisualVerificationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(blockedManual.ok, false);
  assert.equal(blockedManual.errorCode, "manual_verification_required");
  assert.equal(blockedIsolation.ok, false);
  assert.equal(blockedIsolation.errorCode, "isolated_verification_required");

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.verificationSession.renderAcceptanceState.manualOnly, true);
  assert.equal(sessionResult.verificationSession.renderAcceptanceState.isolated, true);

  const firstCleanup = sessionResult.verificationSession.cleanupVerificationSession();
  const secondCleanup = sessionResult.verificationSession.cleanupVerificationSession();

  assert.equal(firstCleanup.ok, true);
  assert.equal(firstCleanup.cleanupPerformed, true);
  assert.equal(firstCleanup.cleanupStatus, "synthetic-verification-session-cleared");
  assert.equal(firstCleanup.affectedLiveRuntime, false);
  assert.equal(firstCleanup.removedRuntimeObjects, false);

  assert.equal(secondCleanup.ok, true);
  assert.equal(secondCleanup.cleanupPerformed, false);
  assert.equal(secondCleanup.cleanupStatus, "already-clean");
});

test("synthetic world visual verification remains passive and does not create renderer runtime objects", () => {
  const result = verificationModule.validateSyntheticWorldCustom25DVisualVerification();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.visualVerification, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.visualVerification.rendererPayloads[0], "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.visualVerification, "runtimeRenderer"),
    false
  );
});
