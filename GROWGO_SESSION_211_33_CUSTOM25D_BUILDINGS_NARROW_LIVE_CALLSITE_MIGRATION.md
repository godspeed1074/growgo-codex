# GROWGO SESSION 211.33 — CUSTOM 2.5D BUILDINGS NARROW LIVE CALLSITE MIGRATION

## Goal

Migrate only the active live buildings draw path to the frozen viewport seam while preserving:

- building data source
- source order
- zoom thresholds
- inclusion and exclusion behavior
- caps
- shop-versus-generic fanout
- projection order
- style and palette behavior
- renderer startup behavior

## Preflight

- Branch verified: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Working tree was clean before Phase 211.33 edits
- Phase 211.32 accepted by verified content at commit `f359419`
- Required Phase 211.32 files confirmed:
  - `client/growgo-custom25d-buildings-viewport-draw-helper.mjs`
  - `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`
  - `GROWGO_SESSION_211_32_CUSTOM25D_BUILDINGS_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`
- Focused Phase 211.22–211.32 regressions passed before migration

## Migration Shape

Following the same narrow synchronous classic-script pattern already used for zones:

- extracted module remains the contract and test oracle
- `script.js` receives only the smallest live adapter and wrapper
- no dynamic import
- no async frame path
- no renderer startup changes

Created inside `script.js`:

- `createCustom25DBuildingsLiveViewportProjection(bounds, topLeft)`
- `projectCustom25DBuildingPointsWithViewport(coords, viewportProjection)`
- `drawCustom25DBuildingsViewportInjected(ctx, buildingFeatures, viewportProjection)`
- `drawCustom25DBuildingsLiveCallsite(ctx, bounds, topLeft)`

## Active Path Result

`drawCustom25DMapCanvas(canvas)` now routes buildings through:

- `drawCustom25DBuildingsLiveCallsite(ctx, bounds, topLeft)`

The legacy direct-map function remains isolated as a source-lock anchor:

- `drawCustom25DBuildings(ctx, bounds, topLeft)`

## Behavior Preserved

### Building-data source

- unchanged: `custom25DBuildingFeatures`

### Source order

- unchanged: iteration remains in input order
- no sorting introduced

### Zoom thresholds

- building minimum zoom unchanged: `16.2`
- max building cap unchanged:
  - `>= 18` => `120`
  - `>= 17` => `80`
  - otherwise => `45`

### Inclusion and exclusion

- empty building set remains a no-op
- below-threshold zoom remains a no-op
- malformed or short `coords` remain skipped
- off-viewport buildings remain skipped
- fewer than 3 projected points remain skipped

### Shop-versus-generic fanout

- unchanged:
  - `getBuildingStyleForFeature(feature, zoom)`
  - `getShopRecipeForFeature(feature, zoom)`
  - `drawShop25D(...)`
  - `drawGeneric25DBuilding(...)`

### Projection order

- unchanged: coordinate projection remains in source coordinate order
- one frame-local viewport is reused for the whole buildings layer

### Style / palette values

- unchanged
- existing live style helpers remain authoritative

### Context behavior

- unchanged draw helpers remain authoritative
- no extra save/restore wrappers introduced around successful building draws

## Global Map Read Migration

Removed from the active migrated buildings logic:

- direct `map.getZoom()`
- direct `map.latLngToLayerPoint(...)`

These live reads now happen only in:

- `createCustom25DBuildingsLiveViewportProjection(bounds, topLeft)`

## Detail Helper Dependency

`getShopRecipeForFeature(...)` now accepts an optional zoom override:

```js
getShopRecipeForFeature(feature, zoomOverride = map?.getZoom?.() || 0)
```

This preserves legacy behavior for the isolated direct-map function while allowing the migrated active path to avoid indirect global zoom reads.

## Failure Behavior

- viewport creation failure blocks only the buildings layer
- projection failure blocks only the buildings layer
- no fallback to direct map reads
- no full-frame crash path added

## Unchanged Paths

- zones migrated path unchanged
- roads unchanged
- trees unchanged
- landmarks unchanged
- renderer initialization unchanged
- map listeners unchanged
- browser diagnostics unchanged
- Atlas activation unchanged

## Focused Tests

Created:

- `tests/client-growgo-custom25d-buildings-live-callsite-migration.test.mjs`

Verified:

- classic script remains unchanged
- active draw callsite uses the migrated buildings wrapper
- migrated buildings logic has no direct `map.getZoom()`
- migrated buildings logic has no direct `map.latLngToLayerPoint(...)`
- one frame-local viewport is used
- data source remains `custom25DBuildingFeatures`
- source order remains unchanged
- zoom thresholds and caps remain unchanged
- shop/generic fanout remains unchanged
- projection order remains unchanged
- representative fake data preserves projection and draw counts
- invalid projection fails the buildings layer closed
- no fallback to global-map reads
- zones path unchanged
- roads path unchanged
- trees path unchanged
- landmarks path unchanged
- renderer startup unchanged
- no listeners, timers, polling, browser commands, renderer startup, canvas creation, pane creation, overlay creation, or WebGL creation added

## Classification

- `BUILDINGS_LIVE_CALLSITE_MIGRATION_READY`

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- no renderer execution during tests
- no live Canvas or pane creation
- no WebGL creation
- no listener additions
- no browser exposure
- no network or asset activity

## Files Changed

- `script.js`
- `tests/client-growgo-custom25d-buildings-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_33_CUSTOM25D_BUILDINGS_NARROW_LIVE_CALLSITE_MIGRATION.md`

## Next Smallest Safe Phase

- narrow viewport-injection extraction for the next live renderer layer that still reads the global map directly, while keeping the current renderer asleep
