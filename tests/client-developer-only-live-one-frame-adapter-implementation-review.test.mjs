import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const integrationContractSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.mjs"
  ),
  "utf8"
);
const readinessSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-live-atlas-renderer-handoff-readiness.mjs"
  ),
  "utf8"
);
const authorizationSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-renderer-handoff-authorization.mjs"
  ),
  "utf8"
);
const lifecycleTranslationSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-one-frame-surface-lifecycle-translation.mjs"
  ),
  "utf8"
);
const surfaceOperationsModule = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-surface-operations.mjs"
  )
);
const drawOperationModule = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-draw-operation.mjs"
  )
);
const lifecycleOwnerModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  )
);

const FUTURE_BROWSER_COMMAND = "runAtlasRendererHandoffLiveOneFrameAttempt";

test("phase 211.44 integration contract remains disconnected from startup and development alpha wiring", () => {
  assert.doesNotMatch(
    developmentAlphaSource,
    /gated-live-one-frame-integration-contract|createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract/
  );
  assert.doesNotMatch(
    scriptSource,
    /gated-live-one-frame-integration-contract|createDeveloperOnlyAtlasCustom25DGatedLiveOneFrameIntegrationContract/
  );
  assert.match(
    integrationContractSource,
    /frameSnapshotFactory/
  );
  assert.match(
    integrationContractSource,
    /drawOperationFactory/
  );
});

test("no live activation browser command exists and live authorization consumption remains unexposed", () => {
  assert.doesNotMatch(scriptSource, new RegExp(FUTURE_BROWSER_COMMAND));
  assert.doesNotMatch(developmentAlphaSource, new RegExp(FUTURE_BROWSER_COMMAND));
  assert.doesNotMatch(
    developmentAlphaSource,
    /consumeAuthorizedRendererHandoffAttempt/
  );
  assert.match(
    authorizationSource,
    /consumeAuthorizedRendererHandoffAttempt/
  );
  assert.match(
    authorizationSource,
    /namespace\.authorizeAtlasRendererHandoffSession/
  );
  assert.match(
    authorizationSource,
    /namespace\.getAtlasRendererHandoffAuthorizationStatus/
  );
  assert.doesNotMatch(
    authorizationSource,
    /namespace\.consumeAuthorizedRendererHandoffAttempt/
  );
});

test("drawCustom25DMapCanvas remains private, initCustom25DMapExperiment remains unchanged, and custom25DMapLayer ownership stays in script.js", () => {
  assert.match(scriptSource, /let custom25DMapLayer = null;/);
  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.match(scriptSource, /const redraw = \(\) => drawCustom25DMapCanvas\(canvas\);/);
  assert.match(scriptSource, /custom25DMapLayer = \{ canvas, redraw \};/);
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
  assert.doesNotMatch(
    scriptSource,
    /GrowGoDeveloperDiagnostics[\s\S]{0,400}drawCustom25DMapCanvas/
  );
  assert.doesNotMatch(
    developmentAlphaSource,
    /drawCustom25DMapCanvas/
  );
});

