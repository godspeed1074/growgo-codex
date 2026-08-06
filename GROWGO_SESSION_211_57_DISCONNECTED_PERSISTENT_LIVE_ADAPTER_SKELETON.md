# GROWGO SESSION 211.57 — DISCONNECTED PERSISTENT LIVE-ADAPTER SKELETON

## Goal

Create a developer-only persistent live-adapter skeleton that maps future live Atlas seams into the existing persistent controller contract without touching any real runtime surface.

This phase stays disconnected from:

- `window`
- `script.js` startup
- the real Leaflet map
- the real DOM
- the real Canvas
- real listeners
- real `requestAnimationFrame`
- the real renderer

## Created

- `client/developer-only-controlled-persistent-atlas-live-adapter.mjs`
- focused fake-only adapter skeleton tests

## Adapter API

- `createControlledPersistentAtlasLiveAdapter(...)`
- `createPersistentControllerDependencies(...)`
- `getPersistentLiveAdapterStatus()`

## Required Candidate Seams

The adapter accepts injected candidate seams only:

- `rawMapProvider`
- `readinessProvider`
- `authorizationStatusProvider`
- `identitySnapshotProvider`
- `retainedSurfaceProvider`
- `retainedLifecycleOwnerProvider`
- `frameSnapshotProvider`
- `frameDrawProvider`
- `animationFrameScheduler`
- `animationFrameCanceller`
- `approvedListenerRegistrar`
- `approvedListenerRemover`
- `retainedCleanupProvider`

All seams default to unavailable and fail closed.

## Narrow Adapter Functions

The skeleton provides narrow wrappers for:

1. `resolveMap()`
2. `resolveReadiness()`
3. `resolveAuthorization()`
4. `resolveIdentity()`
5. `acquireRetainedSurface()`
6. `acquireLifecycleOwner()`
7. `createFrameSnapshot()`
8. `drawFrame()`
9. `scheduleFrame()`
10. `cancelFrame()`
11. `registerApprovedListeners()`
12. `removeApprovedListeners()`
13. `cleanupRetainedResources()`

## Controller Dependency Composition

`createPersistentControllerDependencies()` returns only narrow controller-facing callables matching the Phase 211.53 controller contract:

- `mapProvider.getMap`
- `readinessProvider.getPersistentAttachmentReadiness`
- `authorizationProvider.isLocalDevelopment`
- `authorizationProvider.createPersistentSession`
- `identityProvider.getPersistentAttachmentIdentity`
- `surfaceProvider.preparePersistentSurface`
- `lifecycleOwnerProvider.createLifecycleOwner`
- `snapshotProvider.createPersistentSnapshot`
- `drawProvider.drawPersistentFrame`
- `animationFrameScheduler.schedule`
- `animationFrameScheduler.cancel`
- `listenerRegistrar`
- `listenerRemover`
- `cleanupProvider.cleanupPersistentAttachment`

It does not expose:

- raw map references
- raw Canvas references
- raw listener collections
- mutable adapter internals

## Validation Rules Proven

- missing seams block readiness
- wrong seam types block readiness
- scheduler/canceller mismatch blocks readiness
- listener registrar/remover mismatch blocks readiness
- cleanup seam is required
- stale map identity is rejected
- stale region/package/recipe identity is rejected
- surface with two Canvas objects is rejected
- duplicate lifecycle owner is rejected
- forbidden listener names are rejected
- immutable snapshot is required
- mutable draw state remains separate from immutable snapshot
- cleanup failures are surfaced

## Diagnostics Contract

Frozen serializable status includes:

- schema and readiness booleans
- seam availability booleans
- resolution booleans
- forbidden global-access detection flags
- `lastFailureReason`
- canonical safety flags

Status exposes no raw references.

## Integration Proof

Focused tests prove fake-only composition through the real persistent controller:

- create adapter
- create controller dependencies
- create controller
- authorize fake session
- attach through fake seams
- initial redraw
- queued redraw coalescing
- detach
- cleanup
- zero retained leaks

## Canonical Safety Flags

These remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Live Behavior

No live behavior changed in this phase:

- no `window` exposure
- no startup enablement
- no `script.js` import
- no real map lookup
- no real Canvas creation
- no real listener registration
- no real animation-frame usage
- no real renderer invocation

## Next Phase

Recommended next phase:

- `211.58 — Persistent Live-Adapter Real-Seam Mapping Review`
