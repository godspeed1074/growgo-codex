# GROWGO SESSION 211.52 — PERSISTENT ATTACHMENT FAKE RUNTIME CONTRACT

## Goal

Build a fully isolated fake runtime for the controlled persistent Atlas attachment lifecycle so the state machine, ownership rules, redraw coalescing, and cleanup contract can be proven before any live map or Canvas integration.

This phase stays fake-only:

- no real Leaflet map
- no real DOM Canvas
- no real browser listeners
- no real `requestAnimationFrame`
- no `script.js` live draw seam usage
- no startup execution
- no persistent rendering activation

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- Phase 211.51 committed:
  - `yes`
- Phase 211.51 design commit:
  - `2de1802 docs(atlas): design controlled persistent attachment`
- history rewritten:
  - `no`

## Created Module

Created fake runtime module:

- [`client/developer-only-controlled-persistent-atlas-fake-runtime.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-fake-runtime.mjs)

Created focused tests:

- [`tests/client-developer-only-controlled-persistent-atlas-fake-runtime.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-persistent-atlas-fake-runtime.test.mjs)

## Required API

Implemented fake-runtime API:

- `createControlledPersistentAtlasFakeRuntime(...)`
- `authorizePersistentSession(...)`
- `attachPersistentAtlas(...)`
- `requestPersistentAtlasRedraw(reason)`
- `detachPersistentAtlas(...)`
- `getPersistentAtlasStatus()`

All mutable ownership remains internal.

All public status and result objects are frozen read-only snapshots.

## Fake Runtime Inputs

The fake runtime supports injected fake collaborators for:

- fake map identity provider
- fake Canvas creation/destruction
- fake pane creation/destruction
- fake lifecycle owner creation/release
- fake listener registration/removal
- fake animation-frame scheduler
- fake snapshot provider
- fake draw callback
- fake session ID generator

No live browser objects are required.

## Proven State Machine

The fake runtime proves the designed lifecycle:

- `detached`
- `authorizing`
- `attaching`
- `attached_idle`
- `redraw_queued`
- `drawing`
- `attached_idle`
- `detaching`
- `detached`

Failure path also proven:

- any attach/draw/scheduler/listener/snapshot failure transitions to:
  - `failed_closed`

## Ownership Proof

The fake runtime enforces:

- exactly one Canvas
- at most one pane
- exactly one approved listener set
- one lifecycle owner
- one scheduler owner
- one cleanup owner

Duplicate protection proven:

- second attach does not create another Canvas
- second attach does not add listeners
- repeated detach is harmless
- repeated authorization does not create duplicate sessions
- stale session or identity drift blocks attach/redraw safely

## Redraw And Coalescing Proof

Initial attach proves:

- exactly one initial redraw request
- exactly one scheduled animation frame
- exactly one snapshot
- exactly one draw
- return to `attached_idle`

Burst coalescing proves:

- `moveend`
- `zoomend`
- `resize`

all fired before one scheduled frame produce:

- multiple redraw requests
- one scheduled animation frame
- one completed redraw
- coalesced redraw count greater than zero

While drawing:

- additional redraw requests are coalesced
- at most one follow-up redraw is scheduled
- no recursive draw
- no parallel draw

## Identity Binding Proof

Fake attachment binds to:

- `mapIdentity`
- `regionId`
- `packageId`
- `packageVersion`
- `packageFingerprint`
- `recipeId`
- `recipeVersion`
- `selectorSeed`
- `sessionId`

Identity drift proven to:

- invalidate continued use
- fail closed
- clean ownership when cleanup succeeds
- return zero owned resources

## Failure Proof

Focused failures covered:

- Canvas creation failure
- pane creation failure
- listener registration failure
- snapshot failure
- draw failure
- animation-frame scheduling failure
- cleanup failure
- identity drift
- stale session
- duplicate attach
- redraw after detach

Each failure path proves:

- fail closed
- explicit failure reason preserved
- no leaked Canvas/pane/listeners when cleanup succeeds
- references released when cleanup succeeds

## Diagnostics Proof

Read-only frozen status includes:

- `schemaId`
- `lifecycleState`
- `attached`
- `authorizationActive`
- `authorizationConsumed`
- `sessionId`
- `ownedCanvasCount`
- `ownedPaneCount`
- `ownedListenerCount`
- `redrawRequestedCount`
- `redrawCompletedCount`
- `redrawCoalescedCount`
- `animationFrameScheduleCount`
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
- all four canonical safety flags

Diagnostics are proven:

- immutable
- serializable
- free of raw map/Canvas/listener references

## Forbidden Runtime Behavior Still Absent

Still absent:

- real map connection
- real Canvas creation
- real listeners
- real renderer calls
- live `script.js` changes
- startup execution
- persistent rendering activation

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Focused Test Result

Focused fake-runtime tests:

- `PASS`

Proven areas:

1. initial detached state
2. authorization
3. successful attach
4. one owned Canvas
5. one approved listener set
6. one initial redraw
7. `moveend` redraw
8. `zoomend` redraw
9. `resize` redraw
10. burst coalescing
11. redraw while drawing
12. duplicate attach protection
13. repeated detach
14. stale session block
15. identity drift cleanup
16. Canvas failure cleanup
17. listener failure cleanup
18. snapshot failure cleanup
19. draw failure cleanup
20. scheduler failure cleanup
21. cleanup failure reporting
22. immutable diagnostics
23. no forbidden listeners
24. all canonical flags remain false

## Files Changed

- [`client/developer-only-controlled-persistent-atlas-fake-runtime.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-fake-runtime.mjs)
- [`tests/client-developer-only-controlled-persistent-atlas-fake-runtime.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-persistent-atlas-fake-runtime.test.mjs)
- [`GROWGO_SESSION_211_52_PERSISTENT_ATTACHMENT_FAKE_RUNTIME_CONTRACT.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_52_PERSISTENT_ATTACHMENT_FAKE_RUNTIME_CONTRACT.md)

## Next Phase

Recommended next phase:

- `211.53 — Persistent Attachment Controller Skeleton`
