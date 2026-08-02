# GROWGO SESSION 211.30 — Custom 2.5D Zones Helper Viewport Injection Extraction

## Status

PASS

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- final git status:
  - `?? GROWGO_SESSION_211_30_CUSTOM25D_ZONES_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`
  - `?? client/growgo-custom25d-zones-viewport-draw-helper.mjs`
  - `?? tests/client-growgo-custom25d-zones-viewport-draw-helper.test.mjs`

## Checkpoint

- Phase 211.29 verification method:
  - verified exact commit title:
    - `5dc4da5 feat(atlas): extract custom25d helper viewport projection seam`
  - verified required files exist:
    - `client/growgo-custom25d-live-helper-viewport-projection.mjs`
    - `tests/client-growgo-custom25d-live-helper-viewport-projection.test.mjs`
    - `GROWGO_SESSION_211_29_CUSTOM25D_HELPER_VIEWPORT_PROJECTION_SEAM_EXTRACTION.md`
- history remained unchanged: yes

## Source discovery

### zone-data dependencies

Live `drawCustom25DZones(ctx, bounds, topLeft)` still reads:

- global `custom25DZoneFeatures`
- feature `coords`
- feature `zoneType`
- feature `closed`

### style dependencies

Live zones path depends on:

- `getZoneStyleForFeature(featureType, zoom)`
- fixed zone style palette for:
  - `park`
  - `grass`
  - `water`
  - `beach`
  - `wetland`
  - `sports`
- fixed priority order:
  - `grass`
  - `sports`
  - `park`
  - `wetland`
  - `beach`
  - `water`

### zoom thresholds

Preserved exactly:

- low details: `zoom >= 15`
- medium details: `zoom >= 16.5`
- high details: `zoom >= 18`
- line width:
  - `2.2` at high
  - `1.6` at medium
  - `1.1` below medium

### geometry structure

- zone geometry remains:
  - `feature.coords -> [latitude, longitude]`
- valid live geometry remains:
  - array
  - at least 2 coordinates
- viewport eligibility remains:
  - include only when at least one coordinate is inside the viewport

### projection behavior

Live source still uses:

- `map.getZoom()`
- `bounds.contains([lat, lng])`
- `map.latLngToLayerPoint([lat, lng])`
- `topLeft` subtraction for Canvas-local points

Extracted helper now uses instead:

- `viewportProjection.getZoom()`
- `viewportProjection.projectCoordinateToCanvasPoint({ latitude, longitude })`

and preserves filtering by using the frozen projection result’s `insideSnapshotBounds` signal.

### context operation order

Preserved zone-path draw order:

1. `save`
2. `beginPath`
3. `moveTo`
4. `lineTo`
5. optional `closePath`
6. fill/stroke style assignment
7. `fill`
8. `stroke`
9. `restore`

Detail helpers preserve their own save/clip/draw/restore pattern.

### live callsite coupling

Live coupling is still present and intentionally unchanged:

- `drawCustom25DMapCanvas(canvas)`
  - `drawCustom25DZones(ctx, bounds, topLeft)`
- live source still owns:
  - global zone data access
  - live map reads
  - live bounds reads

This phase extracted only the disconnected seam-compatible helper.

## Files changed

- `client/growgo-custom25d-zones-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-zones-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_30_CUSTOM25D_ZONES_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

## Successful fake zones draw

- input count: `3`
- eligible count: `2`
- skipped count: `1`
- projection count: `9`
- completed draw count: `2`
- context operations:
  - zone path draw
  - detail helper draw
  - balanced `save/restore`
  - Canvas-local `moveTo/lineTo`
- reference release:
  - no zone reference retained
  - no context reference retained
  - no map reference retained

## Blocked and failure cases

- invalid viewport:
  - blocked
  - precise reason preserved
- invalid zones:
  - blocked
  - missing input and malformed collection covered
- invalid geometry:
  - blocked
  - malformed geometry and invalid coordinates covered
- projection failure:
  - blocked
  - first meaningful projection failure preserved
- invalid style:
  - blocked
  - missing and malformed style configuration covered

## Classification

- exact classification: `ZONES_HELPER_VIEWPORT_INJECTION_READY`
- reason:
  - zones drawing behavior is now reproducible with fake data, frozen zoom, injected coordinate projection, and a fake 2D context
  - no direct global map access occurs inside the extracted helper
  - the real renderer and live page remain inactive
- next smallest safe step:
  - perform a narrow source-compatible callsite swap from live `drawCustom25DZones` internals to the extracted helper while preserving current startup behavior and keeping the page disconnected from new browser controls

## Tests

- passed:
  - new Phase 211.30 helper suite: `8`
  - Phase 211.22–211.30 focused regressions: `83`
- failed: `0`

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- `script.js` changed: no
- live map read: no
- real draw called: no
- real Canvas created: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` mutated: no
- browser activation exposed: no

## Commit

YES

## Suggested commit message

`feat(atlas): extract custom25d zones viewport draw helper`

## Next phase

Perform the smallest source-compatible live callsite migration from `drawCustom25DZones` to the extracted viewport-based helper, with source-lock coverage proving startup behavior remains unchanged and the live page still exposes no new activation path.
