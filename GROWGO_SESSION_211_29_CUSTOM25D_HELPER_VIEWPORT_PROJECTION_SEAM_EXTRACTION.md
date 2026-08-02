# GROWGO SESSION 211.29 — Custom 2.5D Helper Viewport and Projection Seam Extraction

## Status

PASS

## Checkpoint

- Phase 211.28 verification method: accepted by verified checkpoint contents and passing focused Phase 211.22–211.28 tests
- Verified files:
  - `client/growgo-custom25d-live-draw-map-snapshot.mjs`
  - `tests/client-growgo-custom25d-live-draw-map-snapshot.test.mjs`
  - `GROWGO_SESSION_211_28_CUSTOM25D_DRAW_MAP_DEPENDENCY_SEAM_EXTRACTION.md`
- History remained unchanged: yes

## Files created

- `client/growgo-custom25d-live-helper-viewport-projection.mjs`
- `tests/client-growgo-custom25d-live-helper-viewport-projection.test.mjs`
- `GROWGO_SESSION_211_29_CUSTOM25D_HELPER_VIEWPORT_PROJECTION_SEAM_EXTRACTION.md`

## Source discovery

### Bounds policy

Current helper behavior usually filters features by `bounds.contains(...)` before projecting them, but the lower-level coordinate projectors themselves do not enforce bounds. This seam therefore reports `insideSnapshotBounds` accurately and does not block projection merely because a coordinate is outside bounds.

### Projection formula

- `layerPoint = coordinateProjector({ latitude, longitude })`
- `canvasLocalX = layerPoint.x - snapshot.canvasLayerPosition.x`
- `canvasLocalY = layerPoint.y - snapshot.canvasLayerPosition.y`

### Viewport lifetime

Viewport values are frozen for the lifetime of one seam instance. A new viewport requires a new immutable Phase 211.28 snapshot and a new projection seam instance.

### Helper dependency table

| Helper | Global map reads | Zoom used | Coordinate projections | Top-left subtraction | Outside-bounds behavior | Additional viewport deps | Classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `drawCustom25DZones` | `map.getZoom()`, `map.latLngToLayerPoint(...)` | yes | polygon coordinates | yes, inside helper projection path | pre-filtered by `bounds.contains(...)` | `bounds`, `topLeft` | `READY_FOR_VIEWPORT_PROJECTION_INJECTION` |
| `drawCustom25DBuildings` | `map.getZoom()`, `map.latLngToLayerPoint(...)` | yes | building polygon coordinates | yes, inside helper projection path | pre-filtered by `bounds.contains(...)` | `bounds`, `topLeft` | `READY_FOR_VIEWPORT_PROJECTION_INJECTION` |
| `drawCustom25DRoads` | `map.getZoom()`, `map.latLngToLayerPoint(...)` | yes | road polyline coordinates | yes, inside helper projection path | pre-filtered by `bounds.contains(...)` | `bounds`, `topLeft` | `READY_FOR_VIEWPORT_PROJECTION_INJECTION` |
| `drawCustom25DTrees` | `map.getZoom()`, `map.latLngToLayerPoint(...)`, north-west layer-point re-lookup | yes | park polygon coordinates | yes, after north-west re-lookup | pre-filtered by `bounds.contains(...)` | `bounds`, `topLeft` | `READY_FOR_VIEWPORT_PROJECTION_INJECTION` |
| `renderCustomLandmarkLayer` | `map.latLngToLayerPoint(...)` | no | marker point coordinates | not currently performed | pre-filtered by `bounds.contains(...)` | canvas-local conversion | `REQUIRES_ADDITIONAL_VIEWPORT_INPUT` |

## Implemented seam

Created a disconnected live-capable viewport/projection seam:

- `createGrowGoCustom25DHelperViewportProjection({ mapSnapshot, coordinateProjector })`

Exposed operations:

- `getViewportStatus()`
- `getZoom()`
- `projectCoordinateToLayerPoint({ latitude, longitude })`
- `projectCoordinateToCanvasPoint({ latitude, longitude })`

The seam:

- validates the Phase 211.28 snapshot schema and frozen viewport values
- copies only immutable numeric viewport data
- retains no map or mutable snapshot reference
- does not invoke the projector during construction
- returns frozen zoom without map access
- performs exactly one projector call per explicit projection
- returns both layer-point and canvas-local point outputs
- retains no coordinate or projected-point reference after success or failure

## Successful projection proof

Verified through injected fake dependencies:

- snapshot values copied:
  - zoom `17.5`
  - logical size `640 x 360`
  - canvas layer position `{ x: 12, y: 34 }`
  - bounds north/south/east/west preserved
- projector calls per projection: `1`
- example layer point: `{ x: 40, y: 90 }`
- example canvas-local point: `{ x: 28, y: 56 }`
- repeated projection behavior:
  - same frozen viewport reused
  - independent immutable result objects returned
  - counters increment accurately
- reference release:
  - no snapshot reference retained
  - no map reference retained
  - no coordinate reference retained
  - no projected-point reference retained

## Blocked and failure cases

- invalid snapshot: fail closed
- invalid zoom: fail closed
- invalid coordinate: fail closed
- projector exception: fail closed with precise reason
- invalid projected point: fail closed with precise reason
- missing projector: fail closed
- invalid canvas layer position: fail closed
- invalid bounds: fail closed

## Classification

`HELPER_VIEWPORT_PROJECTION_SEAM_READY`

### Exact reason

The seam now provides frozen zoom and deterministic coordinate projection without any direct global map access, canvas work, or renderer activity. It is ready to be consumed by fake helper adapters in later phases.

### Next smallest safe extraction step

Adapt the first eligible helper group, starting with zones, to consume injected `getZoom()` and `projectCoordinateToCanvasPoint(...)` instead of `map.getZoom()` and `map.latLngToLayerPoint(...)`.

## Tests

- new focused helper viewport/projection seam suite added
- Phase 211.22–211.28 regressions remained passing

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- `script.js` changed: no
- live map read: no
- real draw called: no
- Canvas mutated: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` mutated: no
- browser activation exposed: no
