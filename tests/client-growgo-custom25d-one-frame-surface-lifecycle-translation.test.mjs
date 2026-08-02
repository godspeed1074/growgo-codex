import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const translationModule = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-one-frame-surface-lifecycle-translation.mjs"
  )
);
const lifecycleOwnerModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  )
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const translatorSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-one-frame-surface-lifecycle-translation.mjs"
  ),
  "utf8"
);

function createEnvironment(overrides = {}) {
  const calls = {
    removeCanvas: [],
    removePane: [],
    off: [],
    retentionReset: 0
  };

  const pane = {
    dataset: { owner: "custom25DMapPane" },
    childElementCount: overrides.paneChildElementCount ?? 0
  };
  const canvas = { className: "custom-25d-map-canvas" };
  const map = {
    id: "fake-map",
    off(eventNames, listener) {
      calls.off.push({ eventNames, listener });
    }
  };

  const preparedSurface = {
    schemaId: "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001",
    map,
    pane,
    canvas,
    paneName: overrides.paneName ?? "custom25DMapPane",
    canvasClassName: overrides.canvasClassName ?? "custom-25d-map-canvas",
    paneReused: overrides.paneReused ?? !overrides.paneOwnedByOperation,
    paneCreated: overrides.paneOwnedByOperation === true,
    paneOwnedByOperation: overrides.paneOwnedByOperation ?? false,
    canvasOwnedByOperation: overrides.canvasOwnedByOperation ?? true,
    canvasAppended: overrides.canvasAppended ?? true,
    cssWidth: 640,
    cssHeight: 360,
    backingWidth: 1280,
    backingHeight: 720,
    devicePixelRatio: 2,
    canvasPosition: { x: 12, y: 34 },
    cleanupRequired: overrides.cleanupRequired ?? true,
    rollbackAvailable: overrides.rollbackAvailable ?? true,
    listenerAdded: overrides.listenerAdded ?? false,
    retentionWritten: overrides.retentionWritten ?? false,
    drawRequested: overrides.drawRequested ?? false,
    automaticInvocation: false
  };

  const removeCanvas = (canvasArg) => {
    calls.removeCanvas.push(canvasArg);
    if (overrides.throwOnRemoveCanvas) {
      throw overrides.throwOnRemoveCanvas;
    }
  };

  const removePaneIfEmpty = (paneArg, paneNameArg) => {
    calls.removePane.push({ paneArg, paneNameArg });
    if (overrides.throwOnRemovePane) {
      throw overrides.throwOnRemovePane;
    }
    return { ok: true, removed: paneArg.childElementCount === 0 };
  };

  const lifecycleOwner =
    overrides.lifecycleOwner ??
    lifecycleOwnerModule.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer",
      removeCanvas,
      removePaneIfEmpty
    });

  const translator =
    translationModule.createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation({
      expectedPaneName: "custom25DMapPane",
      expectedRetentionSlot: "custom25DMapLayer"
    });

  return {
    calls,
    map,
    pane,
    canvas,
    preparedSurface,
    lifecycleOwner,
    translator
  };
}

test("module import has no side effects and translator factory exists", () => {
  assert.equal(
    typeof translationModule.createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation,
    "function"
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-one-frame-surface-lifecycle-translation/
  );
});

test("valid prepared surface is accepted and exact map pane and canvas identities are preserved", () => {
  const env = createEnvironment();
  const result = env.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: env.preparedSurface,
    lifecycleOwner: env.lifecycleOwner
  });
  const status = env.translator.getTranslationStatus();
  const lifecycleStatus = env.lifecycleOwner.getLifecycleOwnerStatus();

  assert.equal(result.outcome, "translated");
  assert.equal(result.reasonCode, "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED");
  assert.equal(result.surfaceValidated, true);
  assert.equal(result.lifecycleOwnerValidated, true);
  assert.equal(result.ownershipMode, "ONE_FRAME_SURFACE_ONLY");
  assert.equal(result.mapIdentityPreserved, true);
  assert.equal(result.paneIdentityPreserved, true);
  assert.equal(result.canvasIdentityPreserved, true);
  assert.equal(result.lifecycleRegistrationAttempted, true);
  assert.equal(result.lifecycleRegistrationSucceeded, true);
  assert.equal(result.lifecycleBundle.map, env.map);
  assert.equal(result.lifecycleBundle.pane, env.pane);
  assert.equal(result.lifecycleBundle.canvas, env.canvas);
  assert.equal(result.lifecycleBundleSnapshot.paneName, "custom25DMapPane");
  assert.equal(result.lifecycleBundleSnapshot.canvasClassName, "custom-25d-map-canvas");
  assert.equal(status.moduleLevelMapRetained, false);
  assert.equal(status.moduleLevelPaneRetained, false);
  assert.equal(status.moduleLevelCanvasRetained, false);
  assert.equal(lifecycleStatus.ownershipMode, "ONE_FRAME_SURFACE_ONLY");
});

