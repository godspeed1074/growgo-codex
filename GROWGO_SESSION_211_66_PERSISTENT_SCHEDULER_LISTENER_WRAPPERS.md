# GROWGO SESSION 211.66 — PERSISTENT SCHEDULER AND LISTENER WRAPPERS

## Goal

Implement disconnected developer-only wrappers for:

- browser animation-frame scheduling/cancellation
- Leaflet listener registration/removal

These wrappers are not connected to the persistent controller, live adapter, startup, or renderer.

## Modules created

- `client/developer-only-persistent-atlas-animation-frame-wrapper.mjs`
- `client/developer-only-persistent-atlas-listener-wrapper.mjs`

## Scheduler wrapper

### API

- `createPersistentAtlasAnimationFrameWrapper(...)`
- `schedulePersistentAtlasFrame(...)`
- `cancelPersistentAtlasFrame(...)`
- `invalidatePersistentAtlasFrameGeneration(...)`
- `getPersistentAtlasAnimationFrameStatus()`

### Proven behavior

- injected request/cancel providers only
- no `window`
- no `globalThis`
- no timer fallback
- no polling fallback
- one queued frame at a time
- second queued frame rejected
- one callback execution only
- stale generation callbacks ignored
- cancellation works before execution
- repeated cancellation is harmless
- ownership mismatch fails closed

## Listener wrapper

### API

- `createPersistentAtlasListenerWrapper(...)`
- `registerPersistentAtlasListeners(...)`
- `removePersistentAtlasListeners(...)`
- `validatePersistentAtlasListenerIdentity(...)`
- `getPersistentAtlasListenerStatus()`

### Proven behavior

- injected Leaflet-shaped map/listener seams only
- whitelist is exactly:
  - `moveend`
  - `zoomend`
  - `resize`
- forbidden and unknown events rejected
- exactly one callback per approved event
- exact callback identities stored internally
- duplicate registration blocked
- second listener set blocked
- partial registration rolls back previously added listeners
- repeated removal is harmless
- stale listener set detection works for:
  - map identity drift
  - session mismatch
  - listener owner mismatch

## Diagnostics

Both wrappers expose frozen serializable status only.

No status exposes raw:

- frame handles
- callbacks
- maps
- registration objects
- mutable identity objects

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has isolated scheduler/canceller and listener registrar/remover wrappers that prove one-owner control, stale callback detection, exact callback cleanup, and strict event whitelisting without activating any live attachment behavior.
