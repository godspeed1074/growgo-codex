# GROWGO SESSION 211.20 — CUSTOM 2.5D RENDERER CLEANUP OWNERSHIP EXTRACTION

## Goal

Extract the passive ownership and cleanup contract for GrowGo’s custom 2.5D renderer so a future renderer surface can be cleaned up exactly once without touching unrelated map resources.

This phase remains passive:

- no `script.js` changes
- no live renderer initialization
- no draw
- no real Canvas
- no real Leaflet pane
- no live listeners

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- accepted Phase 211.19 checkpoint:
  - `b4fff4a`
- checkpoint title:
  - `feat(atlas): add passive custom 2.5D one-frame adapter contract`
- Phase 211.18–211.19 focused tests:
  - `PASS`

## Source-Locked Renderer Ownership Inspection

Exact current ownership points found in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js):

- retention slot:
  - `let custom25DMapLayer = null;`
- initialization entry:
  - `function initCustom25DMapExperiment()`
- draw entry:
  - `function drawCustom25DMapCanvas(canvas)`
- pane name:
  - `custom25DMapPane`
- Canvas creation point:
  - `L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)`
- listener closure identity:
  - `const redraw = () => drawCustom25DMapCanvas(canvas);`
- event registration:
  - `map.on("moveend zoomend", redraw);`
- retention write:
  - `custom25DMapLayer = { canvas, redraw };`
- immediate draw:
  - `redraw();`

Current behavior of `initCustom25DMapExperiment()`:

- creates a Leaflet pane:
  - `yes`
- creates and appends a Canvas:
  - `yes`
- installs a `moveend zoomend` listener:
  - `yes`
- writes `custom25DMapLayer`:
  - `yes`
- draws immediately:
  - `yes`
- can be safely called twice:
  - `no`, it short-circuits once `custom25DMapLayer` exists
- verified cleanup owner:
  - `no`
- exact listener removal found:
  - `no`
- exact Canvas removal found:
  - `no`
- retention reset found:
  - `no`
- pane removal currently safe:
  - `not yet verified from live code`
- retention reset can be passively extracted:
  - `yes`

## Implementation

Created:

- [`client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs)
- [`tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs)

Main exports:

- `createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({ ... })`
- `inspectGrowGoCustom25DRendererOwnershipSource({ scriptSource })`

## Lifecycle Owner Contract

The passive lifecycle owner now supports:

- one explicit ownership registration bundle
- exact event/listener retention
- exact Canvas retention
- exact pane identity retention
- exact retention-slot identity retention
- exact cleanup sequencing
- repeated cleanup safety
- precise fail-closed cleanup reporting

Registration validates:

- `map.off` exists
- Canvas exists
- listener exists
- redraw callback exists
- event names match exactly `moveend zoomend`
- pane name matches `custom25DMapPane`
- retention slot matches `custom25DMapLayer`
- retention reset callback exists

Cleanup performs:

1. remove exact owned listener for exact owned event names
2. remove exact owned Canvas
3. clear exact owned retention slot
4. optionally remove exact owned pane only when ownership is proven

Cleanup preserves:

- unrelated listeners
- unrelated Canvas objects
- unrelated panes

## Required Closeout Classification

Classification:

- `REQUIRES_RENDERER_INITIALIZATION_EXTRACTION`

Why:

- the passive cleanup ownership contract is now ready and proven with injected fake resources
- however the live renderer initialization path still bundles:
  - pane creation
  - Canvas creation
  - listener registration
  - retention write
  - immediate draw
- because that live initializer still mixes creation, retention, listener registration, and drawing, the next safe step is to extract a narrow initialization surface before connecting this cleanup owner to any live renderer path

## Focused Test Coverage

Covered:

- lifecycle-owner factory exists
- module import has no side effects
- initial state owns nothing
- valid fake ownership registration succeeds
- second registration is blocked
- missing map fails closed
- missing Canvas fails closed
- missing listener fails closed
- unexpected event names fail closed
- retention-slot identity mismatch fails closed
- status inspection has no side effects
- exact owned listener is removed
- exact owned Canvas is removed
- exact retention slot is cleared
- unrelated listeners remain untouched
- unrelated Canvas remains untouched
- unrelated panes remain untouched
- empty owned pane removal follows the documented rule
- non-empty pane is preserved
- cleanup clears retained references
- cleanup marks disposed
- repeated cleanup is safe
- use after disposal is blocked
- listener-removal exception fails closed
- Canvas-removal exception fails closed
- retention-reset exception fails closed
- cleanup continues safely after one failure
- results are deeply immutable
- no real renderer is invoked
- `initCustom25DMapExperiment()` is not called
- `drawCustom25DMapCanvas()` is not called
- `custom25DMapLayer` is not mutated
- no real Canvas is created
- no real Leaflet pane is created
- no real listener is added
- no renderer drawing occurs
- no WebGL context is created
- no DOM overlay is created
- no polling or timer is added
- no network request occurs
- no asset download occurs
- no browser activation command is exposed
- no automatic invocation occurs
- all four canonical safety flags remain false
- Phase 211.18 and 211.19 tests remain passing

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Still true:

- real renderer invoked:
  - `no`
- `initCustom25DMapExperiment()` called:
  - `no`
- `drawCustom25DMapCanvas()` called:
  - `no`
- `custom25DMapLayer` mutated:
  - `no`
- real Canvas created:
  - `no`
- real Leaflet pane created:
  - `no`
- real listener added:
  - `no`
- renderer drawing occurred:
  - `no`
- WebGL context created:
  - `no`
- DOM overlay created:
  - `no`
- polling or timer added:
  - `no`
- network requested:
  - `no`
- asset download requested:
  - `no`

## Files Changed

- [`client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs)
- [`tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs)
- [`GROWGO_SESSION_211_20_CUSTOM25D_RENDERER_CLEANUP_OWNERSHIP_EXTRACTION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_20_CUSTOM25D_RENDERER_CLEANUP_OWNERSHIP_EXTRACTION.md)
