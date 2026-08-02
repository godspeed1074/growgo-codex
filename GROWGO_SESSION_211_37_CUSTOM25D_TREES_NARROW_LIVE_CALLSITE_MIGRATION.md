# GROWGO SESSION 211.37 — Custom 2.5D Trees Narrow Live Callsite Migration

## Status

PASS

## Phase 211.36 checkpoint

Phase 211.36 was verified by exact commit title:

- `44fde4b feat(atlas): extract custom25d trees viewport draw helper`

Confirmed present:

- `client/growgo-custom25d-trees-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-trees-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_36_CUSTOM25D_TREES_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

History remained unchanged.

## Loading architecture

- `script.js` remains a classic script
- migration method:
  - synchronous frame-local viewport adapter inside `script.js`
  - active live callsite routed through a narrow migrated wrapper
  - extracted Phase 211.36 helper remains the contract and test oracle
- dynamic import was not used because it would introduce async behavior into the live frame path

## Files changed

- `script.js`
- `tests/client-growgo-custom25d-trees-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_37_CUSTOM25D_TREES_NARROW_LIVE_CALLSITE_MIGRATION.md`

## Trees migration

### Old global-map reads

Legacy direct-map tree function still contains:

- `map.getZoom()`
- `bounds.contains(...)`
- `map.latLngToLayerPoint(bounds.getNorthWest())`
- `projectCustom25DZonePoints(...)`

### Redundant north-west lookup

The old active path re-looked up:

- `map.latLngToLayerPoint(bounds.getNorthWest())`

That lookup was redundant with the frame `topLeft`.

It existed only because the legacy tree path reused `projectCustom25DZonePoints(...)`, which subtracts a caller-supplied top-left.

The migrated active path performs no north-west re-lookup.

### New viewport inputs

Added:

- `createCustom25DTreesLiveViewportProjection(bounds, topLeft)`
- `projectCustom25DTreePointsWithViewport(coords, viewportProjection)`
- `drawCustom25DTreesViewportInjected(ctx, treeFeatures, viewportProjection)`
- `drawCustom25DTreesLiveCallsite(ctx, bounds, topLeft)`

### Active routing

`drawCustom25DMapCanvas(canvas)` now routes trees through:

- `drawCustom25DTreesLiveCallsite(ctx, bounds, topLeft)`

Legacy direct-map anchor is retained in a comment block:

- `drawCustom25DTrees(ctx, size, bounds)`

### Tree-data source

Preserved exactly:

- `custom25DZoneFeatures`

### Filtering equivalence

Preserved exactly:

- `zoneType === "park"`
- `coords.length >= 3`
- at least one coordinate inside frame bounds
- at least three projected points

### Zoom and cluster-count equivalence

Preserved exactly:

- medium-detail threshold starts effectively at `16.5`
- below zoom `18`: `3` clusters
- at or above zoom `18`: `5` clusters

### Scale formulas

Preserved exactly:

Below zoom `18`:

- `0.72 + ((i % 2) * 0.05)`

At or above zoom `18`:

- `0.9 + ((i % 3) * 0.08)`

### Deterministic seed behavior

Preserved exactly:

- `const seed = hashFeatureSeed(feature.id);`
- `Math.abs(Math.sin(seed + i * 17.3)) % 1`
- `Math.abs(Math.sin(seed + i * 29.7)) % 1`

### Clipping and drawing order

Preserved exactly:

1. `ctx.save()`
2. clip polygon
3. canopy blob 1
4. canopy blob 2
5. canopy blob 3
6. highlight
7. `ctx.restore()`

### Style equivalence

Preserved exactly:

- `rgba(64, 149, 77, 0.52)`
- `rgba(50, 133, 63, 0.58)`
- `rgba(228, 247, 206, 0.14)`

No trunk, shadow, or outline pass was added.

### Context behavior

Preserved exactly:

- one save/restore pair per eligible tree
- fill-only tree rendering
- balanced context operations

### Failure behavior

If viewport creation fails:

- trees layer fails closed
- whole frame does not crash

If projection fails:

- trees layer fails closed
- no fallback to direct global-map reads occurs
- no second top-left lookup occurs

## Unchanged paths

- zones
- buildings
- roads
- landmarks
- renderer startup

## Classification

`TREES_LIVE_CALLSITE_MIGRATION_READY`

Reason:

- the active trees path now uses one frozen viewport-injected path
- direct global map reads were removed from the active migrated tree logic
- the redundant north-west re-lookup was removed from the active path
- preserved tree-cluster behavior remained source-compatible

Next smallest safe helper phase:

- `211.38 — Custom 2.5D Landmark Viewport Input Extraction`

## Tests

- passed: `130`
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

`refactor(atlas): migrate custom25d trees to viewport projection seam`
