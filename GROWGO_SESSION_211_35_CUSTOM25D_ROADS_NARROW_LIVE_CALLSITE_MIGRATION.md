# GROWGO SESSION 211.35 — Custom 2.5D Roads Narrow Live Callsite Migration

## Status

PASS

## Phase 211.34 checkpoint

Phase 211.34 was accepted by verified content at commit `8b3c223`.

The commit message is the accidental long-form summary rather than:

`feat(atlas): extract custom25d roads viewport draw helper`

That checkpoint was accepted without history rewrite because it contains:

- `client/growgo-custom25d-roads-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-roads-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_34_CUSTOM25D_ROADS_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

History was not amended, reset, rebased, reverted, force-pushed, or rewritten.

## Scope completed

Migrated only the active roads callsite in `script.js`.

Unchanged:

- zones migration
- buildings migration
- trees path
- landmarks path
- renderer startup
- listeners
- timers
- polling
- browser diagnostics

## Active-path result

`drawCustom25DMapCanvas(canvas)` now routes roads through:

- `drawCustom25DRoadsLiveCallsite(ctx, bounds, topLeft)`

New frame-local roads seam added in `script.js`:

- `createCustom25DRoadsLiveViewportProjection(bounds, topLeft)`
- `projectCustom25DRoadPointsWithViewport(coords, viewportProjection)`
- `drawCustom25DRoadsViewportInjected(ctx, roadFeatures, viewportProjection)`
- `drawCustom25DRoadsLiveCallsite(ctx, bounds, topLeft)`

Legacy direct-map roads function preserved as the source-lock anchor:

- `drawCustom25DRoads(ctx, bounds, topLeft)`

## Preserved source contract

Preserved exactly:

- road data source: `custom25DRoadFeatures`
- source-order drawing
- line-string geometry: `[[latitude, longitude], ...]`
- supported buckets:
  - `primary`, `primary_link`
  - `secondary`, `secondary_link`
  - `tertiary`, `tertiary_link`
  - `service`, `road`
  - `track`, `path`, `footway`, `cycleway`, `pedestrian`
  - fallback `residential`
- filtering:
  - minimum 2 coordinates
  - at least one coordinate inside frame bounds
  - at least 2 projected points
- zoom formula:
  - `Math.max(0, zoom - 15) * 0.55`
- current widths
- five-pass draw order:
  - shadow stroke
  - edge stroke
  - fill stroke
  - warm-core stroke
  - highlight stroke
- `lineCap = "round"`
- `lineJoin = "round"`
- existing colours, alpha, and style values
- Canvas save/restore balancing

## Direct global-map reads removed from active roads logic

The active migrated roads logic no longer directly reads:

- `map.getZoom()`
- `map.latLngToLayerPoint(...)`
- `bounds.contains(...)`

Those reads now occur only in the frame-local roads viewport factory.

## Failure behaviour

If viewport creation fails:

- roads fail closed
- whole frame does not crash

If projection fails:

- roads fail closed
- no fallback to global-map reads occurs

## Files changed

- `script.js`
- `tests/client-growgo-custom25d-roads-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_35_CUSTOM25D_ROADS_NARROW_LIVE_CALLSITE_MIGRATION.md`

## Focused tests run

- `tests/client-growgo-custom25d-roads-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-roads-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-live-helper-viewport-projection.test.mjs`
- `tests/client-growgo-custom25d-zones-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-zones-live-callsite-migration.test.mjs`
- `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`
- `tests/client-growgo-custom25d-buildings-live-callsite-migration.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-surface-preparation.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-draw.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-pipeline.test.mjs`
- `tests/client-developer-only-atlas-custom25d-one-frame-session-coordinator.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-surface-operations.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
- `tests/client-growgo-custom25d-live-draw-map-snapshot.test.mjs`

## Test result

- passed: 117
- failed: 0

## Classification

`ROADS_LIVE_CALLSITE_MIGRATION_READY`

## Canonical safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Safety confirmation

- no renderer startup change
- no live renderer invocation in tests
- no real Canvas creation in tests
- no pane creation in tests
- no WebGL creation in tests
- no overlay creation
- no listeners added
- no timers or polling added
- no browser diagnostic or activation command exposed