test("one-frame ownership is explicit and does not invent listener or retention ownership", () => {
  const env = createEnvironment();
  const result = env.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: env.preparedSurface,
    lifecycleOwner: env.lifecycleOwner
  });

  assert.equal(result.listenerOwnershipAbsent, true);
  assert.equal(result.retentionOwnershipAbsent, true);
  assert.equal(result.lifecycleBundleSnapshot.listenerOwned, false);
  assert.deepEqual(result.lifecycleBundleSnapshot.listenerEventNames, []);
  assert.equal(result.lifecycleBundleSnapshot.listenerFunction, null);
  assert.equal(result.lifecycleBundleSnapshot.redrawCallback, null);
  assert.equal(result.lifecycleBundleSnapshot.retentionWritten, false);
  assert.equal(result.lifecycleBundleSnapshot.retentionValue, null);
  assert.equal(result.lifecycleBundleSnapshot.retentionResetRequired, false);
});

test("canvas cleanup is required created pane is eligible for safe removal reused pane is not owned and unrelated-resource preservation remains true", () => {
  const createdEnv = createEnvironment({ paneOwnedByOperation: true });
  const reusedEnv = createEnvironment({ paneOwnedByOperation: false });

  const created = createdEnv.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: createdEnv.preparedSurface,
    lifecycleOwner: createdEnv.lifecycleOwner
  });
  const reused = reusedEnv.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: reusedEnv.preparedSurface,
    lifecycleOwner: reusedEnv.lifecycleOwner
  });

  assert.equal(created.cleanupRequired, true);
  assert.equal(created.canvasRemovalRequired, true);
  assert.equal(created.paneRemovalEligible, true);
  assert.equal(created.lifecycleBundleSnapshot.paneOwned, true);
  assert.equal(created.lifecycleBundleSnapshot.unrelatedResourcesPreserved, true);

  assert.equal(reused.paneRemovalEligible, false);
  assert.equal(reused.lifecycleBundleSnapshot.paneOwned, false);
});

test("lifecycle registration succeeds once and no cleanup executes during translation", () => {
  const env = createEnvironment();
  const first = env.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: env.preparedSurface,
    lifecycleOwner: env.lifecycleOwner
  });
  const second = env.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: env.preparedSurface,
    lifecycleOwner: env.lifecycleOwner
  });

  assert.equal(first.lifecycleRegistrationSucceeded, true);
  assert.equal(second.reasonCode, "TRANSLATOR_CLOSED");
  assert.deepEqual(env.calls.removeCanvas, []);
  assert.deepEqual(env.calls.removePane, []);
  assert.deepEqual(env.calls.off, []);
  assert.equal(env.calls.retentionReset, 0);
});

