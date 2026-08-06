# GROWGO SESSION 211.71 — PERSISTENT CLEANUP WRAPPER

## Goal

Implement the disconnected developer-only cleanup wrapper that can:

- prepare one cleanup owner and one cleanup mode
- execute the exact persistent shutdown order
- preserve partial progress and resume safely
- keep originating failure reasons separate from cleanup-step failures
- prove zero remaining ownership before reporting cleanup complete

This phase does not connect the wrapper to the persistent controller, live adapter composition, real browser, real map, renderer, window, or startup.

## Module created

- `client/developer-only-persistent-atlas-cleanup-provider.mjs`

## Exposed API

- `createPersistentAtlasCleanupProvider(...)`
- `preparePersistentAtlasCleanup(...)`
- `executePersistentAtlasCleanup(...)`
- `resumePersistentAtlasCleanup(...)`
- `validatePersistentAtlasCleanupCompletion(...)`
- `getPersistentAtlasCleanupStatus()`

## Proven behavior

### Cleanup order

The wrapper coordinates the exact required order:

1. redraw block
2. frame cancel
3. listener remove
4. draw state release
5. snapshot release
6. canvas release
7. pane release
8. lifecycle owner release
9. authorization close
10. map identity release
11. session identity release
12. reference release
13. completion validation

### Ownership and completion

- cleanup binds one cleanup owner and session/map/lifecycle/surface/scheduler/listener/auth identities
- mismatched owner/session/map/lifecycle/surface/scheduler/listener identities fail closed
- cleanup does not report completion while ownership remains
- zero queued frames, listeners, draw refs, snapshots, surface ownership, lifecycle ownership, map refs, and session refs are required before cleanup complete

### Partial cleanup and resume

- later safe cleanup steps continue after non-fatal failures
- completed successful steps are preserved
- resume retries only incomplete steps
- repeated completed cleanup is harmless

### Failure classification

- originating failure reason is preserved separately
- cleanup-step failures are collected without hiding the originating reason
- remaining ownership is surfaced explicitly

## Diagnostics

Status is frozen and serializable and exposes no raw:

- map
- Canvas
- pane
- lifecycle owner
- authorization contract
- listener
- callback
- frame handle
- snapshot
- mutable draw state
- renderer state

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has a disconnected cleanup coordinator that proves deterministic shutdown order, partial cleanup resume, zero-ownership completion validation, and clear failure classification without activating any live persistent behavior.
