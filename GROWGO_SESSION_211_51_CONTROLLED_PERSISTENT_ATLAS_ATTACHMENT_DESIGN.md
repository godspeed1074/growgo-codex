# GROWGO SESSION 211.51 — CONTROLLED PERSISTENT ATLAS ATTACHMENT DESIGN

## Goal

Design the safe developer-only contract for keeping Atlas attached to the live Leaflet map for longer than one frame.

This phase is design-only:

- no persistent attachment is implemented
- no live listeners are added
- no real Canvas is created
- no renderer startup is enabled
- no production activation is added
- no visual renderer behavior is changed

The purpose of this phase is to define exactly how a future persistent developer-only attachment may:

- attach one owned Canvas
- register one approved listener set
- redraw only on approved events
- coalesce duplicate redraw requests
- reject stale identity or stale authorization
- detach deterministically
- release ownership cleanly

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- Phase 211.50aq committed:
  - `yes`
- Phase 211.50aq closeout commit:
  - `bfe8056 test(atlas): close Safari one-frame activation evidence`
- history rewritten:
  - `no`
- prerequisite one-frame Safari proof accepted:
  - `yes`
- accepted prerequisite facts:
  - one snapshot
  - one draw
  - one completed frame
  - one `requestAnimationFrame` boundary
  - cleanup exactly once
  - references released
  - all four canonical safety flags remained false

## Design Classification

Classification:

- `CONTROLLED_PERSISTENT_ATTACHMENT_DESIGN_READY`

Meaning:

- persistent attachment is still disconnected
- the developer-only lifecycle is defined
- ownership and cleanup rules are defined before activation
- no runtime gate is relaxed in this phase

## Persistent Lifecycle Overview

Designed lifecycle:

manual developer authorization
→ attach exactly one owned Canvas
→ register exactly one approved listener set
→ draw initial frame
→ redraw only on approved events
→ coalesce duplicate redraw requests
→ prevent duplicate Canvas/listeners
→ detach deterministically
→ remove listeners
→ release references
→ return to clean Leaflet-only state

Approved event candidates:

- `moveend`
- `zoomend`
- `resize`

Explicitly not allowed:

- continuous animation loops
- polling
- unrestricted `move`
- automatic startup
- production/runtime activation

## Ownership Model

Authoritative ownership must be singular and explicit.

### Canvas owner

- owner:
  - persistent attachment lifecycle owner
- count:
  - exactly `1` while attached
- rule:
  - repeated attach must reuse or reject, never create a second Canvas
- release:
  - removed during deterministic detach

### Pane owner

- owner:
  - persistent attachment lifecycle owner
- count:
  - at most `1` owned Atlas pane
- rule:
  - no duplicate pane creation across repeated attach calls
- release:
  - detach removes the owned pane only if it was created by this lifecycle

### Listener owner

- owner:
  - persistent attachment lifecycle owner
- approved listener set:
  - exactly one `moveend`
  - exactly one `zoomend`
  - exactly one `resize`
- rule:
  - repeated listener registration must be idempotent
- release:
  - detach removes only owned listeners

### Lifecycle owner

- owner:
  - exactly one persistent lifecycle record bound to:
    - current Leaflet map identity
    - approved region/package/recipe identity
    - current developer authorization session
- rule:
  - no second lifecycle owner may coexist for the same developer session

### Draw scheduler owner

- owner:
  - persistent lifecycle owner
- scheduling primitive:
  - one queued `requestAnimationFrame` at a time
- rule:
  - redraw requests while a frame is already queued or drawing are coalesced

### Cleanup owner

- owner:
  - persistent lifecycle owner
- duties:
  - listener removal
  - Canvas removal
  - pane release
  - draw scheduler cancellation state
  - reference release
  - final detached status publication

## State Machine

Required states:

- `detached`
- `authorizing`
- `attaching`
- `attached_idle`
- `redraw_queued`
- `drawing`
- `detaching`
- `failed_closed`

### State transitions

- `detached`
  - enters from clean startup or completed detach
  - may transition to `authorizing`

