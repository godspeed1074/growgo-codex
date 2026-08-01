# GROWGO SESSION 211.21 — CUSTOM 2.5D INITIALIZATION SURFACE EXTRACTION PLAN

## Goal

Plan the smallest safe extraction of GrowGo’s custom 2.5D renderer startup into narrow future operations that can support a reversible one-frame Atlas session.

This phase is planning and passive validation only:

- no `script.js` changes
- no live renderer activation
- no Canvas creation
- no pane creation
- no listener registration
- no draw

Do not call:

- `initCustom25DMapExperiment()`
- `drawCustom25DMapCanvas(canvas)`

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial `git status --short`:
  - clean
- accepted Phase 211.20 checkpoint:
  - `39384d6`
- checkpoint title:
  - `feat(atlas): add custom25d renderer lifecycle owner contract`
- focused Phase 211.18 one-frame activation-contract tests:
  - `PASS`
- focused Phase 211.19 passive adapter tests:
  - `PASS`
- focused Phase 211.20 lifecycle-owner tests:
  - `PASS`
- relevant renderer safety regressions:
  - `PASS`

## Current Initializer

Live initializer:

- `initCustom25DMapExperiment()`

Current bundled responsibilities:

- Leaflet pane creation
- Canvas creation and append
- Canvas sizing and positioning through the draw path
- redraw closure creation
- `moveend zoomend` listener registration
- `custom25DMapLayer` retention write
- immediate call to `drawCustom25DMapCanvas(canvas)`

Current side effects:

- creates `custom25DMapPane`
- appends a `custom-25d-map-canvas`
- captures a closure around the exact Canvas instance
- registers a continuous redraw listener on the live map
- writes global retained state into `custom25DMapLayer`
- draws immediately using global `map` and feature state

Current cleanup gap:

- no verified cleanup exists inside the current live path
- no verified exact `map.off("moveend zoomend", redraw)` in the owner path
- no verified exact Canvas removal in the owner path
- no verified `custom25DMapLayer = null` reset in the owner path

## Confirmed Live Ownership Identities

- initializer:
  - `initCustom25DMapExperiment()`
- draw entry:
  - `drawCustom25DMapCanvas(canvas)`
- retention slot:
  - `custom25DMapLayer`
- pane:
  - `custom25DMapPane`
- Canvas class:
  - `custom-25d-map-canvas`
- listener events:
  - `moveend zoomend`
- redraw closure:
  - `const redraw = () => drawCustom25DMapCanvas(canvas);`
- renderer feature flag:
  - `ENABLE_CUSTOM_25D_MAP`

## Proposed Extraction

### 1. Surface preparation

Suggested future interface:

```js
prepareCustom25DOneFrameSurface({
  map,
  paneName
})
```

Responsibility:

- validate map
- locate or create the exact renderer pane
- create one renderer Canvas
- size and position the Canvas
- return owned surface resources
- perform no drawing
- add no listener
- write no global retention slot

Inputs:

- exact Leaflet map
- pane name
- optional Canvas class name if later needed

Returned resources:

- pane handle
- canvas handle
- computed size/position metadata
- ownership-neutral cleanup bundle seed

Side effects:

- pane lookup or creation only
- one Canvas creation only
- no retention write
- no draw
- no listener

Cleanup owner:

- Phase 211.20 lifecycle owner

Failure behavior:

- if pane creation or Canvas creation fails, rollback the partial surface immediately
- return fail-closed result

### 2. One-frame drawing

Suggested future interface:

```js
drawCustom25DOneFrame({
  canvas
})
```

Responsibility:

- accept only the prepared Canvas
- call the existing drawing logic exactly once
- add no listeners
- perform no retention write
- create no additional surface

Inputs:

- prepared Canvas
- exact global draw dependencies passed or wrapped explicitly

Returned resources:

- one-frame draw result

Side effects:

- one draw only
- no new surface
- no listener
- no retention write

Cleanup owner:

- Phase 211.20 lifecycle owner after draw completion or failure

Failure behavior:

- failed draw requires mandatory cleanup
- no retry in the same activation

### 3. Continuous redraw registration

Suggested future interface:

```js
registerCustom25DContinuousRedraw({
  map,
  canvas
})
```

Responsibility:

- create the redraw callback
- register `moveend zoomend`
- return the exact listener identity
- stay separate from one-frame activation

Inputs:

- exact live map
- exact live Canvas

Returned resources:

- redraw callback identity
- event names
- listener registration result

Side effects:

- listener registration only
- no immediate draw
- no retention write by itself

Cleanup owner:

- Phase 211.20 lifecycle owner

Failure behavior:

- failed registration rolls back any partial retained resources

### 4. Retention registration

Suggested future interface:

