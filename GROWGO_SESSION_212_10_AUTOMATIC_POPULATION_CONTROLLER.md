# GROWGO SESSION 212.10 — AUTOMATIC POPULATION CONTROLLER

## Goal

Create the production-shaped developer-only controller for automatic viewport repopulation using injected seams only.

This phase remains intentionally disconnected from:

- real Leaflet events
- real browser scheduling
- startup behavior
- live automatic viewport population
- raw map objects
- Canvas, panes, listeners, or renderer ownership

## Created module

- [client/developer-only-atlas-automatic-population-controller.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-automatic-population-controller.mjs)

## Created tests

- [tests/client-developer-only-atlas-automatic-population-controller.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-automatic-population-controller.test.mjs)

## Public API

- `createAtlasAutomaticPopulationController(...)`
- `enableAutomaticViewportPopulation(...)`
- `disableAutomaticViewportPopulation(...)`
- `requestAutomaticViewportPopulationRefresh(...)`
- `runQueuedAutomaticViewportPopulationRefresh(...)`
- `invalidateAutomaticViewportPopulationController(...)`
- `getAutomaticViewportPopulationControllerStatus()`

## Injected dependencies

All controller behavior is driven by injected dependencies only:

- `viewportIdentityProvider`
- `atlasIdentityProvider`
- `readinessProvider`
- `liveFeatureAdapter`
- `populationPlanner`
- `populationDrawIntegration`
- `populationReferenceReleaseProvider`

All unavailable-by-default controller seams fail closed.

No fallback exists for:

- `window`
- `document`
- `globalThis`
- Leaflet globals
- `script.js`
- public diagnostics lookups
- public OSM / Overpass

## State machine

Implemented controller states:

- `disabled`
- `attached_idle`
- `viewport_change_detected`
- `population_queued`
- `reading_features`
- `planning`
- `submitting`
- `drawing`
- `replacing_population`
- `cleanup_pending`
- `invalidated`
- `failed_closed`

## Event input contract

Accepted events:

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

## Deterministic generation contract

Each accepted refresh binds one deterministic generation containing:

- `viewportGenerationId`
- `viewportIdentity`
- `mapIdentityId`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`
- `triggerReason`

Tracked controller generation ids:

- current
- queued
- active
- follow-up

## Proven controller rules

### Coalescing

The controller proves:

- one queued refresh max
- one active refresh max
- one follow-up refresh max
- burst events coalesce
- newest generation becomes authoritative
- no recursion
- no parallel feature reading
- no parallel planning
- no parallel submission
- no parallel draw

### Unchanged viewport skip

If viewport identity, Atlas identity, and feature-source generation are unchanged when available:

- refresh is skipped
- `skippedUnchangedViewportCount` increments
- current population remains intact

### Refresh flow

Implemented flow:

1. receive approved event
2. resolve viewport identity
3. resolve Atlas identity
4. validate readiness
5. bind deterministic generation
6. queue refresh
7. read live features
8. validate normalized feature counts
9. create deterministic population plan
10. validate budgets and duplicate instance ids
11. submit through draw integration
12. confirm draw completed
13. atomically replace current population refs
14. release old refs after successful replacement
15. return to `attached_idle`
16. preserve at most one pending follow-up

### Full-batch replacement

Uses:

- `FULL_DETERMINISTIC_BATCH_REPLACEMENT`

Proven rules:

- current good population remains active during planning
- successful draw is required before replacement
- replacement is atomic
- old refs release only after successful replacement
- failed replacement preserves the last good population where safe
- duplicate instance buildup is rejected

### Stale-work handling

The controller rejects stale work at these boundaries:

- after feature read
- after normalization
- after planning
- before submission
- after submission
- after draw

Discard behavior:

- stale work never replaces current population
- stale discard counter increments
- latest valid generation remains authoritative
- follow-up remains bounded to one generation

### Budgets

Proven controller budgets:

- `maxSourceFeaturesPerViewport = 64`
- `maxNormalizedFeatures = 48`
- `maxPopulationCommands = 24`
- `maxVegetationInstances = 18`
- `maxBuildingInstances = 6`
- `maxAutomaticRefreshesPerCompletedViewportGeneration = 1`

### Failure policy

Covered:

- viewport provider unavailable
- readiness blocked
- identity mismatch
- feature source unavailable
- planner failure
- budget failure
- submission failure
- draw failure
- stale generation
- reference release failure

Policy preserved:

- preserve last good population where safe
- readiness / identity drift invalidates controller
- no automatic retries
- no loops
- cleanup failures recorded separately

### Disable and invalidation

Disable:

- blocks new refreshes
- clears queued / active / follow-up generation state
- releases controller-owned automatic refs only
- preserves external persistent Atlas attachment
- returns controller to `disabled`

Invalidation:

- blocks future refreshes
- clears queued / active / follow-up generation state
- releases controller-owned refs only
- preserves invalidation reason
- does not perform persistent Canvas / listener / lifecycle cleanup

## Diagnostics contract

The controller exposes a frozen serializable status including:

- enablement
- controller readiness
- state
- viewport / generation tracking
- refresh counters
- stale / skipped counters
- current population ids and counts
- source / normalized feature counts
- failure and invalidation reasons
- cleanup failure reasons
- reference-release state
- recursion / parallel-detection flags
- canonical safety flags

No raw refs are exposed for:

- map
- features
- Canvas
- pane
- listeners
- renderer
- callbacks
- batch objects
- mutable plan objects

## Safety confirmation

All canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase does not:

- wire real `moveend`, `zoomend`, or `resize`
- expose a live automatic toggle on `window`
- add timers, polling, or browser frame scheduling
- attach Atlas automatically
- alter manual preview behavior
- query public OSM / Overpass

## Next phase

- `212.11 — Disabled Live-Event Adapter`
