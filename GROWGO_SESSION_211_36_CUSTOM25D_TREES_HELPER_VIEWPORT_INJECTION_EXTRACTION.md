# GROWGO SESSION 211.36 — Custom 2.5D Trees Helper Viewport Injection Extraction

## Status

PASS

## Phase 211.35 checkpoint

Phase 211.35 was accepted by verified content at commit `80a0d05`.

The requested commit title was:

`refactor(atlas): migrate custom25d roads to viewport projection seam`

The actual commit message is the accidental long-form summary, but the checkpoint was accepted without history rewrite because it contains:

- the active roads viewport migration in `script.js`
- `tests/client-growgo-custom25d-roads-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_35_CUSTOM25D_ROADS_NARROW_LIVE_CALLSITE_MIGRATION.md`

History remained unchanged.

## Scope completed

Extracted and proved the trees helper contract only.

Did not migrate the active trees callsite.

Did not modify:

- `script.js`
- zones helper or migration
- buildings helper or migration
- roads helper or migration
- viewport/projection seam
- snapshot seam
- renderer readiness or authorization
- activation, surface, draw, pipeline, or session modules

## Source discovery

### Tree-data source

- live tree-data source: `custom25DZoneFeatures`

### Tree schema

- `feature.id`
- `feature.zoneType`
- `feature.coords`

### Coordinate schema

- polygon coordinates only
- format: `[[latitude, longitude], ...]`

### Supported tree types

- current live path supports only `park`
- no species classification exists in the live path

### Zoom thresholds

- tree layer threshold matches zone medium detail threshold
- live gate: `shouldDrawZoneDetailsAtZoom(zoom, "medium")`
- effective minimum zoom: `16.5`
- high-detail cluster change at `18`

### Filtering and caps

- source order preserved
- filter to `zoneType === "park"`
- require `coords.length >= 3`
- require at least one source coordinate inside `bounds.contains(...)`
- require projected point count `>= 3`
- no tree-count cap exists
- per eligible tree:
  - `3` clusters below `18`
  - `5` clusters at or above `18`

### Scale formula

- below `18`: `0.72 + ((i % 2) * 0.05)`
- at or above `18`: `0.9 + ((i % 3) * 0.08)`

### Projection behavior

- live path still projects through `projectCustom25DZonePoints(...)`
- that helper subtracts a caller-supplied top-left
- extracted helper instead uses Canvas-local projector results directly
- helper performs no independent north-west lookup

### North-west dependency

- live path currently does:
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
- reason:
  - not for shadow or style logic
  - not for tree placement randomness
  - only because live trees reuse `projectCustom25DZonePoints(...)`, which expects a top-left to subtract
- classification:
  - redundant with the frame top-left already available elsewhere in the frame

### Drawing order

Per eligible tree:

1. save context
2. clip polygon
3. per cluster:
   - canopy blob 1
   - canopy blob 2
   - canopy blob 3
   - canopy highlight
4. restore context

Not present in the current live tree path:

- trunk geometry
- shadow pass
- outline pass

### Style dependencies

- canopy fill A: `rgba(64, 149, 77, 0.52)`
- canopy fill B: `rgba(50, 133, 63, 0.58)`
- highlight fill: `rgba(228, 247, 206, 0.14)`

### Context behavior

- one `save()` / `restore()` pair per eligible tree
- clip path built from projected polygon
- no stroke usage
- only fill-based canopy/highlight rendering

### Nested helper dependencies

- `shouldDrawZoneDetailsAtZoom(...)`
- `hashFeatureSeed(...)`
- `projectCustom25DZonePoints(...)`
- `getProjectedBounds(...)`
- `clipToProjectedPolygon(...)`
- `drawTreeCluster(...)`

### Live callsite coupling

- active callsite remains:
  - `drawCustom25DTrees(ctx, size, bounds)`
- live tree path is still directly coupled to:
  - `custom25DZoneFeatures`
  - `map.getZoom()`
  - `bounds.contains(...)`
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
  - `projectCustom25DZonePoints(...)`

## Helper created

- `client/growgo-custom25d-trees-viewport-draw-helper.mjs`

Exports:

- `createGrowGoCustom25DTreesStyleConfig(...)`
- `inspectGrowGoCustom25DTreesViewportDrawHelperSourceLock(...)`
- `createGrowGoCustom25DTreesViewportDrawHelper(...)`

Factory:

- `createGrowGoCustom25DTreesViewportDrawHelper({ viewportProjection, styleConfig })`

Operation:

- `drawTrees({ context, trees })`

## Successful fake-tree draw

Representative successful fake result:

- input count: `4`
- eligible count: `2`
- skipped count: `2`
- malformed count: `0`
- projection count: `9`
- north-west lookup count: `0`
- completed draw count: `2`
- context operation summary:
  - `save`: `2`
  - `restore`: `2`
  - `clip`: `2`
  - `arc`: `24`
  - `fill`: `24`
- reference release:
  - no tree, context, coordinate, or projected-point references retained

## Blocked and failure cases covered

- invalid viewport
- missing `getZoom`
- missing projection function
- invalid frozen zoom
- missing context
- missing trees input
- malformed collection
- invalid tree object
- invalid geometry
- invalid coordinates
- projection failure
- invalid style
- missing required tree type/style mapping
- helper disposal reuse

## Files changed

- `client/growgo-custom25d-trees-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-trees-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_36_CUSTOM25D_TREES_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

## Classification

`TREES_HELPER_VIEWPORT_INJECTION_READY`

Reason:

- current tree behavior is reproducible from explicit fake tree input
- zoom, seeded placement, cluster counts, colours, clip behavior, and save/restore balance were preserved
- the helper uses only frozen viewport projection and performs no second north-west lookup

Next smallest safe phase:

- `211.37 — Custom 2.5D Trees Narrow Live Callsite Migration`

## Tests

- passed: `123`
- failed: `0`

## Canonical safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Safety confirmation

- `script.js` changed: no
- live map read: no
- real draw called: no
- real Canvas created: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` mutated: no
- browser activation exposed: no

## Commit recommendation

YES

## Suggested commit message

`feat(atlas): extract custom25d trees viewport draw helper`
