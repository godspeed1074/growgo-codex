# GROWGO SESSION 211.60 — PERSISTENT SCHEDULER AND LISTENER CONTRACT

## Goal

Create a disconnected developer-only scheduler and listener contract for persistent Atlas redraws.

This phase proves:

- one queued frame maximum
- exact approved listener whitelist
- duplicate redraw coalescing
- one follow-up redraw while drawing
- stale callback rejection
- deterministic listener removal

Everything remains disconnected from:

- the real Leaflet map
- real `requestAnimationFrame`
- real `cancelAnimationFrame`
- real browser listeners
- the real renderer
- `window`
- startup

## Created

- `client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs`
- focused scheduler/listener proof tests

## Required Approved Listener Whitelist

- `moveend`
- `zoomend`
- `resize`

Forbidden:

- `move`
- `drag`
- `mousemove`
- `touchmove`
- `wheel`
- polling
- intervals
- timeouts
- startup listeners

## State Model

- `inactive`
- `registering_listeners`
- `ready`
- `redraw_queued`
- `drawing`
- `follow_up_pending`
- `removing_listeners`
- `invalidated`
- `failed_closed`

## Identity Binding

The contract binds to:

- `schedulerOwnerId`
- `listenerOwnerId`
- `mapIdentityId`
- `sessionId`
- `lifecycleOwnerId`

## Listener Rules Proven

- exactly one listener per approved event
- callback identity retained for exact removal
- duplicate registration blocked
- partial registration rollback
- stale map/session invalidation support
- repeated removal harmless
- removal failure reported
- no listener survives successful detach/removal

## Scheduler Rules Proven

- at most one queued frame handle
- multiple redraw requests before execution coalesce
- redraw during drawing creates at most one follow-up redraw
- no recursive draw in the normal path
- no parallel draw in the normal path
- stale queued callback ignored after invalidation/removal
- queued frame cancellable during detach/removal
- scheduler/canceller dependency validation enforced
- no timers or polling fallback

## Redraw Reasons

Approved reasons:

- `initial_attach`
- `moveend`
- `zoomend`
- `resize`
- `manual_redraw`
- `follow_up_redraw`

## Diagnostics Contract

Frozen serializable status includes:

- state / ready / invalidated / failedClosed
- owner IDs
- listener registration booleans
- queued frame / drawing / follow-up flags
- registration, removal, redraw, scheduling, cancellation, draw, follow-up, and stale-callback counters
- last requested/completed/failure reasons
- forbidden-listener / recursive / parallel / stale-callback detection flags
- canonical safety flags

Status contains no raw map, callback, listener, or frame-handle references.

## Integration Proof

Focused tests prove fake-only integration through the persistent authorization contract:

- authorize persistent session
- consume attach permission
- register approved listeners
- request initial redraw
- coalesce moveend / zoomend / resize burst
- execute one draw
- queue one follow-up during drawing
- execute follow-up
- cancel queued frame on detach/removal
- remove listeners
- zero remaining listener/frame ownership

## Canonical Safety Flags

These remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Next Phase

Recommended next phase:

- `211.61 — Retained Surface and Cleanup Live-Wrapper Contract`