- `authorizing`
  - manual developer session is being validated
  - may transition to `attaching`
  - may transition to `failed_closed`

- `attaching`
  - ownership objects are being created or rebound
  - initial draw is requested from this state
  - may transition to `attached_idle`
  - may transition to `detaching`
  - may transition to `failed_closed`

- `attached_idle`
  - one Canvas exists
  - one listener set exists
  - no draw is currently running
  - may transition to `redraw_queued`
  - may transition to `detaching`
  - may transition to `failed_closed`

- `redraw_queued`
  - exactly one redraw is scheduled
  - additional redraw requests increment coalescing counters but do not schedule a second frame
  - may transition to `drawing`
  - may transition to `detaching`
  - may transition to `failed_closed`

- `drawing`
  - one snapshot/draw path is executing
  - redraw requests received here are coalesced into one follow-up queued redraw
  - may transition to `attached_idle`
  - may transition to `redraw_queued`
  - may transition to `detaching`
  - may transition to `failed_closed`

- `detaching`
  - no new attach or redraw work may begin
  - owned listeners/canvas/pane/references are removed
  - may transition only to `detached` or `failed_closed`

- `failed_closed`
  - attachment is considered unsafe for continued runtime use
  - implementation must attempt deterministic cleanup
  - no automatic recovery
  - next action requires a fresh developer session or explicit manual reset contract

## Idempotency Contract

The future persistent path must be idempotent across repeat developer actions.

### Repeated attach

Required proof:

- repeated attach request does not create another Canvas
- repeated attach request does not create another pane
- repeated attach request does not create another lifecycle owner
- repeated attach request returns a structured already-attached or already-authorized result

### Repeated listener registration

Required proof:

- no duplicate `moveend` listener
- no duplicate `zoomend` listener
- no duplicate `resize` listener
- listener registration is keyed by lifecycle owner identity

### Repeated detach

Required proof:

- repeated detach is harmless
- second detach removes nothing extra
- second detach still returns a structured clean result

### Redraw requests while drawing

Required proof:

- redraw requests while drawing are coalesced
- only one follow-up redraw may be queued
- draw spam cannot create unbounded `requestAnimationFrame` scheduling

## Redraw Policy

Persistent redraw remains narrow and event-driven.

### Approved redraw events

- `moveend`
  - allowed
  - reason:
    - viewport changed after movement settled

- `zoomend`
  - allowed
  - reason:
    - viewport scale changed after zoom settled

- `resize`
  - allowed
  - reason:
    - viewport size changed

### Explicitly rejected events

- `move`
  - rejected because it is continuous and high-frequency
- timer events
  - rejected
- polling
  - rejected
- startup
  - rejected
- background renderer callbacks
  - rejected

### Scheduling model

- one `requestAnimationFrame` may be scheduled at a time
- event bursts collapse into one queued redraw
- while `drawing`, new redraw requests set a single coalesced pending-redraw flag
- after draw completes:
  - if a coalesced redraw is pending, schedule one new frame
  - otherwise return to `attached_idle`

### Snapshot freshness

Persistent redraw must reject stale work when:

- map identity drift is detected
- region/package/recipe drift is detected
- authorization session no longer matches
- lifecycle owner no longer matches the active attachment
- draw request was queued against a detached owner

Stale snapshots must not be drawn.

## Failure Handling Policy

All failures must be structured, fail-closed, and cleanup-aware.

### Attach failure

- classification:
  - `failed_closed`
- result:
  - no partial second ownership may remain
- cleanup:
  - remove any partially created owned artifacts

### Draw failure

- classification:
  - `failed_closed`
- result:
  - stop further redraw scheduling
- cleanup:
  - deterministic detach required

### Listener failure

- classification:
  - `failed_closed`
- result:
  - no partially attached listener set may remain
- cleanup:
  - remove any listener already registered in the failed attach attempt

### Cleanup failure

- classification:
  - `failed_closed`
- result:
  - failure reason must be exposed in diagnostics
- policy:
  - do not continue rendering after cleanup failure

### Map identity drift

- classification:
  - `failed_closed`
- result:
  - current attachment invalidates