test("centralized frame-root snapshot remains active and the live draw path still owns snapshot creation internally", () => {
  assert.match(scriptSource, /function createCustom25DFrameViewportSnapshot\(\{ map, canvas \} = \{\}\)/);
  assert.match(scriptSource, /frameViewportSnapshot = createCustom25DFrameViewportSnapshot\(\{\s*map,\s*canvas\s*\}\);/);
  assert.match(
    scriptSource,
    /return drawCustom25DMapCanvasWithFrameSnapshot\(\s*\{\s*canvas,\s*frameViewportSnapshot\s*\}\s*\);/
  );
  assert.match(scriptSource, /L\.DomUtil\.setPosition\(canvas, topLeft\);/);
  assert.match(scriptSource, /canvas\.width = normalizedFrameViewportSnapshot\.backingWidth;/);
  assert.match(scriptSource, /canvas\.height = normalizedFrameViewportSnapshot\.backingHeight;/);
  assert.match(scriptSource, /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(scriptSource, /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(scriptSource, /drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(scriptSource, /drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(scriptSource, /renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/);
});

test("surface operations and draw operation source locks confirm real compatibility but retain the current live draw coupling", () => {
  const surfaceLock =
    surfaceOperationsModule.inspectGrowGoCustom25DLiveOneFrameSurfaceOperationsSourceLock({
      scriptSource
    });
  const drawLock =
    drawOperationModule.inspectGrowGoCustom25DLiveOneFrameDrawOperationSourceLock({
      scriptSource
    });

  assert.equal(surfaceLock.ok, true);
  assert.equal(surfaceLock.classification, "LIVE_SURFACE_SOURCE_LOCK_CONFIRMED");
  assert.equal(
    surfaceLock.currentRendererBehavior.pixelRatioResizeOwner,
    "drawCustom25DMapCanvas"
  );

  assert.equal(drawLock.ok, true);
  assert.equal(drawLock.classification, "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY");
  assert.equal(
    drawLock.discoveredDrawDependencies.singleCallSuitability,
    "future_narrow_adapter_possible_but_requires_map_dependency_extraction"
  );
});

test("lifecycle translation and ONE_FRAME_SURFACE_ONLY cleanup mode remain available and disconnected", () => {
  assert.match(
    lifecycleTranslationSource,
    /const OWNERSHIP_MODE = "ONE_FRAME_SURFACE_ONLY";/
  );
  assert.doesNotMatch(
    lifecycleTranslationSource,
    /GrowGoDeveloperDiagnostics|window\.|document\.|L\.DomUtil/
  );

  const ownershipSourceLock =
    lifecycleOwnerModule.inspectGrowGoCustom25DRendererOwnershipSource({
      scriptSource
    });

  assert.equal(ownershipSourceLock.ok, true);
  assert.equal(
    ownershipSourceLock.ownershipPoints.drawFunction,
    "drawCustom25DMapCanvas"
  );
  assert.equal(
    ownershipSourceLock.ownershipPoints.retentionSlot,
    "custom25DMapLayer"
  );
});

test("readiness, live map access, and classic-script bridge facts are source-locked without startup activation", () => {
  assert.match(
    scriptSource,
    /window\[namespaceKey\] = \{[\s\S]*getGrowGoMap/
  );
  assert.match(
    readinessSource,
    /namespace\.getAtlasRendererHandoffReadiness/
  );
  assert.match(
    developmentAlphaSource,
    /globalThis\?\.GrowGoDeveloperDiagnostics\?\.getGrowGoMap\?\.\(\) \?\? null/
  );
  assert.doesNotMatch(
    developmentAlphaSource,
    /moveend zoomend|initCustom25DMapExperiment\(|drawCustom25DMapCanvas\(/
  );
});

test("all four canonical safety flags remain false and no startup or moveend live adapter activation exists", () => {
  for (const source of [
    integrationContractSource,
    authorizationSource,
    lifecycleTranslationSource
  ]) {
    assert.match(source, /runtimeExecutionEnabled:\s*false/);
    assert.match(source, /mapAttachmentAllowed:\s*false/);
    assert.match(source, /automaticRendererExecutionAllowed:\s*false/);
    assert.match(source, /lifecycleExecutionEnabled:\s*false/);
  }

  assert.match(readinessSource, /safetyFlagSnapshot/);
  assert.match(
    developmentAlphaSource,
    /createDeveloperOnlyLiveAtlasRendererHandoffReadiness/
  );
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_MAP = false;/);

  assert.doesNotMatch(
    scriptSource,
    /runAtlasRendererHandoffLiveOneFrameAttempt|executeGatedLiveOneFrameIntegration|consumeAuthorizedRendererHandoffAttempt\(/
  );
  assert.doesNotMatch(
    developmentAlphaSource,
    /runAtlasRendererHandoffLiveOneFrameAttempt|executeGatedLiveOneFrameIntegration/
  );
});
