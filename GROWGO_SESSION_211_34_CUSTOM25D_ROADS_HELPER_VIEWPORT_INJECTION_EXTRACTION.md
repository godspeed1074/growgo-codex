# GROWGO SESSION 211.34 — CUSTOM 2.5D ROADS HELPER VIEWPORT INJECTION EXTRACTION

## Goal

Extract the custom 2.5D roads draw path into a disconnected helper that consumes a frozen viewport seam rather than reading the live Leaflet map directly.

## Preflight

- Branch verified: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Working tree confirmed clean before Phase 211.34 edits
- Phase 211.33 accepted by verified content at commit `a41987f`
- Required Phase 211.33 files confirmed:
  - buildings migration in `script.js`
  - `client/growgo-custom25d-buildings-viewport-draw-helper.mjs`
  - `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`
  - `tests/client-growgo-custom25d-buildings-live-callsite-migration.test.mjs`
  - `GROWGO_SESSION_211_33_CUSTOM25D_BUILDINGS_NARROW_LIVE_CALLSITE_MIGRATION.md`
- Focused Phase 211.22–211.33 regressions passed before extraction

## Source Discovery

### Live road-data source

- global source: `custom25DRoadFeatures`

### Current road schema observed

- `road.highway`
- `road.coords`

### Geometry schema

- line-string only
- format: `road.coords = [[latitude, longitude], ...]`
- minimum 2 points
- no live multi-line or nested-geometry handling

### Supported and fallback road types

- `primary`
- `primary_link`
- `secondary`
- `secondary_link`
- `tertiary`
- `tertiary_link`
- `service`
- `road`
- `track`
- `path`
- `footway`
- `cycleway`
- `pedestrian`
- fallback: `residential`

### Zoom thresholds

- no road-specific minimum zoom gate
- active behavior supports all finite zoom values
- width scaling uses:
  - `zoomBoost = max(0, zoom - 15) * 0.55`

### Filtering and cap behavior

- no explicit cap
- skipped unless `coords.length >= 2`
- skipped unless at least one coordinate satisfies `bounds.contains([lat, lng])`
- skipped unless projected point count is at least `2`

### Road priority and draw order

- no sorting
- source order preserved exactly

### Projection order

- projection happens in source coordinate order
- each projected point becomes Canvas-local `{ x, y }`

### Line-width calculations

- `primary`: `12.1 + zoomBoost`
- `secondary`: `8.9 + zoomBoost * 0.8`
- `residential`: `6.45 + zoomBoost * 0.62`
- `service`: `4.2 + zoomBoost * 0.44`
- `path`: `2.2 + zoomBoost * 0.18`

### Casing, fill and stroke order

For each road:

1. shadow stroke
2. edge stroke
3. fill stroke
4. optional warm-core stroke
5. highlight stroke

### Line join and cap values

- `lineCap = "round"`
- `lineJoin = "round"`

### Style and colour dependencies

- single style helper: `getRoadStyleForFeature(highwayType, zoom)`
- no additional road-detail fanout

### Save/restore behavior

- `drawRoadShadow(...)` uses one `save()` / `restore()`
- `drawCustom25DRoad(...)` uses one `save()` / `restore()`
- net: two balanced save/restore pairs per successfully drawn road

### Malformed geometry behavior in the live path

- missing or short `coords` is skipped
- off-bounds roads are skipped
- projected point count below `2` is skipped

The extracted helper uses explicit fail-closed contract results for malformed geometry during fake-only validation.

### Remaining global mutable-data dependencies in the live path

- `custom25DRoadFeatures`
- `map.getZoom()`
- `bounds.contains(...)`
- `projectCustom25DRoadPoints(...)`
- `map.latLngToLayerPoint(...)`

### Live callsite coupling

- active live callsite remains unchanged in `drawCustom25DMapCanvas(canvas)`
- active roads layer still calls:
  - `drawCustom25DRoads(ctx, bounds, topLeft)`

## Implementation

Created:

- `client/growgo-custom25d-roads-viewport-draw-helper.mjs`

Exports:

- `createGrowGoCustom25DRoadsStyleConfig(...)`
- `inspectGrowGoCustom25DRoadsViewportDrawHelperSourceLock(...)`
- `createGrowGoCustom25DRoadsViewportDrawHelper(...)`

Factory contract:

```js
createGrowGoCustom25DRoadsViewportDrawHelper({
  viewportProjection,
  styleConfig
})
```

Operation contract:

```js
drawRoads({
  context,
  roads
})
```

Viewport seam contract:

- `viewportProjection.getZoom()`
- `viewportProjection.projectCoordinateToCanvasPoint({ latitude, longitude })`

The helper performs:

- no direct `map.getZoom()`
- no direct `map.latLngToLayerPoint(...)`
- no direct `map.getBounds()`
- no direct `map.getSize()`
- no global road collection read
- no listener installation
- no DOM, pane, canvas, WebGL, overlay, network, asset, or persistence activity

## Focused Test Coverage

Created:

- `tests/client-growgo-custom25d-roads-viewport-draw-helper.test.mjs`

Covered:

- import has no side effects
- helper factory and style config factory exist
- source lock confirms the live road path is still directly coupled
- representative fake roads draw successfully
- source-order behavior is preserved
- projection counts are accurate
- line widths, caps, joins, and operation order are preserved
- repeated draws retain no road state
- missing viewport / invalid seam cases fail closed
- invalid zoom fails closed
- missing context / missing roads / malformed collection fail closed
- malformed geometry and invalid coordinates fail closed
- projection failure fails closed with no fallback
- invalid styles fail closed
- configurable unsupported zoom range fails cleanly
- helper disposal blocks future draws
- results are deeply immutable

## Classification

- `ROADS_HELPER_VIEWPORT_INJECTION_READY`

## Why This Classification Fits

The roads behavior is now reproducible using fake road data, frozen viewport projection, explicit styles, and a recording fake context. The live roads callsite remains unchanged and explicitly source-locked as still coupled to direct map reads, which is the correct stopping point for this phase.

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- no `script.js` changes
- no live renderer execution
- no real Canvas or pane creation
- no WebGL creation
- no listeners, timers, or polling
- no network, asset, or persistence activity
- no browser command exposure

## Files Changed

- `client/growgo-custom25d-roads-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-roads-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_34_CUSTOM25D_ROADS_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

## Next Smallest Safe Phase

- `211.35 — Custom 2.5D Roads Narrow Live Callsite Migration`
