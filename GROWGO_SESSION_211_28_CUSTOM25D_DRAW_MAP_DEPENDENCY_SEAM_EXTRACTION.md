# GROWGO SESSION 211.28 — Custom 2.5D Draw Map-Dependency Seam Extraction

## Status

PASS

## Checkpoint

- Phase 211.27 verification method: accepted by verified checkpoint contents and passing focused Phase 211.22–211.27 tests
- Verified files:
  - `client/growgo-custom25d-live-one-frame-draw-operation.mjs`
  - `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
  - `GROWGO_SESSION_211_27_NARROW_LIVE_CUSTOM25D_ONE_FRAME_DRAW_OPERATION_EXTRACTION.md`
- History remained unchanged: yes

## Files created

- `client/growgo-custom25d-live-draw-map-snapshot.mjs`
- `tests/client-growgo-custom25d-live-draw-map-snapshot.test.mjs`
- `GROWGO_SESSION_211_28_CUSTOM25D_DRAW_MAP_DEPENDENCY_SEAM_EXTRACTION.md`

## Source discovery

### Direct global map reads inside `drawCustom25DMapCanvas(canvas)`

- `map.getSize()`
- `map.getBounds()`
- `map.latLngToLayerPoint(bounds.getNorthWest())`

### Indirect helper global map reads

- `drawCustom25DZones`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DBuildings`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DRoads`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DTrees`
  - `map.getZoom()`
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
  - `map.latLngToLayerPoint([lat, lng])`
- `renderCustomLandmarkLayer`
  - `map.latLngToLayerPoint([marker.lat, marker.lng])`

### Zoom dependency

Zoom is directly required by the current draw helper path and was included in the snapshot contract.

It is used to control:

- zone detail thresholds
- building visibility and budget
- road styling widths
- tree cluster count and scale

### Viewport values required

- logical width
- logical height
- backing width
- backing height
- device pixel ratio
- bounds north/south/east/west
- north-west coordinate
- canvas-layer top-left position
- zoom

### Canvas resize and position order in the real draw path

1. `map.getSize()`
2. `map.getBounds()`
3. `map.latLngToLayerPoint(bounds.getNorthWest())`
4. `L.DomUtil.setPosition(canvas, topLeft)`
5. `window.devicePixelRatio || 1`
6. `canvas.width`
7. `canvas.height`
8. `canvas.style.width`
9. `canvas.style.height`
10. `canvas.getContext("2d")`
11. `ctx.setTransform(...)`
12. `ctx.clearRect(...)`
13. helper fanout draw calls

## Implemented seam

Created a disconnected live-capable map snapshot seam:

- `createGrowGoCustom25DDrawMapSnapshotProvider({ mapProvider, devicePixelRatioProvider })`

Exposed operations:

- `getDrawMapSnapshotStatus()`
- `getDrawMapSnapshot()`

The seam:

- receives one explicit snapshot request
- resolves the map through injected dependencies
- validates the required map contract
- reads size, bounds, north-west coordinate, layer-point conversion, zoom, and device-pixel ratio once each
- returns one deeply immutable snapshot
- retains no map, bounds, or coordinate references
- performs no drawing, Canvas mutation, DOM positioning, listener registration, or renderer retention

## Successful snapshot proof

Verified through injected fake map dependencies:

- provider calls: `1`
- size reads: `1`
- bounds reads: `1`
- north-west reads: `1`
- layer-point conversions: `1`
- device-pixel-ratio reads: `1`
- zoom reads: `1`
- logical size: `640 x 360`
- backing size: `1280 x 720`
- pixel ratio: `2`
- bounds snapshot copied into immutable numeric values
- coordinate snapshot copied into immutable numeric values
- layer-position snapshot copied into immutable numeric values
- reference release after completion: confirmed

## Blocked and failure cases

- missing map provider: fail closed
- missing map: fail closed
- incomplete map interface: fail closed
- invalid size: fail closed
- invalid bounds: fail closed
- invalid north-west coordinate: fail closed
- invalid layer point: fail closed
- map-provider exception: fail closed with exact reason
- size exception: fail closed with exact reason
- bounds exception: fail closed with exact reason
- north-west exception: fail closed with exact reason
- layer-point exception: fail closed with exact reason
- device-pixel-ratio provider exception: fail closed with exact reason

Invalid or absent device pixel ratio does not fail the seam. It safely normalizes to `1`.

## Classification

`BLOCKED_BY_ADDITIONAL_GLOBAL_MAP_READS`

### Exact reason

The direct viewport reads from `drawCustom25DMapCanvas(canvas)` can now be captured through one immutable injected snapshot, including zoom. But the helper fanout still performs additional global map reads for zoom checks, feature projection, and landmark projection. That means the draw path is not yet ready to consume the snapshot alone.

### Next smallest safe extraction step

Extract the smallest helper-side viewport/projection seam so zones, buildings, roads, trees, and landmark foundation can consume injected zoom and projection inputs instead of reading the global map directly.

## Tests

- new focused seam suite added
- Phase 211.22–211.27 regressions remained passing

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- `script.js` changed: no
- live map touched: no
- real draw called: no
- Canvas mutated: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` mutated: no
- browser activation exposed: no
