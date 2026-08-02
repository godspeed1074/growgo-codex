Phase 211.46 — Snapshot-Aware Custom 2.5D Draw Seam Extraction

Status: PASS

Date:
- Sunday, August 2, 2026

ELI5:
- We split the real custom 2.5D draw path into two pieces: one piece still grabs the live map snapshot, and the new piece draws from that already-made snapshot.
- That means a future one-frame adapter can hand in a prepared surface and a prepared snapshot without forcing the draw path to reread the map again.
- The live startup path still behaves the same, and nothing live was activated in this phase.

Branch:
- exact branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status:
  - clean
- final git status:
  - `?? GROWGO_SESSION_211_46_SNAPSHOT_AWARE_CUSTOM25D_DRAW_SEAM_EXTRACTION.md`
  - `M script.js`
  - `M tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
  - `M tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
  - `?? tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs`

Checkpoint:
- Phase 211.45 verification method:
  - exact commit title
- verified commit:
  - `4e5117f docs(atlas): review developer-only live one-frame adapter`
- whether history remained unchanged:
  - yes

Accepted Phase 211.45 classification:
- `BLOCKED_BY_FRAME_SNAPSHOT_COUPLING`

Preflight regression band:
- focused Phase 211.18–211.45 band:
  - passed: `204`
  - failed: `0`

Extraction:
- old draw responsibilities:
  - `drawCustom25DMapCanvas(canvas)` previously did all of the following:
    - live map validation/read-through
    - centralized frame snapshot creation
    - Canvas position application
    - Canvas backing/logical size application
    - context acquisition
    - context transform
    - clearRect
    - active layer draw order fanout
- new frame-snapshot responsibilities:
  - `createCustom25DFrameViewportSnapshot({ map, canvas })` still owns:
    - `map.getSize()`
    - `map.getBounds()`
    - `bounds.getNorthWest()`
    - `map.latLngToLayerPoint(northWestCoordinate)`
    - `map.getZoom()`
    - `window.devicePixelRatio`
    - immutable snapshot creation
- new snapshot-aware draw responsibilities:
  - `drawCustom25DMapCanvasWithFrameSnapshot({ canvas, frameViewportSnapshot })` now owns:
    - supplied snapshot validation
    - Canvas position application from validated snapshot
    - Canvas backing/logical size application from validated snapshot
    - context acquisition
    - context transform
    - clearRect
    - preserved active layer draw order
    - fail-closed invalid snapshot handling
- Canvas sizing ownership:
  - snapshot-aware draw seam
  - reason:
    - preserves existing live draw behavior exactly
    - future adapter can still hand in an already-created snapshot and let the seam apply authoritative frame-local sizing
- Canvas positioning ownership:
  - snapshot-aware draw seam
  - reason:
    - preserves existing live draw behavior exactly
    - uses `frameViewportSnapshot.canvasLayerPosition` only
- context ownership:
  - snapshot-aware draw seam
  - reason:
    - keeps context setup, transform, clear, and layer fanout in one place
- layer order preservation:
  - preserved exactly:
    1. `drawCustom25DBackground(ctx, size, bounds)`
    2. `drawCustom25DZonesLiveCallsite(ctx, bounds, topLeft)`
    3. `drawCustom25DBuildingsLiveCallsite(ctx, bounds, topLeft)`
    4. `drawCustom25DRoadsLiveCallsite(ctx, bounds, topLeft)`
    5. `drawCustom25DTreesLiveCallsite(ctx, bounds, topLeft)`
    6. `renderCustomLandmarkLayerLiveCallsite(ctx, bounds)`

What changed in source:
- `drawCustom25DMapCanvas(canvas)` still:
  - exists
  - creates one centralized frame snapshot
  - remains the live entry
  - keeps startup behavior unchanged
  - delegates actual frame drawing to the new seam
- new internal seam:
  - `drawCustom25DMapCanvasWithFrameSnapshot({ canvas, frameViewportSnapshot })`
- new validation helper:
  - `normalizeCustom25DFrameViewportSnapshotForDraw(frameViewportSnapshot)`

Snapshot validation now requires:
- `logicalWidth`
- `logicalHeight`
- `backingWidth`
- `backingHeight`
- `devicePixelRatio`
- `bounds`
- `northWestCoordinate`
- `canvasLayerPosition`
- `zoom`

Validation behavior:
- finite positive dimensions required
- finite positive device pixel ratio required
- finite zoom required
- valid `north/south/east/west` bounds required
- valid finite Canvas layer position required
- invalid snapshot fails closed
- no fallback live map reads occur
- no silent snapshot rebuild occurs inside the seam

Files changed:
- `script.js`
- `tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs`
- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `GROWGO_SESSION_211_46_SNAPSHOT_AWARE_CUSTOM25D_DRAW_SEAM_EXTRACTION.md`

Classification:
- exact classification:
  - `SNAPSHOT_AWARE_DRAW_SEAM_READY`
- reason:
  - the existing live draw entry now delegates to a new snapshot-aware seam
  - the new seam accepts a supplied immutable frame snapshot
  - the new seam performs no direct live map reads or `window.devicePixelRatio` reads
  - layer order and active migrated layer behavior stayed intact
  - the full focused regression band stayed green
- next smallest safe phase:
  - `211.47 — Developer-Only Live One-Frame Adapter Implementation`

Tests:
- focused Phase 211.46 seam tests:
  - passed: `11`
  - failed: `0`
- focused Phase 211.18–211.46 regression band:
  - passed: `209`
  - failed: `0`

Safety:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- renderer enabled:
  - no
- live renderer invoked:
  - no
- real Canvas created:
  - no
- real pane created:
  - no
- listener added:
  - no
- `custom25DMapLayer` changed:
  - no
- browser activation exposed:
  - no

Commit:
- YES

Suggested commit message:
- `refactor(atlas): extract snapshot-aware custom25d draw seam`

Next phase:
- `211.47 — Developer-Only Live One-Frame Adapter Implementation`
