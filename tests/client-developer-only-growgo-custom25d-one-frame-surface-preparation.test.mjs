import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-surface-preparation.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const adapterSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs"
  ),
  "utf8"
);

function createFakeEnvironment(overrides = {}) {
  const calls = {
    paneLookup: [],
    paneCreate: [],
    canvasCreate: [],
    canvasAppend: [],
    canvasRemove: [],
    sizeReads: 0,
    positionReads: 0,
    sizeApplications: [],
    positionApplications: []
  };

  const map = overrides.map ?? { id: "fake-leaflet-map" };
  const pane =
    overrides.existingPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0
    };
  const createdPane =
    overrides.createdPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0
    };
  const canvas =
    overrides.canvas ?? {
      className: "custom-25d-map-canvas"
    };

  const paneLookup = (mapArg, paneNameArg) => {
    calls.paneLookup.push({ mapArg, paneNameArg });
    if (overrides.throwOnPaneLookup) {
      throw overrides.throwOnPaneLookup;
    }
    return overrides.lookupResult === undefined ? pane : overrides.lookupResult;
  };

  const paneCreate = (mapArg, paneNameArg) => {
    calls.paneCreate.push({ mapArg, paneNameArg });
    if (overrides.throwOnPaneCreate) {
      throw overrides.throwOnPaneCreate;
    }
    return createdPane;
  };

  const canvasCreate = (classNameArg, paneArg, mapArg) => {
    calls.canvasCreate.push({ classNameArg, paneArg, mapArg });
    if (overrides.throwOnCanvasCreate) {
      throw overrides.throwOnCanvasCreate;
    }
    return overrides.canvasResult ?? canvas;
  };

  const canvasAppend = (paneArg, canvasArg, mapArg) => {
    calls.canvasAppend.push({ paneArg, canvasArg, mapArg });
    if (overrides.throwOnAppend) {
      throw overrides.throwOnAppend;
    }
  };

  const canvasRemove = (canvasArg, paneArg) => {
    calls.canvasRemove.push({ canvasArg, paneArg });
    if (overrides.throwOnRemove) {
      throw overrides.throwOnRemove;
    }
  };

  const mapSizeProvider = (mapArg) => {
    calls.sizeReads += 1;
    if (overrides.throwOnSizeRead) {
      throw overrides.throwOnSizeRead;
    }
    return overrides.sizeResult ?? { width: 640, height: 360 };
  };

  const mapTopLeftProvider = (mapArg) => {
    calls.positionReads += 1;
    if (overrides.throwOnPositionRead) {
      throw overrides.throwOnPositionRead;
    }
    return overrides.positionResult ?? { x: 12, y: 34 };
  };

  const applyCanvasSize = (canvasArg, sizeArg) => {
    calls.sizeApplications.push({ canvasArg, sizeArg });
    if (overrides.throwOnApplySize) {
      throw overrides.throwOnApplySize;
    }
    canvasArg.width = sizeArg.width;
    canvasArg.height = sizeArg.height;
  };

  const applyCanvasPosition = (canvasArg, positionArg) => {
    calls.positionApplications.push({ canvasArg, positionArg });
    if (overrides.throwOnApplyPosition) {
      throw overrides.throwOnApplyPosition;
    }
    canvasArg.intendedPosition = { x: positionArg.x, y: positionArg.y };
  };

  const helper =
    moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      paneLookup,
      paneCreate,
      canvasCreate,
      canvasAppend,
      canvasRemove,
      mapSizeProvider,
      mapTopLeftProvider,
      applyCanvasSize,
      applyCanvasPosition,
      ...overrides.helperOverrides
    });

  return {
    calls,
    map,
    pane,
    createdPane,
    canvas,
    helper
  };
}

test("module import has no side effects, factory exists, and source lock stays anchored to live renderer discovery", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DOneFrameSurfacePreparationSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DOneFrameSurfacePreparationSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "INITIALIZATION_EXTRACTION_PLAN_READY"
  );
  assert.equal(
    inspection.discoveredSurfaceDependencies.paneIdentity,
    "custom25DMapPane"
  );
  assert.equal(
    inspection.discoveredSurfaceDependencies.canvasClassName,
    "custom-25d-map-canvas"
  );
  assert.equal(
    inspection.discoveredSurfaceDependencies.liveInitializerOwnership,
    "initCustom25DMapExperiment"
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyCustom25DOneFrameSurfacePreparation/
  );
  assert.doesNotMatch(adapterSource, /prepareOneFrameSurface\(/);
});

