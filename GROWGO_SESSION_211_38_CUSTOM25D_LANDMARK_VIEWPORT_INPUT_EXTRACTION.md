# GROWGO SESSION 211.38 — Custom 2.5D Landmark Viewport Input Extraction

## Status

PASS

## Phase 211.37 checkpoint

Phase 211.37 was verified by exact commit title:

- `8f15047 refactor(atlas): migrate custom25d trees to viewport projection seam`

Confirmed present:

- `script.js` trees live-callsite migration
- `tests/client-growgo-custom25d-trees-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_37_CUSTOM25D_TREES_NARROW_LIVE_CALLSITE_MIGRATION.md`

History remained unchanged.

## Files changed

- `client/growgo-custom25d-landmarks-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-landmarks-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_38_CUSTOM25D_LANDMARK_VIEWPORT_INPUT_EXTRACTION.md`

## Source discovery

### Landmark-data source

Live landmark rendering currently reads:

- `getActiveCustom25DLandmarkData()`
- `getCustom25DLandmarkTestMarkers(bounds)`

The active helper extraction does not read either one directly. It now expects explicit `landmarks`.

### Landmark schema

Current drawable landmark fields are:

- `marker.lat`
- `marker.lng`
- `marker.rendererCategory`
- `marker.category`

The current live draw path does not require labels, ids, or names for rendering.

### Supported types

Explicit recipes exist for:

- `generic`
- `dinosaur`
- `film`
- `music`
- `waterfall`
- `beach`
- `historic`

Unknown categories currently fall back to `generic`. That fallback was preserved.

### Zoom and visibility rules

- no zoom read is required by the current landmark draw path
- no zoom threshold exists
- visibility is enforced after projection
- out-of-bounds markers are skipped

### Projection coordinate space

The live landmark path currently uses:

- raw `map.latLngToLayerPoint(...)`

It does **not** subtract `topLeft`.

The extracted helper preserves that exact contract by requiring:

- `viewportProjection.projectCoordinateToLayerPoint({ latitude, longitude })`

### Raw layer versus Canvas-local behavior

Current source behavior is raw layer-point based.

This phase did not reinterpret that into Canvas-local coordinates.

### Top-left dependency

- live landmark rendering computes frame `topLeft` outside the callsite
- the landmark path does not consume it
- helper extraction therefore records:
  - `coordinateSpaceUsed = "layerPoint"`
  - `frozenTopLeftUsed = false`

### Drawing order

Per eligible landmark:

1. glow fill
2. ring fill
3. white inset fill
4. inner radial gradient fill
5. highlight stroke
6. category glyph draw

### Style dependencies

Preserved exactly:

- `CUSTOM_25D_LANDMARK_VISUAL_RECIPES`
- `outerRadius = 13`
- `innerRadius = 9.2`
- `glowRadius = 16.5`
- glyph size multiplier `1.5`

### Context behavior

Required context capabilities preserved:

- `save`
- `restore`
- `beginPath`
- `arc`
- `fill`
- `stroke`
- `moveTo`
- `lineTo`
- `rect`
- `quadraticCurveTo`
- `createRadialGradient`

Balanced context behavior preserved:

- one foundation save/restore
- one glyph save/restore
- total `2` save/restore pairs per completed landmark

### Helper fanout

The extracted helper reproduces the live landmark foundation path through:

- `getLandmarkVisualRecipe(...)`
- `drawSpecialPoiFoundation(...)`
- `drawLandmarkPreviewGlyph(...)`

### Live callsite coupling

The active live callsite remains unchanged:

- `drawCustom25DLandmarkFoundation(ctx, bounds, topLeft);`

Source-lock tests also confirmed the completed zones, buildings, roads, and trees live callsite migrations remain unchanged.

## Classification

`LANDMARK_HELPER_VIEWPORT_INJECTION_READY`

Reason:

- the landmark foundation path is now reproducible using explicit landmark input
- the direct map projection dependency was replaced by an injected layer-point viewport seam
- raw layer-point behavior was preserved exactly
- no live callsite migration was performed yet

## Tests

Focused helper tests:

- module import side effects and source-lock inspection
- successful fake landmark draw summary
- generic fallback preservation
- repeated-call non-retention
- fail-closed validation coverage
- missing context capability blocking
- helper disposal

Regression band re-run:

- Phase 211.22–211.37 focused regressions

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- `script.js` changed: no
- live map read performed: no
- live renderer invoked: no
- real Canvas created: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` mutated: no
- browser activation exposed: no

## Commit

YES

## Suggested commit message

`feat(atlas): extract custom25d landmarks viewport draw helper`

## Next smallest safe phase

- `211.39 — Custom 2.5D Landmark Narrow Live Callsite Migration`
