# GROWGO SESSION 211.40 — Custom 2.5D Draw Path Global-Map Dependency Audit

## Status

PASS

## Phase 211.39 checkpoint

Phase 211.39 was verified by exact commit title:

- `0e3a73d refactor(atlas): migrate custom25d landmarks to viewport projection seam`

Confirmed present:

- landmark viewport migration in `script.js`
- `tests/client-growgo-custom25d-landmarks-live-callsite-migration.test.mjs`
- `GROWGO_SESSION_211_39_CUSTOM25D_LANDMARK_NARROW_LIVE_CALLSITE_MIGRATION.md`

History remained unchanged.

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- final git status:
  - `?? GROWGO_SESSION_211_40_CUSTOM25D_DRAW_PATH_GLOBAL_MAP_DEPENDENCY_AUDIT.md`
  - `?? tests/client-growgo-custom25d-draw-path-global-map-dependency-audit.test.mjs`

## Audit summary

The active custom 2.5D draw path is now helper-migrated for:

- zones
- buildings
- roads
- trees
- landmarks

No active layer fell back to the legacy direct-map draw functions.

However, the live draw frame still does **not** have a single fully centralized viewport read owner yet.

What remains is:

- frame-root draw reads:
  - `map.getSize()`
  - `map.getBounds()`
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
  - `L.DomUtil.setPosition(canvas, topLeft)`
- per-layer viewport factory reads:
  - zones: `map.getZoom()` and per-coordinate `map.latLngToLayerPoint(...)`
  - buildings: `map.getZoom()` and per-coordinate `map.latLngToLayerPoint(...)`
  - roads: `map.getZoom()` and per-coordinate `map.latLngToLayerPoint(...)`
  - trees: `map.getZoom()` and per-coordinate `map.latLngToLayerPoint(...)`
  - landmarks: per-coordinate `map.latLngToLayerPoint(...)`

So the migration achieved injected helper rendering, but not one single frame-root viewport snapshot for every needed value.

## Remaining active global-map reads

### FRAME_ROOT_READ_ACCEPTABLE

Active frame-root draw still owns:

1. `drawCustom25DMapCanvas(canvas)`
   - `const size = map.getSize();`
   - `const bounds = map.getBounds();`
   - `const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());`
   - `L.DomUtil.setPosition(canvas, topLeft);`

Reason:

- these are still the active root frame setup reads
- Canvas sizing and positioning remain intentionally owned by the frame-root draw

### ACTIVE_UNMIGRATED_READ

Active per-layer viewport factories still read live zoom:

1. `createCustom25DZonesLiveViewportProjection(bounds, topLeft)`
   - `const frozenZoom = map.getZoom();`
2. `createCustom25DBuildingsLiveViewportProjection(bounds, topLeft)`
   - `const frozenZoom = map.getZoom();`
3. `createCustom25DRoadsLiveViewportProjection(bounds, topLeft)`
   - `const frozenZoom = map.getZoom();`
4. `createCustom25DTreesLiveViewportProjection(bounds, topLeft)`
   - `const frozenZoom = map.getZoom();`

Reason:

- the active layers are migrated away from direct map reads inside injected draw helpers
- but zoom ownership is still duplicated across layer factories instead of being centralized once per frame

### FRAME_ROOT_READ_ACCEPTABLE

Active viewport factories still perform injected live projection through the map:

1. zones factory
   - `const point = map.latLngToLayerPoint([latitude, longitude]);`
2. buildings factory
   - `const point = map.latLngToLayerPoint([latitude, longitude]);`
3. roads factory
   - `const point = map.latLngToLayerPoint([latitude, longitude]);`
4. trees factory
   - `const point = map.latLngToLayerPoint([latitude, longitude]);`
5. landmarks factory
   - `const point = map.latLngToLayerPoint([latitude, longitude]);`

Reason:

- these reads are now contained behind injected viewport projection seams
- the migrated draw helpers no longer call `map.latLngToLayerPoint(...)` directly
- projection is still live-map backed, but it is no longer spread through the draw logic itself

### LEGACY_UNUSED_READ

Legacy direct-map draw functions still contain unused active-path reads:

- `drawCustom25DZones(...)`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DBuildings(...)`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DRoads(...)`
  - `map.getZoom()`
  - `map.latLngToLayerPoint([lat, lng])`
- `drawCustom25DTrees(...)`
  - `map.getZoom()`
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
  - legacy projected point path
- `renderCustomLandmarkLayer(...)`
  - `map.latLngToLayerPoint([marker.lat, marker.lng])`

Reason:

- these functions remain preserved as source-lock anchors only
- the active live draw path no longer routes through them

### STARTUP_ONLY_READ

Startup and lifecycle reads remain outside the draw helper path:

