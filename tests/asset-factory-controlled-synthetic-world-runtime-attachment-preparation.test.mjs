import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const runtimePreparationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "controlled-synthetic-world-runtime-attachment-preparation.mjs"
  )
);

test("controlled synthetic world runtime attachment preparation validates the manual-only runtime session structure", () => {
  const result =
    runtimePreparationModule.validateControlledSyntheticWorldRuntimeAttachmentPreparation();

  assert.equal(result.ok, true);
  assert.equal(
    result.runtimePreparation.runtimeSession.sessionId,
    "SYNTHETIC_RUNTIME_ATTACHMENT_SESSION_001"
  );
  assert.equal(
    result.runtimePreparation.runtimeSession.worldId,
    "SYNTHETIC_COASTAL_WORLD_SCENE_001"
  );
  assert.equal(
    result.runtimePreparation.runtimeSession.activationMode.activationState,
    "prepared"
  );
  assert.deepEqual(
    result.runtimePreparation.runtimeSession.assetInstances.map((entry) => entry.assetId),
    [
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});

test("controlled synthetic world runtime attachment preparation requires manual attachment authorization and prevents duplicates", () => {
  const sessionResult =
    runtimePreparationModule.createControlledSyntheticWorldRuntimeAttachmentPreparationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(sessionResult.ok, true);
  assert.equal(sessionResult.runtimeSession.currentActivationState(), "prepared");

  const blockedAttachment = sessionResult.runtimeSession.requestRendererAttachment();
  const firstAttachment = sessionResult.runtimeSession.requestRendererAttachment({
    manualActivationAuthorized: true
  });
  const duplicateAttachment = sessionResult.runtimeSession.requestRendererAttachment({
    manualActivationAuthorized: true
  });

  assert.equal(blockedAttachment.ok, false);
  assert.equal(
    blockedAttachment.errorCode,
    "manual_activation_authorization_required"
  );
  assert.equal(firstAttachment.ok, true);
  assert.equal(firstAttachment.attachmentBoundary.verificationResult.preparedSuccessfully, true);
  assert.equal(sessionResult.runtimeSession.currentActivationState(), "attached");
  assert.equal(duplicateAttachment.ok, false);
  assert.equal(duplicateAttachment.errorCode, "duplicate_session_prevented");
});

test("controlled synthetic world runtime attachment preparation validates detach safety, state release, and stale reference rejection", () => {
  const sessionResult =
    runtimePreparationModule.createControlledSyntheticWorldRuntimeAttachmentPreparationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(sessionResult.ok, true);

  const attachment = sessionResult.runtimeSession.requestRendererAttachment({
    manualActivationAuthorized: true
  });
  const detach = sessionResult.runtimeSession.detachPreparedAttachment();
  const close = sessionResult.runtimeSession.closeRuntimeSession();
  const staleAttachment = sessionResult.runtimeSession.requestRendererAttachment({
    manualActivationAuthorized: true
  });

  assert.equal(attachment.ok, true);
  assert.equal(detach.ok, true);
  assert.equal(detach.cleanupResult.detachedSafely, true);
  assert.equal(detach.cleanupResult.stateReleased, true);
  assert.equal(detach.cleanupResult.duplicateSessionPrevented, true);
  assert.equal(detach.cleanupResult.staleReferenceRejected, true);
  assert.equal(close.ok, true);
  assert.equal(close.cleanupStatus, "synthetic-runtime-session-closed");
  assert.equal(staleAttachment.ok, false);
  assert.equal(staleAttachment.errorCode, "stale_reference_rejected");
});

test("same synthetic world seed and location produce identical passive runtime preparation output", () => {
  const first =
    runtimePreparationModule.validateControlledSyntheticWorldRuntimeAttachmentPreparation();
  const second =
    runtimePreparationModule.validateControlledSyntheticWorldRuntimeAttachmentPreparation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.runtimePreparation, second.runtimePreparation);
});

test("controlled synthetic world runtime attachment preparation remains passive and rejects invalid asset sets safely", () => {
  const invalidAssetSet =
    runtimePreparationModule.validateControlledSyntheticWorldRuntimeAttachmentPreparation({
      ...runtimePreparationModule.controlledSyntheticWorldRuntimeAttachmentPreparationDefinition,
      expectedAssetIds: [
        "LIGHTHOUSE_ISLAND_ROCKY_001",
        "ROAD_STRAIGHT_SMALL_001"
      ]
    });

  const result =
    runtimePreparationModule.validateControlledSyntheticWorldRuntimeAttachmentPreparation();

  assert.equal(invalidAssetSet.ok, false);
  assert.equal(invalidAssetSet.errorCode, "asset_set_mismatch");
  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.runtimePreparation, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.runtimePreparation.runtimeSession,
      "runtimeRenderer"
    ),
    false
  );
  assert.equal(
    result.runtimePreparation.rendererAttachmentBoundary.verificationResult.liveRuntimeEnabled,
    false
  );
});
