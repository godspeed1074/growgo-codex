# GROWGO SESSION 211.32 — CUSTOM 2.5D BUILDINGS HELPER VIEWPORT INJECTION EXTRACTION

## Goal

Extract the custom 2.5D buildings draw path into a disconnected helper that consumes a frozen viewport seam instead of reading the live Leaflet map directly.

## Preflight

- Branch verified: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Phase 211.31 accepted by verified content, even though the checkpoint commit used an accidental long-form message
- Required Phase 211.31 files confirmed:
  - `script.js` narrow zones live-callsite migration
  - `tests/client-growgo-custom25d-zones-live-callsite-migration.test.mjs`
  - `GROWGO_SESSION_211_31_CUSTOM25D_ZONES_HELPER_NARROW_LIVE_CALLSITE_MIGRATION.md`
- Focused Phase 211.22–211.31 tests passed before extraction

## Source Discovery

### Live building data source

- Global source: `custom25DBuildingFeatures`

### Current building schema observed

- `feature.id`
- `feature.coords`
- `feature.center.lat`
- `feature.center.lng`
- `feature.buildingType`
- `feature.zoneType`
- `feature.shopTag`
- `feature.amenity`
- `feature.office`
- `feature.buildingArea`
- `feature.nearCoast`

### Geometry schema

- Polygon-only coordinate arrays
- Format: `feature.coords = [[latitude, longitude], ...]`
- Minimum 3 points
- No live multipolygon handling in the current buildings path

### Malformed geometry behavior in the live path

- Missing or short `coords` is skipped
- Failed projection that yields fewer than 3 points is skipped
- Bounds exclusion is skipped
- The extracted helper now reports malformed and unsupported geometry explicitly as fail-closed contract results for disconnected testing

### Current zoom thresholds

- Building minimum zoom: `16.2`
- Shop minimum zoom: `16.8`
- Shop detail minimum zoom: `18.2`
- High detail zoom threshold: `18`
- Mid detail zoom threshold: `17`
- Max building caps:
  - `>= 18` => `120`
  - `>= 17` => `80`
  - otherwise => `45`

### Inclusion / exclusion rules

- Entire buildings layer exits early below `16.2`
- Empty global building collection exits early
- Feature skipped when draw cap reached
- Feature skipped when `coords` missing or fewer than 3
- Feature skipped when no coordinate is inside `bounds.contains(...)`
- Feature skipped when projected point count is fewer than 3

### Draw order

- No sorting
- Input source order preserved
- Cap applied while iterating in source order

### Projection order

- Coordinates projected in source coordinate order
- Each projected point becomes a Canvas-local `{ x, y }`
- Live path uses `projectCustom25DBuildingPoints(feature.coords, topLeft)`

### Roof / wall / shadow / detail order

#### Generic buildings

1. `drawBuildingShadow`
2. `drawBuildingVerticalFace` side
3. `drawBuildingVerticalFace` front
4. `drawBuildingRoof`
5. Optional roof ridge stroke at high detail zoom

#### Shops

1. `drawGeneric25DBuilding` with softened commercial palette
2. Sign shadow and sign
3. Awning shadow and awning fill
4. Optional striped awning details
5. Windows and highlights
6. Door
7. Optional shop icon and outside detail at shop-detail zoom

### Style and palette dependencies

- Generic building style:
  - `hashFeatureSeed(...)`
  - `getBuildingVariantFromSeed(...)`
  - `getBuildingStyleForFeature(feature, zoom)`
- Commercial palette and detail bundle:
  - `getShopRecipeForFeature(feature)`
  - live helper still contains a hidden global zoom read: `map?.getZoom?.() || 0`
- Recipe pool preserved in extracted config:
  - bakery
  - cafe
  - surfShop
  - fishAndChips
  - pharmacy
  - realEstate
  - bottleShop
  - newsagent
  - hardware
  - supermarket

### Canvas context operations used by the building path

- `save`
- `restore`
- `beginPath`
- `moveTo`
- `lineTo`
- `closePath`
- `fill`
- `stroke`
- `fillRect`
- `strokeRect`
- `quadraticCurveTo`
- `roundRect`
- `arc`
- `ellipse`
- `rect`

### Context property mutations used by the building path

- `fillStyle`
- `strokeStyle`
- `lineWidth`
- `lineCap`
- `lineJoin`
- `shadowColor`
- `shadowBlur`
- `shadowOffsetX`
- `shadowOffsetY`

### Direct and indirect global-map dependencies still present in the live path

- `map.getZoom()`
- `bounds.contains([lat, lng])`
- `projectCustom25DBuildingPoints(feature.coords, topLeft)`
- `map.latLngToLayerPoint([lat, lng])`
- `getShopRecipeForFeature(feature) -> map?.getZoom?.() || 0`

## Implementation

Created:

- `client/growgo-custom25d-buildings-viewport-draw-helper.mjs`

Exports:

- `createGrowGoCustom25DBuildingsStyleConfig(...)`
- `inspectGrowGoCustom25DBuildingsViewportDrawHelperSourceLock(...)`
- `createGrowGoCustom25DBuildingsViewportDrawHelper(...)`

Factory contract:

```js
createGrowGoCustom25DBuildingsViewportDrawHelper({
  viewportProjection,
  styleConfig
})
```

Operation contract:

```js
drawBuildings({
  context,
  buildings
})
```

Viewport seam contract:

- `viewportProjection.getZoom()`
- `viewportProjection.projectCoordinateToCanvasPoint({ latitude, longitude })`

The extracted helper performs:

- no direct `map.getZoom()`
- no direct `map.latLngToLayerPoint(...)`
- no direct `map.getBounds()`
- no direct `map.getSize()`
- no global building collection read
- no listener installation
- no renderer invocation
- no DOM, pane, canvas, WebGL, overlay, network, or asset activity

## Focused Test Coverage

Created:

- `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`

Covered:

- import has no side effects
- source lock confirms the live callsite is still intentionally coupled
- successful disconnected draw using fake viewport + fake context
- canvas-local projection order
- shop and generic detail fanout
- low-zoom fail-closed behavior
- missing context fail-closed behavior
- missing building collection fail-closed behavior
- unsupported geometry fail-closed behavior
- projection failure fail-closed behavior
- max-building-cap preservation without sorting
- disposal and retained-seam cleanup

## Classification

- `BUILDINGS_HELPER_VIEWPORT_INJECTION_READY`

## Why This Classification Fits

The disconnected helper now proves that the buildings layer can consume frozen zoom and explicit coordinate projection without live map reads. The live building callsite remains untouched, and the source-lock inspection explicitly records that the current production path is still blocked by live callsite coupling until a later migration phase.

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- no renderer startup
- no live map mutation
- no listener creation
- no DOM or Canvas creation
- no WebGL creation
- no network activity

## Files Changed

- `client/growgo-custom25d-buildings-viewport-draw-helper.mjs`
- `tests/client-growgo-custom25d-buildings-viewport-draw-helper.test.mjs`
- `GROWGO_SESSION_211_32_CUSTOM25D_BUILDINGS_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`

## Next Smallest Safe Phase

- Narrow live buildings callsite migration to the viewport seam, only after preserving the current live building source-order, filtering, and shop-recipe behavior under source-contract tests.