```js
retainCustom25DRendererResources({
  canvas,
  redraw,
  pane,
  lifecycleOwner
})
```

Responsibility:

- write the approved resource bundle into `custom25DMapLayer`
- occur only after all resource creation succeeds
- use one exact structured retained owner

Inputs:

- pane
- canvas
- redraw callback
- lifecycle owner reference

Returned resources:

- retained resource summary

Side effects:

- one exact global retention write

Cleanup owner:

- Phase 211.20 lifecycle owner

Failure behavior:

- retention write failure triggers mandatory rollback of prepared resources

### 5. Exact cleanup

Suggested future interface:

```js
disposeCustom25DRendererResources()
```

Responsibility:

- delegate to the Phase 211.20 lifecycle owner
- remove exact listener identity
- remove exact Canvas
- reset exact retention slot
- apply the documented pane-removal rule
- remain idempotent

Inputs:

- none at call site once resources are retained

Returned resources:

- structured cleanup result

Side effects:

- exact listener removal
- exact Canvas removal
- exact retention reset
- optional exact pane removal when ownership is proven and safe

Cleanup owner:

- Phase 211.20 lifecycle owner

Failure behavior:

- cleanup continues safely after partial failure
- final status stays fail-closed

## Design Decisions

- pane should be reused or temporarily created:
  - reuse the exact renderer pane identity if already present; otherwise create it explicitly during surface preparation only
- temporary one-frame Canvas should use the existing class:
  - yes, `custom-25d-map-canvas`, to preserve renderer styling assumptions without changing live semantics
- one-frame surface should be added to the existing pane:
  - yes, but only through the extracted surface-preparation step
- Canvas size and Leaflet position should be calculated:
  - from `map.getSize()`, `map.getBounds()`, `map.latLngToLayerPoint(bounds.getNorthWest())`, and `L.DomUtil.setPosition(canvas, topLeft)`
- drawing reads global map state:
  - yes; the current draw path reads `map`, bounds, feature globals, and browser canvas state
- dependencies that must be injected into the extracted draw operation:
  - map access
  - bounds and layer-point projection access
  - `window.devicePixelRatio`
  - `L.DomUtil.setPosition`
  - downstream drawing helpers already called by `drawCustom25DMapCanvas(canvas)`
- how the current draw function can remain unchanged initially:
  - keep `drawCustom25DMapCanvas(canvas)` intact and wrap it later in a narrow one-frame draw seam
- how cleanup removes the exact surface:
  - through the lifecycle owner’s exact listener/canvas/retention cleanup bundle
- when `custom25DMapLayer` should and should not be written:
  - should be written only in the continuous retained path after all resources exist
  - should not be written in one-frame preparation or one-frame drawing
- how to avoid duplicate panes or Canvases:
  - surface preparation must check for the exact owned pane/canvas before creating any new surface
- how a failed preparation is rolled back:
  - exact owned partial surface is cleaned immediately before returning failure
- how a failed draw is cleaned up:
  - lifecycle cleanup becomes mandatory immediately after draw failure
- how the future live adapter will receive the extracted operations:
  - as injected operations from the extracted preparation/draw/cleanup seams, not by importing `script.js` globals directly

## Source-Locked Extraction Plan

### Surface preparation extraction

- source file:
  - `script.js`
- current owner:
  - `initCustom25DMapExperiment()`
- logic to move:
  - pane lookup/creation
  - Canvas creation
  - initial surface handle creation
- logic to leave in place:
  - live feature flag check
  - continuous retained renderer orchestration until later phase
- new proposed function:
  - `prepareCustom25DOneFrameSurface({ map, paneName })`
- inputs:
  - map
  - pane name
- returned resources:
  - pane
  - canvas
  - size/position seed
- side effects:
  - pane and Canvas creation only
- cleanup owner:
  - lifecycle owner
- failure behavior:
  - rollback partial surface
- tests required:
  - surface preparation creates one owned Canvas only
  - no listener registration
  - rollback on partial failure

### One-frame draw extraction

- source file:
  - `script.js`
- current owner:
  - `drawCustom25DMapCanvas(canvas)`
- logic to move:
  - exact one-frame draw call seam only
- logic to leave in place:
  - existing draw body initially
- new proposed function:
  - `drawCustom25DOneFrame({ canvas })`
- inputs:
  - canvas
- returned resources:
  - draw result
- side effects:
  - one draw only
- cleanup owner:
  - lifecycle owner after draw
- failure behavior:
  - cleanup mandatory on failure
- tests required:
  - one draw only
  - no listener registration
  - cleanup after failure

### Continuous listener extraction

- source file:
  - `script.js`
- current owner:
  - `initCustom25DMapExperiment()`
- logic to move:
  - redraw closure creation
  - `map.on("moveend zoomend", redraw)`
