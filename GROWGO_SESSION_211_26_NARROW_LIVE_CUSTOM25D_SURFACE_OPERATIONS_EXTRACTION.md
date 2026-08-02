# GROWGO SESSION 211.26 — NARROW LIVE-CAPABLE CUSTOM 2.5D SURFACE OPERATIONS EXTRACTION

## Phase

- Phase: `211.26`
- Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

## Preflight

- Exact branch confirmed.
- Initial `git status --short` was clean.
- Phase 211.25 checkpoint verification method:
  - exact commit title verification
- Confirmed Phase 211.25 commit:
  - `a0e4b4e feat(atlas): coordinate passive authorized one-frame session`
- Verified checkpoint contents:
  - `client/developer-only-atlas-custom25d-one-frame-session-coordinator.mjs`
  - `tests/client-developer-only-atlas-custom25d-one-frame-session-coordinator.test.mjs`
  - `GROWGO_SESSION_211_25_PASSIVE_AUTHORIZED_ATLAS_ONE_FRAME_SESSION_COORDINATOR.md`
- History remained unchanged.
- Focused Phase 211.22 through 211.25 tests passed before closeout.

## Files Changed

- `client/growgo-custom25d-live-one-frame-surface-operations.mjs`
- `tests/client-growgo-custom25d-live-one-frame-surface-operations.test.mjs`
- `GROWGO_SESSION_211_26_NARROW_LIVE_CUSTOM25D_SURFACE_OPERATIONS_EXTRACTION.md`

## Implemented Extraction

Created a narrow live-capable surface operations module that matches the real Leaflet and DOM preparation shape while staying fully disconnected from:

- `script.js` startup
- `initCustom25DMapExperiment()`
- `drawCustom25DMapCanvas(canvas)`
- `custom25DMapLayer`
- developer browser diagnostics
- the passive session coordinator
- any live map event or player pathway

It is live-capable in surface shape only, and was tested exclusively with injected fake Leaflet, map, pane, Canvas, and DOM objects.

## Live-Capable Surface Operation

- Pane behavior:
  - validates exact pane name `custom25DMapPane`
  - reuses a valid existing pane
  - creates exactly one pane when missing
  - marks reused pane as not owned
  - marks created pane as owned by the operation

- Canvas behavior:
  - creates exactly one Canvas with class `custom-25d-map-canvas`
  - appends only to the approved pane
  - writes no renderer retention and adds no listeners

- Logical size:
  - derived from one `map.getSize()` read
  - CSS width and height match logical map size exactly

- Backing size:
  - scales by validated device pixel ratio
  - defaults safely to `1` when invalid

- Pixel ratio:
  - validated and normalized in the new surface helper
  - documented mismatch:
    - current live renderer still resizes the Canvas again inside `drawCustom25DMapCanvas()`

- Position:
  - derived from one `map.getBounds()` read
  - one `getNorthWest()` read
  - one `map.latLngToLayerPoint(...)` conversion
  - one `L.DomUtil.setPosition(...)` application

- Cleanup requirement:
  - always `true` once a Canvas is created

- Retained-reference behavior:
  - no module-level map reference
  - no module-level pane reference
  - no module-level Canvas reference
  - caller exclusively owns the returned raw surface bundle
  - public snapshots remain immutable and reference-free

## Rollback

- Canvas removal:
  - exact prepared Canvas removal attempted on rollback
  - original failure reason preserved

- Pane preservation/removal:
  - reused pane is never removed
  - newly created pane may be removed only when owned and empty

- Unrelated-resource preservation:
  - unrelated pane contents are preserved
  - unrelated pane ownership is preserved

- Rollback-failure result:
  - precise rollback failure reasons are surfaced
  - rollback attempt and completion state are reported explicitly

## Source-Lock Verification

Confirmed passively in `script.js`:

- `custom25DMapPane`
- `custom-25d-map-canvas`
- `L.DomUtil.create("canvas", ...)`
- `L.DomUtil.setPosition(canvas, ...)`
- `map.getSize()`
- `map.getBounds()`
- `map.latLngToLayerPoint(...)`
- `initCustom25DMapExperiment()`
- `drawCustom25DMapCanvas(canvas)`
- `custom25DMapLayer`

Observed mismatch, documented intentionally:

- the new operation performs initial logical-size and backing-size preparation
- the current live draw function still performs resize and pixel-ratio transform again during draw

## Classification

- Exact classification:
  - `LIVE_SURFACE_OPERATIONS_READY_FOR_GATED_INTEGRATION`
- Reason:
  - the new module can prepare and roll back one exact Leaflet-shaped Canvas surface using fake injected live dependencies, while remaining fully disconnected and uninvoked by the real application
- Next smallest safe step:
  - `211.27 — Narrow Live Draw Operation Extraction`

## Tests

- New Phase 211.26 focused tests passed: `7`
- Phase 211.22 through 211.25 regressions passed: `39`
- Failed: `0`

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed unchanged:

- `script.js` changed: `no`
- live map touched: `no`
- real Canvas created: `no`
- real pane created: `no`
- real DOM changed: `no`
- listener added: `no`
- real draw called: `no`
- `custom25DMapLayer` mutated: `no`
- browser activation exposed: `no`

## Closeout

- Status: `PASS`
- Commit recommendation: `YES`
- Suggested commit message:
  - `feat(atlas): extract narrow live-capable custom25d surface operations`