test("valid fake map passes validation and successful preparation returns one immutable owned surface descriptor", () => {
  const env = createFakeEnvironment();

  const result = env.helper.prepareOneFrameSurface({ map: env.map });
  const status = env.helper.getPreparationStatus();

  assert.equal(result.preparationStatus, "prepared");
  assert.equal(result.reasonCode, "SURFACE_PREPARED");
  assert.equal(result.mapIdentityValidated, true);
  assert.equal(result.paneIdentityValidated, true);
  assert.equal(result.paneReused, true);
  assert.equal(result.paneCreated, false);
  assert.equal(result.canvasCreated, true);
  assert.equal(result.canvasAppended, true);
  assert.equal(result.canvasClassName, "custom-25d-map-canvas");
  assert.equal(result.canvasWidth, 640);
  assert.equal(result.canvasHeight, 360);
  assert.deepEqual(result.canvasPosition, { x: 12, y: 34 });
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.lifecycleRegistrationRequired, true);
  assert.equal(result.drawRequested, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.moduleLevelMapRetained, false);
  assert.equal(result.moduleLevelCanvasRetained, false);
  assert.equal(result.ownedSurface.pane, env.pane);
  assert.equal(result.ownedSurface.canvas, env.canvas);
  assert.equal(result.ownedSurface.paneOwned, false);
  assert.equal(status.preparationCompleted, true);
  assert.equal(status.moduleLevelMapRetained, false);
  assert.equal(status.moduleLevelCanvasRetained, false);
  assert.equal(callsFor(env).canvasCreateCount, 1);
  assert.equal(callsFor(env).sizeReadCount, 1);
  assert.equal(callsFor(env).positionReadCount, 1);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.ownedSurface), true);
});

test("missing map invalid map and incorrect pane name all fail closed before canvas creation", () => {
  const missingMapEnv = createFakeEnvironment();
  const invalidMapEnv = createFakeEnvironment();
  const wrongPaneEnv = createFakeEnvironment();

  const missingMap = missingMapEnv.helper.prepareOneFrameSurface();
  const invalidMap = invalidMapEnv.helper.prepareOneFrameSurface({ map: 42 });
  const wrongPane = wrongPaneEnv.helper.prepareOneFrameSurface({
    map: wrongPaneEnv.map,
    paneName: "wrongPane"
  });

  assert.equal(missingMap.reasonCode, "MISSING_MAP");
  assert.equal(invalidMap.reasonCode, "INVALID_MAP_INTERFACE");
  assert.equal(wrongPane.reasonCode, "INCORRECT_PANE_NAME");
  assert.equal(callsFor(missingMapEnv).canvasCreateCount, 0);
  assert.equal(callsFor(invalidMapEnv).canvasCreateCount, 0);
  assert.equal(callsFor(wrongPaneEnv).canvasCreateCount, 0);
});

test("valid existing pane is reused and missing pane causes exactly one fake pane creation", () => {
  const reusedEnv = createFakeEnvironment();
  const createdEnv = createFakeEnvironment({ lookupResult: null });

  const reused = reusedEnv.helper.prepareOneFrameSurface({ map: reusedEnv.map });
  const created = createdEnv.helper.prepareOneFrameSurface({ map: createdEnv.map });

  assert.equal(reused.paneReused, true);
  assert.equal(reused.paneCreated, false);
  assert.equal(created.paneReused, false);
  assert.equal(created.paneCreated, true);
  assert.equal(created.ownedSurface.pane, createdEnv.createdPane);
  assert.equal(callsFor(reusedEnv).paneCreateCount, 0);
  assert.equal(callsFor(createdEnv).paneCreateCount, 1);
});

test("invalid existing pane identity fails closed before canvas creation", () => {
  const env = createFakeEnvironment({
    existingPane: { dataset: { owner: "wrong-pane" } }
  });

  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(result.reasonCode, "INVALID_EXISTING_PANE_IDENTITY");
  assert.equal(result.canvasCreated, false);
  assert.equal(callsFor(env).canvasCreateCount, 0);
});

test("exact canvas class is required and exactly one fake canvas is created and appended to the exact pane", () => {
  const wrongClassHelper =
    moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      paneLookup: () => ({ dataset: { owner: "custom25DMapPane" } }),
      paneCreate: () => ({ dataset: { owner: "custom25DMapPane" } }),
      canvasCreate: () => ({}),
      canvasAppend: () => {},
      canvasRemove: () => {},
      mapSizeProvider: () => ({ width: 10, height: 10 }),
      mapTopLeftProvider: () => ({ x: 0, y: 0 }),
      canvasClassName: "wrong-class"
    });

  const wrongClass = wrongClassHelper.prepareOneFrameSurface({ map: {} });
  const env = createFakeEnvironment();
  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(wrongClass.reasonCode, "INCORRECT_CANVAS_CLASS_NAME");
  assert.equal(callsFor(env).canvasCreateCount, 1);
  assert.equal(callsFor(env).canvasAppendCount, 1);
  assert.equal(env.calls.canvasCreate[0].classNameArg, "custom-25d-map-canvas");
  assert.equal(env.calls.canvasAppend[0].paneArg, env.pane);
  assert.equal(env.calls.canvasAppend[0].canvasArg, env.canvas);
  assert.equal(result.canvasClassName, "custom-25d-map-canvas");
});