- logic to leave in place:
  - none for one-frame path
- new proposed function:
  - `registerCustom25DContinuousRedraw({ map, canvas })`
- inputs:
  - map
  - canvas
- returned resources:
  - redraw callback
  - event names
- side effects:
  - continuous listener registration only
- cleanup owner:
  - lifecycle owner
- failure behavior:
  - fail closed with cleanup
- tests required:
  - exact listener identity returned
  - one-frame path stays listener-free

### Retention extraction

- source file:
  - `script.js`
- current owner:
  - `initCustom25DMapExperiment()`
- logic to move:
  - `custom25DMapLayer = { canvas, redraw };`
- logic to leave in place:
  - downstream retained redraw consumers until later live refactor
- new proposed function:
  - `retainCustom25DRendererResources({ canvas, redraw, pane, lifecycleOwner })`
- inputs:
  - canvas
  - redraw
  - pane
  - lifecycle owner
- returned resources:
  - retained owner bundle
- side effects:
  - one exact global retention write
- cleanup owner:
  - lifecycle owner
- failure behavior:
  - rollback owned resources
- tests required:
  - retention written only after success
  - no one-frame retention write

### Cleanup extraction

- source file:
  - separate passive lifecycle owner module already created
- current owner:
  - no verified live owner in `script.js`
- logic to move:
  - none yet; future live path should delegate here
- logic to leave in place:
  - current live initializer unchanged
- new proposed function:
  - `disposeCustom25DRendererResources()`
- inputs:
  - lifecycle owner retained bundle
- returned resources:
  - structured cleanup result
- side effects:
  - exact listener removal
  - exact Canvas removal
  - exact retention reset
  - optional pane removal when safe
- cleanup owner:
  - lifecycle owner
- failure behavior:
  - continue safely after one failure
- tests required:
  - idempotent cleanup
  - partial-failure reporting
  - unrelated resource preservation

## Dependency Order

Exact future activation sequence:

1. Atlas readiness
2. renderer authorization
3. one-frame activation contract
4. live renderer adapter
5. surface preparation
6. one-frame draw
7. lifecycle cleanup

Authorization-consumption point:

- consume only after readiness, authorization, renderer identity, and second readiness validation all succeed
- consume immediately before future surface preparation begins

Mandatory-cleanup point:

- cleanup becomes mandatory immediately after successful surface creation
- cleanup also becomes mandatory after any draw failure

## Risks And Smallest Mitigations

- renderer drawing reads global `map`
  - mitigation:
    - keep draw extraction narrow and explicitly document the global dependency before implementation
- Canvas size depends on map container
  - mitigation:
    - compute size only in extracted surface-preparation step
- Canvas position depends on Leaflet layer-point conversion
  - mitigation:
    - keep projection and positioning together inside surface preparation
- pane creation may persist after cleanup
  - mitigation:
    - use lifecycle owner’s exact pane-removal rule only when ownership is proven and pane is empty
- drawing may clear or mutate Canvas
  - mitigation:
    - cleanup must own the exact Canvas after first draw attempt
- repeated initialization may create duplicates
  - mitigation:
    - surface preparation must block duplicate owned surfaces
- current initializer draws immediately
  - mitigation:
    - split immediate draw out of initialization before any live adapter integration
- current initializer registers continuous listeners
  - mitigation:
    - separate continuous redraw registration from one-frame path
- retention is global
  - mitigation:
    - move retention write behind explicit extracted boundary
- failures may leave orphaned DOM resources
  - mitigation:
    - make cleanup mandatory after successful surface creation
- cleanup may occur after partial preparation
  - mitigation:
    - require rollback-safe partial cleanup in surface preparation

## Required Closeout Classification

- `INITIALIZATION_EXTRACTION_PLAN_READY`

Reason:

- the extraction boundaries are now source-locked, deterministic, and test-protected
- the next step is no longer discovery; it is the first narrow implementation split of live surface preparation from the all-in-one initializer

Next required implementation phase:

- extract a passive `prepareCustom25DOneFrameSurface()` helper from the live initializer without changing runtime behavior

## Files Changed

- [GROWGO_SESSION_211_21_CUSTOM25D_INITIALIZATION_SURFACE_EXTRACTION_PLAN.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_21_CUSTOM25D_INITIALIZATION_SURFACE_EXTRACTION_PLAN.md)
- [tests/client-custom25d-initialization-surface-extraction-plan.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-custom25d-initialization-surface-extraction-plan.test.mjs)

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- script.js changed:
  - `no`
- real renderer invoked:
  - `no`
- real Canvas created:
  - `no`
- real pane created:
  - `no`
- real listener added:
  - `no`
- `custom25DMapLayer` mutated:
  - `no`
- real draw called:
  - `no`
- browser activation exposed:
  - `no`
