# GROWGO SESSION 211.39 — Custom 2.5D Landmark Narrow Live Callsite Migration

## Status

PASS

## Phase 211.38 checkpoint

Phase 211.38 was verified by exact commit title:

- `b090a05 ELI5: we pulled the landmark badge drawing out into its own safe little box, so it can be tested with fake map coordinates instead of touching the real map.`

Confirmed present:

- `client/growgo-custom25d-landmarks-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-landmarks-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_38_CUSTOM25D_LANDMARK_VIEWPORT_INPUT_EXTRACTION.md`

History remained unchanged.

## Preflight

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status was **not** clean:
  - `M script.js`
  - `?? tests/client-growgo-custom25d-landmarks-live-callsite-migration.test.mjs`
- those in-progress edits matched the intended Phase 211.39 migration lane and were verified before any additional changes

## Loading architecture

- `script.js` remains a classic script
- migration method:
  - synchronous frame-local viewport adapter inside `script.js`
  - active live callsite routed through a narrow landmark wrapper
  - Phase 211.38 helper remains the test oracle for landmark rendering behavior
- dynamic import was not introduced

## Files changed

- `script.js`
- `tests/client-growgo-custom25d-landmarks-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_39_CUSTOM25D_LANDMARK_NARROW_LIVE_CALLSITE_MIGRATION.md`

## Landmark migration

### New viewport seam

Added:

- `createCustom25DLandmarksLiveViewportProjection(bounds)`
- `drawCustom25DLandmarksViewportInjected(ctx, landmarks, viewportProjection)`
- `renderCustomLandmarkLayerLiveCallsite(ctx, bounds)`

### Active routing

`drawCustom25DMapCanvas(canvas)` now routes the active landmark layer through:

- `renderCustomLandmarkLayerLiveCallsite(ctx, bounds)`

The preserved legacy source-lock anchor remains in a comment block:

- `drawCustom25DLandmarkFoundation(ctx, bounds, topLeft);`

### Legacy direct-map preservation

The old direct-map landmark source remains preserved through:

- `drawCustom25DLandmarkFoundation(ctx, bounds)`
- `renderCustomLandmarkLayer(ctx, bounds)`

That means the active path migrated, while the direct-map source contract stayed available as the locked comparison anchor for tests and future source-lock checks.

### Data sources

Preserved exactly:

- `getActiveCustom25DLandmarkData()`
- `getCustom25DLandmarkTestMarkers(bounds)`

The live callsite still merges active landmarks and test markers in the same order.

### Identity and category behavior

Preserved exactly:

- `marker.lat`
- `marker.lng`
- `marker.rendererCategory`
- `marker.category`
- fallback `marker.rendererCategory || marker.category || "generic"`

Unknown categories still fall back to `generic`.

### Coordinate-space behavior

Preserved exactly:

- raw `map.latLngToLayerPoint([latitude, longitude])`
- no canvas-local top-left subtraction
- no `projectCoordinateToCanvasPoint(...)`

The active landmark layer now consumes only:

- `projectCoordinateToLayerPoint({ latitude, longitude })`

### Bounds and visibility behavior

Preserved exactly:

- per-marker visibility remains `bounds.contains([latitude, longitude]) === true`
- out-of-bounds landmarks are skipped
- no zoom threshold was introduced

### Drawing order and style behavior

Preserved exactly:

1. glow fill
2. ring fill
3. white inset fill
4. inner radial gradient fill
5. highlight stroke
6. glyph draw

Constants preserved:

- `outerRadius = 13`
- `innerRadius = 9.2`
- `glowRadius = 16.5`
- glyph size multiplier `1.5`

### Failure behavior

If viewport creation fails:

- the landmark layer fails closed
- no fallback to direct live-map projection occurs

If point projection fails or returns an invalid layer point:

- the landmark layer fails closed
- the frame-local migrated path does not fall back to `map.latLngToLayerPoint(...)`

## Unchanged paths

- zones
- buildings
- roads
- trees
- renderer initialization
- continuous redraw listeners
- Atlas authorization/activation

## Classification

`LANDMARK_LIVE_CALLSITE_MIGRATION_READY`

Reason:

- the active landmark layer now uses a single frame-local viewport projection seam
- raw layer-point behavior was preserved exactly
- the migrated active landmark logic no longer performs direct global map reads
- the legacy direct-map source contract remains preserved as a locked anchor

## Tests

Focused regression band:

- `tests/client-growgo-custom25d-live-helper-viewport-projection.test.mjs`
- `tests/client-growgo-custom25d-zones-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-zones-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-buildings-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-roads-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-roads-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-trees-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-trees-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-landmarks-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-landmarks-live-callsite-migration.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-surface-preparation.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-draw.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-pipeline.test.mjs`
- `tests/client-developer-only-atlas-custom25d-one-frame-session-coordinator.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-surface-operations.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-renderer-adapter.test.mjs`
- `tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs`

Result:

- passed: `153`
- failed: `0`

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- renderer enabled: no
- live renderer invoked: no
- real Canvas created: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` lifecycle changed: no
- browser activation exposed: no

## Commit

YES

## Suggested commit message

`refactor(atlas): migrate custom25d landmarks to viewport projection seam`