test("missing surface invalid schema incorrect pane canvas identity unowned canvas unappended canvas cleanup false rollback unavailable listenerAdded retentionWritten and drawRequested all block", () => {
  const missingSurfaceEnv = createEnvironment();
  const invalidSchemaEnv = createEnvironment();
  invalidSchemaEnv.preparedSurface.schemaId = "WRONG_SCHEMA";
  const wrongPaneEnv = createEnvironment({ paneName: "wrongPane" });
  const wrongCanvasClassEnv = createEnvironment({ canvasClassName: "wrong-class" });
  const unownedCanvasEnv = createEnvironment({ canvasOwnedByOperation: false });
  const unappendedCanvasEnv = createEnvironment({ canvasAppended: false });
  const cleanupFalseEnv = createEnvironment({ cleanupRequired: false });
  const rollbackFalseEnv = createEnvironment({ rollbackAvailable: false });
  const listenerAddedEnv = createEnvironment({ listenerAdded: true });
  const retentionWrittenEnv = createEnvironment({ retentionWritten: true });
  const drawRequestedEnv = createEnvironment({ drawRequested: true });

  assert.equal(
    missingSurfaceEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      lifecycleOwner: missingSurfaceEnv.lifecycleOwner
    }).reasonCode,
    "MISSING_PREPARED_SURFACE"
  );
  assert.equal(
    invalidSchemaEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: invalidSchemaEnv.preparedSurface,
      lifecycleOwner: invalidSchemaEnv.lifecycleOwner
    }).reasonCode,
    "INVALID_SURFACE_SCHEMA"
  );
  assert.equal(
    wrongPaneEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: wrongPaneEnv.preparedSurface,
      lifecycleOwner: wrongPaneEnv.lifecycleOwner
    }).reasonCode,
    "INCORRECT_PANE_NAME"
  );
  assert.equal(
    wrongCanvasClassEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: wrongCanvasClassEnv.preparedSurface,
      lifecycleOwner: wrongCanvasClassEnv.lifecycleOwner
    }).reasonCode,
    "INCORRECT_CANVAS_CLASS"
  );
  assert.equal(
    unownedCanvasEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: unownedCanvasEnv.preparedSurface,
      lifecycleOwner: unownedCanvasEnv.lifecycleOwner
    }).reasonCode,
    "CANVAS_NOT_OWNED"
  );
  assert.equal(
    unappendedCanvasEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: unappendedCanvasEnv.preparedSurface,
      lifecycleOwner: unappendedCanvasEnv.lifecycleOwner
    }).reasonCode,
    "CANVAS_NOT_APPENDED"
  );
  assert.equal(
    cleanupFalseEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: cleanupFalseEnv.preparedSurface,
      lifecycleOwner: cleanupFalseEnv.lifecycleOwner
    }).reasonCode,
    "CLEANUP_REQUIRED_FALSE"
  );
  assert.equal(
    rollbackFalseEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: rollbackFalseEnv.preparedSurface,
      lifecycleOwner: rollbackFalseEnv.lifecycleOwner
    }).reasonCode,
    "ROLLBACK_UNAVAILABLE"
  );
  assert.equal(
    listenerAddedEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: listenerAddedEnv.preparedSurface,
      lifecycleOwner: listenerAddedEnv.lifecycleOwner
    }).reasonCode,
    "LISTENER_ALREADY_ADDED"
  );
  assert.equal(
    retentionWrittenEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: retentionWrittenEnv.preparedSurface,
      lifecycleOwner: retentionWrittenEnv.lifecycleOwner
    }).reasonCode,
    "RETENTION_ALREADY_WRITTEN"
  );
  assert.equal(
    drawRequestedEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: drawRequestedEnv.preparedSurface,
      lifecycleOwner: drawRequestedEnv.lifecycleOwner
    }).reasonCode,
    "DRAW_ALREADY_REQUESTED"
  );
});

test("missing references missing lifecycle owner and incompatible lifecycle owner all block before registration", () => {
  const missingMapEnv = createEnvironment();
  missingMapEnv.preparedSurface.map = null;
  const missingPaneEnv = createEnvironment();
  missingPaneEnv.preparedSurface.pane = null;
  const missingCanvasEnv = createEnvironment();
  missingCanvasEnv.preparedSurface.canvas = null;
  const missingOwnerEnv = createEnvironment();
  const incompatibleOwnerEnv = createEnvironment({
    lifecycleOwner: { registerOwnedResources() {} }
  });

  assert.equal(
    missingMapEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: missingMapEnv.preparedSurface,
      lifecycleOwner: missingMapEnv.lifecycleOwner
    }).reasonCode,
    "MISSING_MAP_REFERENCE"
  );
  assert.equal(
    missingPaneEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: missingPaneEnv.preparedSurface,
      lifecycleOwner: missingPaneEnv.lifecycleOwner
    }).reasonCode,
    "MISSING_PANE_REFERENCE"
  );
  assert.equal(
    missingCanvasEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: missingCanvasEnv.preparedSurface,
      lifecycleOwner: missingCanvasEnv.lifecycleOwner
    }).reasonCode,
    "MISSING_CANVAS_REFERENCE"
  );
  assert.equal(
    missingOwnerEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: missingOwnerEnv.preparedSurface
    }).reasonCode,
    "MISSING_LIFECYCLE_OWNER"
  );
  assert.equal(
    incompatibleOwnerEnv.translator.translatePreparedSurfaceToLifecycleBundle({
      preparedSurface: incompatibleOwnerEnv.preparedSurface,
      lifecycleOwner: incompatibleOwnerEnv.lifecycleOwner
    }).reasonCode,
    "INCOMPATIBLE_LIFECYCLE_OWNER_CONTRACT"
  );
});

test("results are deeply immutable no module-level references are retained and no real behavior is introduced", () => {
  const env = createEnvironment();
  const result = env.translator.translatePreparedSurfaceToLifecycleBundle({
    preparedSurface: env.preparedSurface,
    lifecycleOwner: env.lifecycleOwner
  });
  const status = env.translator.getTranslationStatus();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.lifecycleBundleSnapshot), true);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(status.moduleLevelMapRetained, false);
  assert.equal(status.moduleLevelPaneRetained, false);
  assert.equal(status.moduleLevelCanvasRetained, false);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realListenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /translatePreparedSurfaceToLifecycleBundle|createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation/
  );
  assert.doesNotMatch(
    translatorSource,
    /custom25DMapLayer\s*=\s*null/
  );
});
