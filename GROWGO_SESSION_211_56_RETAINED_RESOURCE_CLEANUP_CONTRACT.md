# GROWGO SESSION 211.56 — RETAINED RESOURCE CLEANUP CONTRACT

## Goal

Define a disconnected retained-resource contract for future persistent Atlas attachment work without touching the real map, real DOM, real Canvas, real listeners, real animation frames, or live renderer behavior.

This phase proves fake-only retained ownership for:

- one Canvas
- at most one pane
- one listener set
- one queued redraw handle
- one lifecycle owner
- deterministic cleanup

## Scope

Created in this phase:

- `client/developer-only-persistent-atlas-retained-resource-contract.mjs`
- focused retained-resource proof tests

Not created in this phase:

- no live persistent adapter
- no `window` exposure
- no `script.js` runtime changes
- no real listener registration
- no real Canvas creation
- no real `requestAnimationFrame`

## Canonical Safety Flags

These remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Contract API

- `createPersistentAtlasRetainedResourceContract(...)`
- `acquireRetainedSurface(...)`
- `registerRetainedListeners(...)`
- `queueRetainedRedraw(...)`
- `cancelQueuedRetainedRedraw(...)`
- `releaseRetainedResources(...)`
- `getRetainedResourceStatus()`

## Ownership Contract

### Surface

- exactly one retained Canvas
- at most one retained pane
- no second surface acquire while attached
- explicit `surfaceOwnerId`
- explicit `lifecycleOwnerId`
- retained Canvas reused across redraw scheduling

### Listeners

- exactly one registration each for:
  - `moveend`
  - `zoomend`
  - `resize`
- no duplicate registration path
- registration stores removal identity
- registration remains bound to one `mapIdentityId`
- partial registration failure triggers rollback cleanup

### Scheduler

- at most one queued frame handle
- repeated redraw requests coalesce
- queued frame can be cancelled explicitly
- queued frame is cancelled during release
- stale queued callback is ignored after release
- no timer or polling fallback

### Lifecycle Owner

- one authoritative lifecycle owner
- owner retained across queued redraws
- no owner duplication
- no owner replacement while resources are retained
- owner identity verified before each redraw queue

## Cleanup Order

Release order is fixed:

1. `block_new_redraw_requests`
2. `cancel_queued_frame`
3. `remove_moveend_listener`
4. `remove_zoomend_listener`
5. `remove_resize_listener`
6. `release_draw_references`
7. `release_snapshot_references`
8. `remove_canvas`
9. `remove_owned_pane`
10. `release_lifecycle_owner`
11. `clear_map_and_identity_references`
12. `return_detached`

## State Machine

- `empty`
- `acquiring_surface`
- `surface_retained`
- `registering_listeners`
- `ready`
- `redraw_queued`
- `releasing`
- `released`
- `failed_closed`

## Failure Rules

The contract proves explicit handling for:

- Canvas acquisition failure
- pane acquisition failure
- lifecycle-owner acquisition failure
- second Canvas request
- duplicate listener registration
- partial listener registration failure
- scheduler failure
- redraw cancellation failure
- listener removal failure
- Canvas removal failure
- pane removal failure
- lifecycle-owner release failure
- stale map identity
- stale lifecycle owner
- repeated release

Each failure:

- records an exact reason
- blocks further mutation
- attempts remaining cleanup
- preserves owned-resource counts for diagnostics
- ends in `released` or `failed_closed`

## Diagnostics Contract

Frozen serializable status includes:

- schema/state/ready/failure flags
- owner IDs
- resource counts
- listener-registration booleans
- acquire/register/queue/cancel counters
- cleanup counters and failure reasons
- `referencesReleased`
- `lastFailureReason`
- canonical safety flags

Status contains no raw Canvas, pane, listener, map, or scheduler references.

## Proof Summary

The focused tests prove:

- initial empty state
- one retained surface only
- one pane maximum
- exact approved listener set only
- redraw queue coalescing
- redraw cancellation
- stale callback ignore-after-release
- deterministic cleanup order
- repeated release harmlessness
- zero retained resources after successful release
- failure collection during cleanup
- stale map/lifecycle rejection before redraw
- immutable serializable diagnostics
- no browser/global runtime usage

## Result

Phase 211.55 identified cleanup gaps as the blocker to persistent live attachment.

Phase 211.56 closes that missing disconnected contract by proving retained surface ownership, listener ownership, scheduler ownership, lifecycle ownership, and cleanup ordering entirely with injected fakes.

## Next Phase

Recommended next phase:

- `211.57 — Disconnected Persistent Live-Adapter Skeleton`