- cleanup:
  - deterministic detach

### Region/package/recipe drift

- classification:
  - `failed_closed`
- result:
  - queued redraws are rejected
- cleanup:
  - deterministic detach

### Authorization invalidation

- classification:
  - `failed_closed`
- result:
  - no more redraw work may execute
- cleanup:
  - deterministic detach

## Safety Gates

Canonical safety flags must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Persistent mode remains:

- developer-only
- explicitly authorized
- disconnected by default
- not available on startup
- not automatically recoverable
- not production-enabled

This design phase does **not** authorize any future implementation to flip those flags automatically.

## Diagnostics Contract

Designed read-only persistent status surface:

- `attached`
- `lifecycleState`
- `ownedCanvasCount`
- `ownedPaneCount`
- `ownedListenerCount`
- `redrawRequestedCount`
- `redrawCompletedCount`
- `redrawCoalescedCount`
- `animationFrameScheduleCount`
- `lastDrawReason`
- `lastFailureReason`
- `cleanupAttemptCount`
- `cleanupCompleted`
- `referencesReleased`
- `currentMapIdentity`
- `currentRegionIdentity`
- `currentPackageIdentity`
- `currentRecipeIdentity`
- `runtimeExecutionEnabled`
- `mapAttachmentAllowed`
- `automaticRendererExecutionAllowed`
- `lifecycleExecutionEnabled`

### Diagnostics expectations

- read-only only
- deeply immutable result objects
- no raw internal seam exposure
- no live mutation controls hidden inside status reads
- no diagnostics read may create Canvas, listeners, or queued redraws

## Manual Controls To Design, Not Yet Activate

Designed future developer-only commands:

- `authorizePersistentAtlasDeveloperSession(...)`
- `attachPersistentAtlasRenderer(...)`
- `requestPersistentAtlasRedraw(...)`
- `detachPersistentAtlasRenderer(...)`
- `getPersistentAtlasAttachmentStatus()`

### Command contract expectations

- authorization command:
  - manual developer-only
  - one explicit session boundary
- attach command:
  - refuses duplicate attachment
  - refuses stale or invalid authorization
- redraw command:
  - accepted only while attached
  - coalesces duplicate in-flight requests
- detach command:
  - deterministic
  - harmless if already detached
- status command:
  - read-only only

## Test Plan

Required focused design validation:

1. fake map attach
2. one Canvas only
3. one listener set only
4. one initial draw
5. `moveend` redraw
6. `zoomend` redraw
7. `resize` redraw
8. redraw coalescing
9. duplicate attach block
10. deterministic detach
11. cleanup after draw failure
12. cleanup after listener failure
13. identity drift invalidation
14. session boundary reset
15. Safari manual verification plan

### Browser-shaped Safari manual verification plan

When implementation is eventually proposed, the Safari manual plan must confirm:

- developer authorization stays explicit
- one Canvas appears only after explicit attach
- one listener set is owned
- initial draw completes once
- `moveend`, `zoomend`, and `resize` request redraw correctly
- redraw bursts coalesce
- detach removes all owned artifacts
- status returns to clean Leaflet-only state
- all four canonical safety flags remain false unless a later explicitly approved phase says otherwise

## No-Change Runtime Proof

Still true in this design phase:

- live persistent attachment implemented:
  - `no`
- real listeners added:
  - `no`
- real Canvas created:
  - `no`
- startup rendering enabled:
  - `no`
- renderer visuals changed:
  - `no`
- Firebase modified:
  - `no`
- Blender/assets/GLBs modified:
  - `no`
- raw internal seams exposed:
  - `no`

## Files Changed

- [`GROWGO_SESSION_211_51_CONTROLLED_PERSISTENT_ATLAS_ATTACHMENT_DESIGN.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_51_CONTROLLED_PERSISTENT_ATLAS_ATTACHMENT_DESIGN.md)
- [`tests/client-controlled-persistent-atlas-attachment-design.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-controlled-persistent-atlas-attachment-design.test.mjs)

## Next Phase

Recommended next phase:

- `211.52 — Persistent Attachment Fake Runtime Contract`
