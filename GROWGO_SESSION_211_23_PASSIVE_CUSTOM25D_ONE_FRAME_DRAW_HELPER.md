# GROWGO SESSION 211.23 — PASSIVE CUSTOM25D ONE-FRAME DRAW HELPER

## Goal

Build the smallest fake-only one-frame draw doorway for GrowGo’s custom 2.5D renderer path.

This phase stayed passive:

- no `script.js` changes
- no real renderer invocation
- no real draw call
- no live DOM creation
- no pane creation
- no listener registration
- no `custom25DMapLayer` mutation

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial `git status --short`:
  - clean
- accepted Phase 211.22 checkpoint:
  - `b6531d0`
- checkpoint acceptance:
  - accepted by verified content despite inaccurate commit message
- verified Phase 211.22 files present:
  - `client/developer-only-growgo-custom25d-one-frame-surface-preparation.mjs`
  - `tests/client-developer-only-growgo-custom25d-one-frame-surface-preparation.test.mjs`
  - `GROWGO_SESSION_211_22_PASSIVE_CUSTOM25D_ONE_FRAME_SURFACE_PREPARATION_HELPER.md`
- focused Phase 211.22 tests:
  - `PASS`
- Phase 211.18 through 211.22 regression pack:
  - `PASS`

## Source Discovery

The live `script.js` draw path remains source-locked and passive-inspected only.

Confirmed draw dependencies:

- draw entry:
  - `drawCustom25DMapCanvas(canvas)`
- global map guard:
  - `if (!ENABLE_CUSTOM_25D_MAP || !map || !canvas) return;`
- size dependency:
  - `map.getSize()`
- bounds dependency:
  - `map.getBounds()`
- top-left layer point dependency:
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
- DOM position dependency:
  - `L.DomUtil.setPosition(canvas, topLeft)`
- style dependency:
  - `window.devicePixelRatio`
- Canvas context dependency:
  - `canvas.getContext("2d")`
- clear dependency:
  - `ctx.clearRect(...)`
- helper fanout:
  - `drawCustom25DBackground`
  - `drawCustom25DZones`
  - `drawCustom25DBuildings`
  - `drawCustom25DRoads`
  - `drawCustom25DTrees`
  - `drawCustom25DLandmarkFoundation`

These findings were recorded without executing the live renderer.

## Created Helper

- module:
  - `client/developer-only-growgo-custom25d-one-frame-draw.mjs`
- exported factory:
  - `createDeveloperOnlyCustom25DOneFrameDraw(...)`
- exported source-lock inspector:
  - `inspectGrowGoCustom25DOneFrameDrawSourceLock(...)`

The helper remains disconnected from:

- `script.js`
- `drawCustom25DMapCanvas()`
- `initCustom25DMapExperiment()`
- `custom25DMapLayer`
- the Phase 211.18 activation contract
- the Phase 211.19 passive adapter
- the Phase 211.20 lifecycle owner
- any browser interface

## Successful Fake Draw

Validated fake one-frame draw now proves:

- one explicit draw request accepted
- prepared surface descriptor validated
- exact pane identity required
- exact Canvas identity required
- exact Canvas class required:
  - `custom-25d-map-canvas`
- exactly one fake draw attempt recorded
- exactly one fake draw operation invoked
- exactly one completed frame recorded
- cleanup remains mandatory after the draw
- helper permanently closes after the first completed frame
- second draw is blocked
- no map or Canvas reference is retained

Successful fake-draw truth:

- draw attempts:
  - `1`
- completed frames:
  - `1`
- draw completed:
  - `true`
- draw failed:
  - `false`
- cleanup required:
  - `true`
- lifecycle cleanup required:
  - `true`
- permanently closed:
  - `true`
- second draw blocked on next call:
  - `true`

## Failure And Exception Results

Blocked before draw:

- invalid surface descriptor
- unsuccessful surface preparation
- invalid pane identity
- Canvas not created
- Canvas not appended
- cleanupRequired false
- listenerAdded true
- retentionWritten true
- missing Canvas
- Canvas identity mismatch
- incorrect Canvas class
- missing draw operation

Failure behavior:

- returned draw failure:
  - drawAttemptCount = `1`
  - completedFrameCount = `0`
  - drawFailed = `true`
  - cleanup remains mandatory
  - helper permanently closes
  - no retry
- thrown draw exception:
  - structured fail-closed result returned
  - precise reason code preserved
  - drawAttemptCount = `1`
  - completedFrameCount = `0`
  - cleanup remains mandatory
  - helper permanently closes
  - no retry

## Classification

- exact classification:
  - `ONE_FRAME_DRAW_HELPER_READY`
- reason:
  - the fake-only one-frame draw seam now proves validation, single-attempt draw execution, one-frame completion, fail-closed blocking, immutable reporting, and permanent closure without touching the real renderer path
- next smallest integration step:
  - add the smallest passive cleanup handoff seam that accepts a completed draw result and proves cleanup delegation boundaries without calling live cleanup

## Tests

- new focused Phase 211.23 draw-helper tests:
  - `9 passed`
  - `0 failed`
- Phase 211.18 through 211.22 regressions:
  - `47 passed`
  - `0 failed`

Focused coverage included:

- import has no side effects
- initial idle state
- one valid fake draw success
- one draw attempt only
- one completed frame only
- permanent close after draw
- second draw blocked
- invalid surface and Canvas fail-closed cases
- returned failure closeout
- thrown exception closeout
- deep immutability
- no retained map or Canvas references
- no real renderer hook or browser exposure
- canonical safety flags remain false

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- `script.js` changed:
  - no
- real renderer invoked:
  - no
- real Canvas created:
  - no
- real pane created:
  - no
- listener added:
  - no
- draw called:
  - no
- `custom25DMapLayer` mutated:
  - no
- browser activation exposed:
  - no

## Files Changed

- `client/developer-only-growgo-custom25d-one-frame-draw.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-draw.test.mjs`
- `GROWGO_SESSION_211_23_PASSIVE_CUSTOM25D_ONE_FRAME_DRAW_HELPER.md`
