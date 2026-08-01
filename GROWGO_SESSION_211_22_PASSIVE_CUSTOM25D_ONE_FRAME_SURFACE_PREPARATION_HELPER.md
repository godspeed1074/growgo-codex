# GROWGO SESSION 211.22 — PASSIVE CUSTOM25D ONE-FRAME SURFACE PREPARATION HELPER

## Goal

Extract the smallest safe helper that prepares a future one-frame custom 2.5D Canvas surface using injected fake dependencies only.

This phase stayed passive:

- no `script.js` changes
- no real renderer invocation
- no live DOM changes
- no listener registration
- no draw
- no `custom25DMapLayer` mutation

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial `git status --short`:
  - clean
- accepted Phase 211.21 checkpoint:
  - `a2da9f9`
- checkpoint title:
  - `docs(atlas): plan custom25d initialization surface extraction`
- accepted Phase 211.21 classification:
  - `INITIALIZATION_EXTRACTION_PLAN_READY`
- Phase 211.18 through 211.21 focused regressions:
  - `PASS`

## Source Discovery

- pane identity:
  - `custom25DMapPane`
- Canvas class:
  - `custom-25d-map-canvas`
- size dependency:
  - `map.getSize()`
- position dependency:
  - `map.latLngToLayerPoint(bounds.getNorthWest())`
- live initializer ownership:
  - `initCustom25DMapExperiment()`
- live Canvas creation point:
  - `L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)`

These source-locked identities were confirmed from `script.js` without executing the live renderer.

## Created Helper

- module:
  - `client/developer-only-growgo-custom25d-one-frame-surface-preparation.mjs`
- exported factory:
  - `createDeveloperOnlyCustom25DOneFrameSurfacePreparation(...)`
- exported source-lock inspector:
  - `inspectGrowGoCustom25DOneFrameSurfacePreparationSourceLock(...)`

The helper remains disconnected from:

- `script.js`
- `initCustom25DMapExperiment()`
- `drawCustom25DMapCanvas()`
- `custom25DMapLayer`
- the Phase 211.18 activation contract
- the Phase 211.19 passive adapter
- the Phase 211.20 lifecycle owner
- any browser interface

## Successful Preparation

Validated fake preparation now proves:

- map contract validated
- exact pane name enforced:
  - `custom25DMapPane`
- exact Canvas class enforced:
  - `custom-25d-map-canvas`
- valid existing pane reused when identity matches
- exactly one fake pane created when lookup returns no pane
- exactly one fake Canvas created
- Canvas appended to the exact approved pane
- map size read exactly once
- Canvas width and height set exactly once
- top-left position read exactly once
- intended Canvas position recorded exactly once
- returned descriptor deeply immutable
- no draw requested
- no listener added
- no retention written

Successful fake descriptor truth:

- pane reused or created:
  - both paths verified
- Canvas count:
  - `1`
- Canvas size:
  - fake test proof `640 x 360`
- Canvas position:
  - fake test proof `{ x: 12, y: 34 }`
- cleanup requirement after successful Canvas creation:
  - `true`
- lifecycle registration required:
  - `true`
- retained module-level map state:
  - `false`
- retained module-level Canvas state:
  - `false`

## Failure And Rollback

Fail-closed before Canvas creation:

- missing map
- invalid map interface
- incorrect pane name
- invalid existing-pane identity
- missing size provider
- missing position provider
- missing Canvas factory
- pane lookup exception
- pane creation exception
- Canvas creation exception

Rollback after Canvas creation:

- append failure:
  - rollback attempted
  - rollback completed
  - original failure reason preserved
- invalid size:
  - rollback attempted
  - rollback completed
- invalid position:
  - rollback attempted
  - rollback completed
- sizing exception:
  - rollback attempted
  - rollback completed
- positioning exception:
  - rollback attempted
  - rollback completed
- rollback-removal exception:
  - rollback attempted
  - rollback not completed
  - cleanup remains required
  - exact rollback failure reason reported

Duplicate behavior:

- duplicate preparation attempt on the same helper instance:
  - blocked
  - no second Canvas preparation allowed

## Classification

- exact classification:
  - `SURFACE_PREPARATION_HELPER_READY`
- reason:
  - the passive helper now proves exact pane validation, pane reuse versus creation, single-Canvas creation, size capture, position capture, immutable result delivery, and partial-failure rollback without touching the live renderer or DOM
- next smallest integration step:
  - extract a passive one-frame draw seam that accepts the prepared fake Canvas and proves one isolated draw contract without live connection

## Tests

- new focused Phase 211.22 helper tests:
  - `16 passed`
  - `0 failed`
- Phase 211.18 through 211.21 regressions:
  - `31 passed`
  - `0 failed`

Focused coverage included:

- import has no side effects
- factory exists
- source lock remains anchored to live renderer identities
- successful pane reuse
- successful pane creation
- exact Canvas class enforcement
- exact append target
- exact size and position read counts
- duplicate-attempt blocking
- pre-Canvas fail-closed cases
- post-Canvas rollback cases
- rollback-removal failure reporting
- deep immutability
- disconnected safety behavior

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
- live DOM changed:
  - no
- listener added:
  - no
- `custom25DMapLayer` mutated:
  - no
- draw called:
  - no
- browser activation exposed:
  - no

## Files Changed

- `client/developer-only-growgo-custom25d-one-frame-surface-preparation.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-surface-preparation.test.mjs`

