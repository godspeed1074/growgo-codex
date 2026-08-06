# GROWGO SESSION 211.53 — PERSISTENT ATTACHMENT CONTROLLER SKELETON

## Goal

Create the real controller shape for persistent Atlas attachment while keeping it fully disconnected from the live map, live Canvas, live listeners, and `window`.

This phase implements:

- the controller state machine
- ownership slots
- developer-only command surface
- dependency injection seams
- frozen diagnostics

This phase does **not** implement:

- real GrowGo map attachment
- real Canvas creation
- real listener registration
- real `requestAnimationFrame`
- real renderer invocation
- startup wiring
- `window` exposure

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- Phase 211.52 committed:
  - `yes`
- Phase 211.52 fake-runtime commit:
  - `b4767de test(atlas): add persistent attachment fake runtime`
- history rewritten:
  - `no`

## Created Module

- [`client/developer-only-controlled-persistent-atlas-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-controller.mjs)

## API

Implemented developer-only controller API:

- `createControlledPersistentAtlasController(...)`
- `authorizePersistentAtlasSession(...)`
- `attachPersistentAtlas(...)`
- `requestPersistentAtlasRedraw(reason)`
- `detachPersistentAtlas(...)`
- `getPersistentAtlasControllerStatus()`

No raw dependency or mutable internal state is exposed.

## Injected Dependency Contract

Required injected dependencies are supported:

- `mapProvider`
- `readinessProvider`
- `authorizationProvider`
- `identityProvider`
- `surfaceProvider`
- `lifecycleOwnerProvider`
- `snapshotProvider`
- `drawProvider`
- `animationFrameScheduler`
- `listenerRegistrar`
- `listenerRemover`
- `cleanupProvider`

All default to unavailable or fail-closed behavior unless injected by tests.

## State Machine Proof

Controller state machine implemented:

- `detached`
- `authorizing`
- `attaching`
- `attached_idle`
- `redraw_queued`
- `drawing`
- `detaching`
- `failed_closed`

Successful attach path proven through injected fakes:

- `detached`
- `attaching`
- `redraw_queued`
- `drawing`
- `attached_idle`

Successful detach path proven:

- `attached_idle`
- `detaching`
- `detached`

Failure path proven:

- dependency failure
- identity drift
- stale authorization
- cleanup failure

all terminate in either:

- `detached`
- `failed_closed`

## Ownership Proof

Internal ownership slots implemented:

- session
- map
- identity
- pane
- canvas
- listener registrations
- lifecycle owner
- queued animation-frame handle
- pending redraw reason
- drawing flag
- cleanup owner

Guards proven:

- local-development-only
- explicit confirmation string
- fresh authorization required
- approved readiness required
- identity match required
- exactly one attachment owner
- no duplicate Canvas
- no duplicate listener set
- no second queued animation frame
- no draw after detach
- no attach after stale authorization
- no mutation after `failed_closed`

## Listener Policy Proof

Whitelisted only:

- `moveend`
- `zoomend`
- `resize`

Rejected:

- `move`
- `drag`
- `mousemove`
- `touchmove`
- polling
- timers
- startup listeners

No real listener is registered in this phase.

## Redraw And Coalescing Proof

The skeleton proves:

- initial redraw scheduled exactly once
- redraw requests while queued increment coalescing count
- redraw requests while drawing set one follow-up redraw flag
- no recursive draw
- no parallel draw
- stale identity before frame execution causes fail-closed cleanup

## Failure Proof

Focused failure paths covered:

- default unavailable dependencies
- readiness failure
- missing authorization
- identity mismatch
- snapshot dependency failure
- draw dependency failure
- scheduler failure
- listener registration failure
- cleanup failure
- identity drift
- stale authorization

Each fail-closed path proves:

- exact failure reason recorded
- cleanup attempted
- zero owned resources when cleanup succeeds
- `failed_closed` status preserved when cleanup fails

## Diagnostics Proof

Frozen serializable status includes:

- `schemaId`
- `lifecycleState`
- `attached`
- `authorizationActive`
- `authorizationConsumed`
- `authorizationInvalidated`
- `sessionId`
- `ownedCanvasCount`
- `ownedPaneCount`
- `ownedListenerCount`
- `lifecycleOwnerPresent`
- `animationFrameQueued`
- `drawing`
- `followUpRedrawPending`
- `redrawRequestedCount`
- `redrawCompletedCount`
- `redrawCoalescedCount`
- `animationFrameScheduleCount`
- `animationFrameCancelCount`
- `snapshotAttemptCount`
- `snapshotCompletedCount`
- `drawAttemptCount`
- `drawCompletedCount`
- `attachAttemptCount`
- `attachCompletedCount`
- `detachAttemptCount`
- `detachCompletedCount`
- `cleanupAttemptCount`
- `cleanupCompleted`
- `cleanupFailed`
- `cleanupFailureReasons`
- `referencesReleased`
- `lastDrawReason`
- `lastFailureReason`
- bound identity
- canonical safety flags

Status snapshots are proven:

- deeply immutable
- serializable
- free of raw map/Canvas/listener references

## No Live Behavior Changed

Still true:

- no real map connection
- no real Canvas
- no real listeners
- no real animation frame
- no real renderer invocation
- no `window` exposure
- no `script.js` alteration
- no startup enablement
- no visual change

## Focused Test Result

Focused controller skeleton tests:

- `PASS`

Covered:

1. default controller detached
2. default dependencies fail closed
3. authorization requires exact confirmation
4. attach requires authorization
5. attach requires readiness
6. attach requires identity match
7. one ownership set only
8. duplicate attach blocked
9. listener whitelist enforced
10. forbidden listeners rejected
11. initial redraw scheduled once
12. redraw requests coalesce
13. drawing sets one follow-up redraw
14. detach clears ownership
15. repeated detach harmless
16. stale authorization blocked
17. identity drift fail-closed
18. snapshot dependency failure cleanup
19. draw dependency failure cleanup
20. scheduler failure cleanup
21. listener registration failure cleanup
22. cleanup failure reported
23. status immutable and serializable
24. no window exposure
25. no real map/Canvas/listeners
26. all canonical safety flags remain false

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Files Changed

- [`client/developer-only-controlled-persistent-atlas-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-controller.mjs)
- [`tests/client-developer-only-controlled-persistent-atlas-controller.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-persistent-atlas-controller.test.mjs)
- [`GROWGO_SESSION_211_53_PERSISTENT_ATTACHMENT_CONTROLLER_SKELETON.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_53_PERSISTENT_ATTACHMENT_CONTROLLER_SKELETON.md)

## Next Phase

Recommended next phase:

- `211.54 — Persistent Attachment Adapter Composition`
