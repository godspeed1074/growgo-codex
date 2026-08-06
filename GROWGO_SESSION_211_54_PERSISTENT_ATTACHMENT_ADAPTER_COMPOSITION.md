# GROWGO SESSION 211.54 — PERSISTENT ATTACHMENT ADAPTER COMPOSITION

## Goal

Compose the persistent attachment controller skeleton with a developer-only adapter layer made entirely from injected seams.

This phase stays disconnected from:

- the real Leaflet map
- the real DOM
- the real Canvas
- real `requestAnimationFrame`
- real listeners
- the real renderer
- `window`
- `script.js` startup

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- Phase 211.53 committed:
  - `yes`
- Phase 211.53 controller commit:
  - `cc4ed7c feat(atlas): add persistent attachment controller skeleton`
- history rewritten:
  - `no`

## Module Created

- [`client/developer-only-controlled-persistent-atlas-adapter-composition.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-adapter-composition.mjs)

## Composition API

Implemented:

- `createControlledPersistentAtlasAdapterComposition(...)`
- `createPersistentControllerFromComposition(...)`
- `getPersistentAdapterCompositionStatus()`

## Seam Contract Proof

The composition supplies narrow injected seams for:

- `mapProvider`
- `readinessProvider`
- `authorizationProvider`
- `identityProvider`
- `surfaceProvider`
- `lifecycleOwnerProvider`
- `snapshotProvider`
- `drawProvider`
- `animationFrameScheduler`
- `animationFrameCanceller`
- `listenerRegistrar`
- `listenerRemover`
- `cleanupProvider`

Default behavior:

- every seam unavailable by default
- fail closed unless explicitly supplied
- no fallback to globals
- no public diagnostics lookup
- no `window` access
- no hidden real-map lookup

Validated seam rules:

- wrong dependency types keep composition not ready
- partial dependency sets keep composition not ready
- scheduler/canceller mismatch is rejected
- listener registrar is wrapped with whitelist enforcement
- identity, readiness, and snapshot outputs must stay serializable

## Required Adapter Status

Frozen serializable status includes:

- `schemaId`
- `compositionReady`
- `controllerCreated`
- provider availability flags
- `forbiddenGlobalLookupDetected`
- `windowAccessDetected`
- `realMapAccessDetected`
- `realCanvasAccessDetected`
- `realListenerAccessDetected`
- `realRendererAccessDetected`
- `lastFailureReason`
- canonical safety flags

## Controller Integration Proof

Using injected fakes only, the composition proves:

1. default composition unavailable
2. complete fake dependency set makes composition ready
3. controller can be created from composition
4. controller starts detached
5. authorization works
6. attach works
7. initial redraw works
8. event redraw works
9. coalescing works
10. detach works
11. cleanup works
12. failure in any seam fails closed
13. forbidden listener names rejected
14. no duplicate ownership
15. no global lookup
16. no window exposure
17. no real map/Canvas/listeners/renderer
18. all status snapshots immutable and serializable
19. all canonical flags remain false

## Failure Proof

Focused failure coverage includes:

- partial dependency sets
- wrong dependency types
- stale provider outputs
- listener whitelist rejection
- scheduler/canceller mismatch
- cleanup failure
- snapshot failure
- draw failure
- identity drift
- duplicate controller creation handling

All fail-closed paths preserve explicit reason codes and avoid live behavior.

## Diagnostics Proof

Both composition status and controller status are proven:

- deeply immutable
- serializable
- free of raw object references
- not exposed on `window`

## Focused Test Result

Focused composition tests:

- `PASS`

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Files Changed

- [`client/developer-only-controlled-persistent-atlas-adapter-composition.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-adapter-composition.mjs)
- [`tests/client-developer-only-controlled-persistent-atlas-adapter-composition.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-persistent-atlas-adapter-composition.test.mjs)
- [`GROWGO_SESSION_211_54_PERSISTENT_ATTACHMENT_ADAPTER_COMPOSITION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_54_PERSISTENT_ATTACHMENT_ADAPTER_COMPOSITION.md)

## Next Phase

Recommended next phase:

- `211.55 — Persistent Attachment Live-Seam Readiness Review`
