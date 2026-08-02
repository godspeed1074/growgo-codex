# GROWGO SESSION 211.41 — Centralized Custom 2.5D Frame-Root Viewport Snapshot

## Status

PASS

## Phase 211.40 checkpoint

Phase 211.40 was verified by exact commit title:

- `65d7474 test(atlas): audit custom25d draw path map dependencies`

Confirmed present:

- `GROWGO_SESSION_211_40_CUSTOM25D_DRAW_PATH_GLOBAL_MAP_DEPENDENCY_AUDIT.md`
- `tests/client-growgo-custom25d-draw-path-global-map-dependency-audit.test.mjs`

History remained unchanged.

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- final git status:
  - `M script.js`
  - `?? GROWGO_SESSION_211_41_CENTRALIZED_CUSTOM25D_FRAME_ROOT_VIEWPORT_SNAPSHOT.md`
  - `?? tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`

## Goal result

One active frame-root snapshot now owns:

- logical size
- bounds
- north-west coordinate
- top-left layer point
- zoom
- device pixel ratio
- Canvas logical size
- Canvas backing size

That same frozen snapshot is now consumed by all five active live layers:

- zones
- buildings
- roads
- trees
- landmarks

The migrated layer viewport factories still project feature coordinates through:

- `map.latLngToLayerPoint(...)`

But they no longer independently re-read:

- `map.getZoom()`
- `map.getBounds()`
- `map.getSize()`
- `bounds.getNorthWest()`

## Frame-root snapshot

Added:

- `CUSTOM_25D_FRAME_VIEWPORT_SNAPSHOT_SCHEMA_ID`
- `normalizeCustom25DDevicePixelRatio(...)`
- `freezeCustom25DFrameViewportSnapshot(...)`
- `createCustom25DFrameViewportSnapshot({ map, canvas })`

The snapshot contains:

- `schemaId`
- `logicalWidth`
- `logicalHeight`
- `backingWidth`
- `backingHeight`
- `devicePixelRatio`
- `bounds.north`
- `bounds.south`
- `bounds.east`
- `bounds.west`
- `northWestCoordinate.latitude`
- `northWestCoordinate.longitude`
- `canvasLayerPosition.x`
- `canvasLayerPosition.y`
- `zoom`
- `mapIdentityValidated`
- `canvasIdentityValidated`
- `snapshotCreated`
- `drawRequested`
- `listenerAdded`
- `retentionWritten`

It also exposes frozen frame-safe bounds helpers used by the active live path:

- `contains([latitude, longitude])`
- `getNorthWest()`
- `getCenter()`

Those helpers preserve compatibility for the active landmark test-marker path and bounds membership checks without re-reading the live map frame state.

## Required frame-root sequence

Confirmed:

1. `drawCustom25DMapCanvas(canvas)` begins.
2. map and Canvas are validated through snapshot creation.
3. `map.getSize()` is read exactly once.
4. `map.getBounds()` is read exactly once.
5. `bounds.getNorthWest()` is read exactly once.
6. `map.latLngToLayerPoint(northWestCoordinate)` is read exactly once.
7. `map.getZoom()` is read exactly once.
8. device pixel ratio is read and normalized exactly once.
9. Canvas position is applied once.
10. Canvas logical and backing dimensions are applied once.
11. One frozen frame snapshot is created.
12. The same snapshot is passed through the active draw path to:
    - zones
    - buildings
    - roads
    - trees
    - landmarks

## Active draw path changes

### drawCustom25DMapCanvas(canvas)

Now:

- creates one frame-root snapshot
- derives:
  - `size`
  - `bounds`
  - `topLeft`
  - `scale`
  from that snapshot
- preserves active layer draw order exactly
- preserves Canvas positioning and sizing ownership exactly

The live callsite order remains:

1. background
2. zones
3. buildings
4. roads
5. trees
6. landmarks

### Zones

`createCustom25DZonesLiveViewportProjection(bounds, topLeft)` now consumes:

- `frameViewportSnapshot.zoom`
- `frameViewportSnapshot.canvasLayerPosition`
- `frameViewportSnapshot.contains(...)`

Removed from the active path:

- per-layer `map.getZoom()`
- per-layer north-west re-read

Canvas-local projection remains unchanged.

### Buildings

`createCustom25DBuildingsLiveViewportProjection(bounds, topLeft)` now consumes:

- `frameViewportSnapshot.zoom`
- `frameViewportSnapshot.canvasLayerPosition`
- `frameViewportSnapshot.contains(...)`

Removed from the active path:

- per-layer `map.getZoom()`
- per-layer north-west re-read

Canvas-local projection remains unchanged.

### Roads

`createCustom25DRoadsLiveViewportProjection(bounds, topLeft)` now consumes:

- `frameViewportSnapshot.zoom`
- `frameViewportSnapshot.canvasLayerPosition`
- `frameViewportSnapshot.contains(...)`

Removed from the active path:

- per-layer `map.getZoom()`
- per-layer north-west re-read

Canvas-local projection remains unchanged.

### Trees

`createCustom25DTreesLiveViewportProjection(bounds, topLeft)` now consumes:

- `frameViewportSnapshot.zoom`
- `frameViewportSnapshot.canvasLayerPosition`
- `frameViewportSnapshot.contains(...)`

Removed from the active path:

- per-layer `map.getZoom()`
- per-layer north-west re-read

Canvas-local projection remains unchanged.

### Landmarks

`createCustom25DLandmarksLiveViewportProjection(bounds)` now consumes:

- `frameViewportSnapshot.contains(...)`

Preserved exactly:

- raw layer-point projection
- no top-left subtraction
- no zoom read

## Coordinate-space preservation

Preserved exactly:

- zones: Canvas-local projection
- buildings: Canvas-local projection
- roads: Canvas-local projection
- trees: Canvas-local projection
- landmarks: raw layer-point projection

No visual thresholds, styles, ordering, source data, or layer-specific draw behavior were changed.

## Failure behavior

If frame-root snapshot creation fails:

- the custom 2.5D frame fails closed
- the live draw path does not fall back to per-layer direct map reads

If layer projection fails:

- existing layer-level fail-closed behavior remains intact
- the frame snapshot is not recreated
- zoom is not re-read

## Unchanged systems

- renderer startup
- renderer authorization
- renderer readiness
- activation contract
- session coordinator
- lifecycle owner
- passive helpers
- `custom25DMapLayer` ownership
- `moveend zoomend` listener behavior

## Classification

`FRAME_ROOT_VIEWPORT_SNAPSHOT_READY`

Reason:

- one frame-root snapshot now owns size, bounds, north-west, top-left, zoom, and pixel ratio
- all five active live layers consume that shared frozen frame viewport state
- repeated per-layer frame reads were removed from the active adapters
- coordinate-space behavior stayed source-compatible

## Next smallest safe phase

- `211.42 — Narrow Live One-Frame Adapter Wiring Review`

## Files changed

- `script.js`
- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
- `GROWGO_SESSION_211_41_CENTRALIZED_CUSTOM25D_FRAME_ROOT_VIEWPORT_SNAPSHOT.md`

## Tests

Focused new test:

- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`

Focused regression band:

- Phase 211.22–211.40 relevant regressions

Result:

- passed: `166`
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
- `custom25DMapLayer` behavior changed: no
- browser activation exposed: no

## Commit

YES

## Suggested commit message

`refactor(atlas): centralize custom25d frame viewport snapshot`