test("map size is read exactly once, canvas sizing is applied exactly once, top-left position is read once, and intended position is recorded", () => {
  const env = createFakeEnvironment();

  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(callsFor(env).sizeReadCount, 1);
  assert.equal(callsFor(env).positionReadCount, 1);
  assert.equal(env.calls.sizeApplications.length, 1);
  assert.equal(env.calls.positionApplications.length, 1);
  assert.equal(env.canvas.width, 640);
  assert.equal(env.canvas.height, 360);
  assert.deepEqual(env.canvas.intendedPosition, { x: 12, y: 34 });
  assert.deepEqual(result.canvasPosition, { x: 12, y: 34 });
});

test("duplicate preparation attempt on the same helper instance fails closed", () => {
  const env = createFakeEnvironment();

  const first = env.helper.prepareOneFrameSurface({ map: env.map });
  const second = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(first.reasonCode, "SURFACE_PREPARED");
  assert.equal(second.reasonCode, "PREPARATION_ALREADY_COMPLETED");
  assert.equal(second.preparationStatus, "blocked");
});

test("missing size provider, missing position provider, and missing canvas factory all fail closed before canvas creation", () => {
  const baseDeps = {
    paneLookup: () => ({ dataset: { owner: "custom25DMapPane" } }),
    paneCreate: () => ({ dataset: { owner: "custom25DMapPane" } }),
    canvasCreate: () => ({}),
    canvasAppend: () => {},
    canvasRemove: () => {}
  };

  const missingSize =
    moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      ...baseDeps,
      mapTopLeftProvider: () => ({ x: 0, y: 0 })
    });
  const missingPosition =
    moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      ...baseDeps,
      mapSizeProvider: () => ({ width: 1, height: 1 })
    });
  const missingCanvasFactory =
    moduleUnderTest.createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
      paneLookup: baseDeps.paneLookup,
      paneCreate: baseDeps.paneCreate,
      canvasAppend: baseDeps.canvasAppend,
      canvasRemove: baseDeps.canvasRemove,
      mapSizeProvider: () => ({ width: 1, height: 1 }),
      mapTopLeftProvider: () => ({ x: 0, y: 0 })
    });

  assert.equal(
    missingSize.prepareOneFrameSurface({ map: {} }).reasonCode,
    "MAP_SIZE_PROVIDER_REQUIRED"
  );
  assert.equal(
    missingPosition.prepareOneFrameSurface({ map: {} }).reasonCode,
    "MAP_TOP_LEFT_PROVIDER_REQUIRED"
  );
  assert.equal(
    missingCanvasFactory.prepareOneFrameSurface({ map: {} }).reasonCode,
    "CANVAS_FACTORY_REQUIRED"
  );
});

test("pane lookup exception, pane creation exception, and canvas creation exception all fail closed", () => {
  const paneLookupEnv = createFakeEnvironment({
    throwOnPaneLookup: new Error("pane lookup exception")
  });
  const paneCreateEnv = createFakeEnvironment({
    lookupResult: null,
    throwOnPaneCreate: new Error("pane create exception")
  });
  const canvasCreateEnv = createFakeEnvironment({
    throwOnCanvasCreate: new Error("canvas create exception")
  });

  assert.equal(
    paneLookupEnv.helper.prepareOneFrameSurface({ map: paneLookupEnv.map }).reasonCode,
    "PANE_LOOKUP_EXCEPTION"
  );
  assert.equal(
    paneCreateEnv.helper.prepareOneFrameSurface({ map: paneCreateEnv.map }).reasonCode,
    "PANE_CREATION_EXCEPTION"
  );
  assert.equal(
    canvasCreateEnv.helper.prepareOneFrameSurface({ map: canvasCreateEnv.map }).reasonCode,
    "CANVAS_CREATION_EXCEPTION"
  );
});

test("append failure triggers rollback and preserves the original failure reason", () => {
  const env = createFakeEnvironment({
    throwOnAppend: new Error("append exception")
  });

  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(result.reasonCode, "APPEND_EXCEPTION");
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackCompleted, true);
  assert.equal(result.cleanupRequired, false);
  assert.equal(callsFor(env).canvasRemoveCount, 1);
});

