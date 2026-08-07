# GROWGO SESSION 212.9 — AUTOMATIC POPULATION FAKE RUNTIME CONTRACT

Schema / contract tag:

- `AUTOMATIC_POPULATION_FAKE_RUNTIME`

## Goal

Prove the Phase 212.8 automatic viewport repopulation design in a fake-only runtime before any real event wiring is added.

This phase is intentionally disconnected from:

- real Leaflet map objects
- real listeners
- real requestAnimationFrame
- real Canvas or panes
- real renderer submission
- startup behavior

## Created module

- [client/developer-only-atlas-automatic-population-fake-runtime.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-automatic-population-fake-runtime.mjs)

## Created tests

- [tests/client-developer-only-atlas-automatic-population-fake-runtime.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-automatic-population-fake-runtime.test.mjs)

## Public fake-runtime API

- `createAtlasAutomaticPopulationFakeRuntime(...)`
- `enableAutomaticPopulationFakeRuntime(...)`
- `disableAutomaticPopulationFakeRuntime(...)`
- `requestAutomaticViewportRefresh(...)`
- `runQueuedAutomaticViewportRefresh(...)`
- `invalidateAutomaticViewportPopulation(...)`
- `getAutomaticPopulationFakeRuntimeStatus()`

## Proven fake-runtime contract

### Initial state

- starts `disabled`
- no queued generation
- no active generation
- no follow-up generation
- no population plan or batch references

### Approved events only

Accepted fake events:

- `moveend`
- `zoomend`
- `resize`

Rejected:

- `move`
- `drag`
- `mousemove`
- `touchmove`
- `wheel`
- `timer`
- `polling`
- `startup`
- unknown events

### Generation binding

Each accepted refresh request binds one deterministic:

- `viewportGenerationId`
- `viewportIdentity`
- `mapIdentityId`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`
- `triggerReason`

### Coalescing proof

The fake runtime proves:

- one queued refresh maximum
- one active refresh maximum
- one follow-up refresh maximum
- latest generation wins
- burst events coalesce
- no recursive refresh
- no parallel planning
- no parallel submission
- no parallel draw

### Stale-work proof

The fake runtime proves:

- stale queued work is discarded
- stale submission results cannot replace current population
- stale draw results cannot replace current population
- stale discard counters increase

### Replacement policy

Implemented and proven:

- `FULL_DETERMINISTIC_BATCH_REPLACEMENT`

Rules proven:

- old valid population remains current while the next generation plans
- successful new batch replaces atomically
- old refs release only after successful replacement
- failed replacement preserves the last good population
- duplicate instance ids are rejected

### Budget enforcement

Proven budgets:

- `maxSourceFeaturesPerViewport = 64`
- `maxNormalizedFeatures = 48`
- `maxPopulationCommands = 24`
- `maxVegetationInstances = 18`
- `maxBuildingInstances = 6`
- `maxAutomaticRefreshesPerCompletedViewportGeneration = 1`

### Failure handling

Covered:

- feature source unavailable
- planner failure
- submission failure
- draw failure
- stale viewport
- identity mismatch
- readiness blocked
- ref release failure

Policy preserved:

- keep last good population where safe
- invalidate on readiness/identity drift
- no automatic retry
- no loops

### Disable and invalidation behavior

Disable:

- clears automatic queued/active/follow-up generation metadata
- releases automatic population references
- returns to `disabled`

Invalidation:

- preserves explicit invalidation reason
- clears automatic refs
- enters `invalidated`
- does not model persistent Atlas cleanup ownership

## Diagnostics

The fake runtime exposes a frozen serializable status including:

- automatic enablement
- runtime state
- current/queued/active generation ids
- follow-up pending flag
- refresh counters
- stale discard counters
- current plan and batch ids
- command/source/normalized counts
- failure and invalidation reasons
- population reference count
- refs released
- recursion / parallel violation flags
- canonical safety flags

No raw refs are exposed for:

- map
- features
- Canvas
- pane
- listeners
- renderer
- callbacks

## Safety confirmation

All canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase does not:

- add real listeners
- wire live `moveend`, `zoomend`, or `resize`
- expose automatic toggle on `window`
- schedule real browser frames
- attach Atlas automatically
- populate live viewport automatically
- query public Overpass
- alter manual preview

## Next phase

- `212.10 — Automatic Population Controller`
