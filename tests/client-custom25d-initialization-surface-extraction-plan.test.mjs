import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const planSource = fs.readFileSync(
  path.join(
    repoRoot,
    "GROWGO_SESSION_211_21_CUSTOM25D_INITIALIZATION_SURFACE_EXTRACTION_PLAN.md"
  ),
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
const lifecycleOwnerSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  ),
  "utf8"
);
const activationContractSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-one-frame-renderer-activation-contract.mjs"
  ),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

test("custom25d initialization extraction plan stays grounded in the current live renderer source", () => {
  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.match(scriptSource, /function drawCustom25DMapCanvas\(canvas\)/);
  assert.match(scriptSource, /let custom25DMapLayer = null;/);
  assert.match(scriptSource, /map\.createPane\("custom25DMapPane"\)/);
  assert.match(
    scriptSource,
    /L\.DomUtil\.create\("canvas", "custom-25d-map-canvas", pane\)/
  );
  assert.match(
    scriptSource,
    /const redraw = \(\) => drawCustom25DMapCanvas\(canvas\);/
  );
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
  assert.match(scriptSource, /redraw\(\);/);
  assert.match(scriptSource, /custom25DMapLayer = \{ canvas, redraw \};/);
});

test("custom25d initialization extraction plan records the bundled responsibilities and cleanup gap honestly", () => {
  assert.match(planSource, /bundled responsibilities/i);
  assert.match(planSource, /Leaflet pane creation/i);
  assert.match(planSource, /Canvas creation and append/i);
  assert.match(planSource, /moveend zoomend.*listener registration/i);
  assert.match(planSource, /`custom25DMapLayer` retention write/i);
  assert.match(planSource, /immediate call to `drawCustom25DMapCanvas\(canvas\)`/i);
  assert.match(planSource, /no verified cleanup exists inside the current live path/i);
  assert.match(planSource, /INITIALIZATION_EXTRACTION_PLAN_READY/);
});

test("custom25d initialization extraction plan defines the required future boundaries and dependency order", () => {
  assert.match(planSource, /prepareCustom25DOneFrameSurface/);
  assert.match(planSource, /drawCustom25DOneFrame/);
  assert.match(planSource, /registerCustom25DContinuousRedraw/);
  assert.match(planSource, /retainCustom25DRendererResources/);
  assert.match(planSource, /disposeCustom25DRendererResources/);
  assert.match(planSource, /Atlas readiness/);
  assert.match(planSource, /renderer authorization/);
  assert.match(planSource, /one-frame activation contract/);
  assert.match(planSource, /live renderer adapter/);
  assert.match(planSource, /surface preparation/);
  assert.match(planSource, /one-frame draw/);
  assert.match(planSource, /lifecycle cleanup/);
  assert.match(planSource, /Authorization-consumption point:/i);
  assert.match(planSource, /cleanup becomes mandatory/i);
});

test("phase 211.18 211.19 and 211.20 passive contracts remain available and disconnected", () => {
  assert.match(
    activationContractSource,
    /createDeveloperOnlyAtlasOneFrameRendererActivationContract/
  );
  assert.match(
    adapterSource,
    /createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter/
  );
  assert.match(
    lifecycleOwnerSource,
    /createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createDeveloperOnlyAtlasOneFrameRendererActivationContract/
  );
});

test("phase 211.21 stays passive with no live renderer call browser activation exposure or safety-flag changes", () => {
  assert.match(planSource, /Do not call:\s+[\s\S]*`initCustom25DMapExperiment\(\)`/i);
  assert.match(planSource, /Do not call:\s+[\s\S]*`drawCustom25DMapCanvas\(canvas\)`/i);
  assert.match(planSource, /script\.js changed:\s+- `no`/i);
  assert.match(planSource, /real renderer invoked:\s+- `no`/i);
  assert.match(planSource, /real Canvas created:\s+- `no`/i);
  assert.match(planSource, /real pane created:\s+- `no`/i);
  assert.match(planSource, /real listener added:\s+- `no`/i);
  assert.match(planSource, /`custom25DMapLayer` mutated:\s+- `no`/i);
  assert.match(planSource, /real draw called:\s+- `no`/i);
  assert.match(planSource, /browser activation exposed:\s+- `no`/i);
  assert.match(planSource, /`runtimeExecutionEnabled = false`/);
  assert.match(planSource, /`mapAttachmentAllowed = false`/);
  assert.match(planSource, /`automaticRendererExecutionAllowed = false`/);
  assert.match(planSource, /`lifecycleExecutionEnabled = false`/);
});
