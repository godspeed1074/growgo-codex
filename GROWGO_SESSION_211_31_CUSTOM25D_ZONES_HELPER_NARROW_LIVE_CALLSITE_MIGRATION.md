# GROWGO SESSION 211.31 — Custom 2.5D Zones Helper Narrow Live Callsite Migration

## Status

PASS

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- final git status:
  - `M script.js`
  - `?? GROWGO_SESSION_211_31_CUSTOM25D_ZONES_HELPER_NARROW_LIVE_CALLSITE_MIGRATION.md`
  - `?? tests/client-growgo-custom25d-zones-live-callsite-migration.test.mjs`

## Checkpoint

- Phase 211.30 verification method:
  - verified exact commit title:
    - `2e63f21 feat(atlas): extract custom25d zones viewport draw helper`
  - verified required files exist:
    - `client/growgo-custom25d-zones-viewport-draw-helper.mjs`
    - `tests/client-growgo-custom25d-zones-viewport-draw-helper.test.mjs`
    - `GROWGO_SESSION_211_30_CUSTOM25D_ZONES_HELPER_VIEWPORT_INJECTION_EXTRACTION.md`
- history remained unchanged: yes

## Loading architecture

- classic script or module:
  - `script.js` remains a classic script loaded by:
    - `<script src="script.js?v=cards14"></script>`
  - `client/development-alpha-app.mjs` remains separately module-loaded
- migration approach selected:
  - add a synchronous frame-local viewport adapter inside `script.js`
  - route the active live zones callsite through a new migrated wrapper
  - keep the extracted module as the contract/test oracle
  - keep the old direct-map `drawCustom25DZones` function isolated and unused
- why dynamic import was not used:
  - it would introduce asynchronous behavior into the frame-draw path
  - this phase required no renderer startup changes and no draw-order drift

## Files changed

- `script.js`
- `tests/client-growgo-custom25d-zones-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_31_CUSTOM25D_ZONES_HELPER_NARROW_LIVE_CALLSITE_MIGRATION.md`

## Zones migration

### old global map reads

The legacy direct-map zones path still exists in source, isolated and unused, and still contains:

- `map.getZoom()`
- `map.latLngToLayerPoint(...)`
- `bounds.contains([lat, lng])`

### new viewport inputs

The active live zones path now uses:

- `drawCustom25DZonesLiveCallsite(ctx, bounds, topLeft)`
- `createCustom25DZonesLiveViewportProjection(bounds, topLeft)`
- `drawCustom25DZonesViewportInjected(ctx, zoneFeatures, viewportProjection)`

The migrated zones logic consumes:

- `viewportProjection.getZoom()`
- `viewportProjection.projectCoordinateToCanvasPoint({ latitude, longitude })`
- `insideSnapshotBounds`

### zone-data source

Unchanged:

- `custom25DZoneFeatures`

### style and threshold equivalence

Unchanged:

- style source:
  - `getZoneStyleForFeature(feature.zoneType, zoom)`
- thresholds:
  - `15`
  - `16.5`
  - `18`
- priority order:
  - `grass`
  - `sports`
  - `park`
  - `wetland`
  - `beach`
  - `water`

### projection behavior

The active live path now:

- freezes zoom once per zones frame
- reuses the existing frame `topLeft`
- projects coordinates through the frame-local viewport adapter
- keeps bounds membership via `insideSnapshotBounds`

### context behavior

Unchanged:

- `drawCustom25DZone(...)`
- `drawWaterTexture(...)`
- `drawBeachDetails(...)`
- `drawParkDetails(...)`
- `drawGrassTexture(...)`
- `drawSportsFieldDetails(...)`
- `drawWetlandDetails(...)`

Canvas draw order and save/restore behavior remain source-compatible.

### failure behavior

If viewport creation or projection fails:

- zones layer fails closed
- no fallback to direct global map access occurs
- no renderer startup behavior changes
- no extra listener, timer, polling, or browser exposure is introduced

## Unchanged paths

- buildings: unchanged
- roads: unchanged
- trees: unchanged
- landmarks: unchanged
- renderer startup: unchanged

## Classification

- exact classification: `ZONES_LIVE_CALLSITE_MIGRATION_READY`
- reason:
  - the active live zones callsite now routes through a viewport-injected path
  - the migrated zones logic itself no longer directly reads `map.getZoom()` or `map.latLngToLayerPoint(...)`
  - the renderer remains disabled and no live frame was drawn in tests
- next smallest safe helper migration:
  - `211.32 — Custom 2.5D Buildings Helper Viewport Injection Extraction`

## Tests

- passed:
  - focused Phase 211.28–211.31 suite: `31`
  - focused Phase 211.22–211.31 regressions: `88`
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

`refactor(atlas): migrate custom25d zones to viewport projection seam`

## Next phase

`211.32 — Custom 2.5D Buildings Helper Viewport Injection Extraction`
