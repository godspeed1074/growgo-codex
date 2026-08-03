# GrowGo Session 211.50g — Final Snapshot Creation Recursion Trace

Date: August 3, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50g — Final Snapshot Creation Recursion Trace`
Classification: `SNAPSHOT_CREATION_RECURSION_FIXED`

## Scope

This phase traced only the snapshot creation lane after surface preparation.

Intentionally not changed:

- draw seam
- renderer lifecycle
- authorization
- cleanup
- visual rendering
- command wrapper

## Safari evidence preserved

Confirmed live Safari evidence entering this phase:

- `outcome = failed_closed`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `authorizationConsumed = true`
- `adapterInvoked = true`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `realDrawFunctionCalled = false`
- `cleanupCompleted = true`
- `referencesReleased = true`

This phase does **not** replace or rewrite that manual Safari evidence.

## Bounded tracing added

The developer-only one-frame execution trace now records bounded snapshot-path evidence for:

- function entry
- function exit
- call depth
- repeat count
- last 50 calls

Snapshot-stage tracing now covers the investigated path:

- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`
- snapshot-stage helper calls made during viewport construction

## Exact repeated call chain identified

The new browser-shaped regression reproduced a remaining snapshot-stage recursion shape where the adapter receives a diagnostics proxy map instead of the raw Leaflet map.

Exact repeated chain:

- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`
- `proxyGetSize`
- `publicGetGrowGoMap`
- `proxyGetSize`
- `publicGetGrowGoMap`
- `proxyGetSize`
- `publicGetGrowGoMap`
- `...`

Meaning:

- surface preparation had already completed
- snapshot creation had started
- the snapshot body itself was entered
- the map handed to snapshot creation was still browser-wrapper-shaped
- reading `map.getSize()` re-entered the public diagnostics map getter instead of staying on a raw Leaflet map instance

## Root cause

The remaining recursion was not in the draw path or cleanup path.

It was in snapshot-stage map access when a diagnostics proxy could still be handed into snapshot creation. In that shape, snapshot helpers such as `getSize()` could bounce back through `window.GrowGoDeveloperDiagnostics.getGrowGoMap()` while snapshot creation was already running.

So the stable bridge capture from Phase 211.50e was necessary but not sufficient.

## Correction applied

In the live one-frame adapter only:

- snapshot execution now normalizes the live map into a snapshot-compatible map view before calling the script snapshot bridge
- the adapter resolves a raw Leaflet map target when a wrapper exposes one
- snapshot execution now calls stable bound raw-map methods for:
  - `getSize()`
  - `getBounds()`
  - `latLngToLayerPoint(...)`
  - `getZoom()`

This keeps the fix inside the snapshot-creation lane and does not alter:

- draw ownership
- cleanup ownership
- renderer lifecycle
- authorization sequencing

## Browser-shaped regression proof

### Reproduced failure shape

A browser-shaped regression now reproduces the failure boundary with bounded tracing:

- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `cleanupCompleted = true`
- `referencesReleased = true`

### Fixed path proof

With raw-map snapshot normalization active, the same browser-shaped lane now proves:

- `surfacePrepared = true`
- `frameSnapshotCreated = true`
- `drawAttemptCount = 1`
- `completedFrameCount = 1`
- `cleanupCompleted = true`
- `referencesReleased = true`

## Focused tests

Focused regression suites run in this phase:

- `tests/client-browser-shaped-atlas-one-frame-recursion.test.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`

Result:

- `PASS`

## Safety confirmation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Also preserved:

- no real renderer startup
- no real continuous draw
- no lifecycle redesign
- no authorization redesign
- no cleanup redesign

## Final closeout

Status:

- exact repeated snapshot-stage recursion chain identified
- bounded trace evidence added
- browser-shaped recursion reproduced honestly
- snapshot-stage raw-map normalization applied
- fixed path now proves one snapshot, one draw, one cleanup

Final classification:

- `SNAPSHOT_CREATION_RECURSION_FIXED`
