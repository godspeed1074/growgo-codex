# GROWGO SESSION 211.70 — PERSISTENT DRAW WRAPPER

## Goal

Implement the disconnected developer-only draw wrapper that can:

- accept one validated immutable snapshot and one retained Canvas
- create private mutable scalar copies for browser-facing draw work
- safely adapt Canvas positioning without mutating frozen snapshot data
- reject recursive or parallel draw attempts
- release only draw-owned mutable state

This phase does not connect the draw wrapper to the persistent controller, live adapter composition, scheduler, listeners, browser startup, or automatic rendering.

## Module created

- `client/developer-only-persistent-atlas-frame-draw-provider.mjs`

## Exposed API

- `createPersistentAtlasFrameDrawProvider(...)`
- `validatePersistentAtlasDrawInputs(...)`
- `drawPersistentAtlasFrame(...)`
- `releasePersistentAtlasDrawState(...)`
- `invalidatePersistentAtlasDrawProvider(...)`
- `getPersistentAtlasFrameDrawStatus()`

## Proven behavior

### Input validation

- snapshot must already be frozen and serializable
- redraw reason must be approved
- snapshot, surface, lifecycle, and authorization seams must all validate
- released or reused snapshots are rejected
- Canvas and pane identity mismatches are rejected

### Mutable draw-state boundary

- only scalar snapshot values are copied into mutable runtime state
- frozen snapshot data is never passed to browser-facing mutation paths
- mutable runtime state remains private and is released after draw completion or failure

### Canvas position protection

- Canvas position uses a mutable scalar copy
- readonly Leaflet-position fallback is supported
- the exact position-adapter path is recorded

### Concurrency and lifecycle

- one draw at a time
- recursive re-entry is rejected
- parallel draw attempts are rejected
- invalidation blocks future draws

### Release

- release only clears draw-owned mutable references
- repeated release is harmless
- no snapshot ownership release
- no Canvas, pane, lifecycle, listener, scheduler, or controller cleanup

## Diagnostics

Status is frozen and serializable and exposes no raw:

- Canvas
- pane
- map
- renderer context
- lifecycle owner
- snapshot source
- mutable draw state
- listener
- callback
- scheduler handle

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has a disconnected draw wrapper that proves validated snapshot-to-draw handoff, mutable draw-state separation, readonly Canvas-position fallback handling, sequential Canvas reuse, and draw-state-only cleanup without activating any live persistent rendering behavior.