test("invalid size, invalid position, sizing exception, and positioning exception all trigger rollback", () => {
  const invalidSizeEnv = createFakeEnvironment({
    sizeResult: { width: 0, height: 10 }
  });
  const invalidPositionEnv = createFakeEnvironment({
    positionResult: { x: Number.NaN, y: 4 }
  });
  const sizingExceptionEnv = createFakeEnvironment({
    throwOnApplySize: new Error("sizing exception")
  });
  const positioningExceptionEnv = createFakeEnvironment({
    throwOnApplyPosition: new Error("positioning exception")
  });

  const invalidSize = invalidSizeEnv.helper.prepareOneFrameSurface({
    map: invalidSizeEnv.map
  });
  const invalidPosition = invalidPositionEnv.helper.prepareOneFrameSurface({
    map: invalidPositionEnv.map
  });
  const sizingException = sizingExceptionEnv.helper.prepareOneFrameSurface({
    map: sizingExceptionEnv.map
  });
  const positioningException =
    positioningExceptionEnv.helper.prepareOneFrameSurface({
      map: positioningExceptionEnv.map
    });

  assert.equal(invalidSize.reasonCode, "INVALID_MAP_SIZE");
  assert.equal(invalidPosition.reasonCode, "INVALID_TOP_LEFT_POSITION");
  assert.equal(sizingException.reasonCode, "CANVAS_SIZING_EXCEPTION");
  assert.equal(positioningException.reasonCode, "CANVAS_POSITIONING_EXCEPTION");
  assert.equal(callsFor(invalidSizeEnv).canvasRemoveCount, 1);
  assert.equal(callsFor(invalidPositionEnv).canvasRemoveCount, 1);
  assert.equal(callsFor(sizingExceptionEnv).canvasRemoveCount, 1);
  assert.equal(callsFor(positioningExceptionEnv).canvasRemoveCount, 1);
});

test("rollback-removal exception is reported precisely and cleanupRequired remains true", () => {
  const env = createFakeEnvironment({
    throwOnAppend: new Error("append exception"),
    throwOnRemove: new Error("rollback remove exception")
  });

  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(result.reasonCode, "APPEND_EXCEPTION");
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackCompleted, false);
  assert.equal(result.rollbackFailureReasonCode, "ROLLBACK_REMOVE_EXCEPTION");
  assert.equal(result.cleanupRequired, true);
  assert.equal(result.ownedSurface.canvas, env.canvas);
});

test("no drawing, listeners, retention, module-level state, browser exposure, network, downloads, overlays, or polling are introduced", () => {
  const env = createFakeEnvironment();

  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.equal(result.drawRequested, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.equal(result.moduleLevelMapRetained, false);
  assert.equal(result.moduleLevelCanvasRetained, false);
  assert.equal(env.helper.getPreparationStatus().moduleLevelMapRetained, false);
  assert.equal(env.helper.getPreparationStatus().moduleLevelCanvasRetained, false);
});

test("no real renderer hooks, live initializer calls, draw calls, custom25DMapLayer mutation, webgl, listener registration, or browser commands are introduced", () => {
  const moduleSource = fs.readFileSync(
    path.join(
      repoRoot,
      "client",
      "developer-only-growgo-custom25d-one-frame-surface-preparation.mjs"
    ),
    "utf8"
  );

  assert.doesNotMatch(moduleSource, /\binitCustom25DMapExperiment\(\);/);
  assert.doesNotMatch(moduleSource, /\bdrawCustom25DMapCanvas\([^)]*\);/);
  assert.doesNotMatch(moduleSource, /custom25DMapLayer\s*=/);
  assert.doesNotMatch(moduleSource, /getContext\(["']webgl/i);
  assert.doesNotMatch(moduleSource, /\.on\(/);
  assert.doesNotMatch(moduleSource, /window\./);
});

test("all four canonical flags remain false and phase 211.18 through 211.21 modules stay disconnected", () => {
  const env = createFakeEnvironment();
  const result = env.helper.prepareOneFrameSurface({ map: env.map });

  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyAtlasOneFrameRendererActivationContract|createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter|createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner|createDeveloperOnlyCustom25DOneFrameSurfacePreparation/
  );
});

function callsFor(env) {
  return {
    paneLookupCount: env.calls.paneLookup.length,
    paneCreateCount: env.calls.paneCreate.length,
    canvasCreateCount: env.calls.canvasCreate.length,
    canvasAppendCount: env.calls.canvasAppend.length,
    canvasRemoveCount: env.calls.canvasRemove.length,
    sizeReadCount: env.calls.sizeReads,
    positionReadCount: env.calls.positionReads
  };
}
