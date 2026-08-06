# GROWGO SESSION 211.67 — PERSISTENT RETAINED SURFACE WRAPPER

## Goal

Implement the disconnected developer-only retained-surface provider that can:

- acquire exactly one retained Atlas Canvas
- optionally retain one pane
- validate identity and ownership before reuse
- reuse the same retained surface without creating a new one
- release only the retained surface resources safely

This phase does not connect the wrapper to the controller, live adapter, listeners, scheduler, renderer, `window`, or startup.

## Module created

- `client/developer-only-persistent-atlas-retained-surface-provider.mjs`

## Exposed API

- `createPersistentAtlasRetainedSurfaceProvider(...)`
- `acquirePersistentAtlasRetainedSurface(...)`
- `validatePersistentAtlasRetainedSurface(...)`
- `reusePersistentAtlasRetainedSurface(...)`
- `releasePersistentAtlasRetainedSurface(...)`
- `getPersistentAtlasRetainedSurfaceStatus()`

## Proven behavior

### Acquisition

- defaults unavailable and fail closed
- requires injected one-frame surface, pane, canvas, identity, removal, and reference-release seams
- accepts exactly one Canvas
- accepts zero or one pane
- rejects missing Canvas
- rejects duplicate Canvas
- rejects duplicate pane
- blocks duplicate retained acquisition
- binds:
  - `surfaceOwnerId`
  - `mapIdentityId`
  - `sessionId`
  - `regionId`
  - `packageId`
  - `packageVersion`
  - `packageFingerprint`
  - `recipeId`
  - `recipeVersion`
  - `selectorSeed`

### Reuse and validation

- validates retained state before reuse
- requires stable map/session/package/recipe/selector identity
- requires stable surface owner
- requires stable Canvas identity
- requires stable pane identity when present
- rejects Canvas replacement
- rejects pane replacement
- rejects missing Canvas/pane after acquisition
- does not create a new surface during reuse

### Release

- surface-only release is owned here
- reference release runs through injected seam
- Canvas removal runs through injected seam
- pane removal runs through injected seam when owned
- repeated release is harmless
- partial release is resumable
- failures are collected and reported
- successful release leaves zero ownership and cleared bindings

## Diagnostics

The provider exposes frozen serializable status only.

No raw references are exposed for:

- Canvas
- pane
- DOM nodes
- map
- bridge
- surface object
- mutable identity objects

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has a disconnected retained-surface provider that proves one retained Canvas, optional pane retention, stable reuse, strict identity validation, and surface-only cleanup without activating any live persistent rendering behavior.
