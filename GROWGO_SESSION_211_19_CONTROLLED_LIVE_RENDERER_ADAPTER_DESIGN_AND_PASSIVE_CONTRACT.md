# GROWGO SESSION 211.19 — CONTROLLED LIVE RENDERER ADAPTER DESIGN AND PASSIVE CONTRACT

## Goal

Design the passive adapter contract that a future authorized Atlas one-frame activation may use to interact with GrowGo’s live custom 2.5D renderer.

This phase stays disconnected:

- no `script.js` changes
- no browser command exposure
- no live renderer calls
- no Canvas creation
- no Leaflet pane creation
- no listeners
- no drawing

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- accepted Phase 211.18 checkpoint:
  - `237c29e`
- checkpoint acceptance basis:
  - verified by content, not by commit message
- commit message accuracy:
  - inaccurate
- history rewritten:
  - `no`
- Phase 211.18 confirmed by content:
  - [`client/developer-only-atlas-one-frame-renderer-activation-contract.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-one-frame-renderer-activation-contract.mjs)
  - [`tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs)
  - [`GROWGO_SESSION_211_18_REVERSIBLE_ONE_FRAME_RENDERER_ACTIVATION_CONTRACT_AND_NO_ACTION_SIMULATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_18_REVERSIBLE_ONE_FRAME_RENDERER_ACTIVATION_CONTRACT_AND_NO_ACTION_SIMULATION.md)
- Phase 211.18 focused tests:
  - `PASS`

## Renderer Discovery

Discovered live renderer owner:

- file:
  - [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)
- initialization entry:
  - `initCustom25DMapExperiment()`
- draw entry:
  - `drawCustom25DMapCanvas(canvas)`
- retention slot:
  - `custom25DMapLayer`

Current renderer lifecycle behavior:

- creates a Leaflet pane:
  - `yes`
- creates and appends a Canvas:
  - `yes`
- installs listeners:
  - `yes`
- draws immediately:
  - `yes`
- writes `custom25DMapLayer`:
  - `yes`
- safely callable twice:
  - `no`, second call short-circuits once `custom25DMapLayer` exists
- explicit cleanup function in the same owner path:
  - `no`
- explicit listener removal found:
  - `no`
- explicit Canvas removal found:
  - `no`
- explicit `custom25DMapLayer = null` reset found:
  - `no`
- alters normal Leaflet behavior:
  - `yes`, by adding retained renderer state and map listeners
- drawing depends on global state:
  - `yes`, it reads `map`, feature globals, pane ownership, and browser canvas state

## Lifecycle Classification

Classification:

- `BLOCKED_BY_MISSING_CLEANUP`

Why:

- the live initializer bundles pane creation, Canvas creation, listener installation, retained slot mutation, and immediate drawing into one path
- no matching cleanup owner was found for removing the exact Canvas, unregistering the exact listener, and clearing `custom25DMapLayer`
- because cleanup ownership is currently incomplete, this phase does **not** claim live one-frame safety

Smallest future extraction needed:

1. separate surface initialization from immediate draw
2. separate listener registration from one-frame rendering
3. add exact cleanup ownership for:
   - Leaflet listener removal
   - Canvas removal
   - pane cleanup if needed
   - `custom25DMapLayer` reset
4. keep those extracted operations injectable before any live adapter connection

## Implementation

Created:

- [`client/developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs)
- [`tests/client-developer-only-growgo-custom25d-one-frame-renderer-adapter.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-growgo-custom25d-one-frame-renderer-adapter.test.mjs)

Passive adapter factory:

- `createDeveloperOnlyGrowGoCustom25DOneFrameRendererAdapter({ identity, initializeOneFrameSurface, drawOneFrame, disposeOneFrameSurface })`

Passive identity helpers:

- `createDiscoveredGrowGoCustom25DOneFrameRendererIdentityDescriptor()`
- `validateGrowGoCustom25DRendererSourceLock({ scriptSource, identity })`

## Passive Adapter Contract

Exposed capabilities:

- `validateIdentity()`
- `initializeForOneFrame()`
- `drawExactlyOneFrame()`
- `disposeAfterOneFrame()`
- `getAdapterStatus()`

Contract behavior:

- requires explicit injected operations
- performs no import-time work
- retains no live map reference by default
- retains no Canvas before initialization
- blocks draw before initialization
- allows one initialization only
- allows one draw only
- requires disposal after initialization
- blocks use after disposal
- converts exceptions into structured fail-closed results
- returns deeply immutable status and operation results
- exposes no browser command

## Passive Identity Descriptor

Descriptor truth:

- schema ID:
  - `GROWGO_CUSTOM_25D_ONE_FRAME_RENDERER_ADAPTER_IDENTITY_001`
- renderer ID:
  - `GROWGO_CUSTOM_25D_MAP_EXPERIMENT`
- owner file:
  - `script.js`
- initialization entry:
  - `initCustom25DMapExperiment`
- draw entry:
  - `drawCustom25DMapCanvas`
- retention slot:
  - `custom25DMapLayer`
- rendering technology:
  - `canvas-2d-leaflet-pane`
- expected Canvas ownership:
  - `custom25DMapLayer.canvas`
- expected Leaflet pane ownership:
  - `custom25DMapPane`
- expected cleanup ownership:
  - `missing_explicit_cleanup_owner`
- supports one-frame adapter:
  - `false`
- adapter connection status:
  - `passive_disconnected`

## Focused Test Coverage

Covered:

- adapter factory exists
- module import has no side effects
- passive identity descriptor matches discovered renderer owner
- missing identity fails closed
- identity mismatch fails closed
- missing initialize capability fails closed
- missing draw capability fails closed
- missing dispose capability fails closed
- initial adapter status is idle
- status inspection has no side effects
- fake initialization succeeds once
- draw before initialization is blocked
- fake draw succeeds exactly once
- second draw is blocked
- fake disposal succeeds exactly once
- repeated disposal is safe and closed
- use after disposal is blocked
- second initialization is blocked
- initialization exceptions fail closed
- draw exceptions fail closed
- disposal exceptions fail closed
- cleanup remains required after draw failure
- results are deeply immutable
- no live map reference is retained
- no real renderer function is called
- `initCustom25DMapExperiment()` is not called
- `drawCustom25DMapCanvas()` is not called
- `custom25DMapLayer` is not mutated
- no real Canvas is created
- no Leaflet pane is created
- no WebGL context is created
- no DOM overlay is created
- no map listener is added
- no polling or timer is added
- no network request occurs
- no asset download occurs
- no browser activation command is exposed
- no automatic invocation occurs
- all four canonical safety flags remain false
- Phase 211.18 regressions remain passing

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Still true:

- real renderer invoked:
  - `no`
- real Canvas created:
  - `no`
- WebGL context created:
  - `no`
- DOM overlay created:
  - `no`
- map listener added:
  - `no`
- polling or timer added:
  - `no`
- network requested:
  - `no`
- asset download requested:
  - `no`
- browser activation command exposed:
  - `no`
- automatic invocation:
  - `no`

## Files Changed

- [`client/developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-growgo-custom25d-one-frame-renderer-adapter.mjs)
- [`tests/client-developer-only-growgo-custom25d-one-frame-renderer-adapter.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-growgo-custom25d-one-frame-renderer-adapter.test.mjs)
- [`GROWGO_SESSION_211_19_CONTROLLED_LIVE_RENDERER_ADAPTER_DESIGN_AND_PASSIVE_CONTRACT.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_19_CONTROLLED_LIVE_RENDERER_ADAPTER_DESIGN_AND_PASSIVE_CONTRACT.md)
