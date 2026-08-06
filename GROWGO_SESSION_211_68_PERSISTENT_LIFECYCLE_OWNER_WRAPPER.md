# GROWGO SESSION 211.68 — PERSISTENT LIFECYCLE OWNER WRAPPER

## Goal

Implement the disconnected developer-only lifecycle-owner provider that can:

- acquire exactly one lifecycle owner
- translate it through a cycle-safe scalar boundary
- validate stable owner and identity before reuse
- reuse the same owner across redraw-shaped calls
- release lifecycle ownership safely without touching unrelated persistent seams

This phase does not connect the provider to the persistent controller, live adapter composition, renderer, browser startup, listeners, scheduler, or map activation.

## Module created

- `client/developer-only-persistent-atlas-lifecycle-owner-provider.mjs`

## Exposed API

- `createPersistentAtlasLifecycleOwnerProvider(...)`
- `acquirePersistentAtlasLifecycleOwner(...)`
- `validatePersistentAtlasLifecycleOwner(...)`
- `reusePersistentAtlasLifecycleOwner(...)`
- `releasePersistentAtlasLifecycleOwner(...)`
- `getPersistentAtlasLifecycleOwnerStatus()`

## Proven behavior

### Acquisition

- all dependencies default unavailable and fail closed
- owner acquisition occurs only through injected seams
- exactly one authoritative lifecycle owner is required
- duplicate owner bundles are rejected
- bound identity includes:
  - `lifecycleOwnerId`
  - `lifecycleGenerationId`
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

### Translation

- translation flows through an injected cycle-safe seam
- only scalar serializable translation output is frozen and retained
- raw browser references are rejected
- translation identity must match the retained lifecycle owner identity
- cyclic browser-shaped source data can exist upstream as long as the translation seam emits scalar output only

### Validation and reuse

- retained owner ID must remain stable
- retained generation ID must remain stable
- retained surface owner ID must remain stable
- map/session/package/recipe/selector identity must remain stable
- translation is revalidated before reuse
- reuse does not acquire a second owner

### Release

- this phase owns lifecycle-owner release only
- lifecycle release runs through its injected seam
- reference release runs through its injected seam
- repeated release is harmless
- partial release is resumable
- failures are collected and exposed in status
- successful release clears retained ownership and translation references

## Diagnostics

Status is frozen and serializable and exposes no raw:

- lifecycle owner
- translation source object
- map
- canvas
- pane
- DOM node
- listener
- callback
- scheduler handle
- renderer state

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has a disconnected lifecycle-owner provider that proves stable owner retention, cycle-safe translation, redraw-time validation, and lifecycle-only cleanup without activating any live persistent runtime behavior.
