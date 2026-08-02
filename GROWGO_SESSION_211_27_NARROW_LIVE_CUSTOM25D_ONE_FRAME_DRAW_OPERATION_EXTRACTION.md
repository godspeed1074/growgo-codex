# GROWGO SESSION 211.27 — Narrow Live-Capable Custom 2.5D One-Frame Draw Operation Extraction

## Status

PASS

## Phase 211.26 checkpoint

- Verification method: accepted by verified commit contents and passing focused regressions.
- Verified checkpoint files:
  - `client/growgo-custom25d-live-one-frame-surface-operations.mjs`
  - `tests/client-growgo-custom25d-live-one-frame-surface-operations.test.mjs`
  - `GROWGO_SESSION_211_26_NARROW_LIVE_CUSTOM25D_SURFACE_OPERATIONS_EXTRACTION.md`
- History rewrite performed: no.

## Files created

- `client/growgo-custom25d-live-one-frame-draw-operation.mjs`
- `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
- `GROWGO_SESSION_211_27_NARROW_LIVE_CUSTOM25D_ONE_FRAME_DRAW_OPERATION_EXTRACTION.md`

## Source discovery

Real `drawCustom25DMapCanvas(canvas)` remains source-locked to the current live renderer path and was inspected without execution.

- Global map dependency: true
- Canvas context dependency: `2d`
- Pixel-ratio behavior: `window.devicePixelRatio || 1`
- Resizing behavior: `canvas.width`, `canvas.height`, `canvas.style.width`, and `canvas.style.height` mutate on each draw
- Positioning behavior: `L.DomUtil.setPosition(canvas, topLeft)` runs on each draw
- Global drawing-data dependencies:
  - `drawCustom25DBackground`
  - `drawCustom25DZones`
  - `drawCustom25DBuildings`
  - `drawCustom25DRoads`
  - `drawCustom25DTrees`
  - `drawCustom25DLandmarkFoundation`
- Synchronous behavior: yes
- Listener registration inside draw path: no
- Network or asset activity inside draw path: none observed in the draw entry itself
- Single-call suitability: future narrow adapter is possible, but the live function still relies on global map reads and per-draw resizing and positioning

## Implemented operation

Created a disconnected live-capable one-frame draw operation factory:

- `createGrowGoCustom25DLiveOneFrameDrawOperation({ expectedCanvasClassName, drawFunctionProvider, operationIdGenerator })`

Exposed operation:

- `drawPreparedSurfaceExactlyOnce({ surface, canvas })`

The module:

- validates the Phase 211.26 surface bundle
- requires the exact owned Canvas instance
- requires the exact Canvas class
- requires one callable draw operation from the injected provider
- allows exactly one draw attempt
- records at most one completed frame
- permanently closes after success, returned failure, or thrown exception
- requires cleanup after every terminal outcome
- releases transient map and Canvas references after execution
- stays fully disconnected from startup, browser diagnostics, session orchestration, and the live renderer

## Successful fake draw proof

Verified through injected fake dependencies:

- operation ID: `LIVE_DRAW_OPERATION_001`
- draw-function provider calls: 1
- draw-function calls: 1
- draw attempts: 1
- completed frames: 1
- `drawCompleted`: true
- `cleanupRequired`: true
- `lifecycleCleanupRequired`: true
- `permanentlyClosed`: true
- second draw blocked: true on repeat invocation
- reference release after completion: true

## Blocked and fail-closed proof

Blocked before draw:

- missing surface
- invalid surface schema
- incorrect pane name
- incorrect descriptor Canvas class
- Canvas not created
- Canvas not appended
- `cleanupRequired = false`
- `rollbackAvailable = false`
- `listenerAdded = true`
- `retentionWritten = true`
- `drawRequested = true`
- missing Canvas
- Canvas identity mismatch
- Canvas class mismatch
- missing draw-function provider
- provider returns non-function
- already closed / second draw request

Fail-closed behavior:

- provider exception returns structured `failed_closed`
- injected draw failure returns structured `failed_closed`
- injected draw exception returns structured `failed_closed`
- failed draw keeps `completedFrameCount = 0`
- cleanup remains mandatory
- operation permanently closes
- no retry path remains open

## Mutation observation

If the injected fake draw mutates the Canvas:

- size mutation is recorded as `canvasResizeObserved`
- position mutation is recorded as `canvasPositionMutationObserved`

These observations are surfaced rather than hidden so later gated integration can explicitly resolve draw ownership boundaries.

## Safety confirmation

Canonical safety flags remained:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed in this phase:

- no call to `drawCustom25DMapCanvas()`
- no call to `initCustom25DMapExperiment()`
- no `custom25DMapLayer` mutation
- no real Canvas creation
- no real pane creation
- no real DOM changes
- no WebGL context creation
- no overlay creation
- no listener addition
- no timers or polling
- no network requests
- no asset downloads
- no browser activation interface exposure

## Focused tests

- `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
- Phase 211.22–211.26 regression pack remained passing

## Closeout classification

`BLOCKED_BY_GLOBAL_MAP_DEPENDENCY`

### Exact reason

The extracted one-frame operation is ready as a disconnected contract, but the real `drawCustom25DMapCanvas(canvas)` still depends on the global live `map` and still performs per-draw Canvas resizing and Leaflet positioning. That means the next gated integration step must first bridge or extract those map dependencies deliberately rather than invoking the live draw entry directly.
