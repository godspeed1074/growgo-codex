import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const atlasPreviewRendererIntegrationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-preview-renderer-integration-foundation.mjs"
  )
);

const atlasRuntimeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-world-preview-runtime-foundation.mjs"
  )
);

test("Atlas Engine preview renderer integration foundation validates a prepared passive renderer attachment contract", () => {
  const result =
    atlasPreviewRendererIntegrationModule.validateAtlasEnginePreviewRendererIntegrationFoundation();
  const atlasRuntime =
    atlasRuntimeModule.validateAtlasEngineWorldPreviewRuntimeFoundation();

  assert.equal(result.ok, true);
  assert.equal(atlasRuntime.ok, true);
  assert.equal(
    result.atlasPreviewRendererIntegration.atlasSessionId,
    "ATLAS_WORLD_PREVIEW_SESSION_001"
  );
  assert.equal(
    result.atlasPreviewRendererIntegration.attachmentState.currentState,
    "prepared"
  );
  assert.deepEqual(
    result.atlasPreviewRendererIntegration.rendererRequest.previewModes,
    ["day", "sunset", "night"]
  );
  assert.equal(
    result.atlasPreviewRendererIntegration.rendererRequest.rendererPayload.length,
    atlasRuntime.atlasWorldPreviewRuntime.rendererPayload.length
  );
});

test("Atlas Engine preview renderer integration requires manual attachment authorization and prevents duplicate attachments", () => {
  const sessionResult =
    atlasPreviewRendererIntegrationModule.createAtlasEnginePreviewRendererIntegrationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(sessionResult.ok, true);
  assert.equal(
    sessionResult.rendererAttachmentSession.currentAttachmentState(),
    "prepared"
  );

  const blockedAttachment =
    sessionResult.rendererAttachmentSession.requestRendererAttachment();
  const firstAttachment =
    sessionResult.rendererAttachmentSession.requestRendererAttachment({
      manualAttachmentAuthorized: true,
      previewMode: "sunset"
    });
  const duplicateAttachment =
    sessionResult.rendererAttachmentSession.requestRendererAttachment({
      manualAttachmentAuthorized: true,
      previewMode: "night"
    });

  assert.equal(blockedAttachment.ok, false);
  assert.equal(
    blockedAttachment.errorCode,
    "manual_attachment_authorization_required"
  );
  assert.equal(firstAttachment.ok, true);
  assert.equal(firstAttachment.attachment.attachmentState, "verified");
  assert.equal(firstAttachment.attachment.verificationResult.previewMode, "sunset");
  assert.equal(
    firstAttachment.attachment.verificationResult.selectedAppearanceProfile,
    "SUNSET_COASTAL_LIGHTHOUSE"
  );
  assert.equal(
    sessionResult.rendererAttachmentSession.currentAttachmentState(),
    "verified"
  );
  assert.equal(duplicateAttachment.ok, false);
  assert.equal(duplicateAttachment.errorCode, "duplicate_attachment_prevented");
});

test("Atlas Engine preview renderer integration validates detach safety, renderer state release, and stale reference rejection", () => {
  const sessionResult =
    atlasPreviewRendererIntegrationModule.createAtlasEnginePreviewRendererIntegrationSession(
      undefined,
      { manual: true, isolated: true }
    );

  assert.equal(sessionResult.ok, true);

  const attachment =
    sessionResult.rendererAttachmentSession.requestRendererAttachment({
      manualAttachmentAuthorized: true,
      previewMode: "night"
    });
  const detach =
    sessionResult.rendererAttachmentSession.detachRendererAttachment();
  const close =
    sessionResult.rendererAttachmentSession.closeRendererAttachmentSession();
  const staleAttachment =
    sessionResult.rendererAttachmentSession.requestRendererAttachment({
      manualAttachmentAuthorized: true,
      previewMode: "day"
    });

  assert.equal(attachment.ok, true);
  assert.equal(detach.ok, true);
  assert.equal(detach.cleanupResult.currentState, "detached");
  assert.equal(detach.cleanupResult.rendererStateReleased, true);
  assert.equal(detach.cleanupResult.duplicateAttachmentPrevented, true);
  assert.equal(close.ok, true);
  assert.equal(
    close.cleanupStatus,
    "atlas-preview-renderer-attachment-detached"
  );
  assert.equal(close.affectedLiveRuntime, false);
  assert.equal(staleAttachment.ok, false);
  assert.equal(staleAttachment.errorCode, "stale_reference_rejected");
});

test("same Atlas preview input produces identical passive renderer integration output", () => {
  const first =
    atlasPreviewRendererIntegrationModule.validateAtlasEnginePreviewRendererIntegrationFoundation();
  const second =
    atlasPreviewRendererIntegrationModule.validateAtlasEnginePreviewRendererIntegrationFoundation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(
    first.atlasPreviewRendererIntegration,
    second.atlasPreviewRendererIntegration
  );
});

test("Atlas Engine preview renderer integration remains passive and rejects invalid preview modes safely", () => {
  const invalidPreviewModes =
    atlasPreviewRendererIntegrationModule.validateAtlasEnginePreviewRendererIntegrationFoundation(
      {
        ...atlasPreviewRendererIntegrationModule.atlasEnginePreviewRendererIntegrationFoundationDefinition,
        supportedPreviewModes: ["day", "storm", "night"]
      }
    );

  const result =
    atlasPreviewRendererIntegrationModule.validateAtlasEnginePreviewRendererIntegrationFoundation();

  assert.equal(invalidPreviewModes.ok, false);
  assert.equal(invalidPreviewModes.errorCode, "unsupported_preview_mode");
  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasPreviewRendererIntegration,
      "runtimeWorld"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.atlasPreviewRendererIntegration,
      "realMapAttachment"
    ),
    false
  );
  assert.equal(
    result.atlasPreviewRendererIntegration.compatibility.playerRuntimeEnabled,
    false
  );
});