1. `initCustom25DMapExperiment()`
   - `map.createPane("custom25DMapPane")`
   - `map.getPane("custom25DMapPane")`
   - `map.on("moveend zoomend", redraw)`
2. `syncCustom25DMapPresentation()`
   - `map.getContainer()`
   - `map.getPane("tilePane")`
   - `map.getPane("overlayPane")`

Reason:

- these are startup/lifecycle ownership reads
- they are not newly introduced by the layer migrations
- listener behavior and `custom25DMapLayer` ownership remain unchanged

### MIGRATED_HELPER_READ_REMOVED

Direct map reads were removed from the active injected draw helpers themselves:

- `drawCustom25DZonesViewportInjected(...)`
- `drawCustom25DBuildingsViewportInjected(...)`
- `drawCustom25DRoadsViewportInjected(...)`
- `drawCustom25DTreesViewportInjected(...)`
- `drawCustom25DLandmarksViewportInjected(...)`

Confirmed removed from those helpers:

- direct `map.getZoom()`
- direct `map.latLngToLayerPoint(...)`
- tree helper north-west re-read
- landmark helper top-left subtraction

## Frame model result

### Does the active draw path now have one frame-root viewport read plus injected helper projections?

Not yet.

Current state:

- frame root owns `size`, `bounds`, `topLeft`, Canvas positioning, and Canvas sizing
- each migrated layer factory still freezes its own zoom from the live map
- each migrated layer factory still exposes live per-coordinate projection via injected viewport functions

So the active path is **contained**, but not yet fully centralized into one single frame-root viewport snapshot.

## Helper bypass check

No active injected draw helper bypasses the viewport model.

Confirmed:

- active injected draw helpers contain no direct `map.getZoom()`
- active injected draw helpers contain no direct `map.latLngToLayerPoint(...)`
- active tree injected draw logic performs no independent north-west re-read
- active landmark injected draw logic keeps raw layer-point behavior and does not subtract top-left

## Repeated per-frame reads

Yes, repeated live-map reads still occur inside one active frame.

Repeated active reads include:

- root frame:
  - one `map.getSize()`
  - one `map.getBounds()`
  - one north-west `map.latLngToLayerPoint(...)`
- layer factories:
  - four `map.getZoom()` reads per frame
- per-feature projection:
  - many `map.latLngToLayerPoint(...)` calls across zones, buildings, roads, trees, and landmarks as features are projected

Important distinction:

- these repeated reads are now concentrated in viewport factories
- they are no longer scattered through the migrated draw helpers themselves

## Canvas sizing and positioning ownership

Still owned by `drawCustom25DMapCanvas(canvas)`.

Preserved exactly:

- `canvas.width`
- `canvas.height`
- `canvas.style.width`
- `canvas.style.height`
- `L.DomUtil.setPosition(canvas, topLeft)`

## Top-left, bounds, and zoom re-read audit

- top-left:
  - frame root reads north-west once
  - active callsites pass `topLeft` into zones, buildings, roads, and trees
  - source-level fallback re-read remains in the factories, but active callsites supply `topLeft`, so the fallback is not active in the current path
- bounds:
  - frame root reads `map.getBounds()` once
  - factories reuse the passed `bounds` snapshot
  - no helper re-reads bounds from `map`
- zoom:
  - still re-read once in each of the four zoomed layer factories
  - landmarks do not read zoom

## Startup, listener, and ownership audit

Remained unchanged:

- `custom25DMapLayer` retention slot
- `initCustom25DMapExperiment()`
- pane creation and pane lookup
- `map.on("moveend zoomend", redraw)`
- redraw ownership

No new listener, timer, polling, startup call, or browser command was introduced.

## Classification

`BLOCKED_BY_FRAME_ROOT_READ_DUPLICATION`

Reason:

- active injected layer helpers are migrated and no longer directly read the map
- but zoom ownership is still duplicated across four per-layer viewport factories
- the live draw path therefore does not yet have one single frame-root viewport snapshot owner

## Next smallest safe phase

Extract one narrow frame-root viewport snapshot object that owns:

- `size`
- `bounds`
- `topLeft`
- `zoom`

Then feed that single frozen snapshot into the migrated layer viewport adapters without changing visuals, ordering, or startup behavior.

## Files changed

- `tests/client-growgo-custom25d-draw-path-global-map-dependency-audit.test.mjs`
- `GROWGO_SESSION_211_40_CUSTOM25D_DRAW_PATH_GLOBAL_MAP_DEPENDENCY_AUDIT.md`

## Tests

Focused audit test added:

- `tests/client-growgo-custom25d-draw-path-global-map-dependency-audit.test.mjs`

Focused regression band:

- Phase 211.22–211.39 relevant regressions

Result:

- passed: `159`
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
- browser activation exposed: no

## Commit

YES

## Suggested commit message

`test(atlas): audit custom25d draw path map dependencies`
